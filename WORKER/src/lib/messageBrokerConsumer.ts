import * as amqp from "amqplib";
import { GlobalSettings } from "../globalSettings";
import { DiscordOptions, InternalServerError, MailOptions, SlackOptions } from "../typings/base.type";
import { sendSlackMessage } from "../utility/slack.utils";
import { sendDiscordMessage } from "../utility/discord.utils";
import { sendEmail } from "../utility/mailsender.utils";
import { logger } from "../utility/logger.utils";

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
      logger.error("Failed to connect to RabbitMQ", { error: err });
      throw new InternalServerError("Failed to connect to RabbitMQ: " + (err as Error).message);
    }
  }

  async createChannel(): Promise<amqp.Channel | undefined> {
    if (!this.connection) {
      const msg = "Connection not established. Call createConnection() first.";
      logger.error(msg);
      throw new InternalServerError(msg);
    }
    try {
      this.channel = await this.connection.createChannel();
      return this.channel;
    } catch (err) {
      logger.error("Failed to create channel", { error: err });
      throw new InternalServerError("Failed to create channel: " + (err as Error).message);
    }
  }

  async assertQueue(queue: string, durable: boolean = false): Promise<boolean> {
    if (!this.channel) {
      const msg = "Channel not created. Call createChannel() first.";
      logger.error(msg);
      throw new InternalServerError(msg);
    }
    try {
      await this.channel.assertQueue(queue, { durable });
      return true;
    } catch (err) {
      logger.error("Failed to assert queue", { queue, error: err });
      throw new InternalServerError("Failed to assert queue: " + (err as Error).message);
    }
  }

  async bindQueue(queue: string, exchange: string, routingKey: string): Promise<boolean> {
    if (!this.channel) {
      const msg = "Channel not created. Call createChannel() first.";
      logger.error(msg);
      throw new InternalServerError(msg);
    }
    try {
      await this.channel.bindQueue(queue, exchange, routingKey);
      return true;
    } catch (err) {
      logger.error("Failed to bind queue", { queue, exchange, routingKey, error: err });
      throw new InternalServerError("Failed to bind queue: " + (err as Error).message);
    }
  }

  async assertExchange(exchange: string, type: string = "direct"): Promise<boolean> {
    if (!this.channel) {
      const msg = "Channel not created. Call createChannel() first.";
      logger.error(msg);
      throw new InternalServerError(msg);
    }
    try {
      await this.channel.assertExchange(exchange, type, { durable: true });
      return true;
    } catch (err) {
      logger.error("Failed to assert exchange", { exchange, type, error: err });
      throw new InternalServerError("Failed to assert exchange: " + (err as Error).message);
    }
  }

  async setupBroker(): Promise<void> {
    try {
      await this.createConnection();
      await this.createChannel();
      await this.assertExchange(GlobalSettings.rabbitMQ.exchange);
      await this.assertQueue(this.queueEmail, true);
      await this.assertQueue(this.queueSlack, true);
      await this.assertQueue(this.queueDiscord, true);
      await this.bindQueue(this.queueEmail, GlobalSettings.rabbitMQ.exchange, GlobalSettings.rabbitMQ.routingKeyEmail);
      await this.bindQueue(this.queueSlack, GlobalSettings.rabbitMQ.exchange, GlobalSettings.rabbitMQ.routingKeySlack);
      await this.bindQueue(this.queueDiscord, GlobalSettings.rabbitMQ.exchange, GlobalSettings.rabbitMQ.routingKeyDiscord);
      await this.consume();
    } catch (err) {
      logger.error("Failed to setup message broker", { error: err });
      throw new InternalServerError("Failed to setup message broker: " + (err as Error).message);
    }
  }

  async consume(): Promise<void> {
    if (!this.channel) {
      const msg = "Channel not available. Call setupBroker() first.";
      logger.error(msg);
      throw new InternalServerError(msg);
    }

    const retryWithMaxAttempts = async (
      msg: amqp.ConsumeMessage,
      handler: (msg: amqp.ConsumeMessage) => Promise<void>,
      queueName: string,
      maxAttempts: number = 3,
    ) => {
      const content = JSON.parse(msg.content.toString());
      const retries = (msg.properties.headers?.["x-retries"] as number) || 0;

      try {
        await handler(msg);
        logger.info(`${queueName} message processed successfully`, { content });
        this.channel!.ack(msg);
      } catch (err) {
        if (retries < maxAttempts) {
          logger.warn(`${queueName} message processing failed, retrying...`, { content, error: err, attempt: retries + 1 });
          this.channel!.ack(msg);
          this.channel!.sendToQueue(queueName, Buffer.from(JSON.stringify(content)), {
            headers: { "x-retries": retries + 1 },
            persistent: true,
          });
        } else {
          logger.error(`${queueName} message processing failed after ${maxAttempts} attempts`, { content, error: err });
          this.channel!.ack(msg);
        }
      }
    };

    await this.channel.consume(
      this.queueEmail,
      async (msg) => {
        if (msg) {
          await retryWithMaxAttempts(
            msg,
            async (m) => {
              const content: MailOptions = JSON.parse(m.content.toString());
              await this.handleEmail(content);
            },
            this.queueEmail,
          );
        }
      },
      { noAck: false },
    );

    await this.channel.consume(
      this.queueSlack,
      async (msg) => {
        if (msg) {
          await retryWithMaxAttempts(
            msg,
            async (m) => {
              const content: SlackOptions = JSON.parse(m.content.toString());
              await this.handleSlack(content);
            },
            this.queueSlack,
          );
        }
      },
      { noAck: false },
    );

    await this.channel.consume(
      this.queueDiscord,
      async (msg) => {
        if (msg) {
          await retryWithMaxAttempts(
            msg,
            async (m) => {
              const content: DiscordOptions = JSON.parse(m.content.toString());
              await this.handleDiscord(content);
            },
            this.queueDiscord,
          );
        }
      },
      { noAck: false },
    );
  }

  private async handleEmail(content: MailOptions): Promise<void> {
    logger.debug("Handling email", { to: content.to });
    await sendEmail(content.to, content);
  }

  private async handleSlack(content: SlackOptions): Promise<void> {
    logger.debug("Handling slack", { channel: content.channel });
    await sendSlackMessage(content.channel, content.text);
  }

  private async handleDiscord(content: DiscordOptions): Promise<void> {
    logger.debug("Handling discord", { channelId: content.channelId });
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
