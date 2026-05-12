const crypto = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const signature = event.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(event.body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid signature');
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid signature' }) };
    }

    const payload = JSON.parse(event.body);
    const eventName = payload.event;
    
    console.log(`Received webhook event: ${eventName}`);

    // Handle Payment Link paid event
    if (eventName === 'payment_link.paid') {
      const paymentLink = payload.payload.payment_link.entity;
      const email = paymentLink.notes && paymentLink.notes.email;

      if (!email) {
        console.warn('No email found in payment link notes. Cannot update DB.');
        return { statusCode: 200, body: 'OK' };
      }

      // Store in DynamoDB - set isPremium to true
      const putCommand = new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: {
          email: email,
          isPremium: true,
          paymentLinkId: paymentLink.id,
          orderId: paymentLink.order_id,
          status: 'paid',
          updatedAt: new Date().toISOString()
        }
      });

      await docClient.send(putCommand);
      console.log(`Successfully activated premium status for ${email}`);
    } else {
        console.log(`Event ${eventName} ignored.`);
    }

    return { statusCode: 200, body: 'OK' };

  } catch (error) {
    console.error("Error in webhook handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
