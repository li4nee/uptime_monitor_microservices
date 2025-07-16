import * as amqp from "amqplib";
import { GlobalSettings } from "../globalSettings";
import { InternalServerError } from "../typings/base.type";
export class MessageBrokerConsumer {
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  private readonly url = GlobalSettings.rabbitMQ.url;
  private readonly queueName = GlobalSettings.rabbitMQ.queue;

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
      await this.assertQueue(this.queueName, true);
    } catch (err) {
      throw new InternalServerError("Failed to setup message broker: " + (err as Error).message);
    }
  }

}