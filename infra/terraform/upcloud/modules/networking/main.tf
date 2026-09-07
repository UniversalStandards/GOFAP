resource "upcloud_network" "this" {
  name = "${var.name}-network"
  zone = var.zone
  ip_network {
    address = var.network_cidr
    dhcp    = true
    family  = "IPv4"
  }
}
