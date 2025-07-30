import * as amqp from "amqplib";
import { GlobalSettings } from "../globalSettings";
import { MailOptions } from "../typings/base.typings";
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

  private async assertQueue(queue: string, durable: boolean = false): Promise<boolean> {
    if (!this.channel) {
      throw new Error("Channel not created. Call createChannel() first.");
    }
    try {
      await this.channel.assertQueue(queue, { durable });
      return true;
    } catch (err) {
      throw new Error("Failed to assert queue: " + (err as Error).message);
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

  private async bindQueue(queue: string, exchange: string, routingKey: string): Promise<boolean> {
    if (!this.channel) {
      throw new Error("Channel not created. Call createChannel() first.");
    }
    try {
      await this.channel.bindQueue(queue, exchange, routingKey);
      return true;
    } catch (err) {
      throw new Error("Failed to bind queue: " + (err as Error).message);
    }
  }

  async setupBroker(): Promise<void> {
    try {
      await this.createConnection();
      await this.createChannel();
      await this.assertExchange(this.exchangeName);
      await this.assertQueue(this.emailQueue, true);
      await this.bindQueue(this.emailQueue, this.exchangeName, this.routingKeyEmail);
    } catch (err) {
      console.error("Error setting up RabbitMQ broker:", err);
      throw new Error("Failed to setup RabbitMQ broker: " + (err as Error).message);
    }
  }

  async sendEmail(data: MailOptions): Promise<boolean> {
    if (!this.channel) {
      throw new Error("Channel not created. Call createChannel() first.");
    }
    try {
      const message = JSON.stringify(data);
      this.channel.sendToQueue(this.emailQueue, Buffer.from(message), { persistent: true });
      return true;
    } catch (err) {
      throw new Error("Failed to send email: " + (err as Error).message);
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
