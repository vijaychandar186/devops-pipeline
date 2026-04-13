# Terraform LocalStack test configuration
#
# Tests the VPC module against LocalStack Community edition.
# RDS and ElastiCache require LocalStack Pro (CreateDBSubnetGroup and
# ElastiCache APIs return 501 in the community image).
# EKS is excluded entirely — not supported even in Pro via tflocal.
#
# Community coverage: VPC, subnets, route tables, internet gateway,
#   NAT gateways, security groups, EIPs.
#
# Use `make kind-up` + `make kind-deploy` to test Kubernetes locally.
#
# Requirements:
#   LocalStack running: make localstack-up
#   tflocal wrapper:    pip install terraform-local
#
# Usage:
#   make tf-local-init    # tflocal init
#   make tf-local-plan    # tflocal plan
#   make tf-local-apply   # tflocal apply
#   make tf-local-destroy # tflocal destroy

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  ls = "http://localhost:4566"
}

provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    ec2 = local.ls
    iam = local.ls
    sts = local.ls
  }
}

# ── VPC ───────────────────────────────────────────────────────────────────────

module "vpc" {
  source = "../modules/vpc"

  project     = "devops-pipeline"
  environment = "localstack"
  region      = "us-east-1"
  cidr        = "10.0.0.0/16"
}

# ── Security groups (validate SG config; stand in for RDS/ElastiCache/EKS SGs)

resource "aws_security_group" "mock_eks_nodes" {
  name        = "mock-eks-nodes"
  description = "Placeholder EKS node SG — LocalStack community test"
  vpc_id      = module.vpc.vpc_id
}

resource "aws_security_group" "mock_rds" {
  name        = "mock-rds"
  description = "Placeholder RDS SG — LocalStack community test"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.mock_eks_nodes.id]
  }
}

resource "aws_security_group" "mock_redis" {
  name        = "mock-redis"
  description = "Placeholder Redis SG — LocalStack community test"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.mock_eks_nodes.id]
  }
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}
