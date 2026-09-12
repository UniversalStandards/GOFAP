environment       = "production"
region            = "us-east-1"
availability_zone = "us-east-1c"
vpc_cidr          = "10.30.0.0/16"
subnet_cidr       = "10.30.1.0/24"
instance_type     = "t3.large"
tags              = { Owner = "platform-team", CostCenter = "gofaps" }
