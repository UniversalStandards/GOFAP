locals {
  name = "gofaps-${var.environment}"
}
module "networking" {
  source       = "./modules/networking"
  name         = local.name
  zone         = var.zone
  network_cidr = var.network_cidr
}
module "compute" {
  source         = "./modules/compute"
  name           = local.name
  zone           = var.zone
  plan           = var.plan
  storage_size   = var.storage_size
  network_id     = module.networking.network_id
  ssh_public_key = var.ssh_public_key
}
module "security" {
  source      = "./modules/security"
  server_id   = module.compute.server_id
  admin_cidrs = var.admin_cidrs
}
