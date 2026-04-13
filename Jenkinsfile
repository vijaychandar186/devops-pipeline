pipeline {
  agent any

  options {
    buildDiscarder(logRotator(numToKeepStr: '20'))
    timeout(time: 45, unit: 'MINUTES')
    disableConcurrentBuilds(abortPrevious: true)
    ansiColor('xterm')
  }

  environment {
    REGISTRY     = 'ghcr.io'
    IMAGE_PREFIX = "ghcr.io/vijaychandar186"
    SHORT_SHA    = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    NAMESPACE    = 'devops-pipeline'
  }

  stages {

    // ── Install dependencies ─────────────────────────────────────────────────
    stage('Install') {
      steps {
        sh 'bun install --frozen-lockfile'
        sh 'bun install --frozen-lockfile --cwd services/llm-aggregator'
        sh 'bun install --frozen-lockfile --cwd services/user-analytics'
        sh 'bun install --frozen-lockfile --cwd micro-frontends/model-widget'
      }
    }

    // ── Lint & type-check ────────────────────────────────────────────────────
    stage('Lint & Type Check') {
      parallel {
        stage('ESLint') {
          steps { sh 'bun lint' }
        }
        stage('Prettier') {
          steps { sh 'bun format:check' }
        }
        stage('TypeScript') {
          steps { sh 'bunx tsc --noEmit' }
        }
        stage('Markdown') {
          steps { sh 'bunx markdownlint-cli2 "**/*.md" "!node_modules" "!CHANGELOG.md"' }
        }
        stage('Spell Check') {
          steps { sh 'codespell' }
        }
      }
    }

    // ── Unit tests ───────────────────────────────────────────────────────────
    stage('Unit Tests') {
      steps {
        sh 'bun test:unit'
      }
    }

    // ── Integration tests (spins up Postgres + Redis via Docker) ────────────
    stage('Integration Tests') {
      environment {
        POSTGRES_USER     = 'admin'
        POSTGRES_PASSWORD = 'testpassword'
        POSTGRES_DB       = 'testdb'
        DATABASE_URL      = 'postgresql://admin:testpassword@localhost:5432/testdb'
        REDIS_URL         = 'redis://localhost:6379'
        LLM_AGGREGATOR_URL = 'http://localhost:4001'
        USER_ANALYTICS_URL = 'http://localhost:4002'
      }
      steps {
        sh '''
          docker run -d --name ci-postgres \
            --network host \
            -e POSTGRES_USER=$POSTGRES_USER \
            -e POSTGRES_PASSWORD=$POSTGRES_PASSWORD \
            -e POSTGRES_DB=$POSTGRES_DB \
            postgres:16-alpine

          docker run -d --name ci-redis \
            --network host \
            redis:8-alpine
        '''

        sh '''
          # Wait for Postgres
          for i in $(seq 1 20); do
            docker exec ci-postgres pg_isready -U admin && break
            sleep 2
          done

          # Wait for Redis
          for i in $(seq 1 20); do
            docker exec ci-redis redis-cli ping | grep -q PONG && break
            sleep 2
          done
        '''

        sh '''
          REDIS_URL=$REDIS_URL PORT=4001 \
            bun services/llm-aggregator/src/index.ts &
          DATABASE_URL=$DATABASE_URL PORT=4002 \
            bun services/user-analytics/src/index.ts &

          for i in $(seq 1 20); do
            curl -sf http://localhost:4001/health && \
            curl -sf http://localhost:4002/health && break
            sleep 2
          done
        '''

        sh 'bun test:integration'
      }
      post {
        always {
          sh '''
            docker rm -f ci-postgres ci-redis || true
            kill $(lsof -ti:4001) $(lsof -ti:4002) 2>/dev/null || true
          '''
        }
      }
    }

    // ── Build Docker images ──────────────────────────────────────────────────
    stage('Build Images') {
      when { anyOf { branch 'main'; branch 'develop' } }
      parallel {
        stage('app') {
          steps {
            sh """
              docker build -f Dockerfile.prod \
                -t ${IMAGE_PREFIX}/devops-pipeline:sha-${SHORT_SHA} \
                -t ${IMAGE_PREFIX}/devops-pipeline:${BRANCH_NAME} \
                .
            """
          }
        }
        stage('llm-aggregator') {
          steps {
            sh """
              docker build -f services/llm-aggregator/Dockerfile \
                -t ${IMAGE_PREFIX}/devops-pipeline-llm-aggregator:sha-${SHORT_SHA} \
                -t ${IMAGE_PREFIX}/devops-pipeline-llm-aggregator:${BRANCH_NAME} \
                services/llm-aggregator/
            """
          }
        }
        stage('user-analytics') {
          steps {
            sh """
              docker build -f services/user-analytics/Dockerfile \
                -t ${IMAGE_PREFIX}/devops-pipeline-user-analytics:sha-${SHORT_SHA} \
                -t ${IMAGE_PREFIX}/devops-pipeline-user-analytics:${BRANCH_NAME} \
                services/user-analytics/
            """
          }
        }
        stage('model-widget') {
          steps {
            sh """
              docker build -f micro-frontends/model-widget/Dockerfile \
                -t ${IMAGE_PREFIX}/devops-pipeline-model-widget:sha-${SHORT_SHA} \
                -t ${IMAGE_PREFIX}/devops-pipeline-model-widget:${BRANCH_NAME} \
                micro-frontends/model-widget/
            """
          }
        }
      }
    }

    // ── Push to GHCR ─────────────────────────────────────────────────────────
    stage('Push Images') {
      when { branch 'main' }
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'ghcr-credentials',
          usernameVariable: 'GHCR_USER',
          passwordVariable: 'GHCR_TOKEN'
        )]) {
          sh 'echo $GHCR_TOKEN | docker login ghcr.io -u $GHCR_USER --password-stdin'
          sh """
            docker push ${IMAGE_PREFIX}/devops-pipeline:sha-${SHORT_SHA}
            docker push ${IMAGE_PREFIX}/devops-pipeline:main

            docker push ${IMAGE_PREFIX}/devops-pipeline-llm-aggregator:sha-${SHORT_SHA}
            docker push ${IMAGE_PREFIX}/devops-pipeline-llm-aggregator:main

            docker push ${IMAGE_PREFIX}/devops-pipeline-user-analytics:sha-${SHORT_SHA}
            docker push ${IMAGE_PREFIX}/devops-pipeline-user-analytics:main

            docker push ${IMAGE_PREFIX}/devops-pipeline-model-widget:sha-${SHORT_SHA}
            docker push ${IMAGE_PREFIX}/devops-pipeline-model-widget:main
          """
        }
      }
    }

    // ── Terraform plan/apply ─────────────────────────────────────────────────
    stage('Terraform') {
      when { anyOf { branch 'main'; changeRequest() } }
      environment {
        AWS_ACCESS_KEY_ID     = credentials('aws-access-key-id')
        AWS_SECRET_ACCESS_KEY = credentials('aws-secret-access-key')
        AWS_REGION            = credentials('aws-region')
        TF_DB_PASSWORD        = credentials('tf-db-password')
        TF_REDIS_AUTH_TOKEN   = credentials('tf-redis-auth-token')
      }
      steps {
        dir('terraform') {
          sh 'terraform init'
          sh 'terraform fmt -check -recursive'
          sh 'terraform validate'
          sh '''
            terraform plan \
              -var="db_password=${TF_DB_PASSWORD}" \
              -var="redis_auth_token=${TF_REDIS_AUTH_TOKEN}" \
              -out=tfplan \
              -no-color | tee plan.txt
          '''
          script {
            if (env.BRANCH_NAME == 'main') {
              sh 'terraform apply -auto-approve tfplan'
            }
          }
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'terraform/plan.txt', allowEmptyArchive: true
        }
      }
    }

    // ── Deploy to Kubernetes ─────────────────────────────────────────────────
    stage('Deploy') {
      when { branch 'main' }
      environment {
        AWS_ACCESS_KEY_ID     = credentials('aws-access-key-id')
        AWS_SECRET_ACCESS_KEY = credentials('aws-secret-access-key')
        AWS_REGION            = credentials('aws-region')
      }
      steps {
        sh 'aws eks update-kubeconfig --region $AWS_REGION --name devops-pipeline-production'
        sh """
          sed -i 's|:latest|:sha-${SHORT_SHA}|g' k8s/app.yaml
          sed -i 's|:latest|:sha-${SHORT_SHA}|g' k8s/services.yaml
        """
        sh 'kubectl apply -k k8s/'
        sh '''
          kubectl rollout status deployment/nextjs-app     -n devops-pipeline --timeout=300s
          kubectl rollout status deployment/llm-aggregator -n devops-pipeline --timeout=300s
          kubectl rollout status deployment/user-analytics -n devops-pipeline --timeout=300s
          kubectl rollout status deployment/model-widget   -n devops-pipeline --timeout=300s
        '''
      }
    }

    // ── Smoke tests ──────────────────────────────────────────────────────────
    stage('Smoke Tests') {
      when { branch 'main' }
      environment {
        APP_URL            = credentials('prod-app-url')
        LLM_AGGREGATOR_URL = credentials('prod-llm-aggregator-url')
        USER_ANALYTICS_URL = credentials('prod-user-analytics-url')
        MODEL_WIDGET_URL   = credentials('prod-model-widget-url')
      }
      steps {
        sh 'bun test:smoke'
      }
    }

  } // stages

  post {
    always {
      sh 'docker logout ghcr.io || true'
    }
    failure {
      echo "Pipeline failed on branch ${BRANCH_NAME} at commit ${SHORT_SHA}"
    }
    success {
      echo "Pipeline passed — ${IMAGE_PREFIX}/devops-pipeline:sha-${SHORT_SHA} deployed"
    }
  }
}
