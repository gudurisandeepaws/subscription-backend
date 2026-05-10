provider "aws" {
  region = var.aws_region
}

# DynamoDB Table
resource "aws_dynamodb_table" "users_table" {
  name           = var.dynamodb_table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "email"

  attribute {
    name = "email"
    type = "S"
  }
}

# API Gateway (HTTP API)
resource "aws_apigatewayv2_api" "subscription_api" {
  name          = "subscription-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.subscription_api.id
  name        = "$default"
  auto_deploy = true
}

# --- Lambda: Create Subscription ---
data "archive_file" "create_subscription_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/create-subscription"
  output_path = "${path.module}/create_subscription.zip"
}

resource "aws_lambda_function" "create_subscription" {
  filename         = data.archive_file.create_subscription_zip.output_path
  function_name    = "create-subscription"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.create_subscription_zip.output_base64sha256
  runtime          = "nodejs20.x"

  environment {
    variables = {
      RAZORPAY_KEY_ID     = var.razorpay_key_id
      RAZORPAY_KEY_SECRET = var.razorpay_key_secret
      PLAN_ID             = var.razorpay_plan_id
    }
  }
}

resource "aws_apigatewayv2_integration" "create_subscription" {
  api_id             = aws_apigatewayv2_api.subscription_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.create_subscription.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "create_subscription" {
  api_id    = aws_apigatewayv2_api.subscription_api.id
  route_key = "POST /create-subscription"
  target    = "integrations/${aws_apigatewayv2_integration.create_subscription.id}"
}

resource "aws_lambda_permission" "api_gw_create_subscription" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_subscription.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.subscription_api.execution_arn}/*/*"
}

# --- Lambda: Webhook ---
data "archive_file" "webhook_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/webhook"
  output_path = "${path.module}/webhook.zip"
}

resource "aws_lambda_function" "webhook" {
  filename         = data.archive_file.webhook_zip.output_path
  function_name    = "webhook"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.webhook_zip.output_base64sha256
  runtime          = "nodejs20.x"

  environment {
    variables = {
      RAZORPAY_WEBHOOK_SECRET = var.razorpay_webhook_secret
      TABLE_NAME              = aws_dynamodb_table.users_table.name
    }
  }
}

resource "aws_apigatewayv2_integration" "webhook" {
  api_id             = aws_apigatewayv2_api.subscription_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.webhook.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "webhook" {
  api_id    = aws_apigatewayv2_api.subscription_api.id
  route_key = "POST /webhook"
  target    = "integrations/${aws_apigatewayv2_integration.webhook.id}"
}

resource "aws_lambda_permission" "api_gw_webhook" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.webhook.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.subscription_api.execution_arn}/*/*"
}

# --- Lambda: Check Subscription ---
data "archive_file" "check_subscription_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src/check-subscription"
  output_path = "${path.module}/check_subscription.zip"
}

resource "aws_lambda_function" "check_subscription" {
  filename         = data.archive_file.check_subscription_zip.output_path
  function_name    = "check-subscription"
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.check_subscription_zip.output_base64sha256
  runtime          = "nodejs20.x"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.users_table.name
    }
  }
}

resource "aws_apigatewayv2_integration" "check_subscription" {
  api_id             = aws_apigatewayv2_api.subscription_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.check_subscription.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_route" "check_subscription" {
  api_id    = aws_apigatewayv2_api.subscription_api.id
  route_key = "GET /check-subscription"
  target    = "integrations/${aws_apigatewayv2_integration.check_subscription.id}"
}

resource "aws_lambda_permission" "api_gw_check_subscription" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.check_subscription.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.subscription_api.execution_arn}/*/*"
}
