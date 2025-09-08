import { WebClient, LogLevel } from "@slack/web-api";
import dotenv from 'dotenv';

dotenv.config();

const token: string | undefined = process.env.SLACK_BOT_USER_OAUTH_TOKEN;
const channelId: string | undefined = process.env.SLACK_CHANNEL_ID;

if (!token || !channelId) {
  console.error("Slack token or channel ID is missing!");
  process.exit(1);
}

const client = new WebClient(token, {
  logLevel: LogLevel.DEBUG
});

// Define the function to publish a message
async function publishSlackMessage(id: string, text: string): Promise<void> {
  try {
    console.log('Sending message to Slack...');
    const result = await client.chat.postMessage({
      channel: id,
      text: text
    });
    console.log('Message sent successfully: ', result);
  } catch (error: any) { // Explicitly type error as any
    console.error('Error posting message:', error);
    if (error.response) {
      console.error('Slack error response: ', error.response);
    }
  }
}

// publishMessage(channelId, "Test message from TypeScript!");

export default publishSlackMessage;