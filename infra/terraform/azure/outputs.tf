output "resource_group_name" {
  value = azurerm_resource_group.this.name
}
output "vm_id" {
  value = module.compute.vm_id
}
output "public_ip" {
  value = module.compute.public_ip
}
