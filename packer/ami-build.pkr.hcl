packer {
  required_plugins {
    amazon = {
      version = ">= 1.0.0, <2.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "artifact" {
  type    = string
  default = ""
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "source_ami" {
  type    = string
  default = "ami-0866a3c8686eaeeba"
}

variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

variable "subnet_id" {
  type    = string
  default = ""
}

variable "instance_type" {
  type    = string
  default = "t2.small"
}

variable "aws_demo_account" {
  type    = string
  default = "123456789012"
}

source "amazon-ebs" "my-ami" {
  region          = var.aws_region
  ami_name        = "aashish-csye-webapp-{{timestamp}}"
  ami_description = "CSYE Webapp AMI"

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }

  ami_users     = [var.aws_demo_account]
  instance_type = var.instance_type
  source_ami    = var.source_ami
  ssh_username  = var.ssh_username
  subnet_id     = var.subnet_id

  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/sda1"
    volume_size           = 8
    volume_type           = "gp2"
  }
}

build {
  sources = [
    "source.amazon-ebs.my-ami"
  ]

  provisioner "file" {
    source      = var.artifact
    destination = "/tmp/app.zip"
  }

  provisioner "shell" {
    script = "./packer/scripts/os_setup.sh"
  }

  provisioner "shell" {
    script = "./packer/scripts/dir_setup.sh"
  }

  provisioner "shell" {
    script = "./packer/scripts/app_setup.sh"
  }

  provisioner "shell" {
    script = "./packer/scripts/app_install.sh"
  }

  provisioner "shell" {
    script = "./packer/scripts/service_setup.sh"
  }

  provisioner "shell" {
    script = "./packer/scripts/app_cleanup.sh"
  }

}