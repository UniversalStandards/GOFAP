output "server_id" {
  value = upcloud_server.this.id
}
output "public_ip" {
  value = upcloud_server.this.network_interface[0].ip_address
}
