import * as amqp from "amqplib";
import { GlobalSettings } from "../globalSettings";
import { MailOptions } from "../typings/base.typings";
import { logger } from "../utility/logger.utils";
class Broker {
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  private readonly url = GlobalSettings.rabbitMQ.url;
  private readonly exchangeName = GlobalSettings.rabbitMQ.exchange;
  private readonly emailQueue = GlobalSettings.rabbitMQ.queueEmail;
  private readonly routingKeyEmail = GlobalSettings.rabbitMQ.routingKeyEmail;

  private async createConnection(): Promise<amqp.ChannelModel> {
    try {
      this.connection = await amqp.connect(this.url);
      return this.connection;
    } catch (err) {
      throw new Error("Failed to connect to RabbitMQ: " + (err as Error).message);
    }
  }

  private async createChannel(): Promise<amqp.Channel | undefined> {
    if (!this.connection) {
      throw new Error("Connection not established. Call createConnection() first.");
    }
    try {
      this.channel = await this.connection.createChannel();
      return this.channel;
    } catch (err) {
      throw new Error("Failed to create channel: " + (err as Error).message);
    }
  }

  private async assertExchange(exchange: string, type: string = "direct"): Promise<boolean> {
    if (!this.channel) {
      throw new Error("Channel not created. Call createChannel() first.");
    }
    try {
      await this.channel.assertExchange(exchange, type, { durable: true });
      return true;
    } catch (err) {
      throw new Error("Failed to assert exchange: " + (err as Error).message);
    }
  }

  async setupBroker(): Promise<void> {
    try {
      await this.createConnection();
      await this.createChannel();
      await this.assertExchange(this.exchangeName);
    } catch (err) {
      logger.error("Failed to setup RabbitMQ broker", { error: err });
      throw new Error("Failed to setup RabbitMQ broker: " + (err as Error).message);
    }
  }

  async sendEmail(data: MailOptions): Promise<boolean | undefined> {
    if (!this.channel) {
      throw new Error("Channel not created. Call createChannel() first.");
    }
    try {
      const message = JSON.stringify(data);
      this.channel.publish(this.exchangeName, this.routingKeyEmail, Buffer.from(message), {
        persistent: true,
      });
      return true;
    } catch (err) {
      logger.error("Failed to send email message to RabbitMQ", {
        message: (err as Error).message,
        stack: (err as Error).stack,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

let BrokerInstance: Broker | null;
export function getBrokerInstance(): Broker {
  if (!BrokerInstance) {
    BrokerInstance = new Broker();
    BrokerInstance.setupBroker().catch((err) => {
      console.error("Failed to setup RabbitMQ broker:", err);
    });
  }
  return BrokerInstance;
}
