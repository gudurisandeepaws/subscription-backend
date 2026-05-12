variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  type        = string
  default     = "Users"
}

variable "razorpay_key_id" {
  description = "Razorpay Key ID"
  type        = string
}

variable "razorpay_key_secret" {
  description = "Razorpay Key Secret"
  type        = string
  sensitive   = true
}

variable "razorpay_webhook_secret" {
  description = "Razorpay Webhook Secret"
  type        = string
  sensitive   = true
}

variable "payment_amount" {
  description = "Payment amount in paise (e.g., 50000 for ₹500.00)"
  type        = number
  default     = 50000
}
