resource "aws_key_pair" "this" {
  key_name   = var.name
  public_key = var.ssh_public_key
  tags       = var.tags
}
resource "aws_instance" "this" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = var.security_group_ids
  key_name               = aws_key_pair.this.key_name
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }
  root_block_device {
    encrypted   = true
    volume_type = "gp3"
    volume_size = 30
  }
  tags = merge(var.tags, {
    Name = var.name
  })
}
