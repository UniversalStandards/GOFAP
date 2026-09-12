provider "aws" {
  region = var.region
}
data "aws_ssm_parameter" "amazon_linux_2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}
locals {
  name = "gofaps-${var.environment}"
  tags = merge(var.tags, {
    Application = "GOFAPS", Environment = var.environment, ManagedBy = "Terraform"
  })
}
module "networking" {
  source            = "./modules/networking"
  name              = local.name
  vpc_cidr          = var.vpc_cidr
  subnet_cidr       = var.subnet_cidr
  availability_zone = var.availability_zone
  tags              = local.tags
}
module "security" {
  source      = "./modules/security"
  name        = local.name
  vpc_id      = module.networking.vpc_id
  admin_cidrs = var.admin_cidrs
  tags        = local.tags
}
module "compute" {
  source             = "./modules/compute"
  name               = local.name
  ami_id             = data.aws_ssm_parameter.amazon_linux_2023.value
  instance_type      = var.instance_type
  subnet_id          = module.networking.subnet_id
  security_group_ids = [module.security.security_group_id]
  ssh_public_key     = var.ssh_public_key
  tags               = local.tags
}
