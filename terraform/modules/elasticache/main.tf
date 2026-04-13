locals {
  name = "${var.project}-${var.environment}"
}

resource "aws_elasticache_subnet_group" "main" {
  name       = local.name
  subnet_ids = var.private_subnets
}

resource "aws_security_group" "redis" {
  name        = "${local.name}-redis"
  description = "Allow Redis from EKS nodes"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [var.eks_sg_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-redis" }
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id = local.name
  description          = "Redis for ${local.name}"

  node_type          = var.node_type
  num_cache_clusters = 2 # primary + 1 replica
  engine_version     = "7.1"
  port               = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  auth_token                 = var.auth_token
  transit_encryption_enabled = true
  at_rest_encryption_enabled = true

  automatic_failover_enabled = true
  multi_az_enabled           = true

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format       = "text"
    log_type         = "slow-log"
  }
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/elasticache/${local.name}"
  retention_in_days = 7
}
