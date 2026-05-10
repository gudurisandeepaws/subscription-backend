const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const email = event.queryStringParameters && event.queryStringParameters.email;

    if (!email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email query parameter is required' }) };
    }

    const command = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        email: email
      }
    });

    const response = await docClient.send(command);
    const item = response.Item;

    if (!item) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPremium: false })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPremium: item.isPremium || false })
    };

  } catch (error) {
    console.error("Error checking subscription:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
