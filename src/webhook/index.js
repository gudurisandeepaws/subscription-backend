const crypto = require('crypto');
const Razorpay = require('razorpay');
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
    
    // Razorpay subscription events usually have the subscription entity
    const subscription = payload.payload.subscription.entity;
    
    // Extract email from notes (we passed this during creation)
    const email = subscription.notes && subscription.notes.email;

    if (!email) {
      console.warn('No email found in subscription notes. Cannot update DB.');
      return { statusCode: 200, body: 'OK' }; // Acknowledge webhook
    }

    let isPremium = false;
    let status = subscription.status;

    if (eventName === 'subscription.charged' || status === 'active' || status === 'authenticated') {
      isPremium = true;
    } else if (eventName === 'subscription.cancelled' || status === 'cancelled' || status === 'halted') {
      isPremium = false;
    }

    // Store in DynamoDB
    const putCommand = new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        email: email,
        isPremium: isPremium,
        subscriptionId: subscription.id,
        status: status,
        updatedAt: new Date().toISOString()
      }
    });

    await docClient.send(putCommand);
    console.log(`Successfully updated subscription status for ${email}`);

    return { statusCode: 200, body: 'OK' };

  } catch (error) {
    console.error("Error in webhook handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
