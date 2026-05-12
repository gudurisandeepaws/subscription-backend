const Razorpay = require('razorpay');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const email = body.email;

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) };
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log(`email id check ${email}`);

    // 1. Create a customer (or get existing one)
    const customer = await instance.customers.create({
      email: email,
      fail_existing: 0,
      notes: {
        email: email
      }
    });

    // 2. Create a subscription
    console.log(`Attempting to create subscription with Plan ID: ${process.env.PLAN_ID} and Customer ID: ${customer.id}`);

    const subscription = await instance.subscriptions.create({
      plan_id: process.env.PLAN_ID,
      // customer_id: customer.id,
      customer_notify: 1,
      total_count: 1, // keep small for testing
      start_at: Math.floor(Date.now() / 1000) + 60, // start after 1 minute
      notes: {
        email: email
      }
    });

    console.log(` testing subscription console ${JSON.stringify(subscription, null, 2)}`);
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkoutUrl: subscription.short_url,
        subscriptionId: subscription.id
      })
    };

  } catch (error) {
    console.error("Error creating subscription:", error);
    // Return the specific error from Razorpay if available
    const errorMessage = error.description || error.message || "Unknown error";
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create subscription',
        details: errorMessage
      })
    };
  }
};
