# AWS Subscription Backend with Razorpay Integration

This repository contains the source code and infrastructure definitions for a production-ready subscription management backend. The system is built on AWS serverless technologies (Lambda, API Gateway, DynamoDB), integrates with Razorpay for subscription handling, and uses Terraform for infrastructure as code.

## Architecture

The backend consists of the following components:

- **AWS API Gateway**: Exposes RESTful endpoints for the frontend applications to interact with.
- **AWS Lambda**: Serverless compute running Node.js to handle business logic.
- **AWS DynamoDB**: NoSQL database to store user and subscription data.
- **Razorpay**: External payment gateway to handle subscription creation, billing, and webhooks.

### Lambda Functions

The business logic is split into three separate Node.js Lambda functions located in the `src/` directory:

1. **`create-subscription`**: Generates a new Razorpay subscription and saves initial record state to DynamoDB.
2. **`check-subscription`**: Retrieves the current subscription status for a given user from DynamoDB.
3. **`webhook`**: Receives asynchronous events from Razorpay (e.g., successful payment, subscription cancelled), verifies the webhook signature, and updates the subscription state in DynamoDB accordingly.

## Infrastructure Provisioning

The infrastructure is defined using Terraform in the `terraform/` directory.

### Prerequisites

- Terraform v1.x+
- AWS CLI configured with appropriate credentials
- A Razorpay Account with API keys

### Deployment

1. Navigate to the `terraform` directory:
   ```bash
   cd terraform
   ```
2. Initialize Terraform:
   ```bash
   terraform init
   ```
3. Apply the infrastructure (you will need to provide the required variables for Razorpay configuration):
   ```bash
   terraform apply
   ```

## CI/CD Pipeline

A GitHub Actions workflow is defined in `.github/workflows/deploy.yml` which automates the deployment process.

On every push to the `main` branch, the workflow:
1. Installs Node.js dependencies for each Lambda function.
2. Configures AWS Credentials.
3. Runs `terraform init` and `terraform apply` to provision/update the infrastructure.

### GitHub Secrets Required

To enable the automated deployment, you need to configure the following secrets in your GitHub repository:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `PLAN_ID` (The Razorpay subscription Plan ID)

## Development

To work on the individual Lambda functions, navigate to their respective directories and install the dependencies:

```bash
cd src/create-subscription
npm install
```

Ensure you run `npm install` in the specific function's directory before making changes.
