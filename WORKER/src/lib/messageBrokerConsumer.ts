import * as amqp from "amqplib";
import { GlobalSettings } from "../globalSettings";
import { DiscordOptions, InternalServerError, MailOptions, SlackOptions } from "../typings/base.type";
import { sendSlackMessage } from "../utility/slack.utils";
import { sendDiscordMessage } from "../utility/discord.utils";
import { sendEmail } from "../utility/mailsender.utils";
export class MessageBrokerConsumer {
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  private readonly url = GlobalSettings.rabbitMQ.url;
  private readonly queueEmail = GlobalSettings.rabbitMQ.queueEmail;
  private readonly queueSlack = GlobalSettings.rabbitMQ.queueSlack;
  private readonly queueDiscord = GlobalSettings.rabbitMQ.queueDiscord;

  async createConnection(): Promise<amqp.ChannelModel> {
    try {
      this.connection = await amqp.connect(this.url);
      return this.connection;
    } catch (err) {
      throw new InternalServerError("Failed to connect to RabbitMQ: " + (err as Error).message);
    }
  }

  async createChannel(): Promise<amqp.Channel | undefined> {
    if (!this.connection) {
      throw new InternalServerError("Connection not established. Call createConnection() first.");
    }
    try {
      this.channel = await this.connection.createChannel();
      return this.channel;
    } catch (err) {
      throw new InternalServerError("Failed to create channel: " + (err as Error).message);
    }
  }

  async assertQueue(queue: string, durable: boolean = false): Promise<boolean> {
    if (!this.channel) {
      throw new InternalServerError("Channel not created. Call createChannel() first.");
    }
    try {
      await this.channel.assertQueue(queue, { durable });
      return true;
    } catch (err) {
      throw new InternalServerError("Failed to assert queue: " + (err as Error).message);
    }
  }

  async setupBroker(): Promise<void> {
    try {
      await this.createConnection();
      await this.createChannel();
      await this.assertQueue(this.queueEmail, true);
      await this.assertQueue(this.queueSlack, true);
      await this.assertQueue(this.queueDiscord, true);
    } catch (err) {
      throw new InternalServerError("Failed to setup message broker: " + (err as Error).message);
    }
  }

  async consume(): Promise<void> {
    if (!this.channel) {
      throw new InternalServerError("Channel not available. Call setupBroker() first.");
    }

    await this.channel.consume(this.queueEmail, async (msg) => {
      if (msg) {
        try {
          const content: MailOptions = JSON.parse(msg.content.toString());
          await this.handleEmail(content);
          this.channel!.ack(msg);
        } catch (err) {
          this.channel!.nack(msg, false, false); // no requeue
        }
      }
    });

    await this.channel.consume(this.queueSlack, async (msg) => {
      if (msg) {
        try {
          const content: SlackOptions = JSON.parse(msg.content.toString());
          await this.handleSlack(content);
          this.channel!.ack(msg);
        } catch (err) {
          this.channel!.nack(msg, false, false);
        }
      }
    });

    await this.channel.consume(this.queueDiscord, async (msg) => {
      if (msg) {
        try {
          const content: DiscordOptions = JSON.parse(msg.content.toString());
          await this.handleDiscord(content);
          this.channel!.ack(msg);
        } catch (err) {
          this.channel!.nack(msg, false, false);
        }
      }
    });
  }

  private async handleEmail(content: MailOptions): Promise<void> {
    console.log("Handling email message:", content);
    await sendEmail(content.to, content);
  }

  private async handleSlack(content: SlackOptions): Promise<void> {
    console.log("Handling Slack message:", content);
    await sendSlackMessage(content.channel, content.text);
  }

  private async handleDiscord(content: DiscordOptions): Promise<void> {
    console.log("Handling Discord message:", content);
    await sendDiscordMessage(content.channelId, content.content);
  }
}

let messageBrokerConsumerInstance: MessageBrokerConsumer | null = null;

export function getMessageBrokerConsumer(): MessageBrokerConsumer {
  if (!messageBrokerConsumerInstance) {
    messageBrokerConsumerInstance = new MessageBrokerConsumer();
  }
  return messageBrokerConsumerInstance;
}
