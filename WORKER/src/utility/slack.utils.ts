import axios from "axios";

export async function sendSlackMessage(webhookUrl: string, message: string): Promise<void> {
  try {
    await axios.post(webhookUrl, { text: message });
  } catch (error) {
    console.error(`Failed to send Slack message to ${webhookUrl}:`, error);
    throw error;
  }
}
