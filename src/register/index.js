const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password, name } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and password are required' })
      };
    }

    // 1. Check if user already exists
    const getCommand = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: { email }
    });

    const existingUser = await docClient.send(getCommand);
    if (existingUser.Item) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User already exists' })
      };
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Store user in DynamoDB
    const putCommand = new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        email,
        name: name || '',
        passwordHash,
        isPremium: false,
        createdAt: new Date().toISOString()
      }
    });

    await docClient.send(putCommand);

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: 'User registered successfully' })
    };

  } catch (error) {
    console.error("Error in registration:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
