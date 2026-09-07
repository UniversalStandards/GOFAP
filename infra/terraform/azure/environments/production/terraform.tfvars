environment     = "production"
location        = "eastus"
address_space   = ["10.60.0.0/16"]
subnet_prefixes = ["10.60.1.0/24"]
vm_size         = "Standard_D4s_v5"
admin_username  = "gofaps"
tags            = { Owner = "platform-team", CostCenter = "gofaps" }
