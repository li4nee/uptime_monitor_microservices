import * as amqp from "amqplib";
import { GlobalSettings } from "../globalSettings";
import { discordOptions, InternalServerError, MailOptions, slackOptions } from "../typings/base.type";
import { logger } from "../utils/logger.utils";

class MessageBrokerProducer {
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  private readonly url = GlobalSettings.rabbitMQ.url;
  private readonly exchangeName = GlobalSettings.rabbitMQ.exchange;
  private readonly routingKeyEmail = GlobalSettings.rabbitMQ.routingKeyEmail;
  private readonly routingKeySlack = GlobalSettings.rabbitMQ.routingKeySlack;
  private readonly routingKeyDiscord = GlobalSettings.rabbitMQ.routingKeyDiscord;

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

  async assertExchange(exchange: string, type: string = "direct"): Promise<boolean> {
    if (!this.channel) {
      throw new InternalServerError("Channel not created. Call createChannel() first.");
    }
    try {
      await this.channel.assertExchange(exchange, type, { durable: true });
      return true;
    } catch (err) {
      throw new InternalServerError("Failed to assert exchange: " + (err as Error).message);
    }
  }

  async setupBroker(): Promise<void> {
    try {
      await this.createConnection();
      await this.createChannel();
      await this.assertExchange(this.exchangeName);
      logger.info("RabbitMQ broker setup completed successfully in MONITOR_SERVICE");
    } catch (err) {
      throw new InternalServerError("Failed to setup message broker: " + (err as Error).message);
    }
  }

  async publish(message: string, routingKey: string): Promise<void> {
    if (!this.channel) {
      throw new InternalServerError("Channel not created. Call createChannel() first.");
    }
    try {
      const buffer = Buffer.from(message);
      this.channel.publish(this.exchangeName, routingKey, buffer);
    } catch (err) {
      throw new InternalServerError("Failed to publish message: " + (err as Error).message);
    }
  }

  async sendEmail(to: string, subject: string, body?: string, html?: string): Promise<void> {
    if (!this.channel) {
      throw new InternalServerError("Channel not created. Call createChannel() first.");
    }
    try {
      let message: MailOptions = {
        from: GlobalSettings.mail.user,
        to,
        subject,
        text: body,
        html,
      };
      let stringifyMessage = JSON.stringify(message);
      await this.publish(stringifyMessage, this.routingKeyEmail);
    } catch (err) {
      throw new InternalServerError("Failed to send email: " + (err as Error).message);
    }
  }

  async sendSlackMessage(channel: string, text: string): Promise<void> {
    if (!this.channel) {
      throw new InternalServerError("Channel not created. Call createChannel() first.");
    }
    try {
      const message: slackOptions = { channel, text };
      const stringifyMessage = JSON.stringify(message);
      await this.publish(stringifyMessage, this.routingKeySlack);
    } catch (err) {
      throw new InternalServerError("Failed to send Slack message: " + (err as Error).message);
    }
  }

  async sendDiscordMessage(channelId: string, content: string): Promise<void> {
    if (!this.channel) {
      throw new InternalServerError("Channel not created. Call createChannel() first.");
    }
    try {
      const message: discordOptions = { channelId, content };
      const stringifyMessage = JSON.stringify(message);
      await this.publish(stringifyMessage, this.routingKeyDiscord);
    } catch (err) {
      throw new InternalServerError("Failed to send Discord message: " + (err as Error).message);
    }
  }
}

let producerInstance: MessageBrokerProducer | null = null;
export function getMessageBrokerProducer(): MessageBrokerProducer {
  if (!producerInstance) {
    producerInstance = new MessageBrokerProducer();
    producerInstance.setupBroker().catch((err) => {
      console.error("Error setting up message broker:", err);
    });
  }
  return producerInstance;
}
