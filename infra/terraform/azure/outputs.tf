output "resource_group_names" {
  description = "Resource group names created for each environment."
  value = {
    dev            = azurerm_resource_group.dev.name
    staging        = azurerm_resource_group.staging.name
    prod           = azurerm_resource_group.prod.name
    shared_network = azurerm_resource_group.shared.name
  }
}

output "shared_vnet_id" {
  description = "ID of the shared virtual network."
  value       = azurerm_virtual_network.shared.id
}

output "shared_subnet_ids" {
  description = "IDs of the shared subnets for app, data, and private endpoints."
  value       = { for name, subnet in azurerm_subnet.shared : name => subnet.id }
}
