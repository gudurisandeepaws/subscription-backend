# Interview Assistance - Product Documentation

## Overview
The Interview Assistance Service provides premium access to interview tools through a simple one-time payment. Once a user pays the fee, their account is permanently upgraded to "Premium" status.

## Core Features
1. **One-Time Payment**: Users pay a single fee for lifetime/extended access (no recurring subscriptions).
2. **Instant Activation**: Automated webhook processing ensures that premium features are enabled immediately after a successful transaction.
3. **Status Verification**: A simple API to check whether a user has already paid and is eligible for premium features.

## User Flow
1. **Check Status**: When the user opens the application, the frontend calls the `/check-subscription` endpoint with the user's email.
2. **Payment Trigger**: If `isPremium` is `false`, the frontend displays a "Buy Premium" button.
3. **Generate Link**: Clicking the button calls `/create-subscription` (renamed to Create Payment Link), which returns a Razorpay Payment Link.
4. **Checkout**: The user is redirected to the Razorpay hosted payment page to complete the transaction.
5. **Confirmation**: Razorpay triggers a webhook (`payment_link.paid`) to our backend.
6. **Access Granted**: The backend updates DynamoDB, setting `isPremium` to `true`. Subsequent checks will now return `true`.

---

## API Reference

### 1. Create Payment Link
Generates a one-time Razorpay Payment Link.

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
      "paymentLinkId": "plink_1234567890"
    }
    ```

### 2. Check Premium Status
Checks whether a given user has premium access.

* **URL:** `/check-subscription`
* **Method:** `GET`
* **Query Parameters:** `email=user@example.com`
* **Success Response:**
  ```json
  {
    "isPremium": true
  }
  ```

### 3. Webhook (Internal)
Handles the `payment_link.paid` event from Razorpay to activate the user's premium status.
