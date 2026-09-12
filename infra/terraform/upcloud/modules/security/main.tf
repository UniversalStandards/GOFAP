resource "upcloud_firewall_rules" "this" {
  server_id = var.server_id
  dynamic "firewall_rule" {
    for_each = toset(var.admin_cidrs)
    content {
      action                 = "accept"
      direction              = "in"
      family                 = "IPv4"
      protocol               = "tcp"
      destination_port_start = "22"
      destination_port_end   = "22"
      source_address_start   = cidrhost(firewall_rule.value, 0)
      source_address_end     = cidrhost(firewall_rule.value, -1)
      comment                = "SSH administration"
    }
  }
  firewall_rule {
    action                 = "accept"
    direction              = "in"
    family                 = "IPv4"
    protocol               = "tcp"
    destination_port_start = "80"
    destination_port_end   = "80"
    comment                = "HTTP"
  }
  firewall_rule {
    action                 = "accept"
    direction              = "in"
    family                 = "IPv4"
    protocol               = "tcp"
    destination_port_start = "443"
    destination_port_end   = "443"
    comment                = "HTTPS"
  }
  firewall_rule {
    action    = "accept"
    direction = "out"
    family    = "IPv4"
    protocol  = ""
    comment   = "Outbound IPv4"
  }
  firewall_rule {
    action    = "drop"
    direction = "in"
    family    = "IPv4"
    protocol  = ""
    comment   = "Default deny inbound"
  }
}
