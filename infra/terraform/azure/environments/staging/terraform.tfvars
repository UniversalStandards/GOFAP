environment     = "staging"
location        = "eastus"
address_space   = ["10.50.0.0/16"]
subnet_prefixes = ["10.50.1.0/24"]
vm_size         = "Standard_D2s_v5"
admin_username  = "gofaps"
tags            = { Owner = "platform-team", CostCenter = "gofaps" }
