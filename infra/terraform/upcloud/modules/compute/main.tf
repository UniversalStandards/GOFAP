resource "upcloud_server" "this" {
  hostname = var.name
  zone     = var.zone
  plan     = var.plan
  firewall = true
  metadata = true
  template {
    storage = "Ubuntu Server 22.04 LTS (Cloud-Init)"
    size    = var.storage_size
  }
  network_interface {
    type = "public"
  }
  network_interface {
    type    = "private"
    network = var.network_id
  }
  user_data = <<-CLOUD_INIT
    #cloud-config
    users:
      - name: gofaps
        groups: sudo
        shell: /bin/bash
        sudo: ALL=(ALL) NOPASSWD:ALL
        ssh_authorized_keys:
          - ${var.ssh_public_key}
    ssh_pwauth: false
    package_update: true
  CLOUD_INIT
}
