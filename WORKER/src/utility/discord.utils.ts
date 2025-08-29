import axios from "axios";

export async function sendDiscordMessage(webhookUrl: string, message: string): Promise<void> {
  try {
    await axios.post(webhookUrl, { content: message });
  } catch (error) {
    console.error(`Failed to send Discord message to ${webhookUrl}:`, error);
    throw error;
  }
}
