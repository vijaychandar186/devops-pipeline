terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }

  # Uncomment to use S3 remote state
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "devops-pipeline/terraform.tfstate"
  #   region         = var.region
  #   dynamodb_table = "terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "devops-pipeline"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_ca_certificate)
  token                  = module.eks.cluster_token
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_ca_certificate)
    token                  = module.eks.cluster_token
  }
}

# ── Modules ───────────────────────────────────────────────────────────────────

module "vpc" {
  source = "./modules/vpc"

  project     = var.project
  environment = var.environment
  region      = var.region
  cidr        = var.vpc_cidr
}

module "eks" {
  source = "./modules/eks"

  project             = var.project
  environment         = var.environment
  cluster_version     = var.eks_cluster_version
  vpc_id              = module.vpc.vpc_id
  private_subnets     = module.vpc.private_subnet_ids
  node_instance_types = var.node_instance_types
  node_min_size       = var.node_min_size
  node_max_size       = var.node_max_size
  node_desired_size   = var.node_desired_size
}

module "rds" {
  source = "./modules/rds"

  project         = var.project
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
  eks_sg_id       = module.eks.node_security_group_id
  db_name         = var.db_name
  db_username     = var.db_username
  db_password     = var.db_password
  instance_class  = var.rds_instance_class
}

module "elasticache" {
  source = "./modules/elasticache"

  project         = var.project
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnet_ids
  eks_sg_id       = module.eks.node_security_group_id
  node_type       = var.elasticache_node_type
  auth_token      = var.redis_auth_token
}