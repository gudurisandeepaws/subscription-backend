# Subscription Service - Product Documentation

## Overview
The Subscription Service is a robust, serverless backend designed to manage recurring billing and subscriptions for our users. By integrating with Razorpay, we offer a seamless checkout experience and automated subscription management. The backend is designed using AWS API Gateway, Lambda, and DynamoDB to ensure high availability, fast response times, and infinite scalability.

## Core Features
1. **Automated Checkout Generation:** Instantly generate secure, unique Razorpay checkout URLs for users based on their email.
2. **Subscription Status Tracking:** Real-time visibility into whether a user holds an active premium subscription.
3. **Automated Webhook Processing:** Asynchronously listens to Razorpay events (such as successful payments or subscription cancellations) and updates the internal database in real-time without requiring user intervention.

## User Flow
1. **Initiation**: The user clicks "Subscribe" or "Upgrade" in the frontend application.
2. **Checkout Creation**: The frontend calls the backend to create a subscription. The backend registers the customer in Razorpay, attaches them to our specific `PLAN_ID`, and returns a `checkoutUrl`.
3. **Payment**: The frontend redirects the user to the `checkoutUrl` where they securely enter their payment details.
4. **Verification**: After a successful transaction, Razorpay asynchronously triggers a webhook to our backend.
5. **Activation**: Our backend verifies the webhook signature for security, extracts the customer information, and activates the user's premium status in our DynamoDB database.
6. **Access**: The next time the user tries to access premium features, the frontend verifies their status and grants access.

---

## API Reference

The backend exposes the following RESTful endpoints via AWS API Gateway.

### 1. Create a Subscription
Generates a new Razorpay subscription and returns the checkout URL to redirect the user to.

* **URL:** `/create-subscription`
* **Method:** `POST`
* **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
* **Success Response:**
  * **Code:** 200 OK
  * **Content:**
    ```json
    {
      "checkoutUrl": "https://rzp.io/i/exampleUrl",
      "subscriptionId": "sub_1234567890"
    }
    ```
* **Error Response:**
  * **Code:** 400 Bad Request (Missing email)
  * **Code:** 500 Internal Server Error (Razorpay error)

### 2. Check Subscription Status
Checks whether a given user currently has an active premium subscription.

* **URL:** `/check-subscription`
* **Method:** `GET`
* **Query Parameters:**
  * `email`: The email address of the user. (e.g., `/check-subscription?email=user@example.com`)
* **Success Response:**
  * **Code:** 200 OK
  * **Content:**
    ```json
    {
      "isPremium": true
    }
    ```
* **Error Response:**
  * **Code:** 400 Bad Request (Missing email query parameter)
  * **Code:** 500 Internal Server Error (Database connection issue)

### 3. Razorpay Webhook
*Internal endpoint used strictly by Razorpay.* Receives asynchronous events regarding subscription and payment status. Validates the `x-razorpay-signature` header using our secret webhook key to ensure data authenticity.

* **URL:** `/webhook`
* **Method:** `POST`
* **Events Handled:** `subscription.authenticated`, `subscription.activated`, `subscription.cancelled`, `subscription.halted`, etc.

## Infrastructure Highlights
- **Serverless Compute**: Fully managed by AWS Lambda, scaling automatically with traffic.
- **Pay-Per-Request Database**: AWS DynamoDB handles data storage with minimal baseline cost and single-digit millisecond latency.
- **Infrastructure as Code**: The entire stack is codified using Terraform, ensuring reproducible deployments across staging and production environments.
