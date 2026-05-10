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

    // 1. Create a customer
    const customer = await instance.customers.create({
      email: email,
      notes: {
        email: email
      }
    });

    // 2. Create a subscription
    const subscription = await instance.subscriptions.create({
      plan_id: process.env.PLAN_ID,
      customer_id: customer.id,
      total_count: 120, // Setting a high number of billing cycles
      notes: {
        email: email // Note is important to identify user in webhook
      }
    });

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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create subscription', details: error.message })
    };
  }
};
