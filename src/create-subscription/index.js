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

    console.log(`Generating payment link for email: ${email}`);

    // Create a Payment Link for one-time payment
    const paymentLink = await instance.paymentLink.create({
      amount: parseInt(process.env.PAYMENT_AMOUNT || '50000'), // in paise
      currency: "INR",
      accept_partial: false,
      description: "Interview Assistance Premium Access",
      customer: {
        email: email
      },
      notify: {
        email: true
      },
      reminder_enable: true,
      notes: {
        email: email
      },
      callback_url: "https://your-frontend-url.com/payment-success", // You should update this to your actual frontend success page
      callback_method: "get"
    });

    console.log(`Payment link generated: ${paymentLink.short_url}`);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkoutUrl: paymentLink.short_url,
        paymentLinkId: paymentLink.id
      })
    };

  } catch (error) {
    console.error("Error creating payment link:", error);
    const errorMessage = error.description || error.message || "Unknown error";
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create payment link', 
        details: errorMessage 
      })
    };
  }
};
