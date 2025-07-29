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
      logger.info("Connecting to RabbitMQ", { url: this.url });
      this.connection = await amqp.connect(this.url);
      logger.info("Successfully connected to RabbitMQ");
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
      logger.info("Creating channel");
      this.channel = await this.connection.createChannel();
      logger.info("Channel created successfully");
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
      logger.info(`Asserting queue: ${queue}`, { durable });
      await this.channel.assertQueue(queue, { durable });
      logger.info(`Queue asserted: ${queue}`);
      return true;
    } catch (err) {
      logger.error("Failed to assert queue", { queue, error: err });
      throw new InternalServerError("Failed to assert queue: " + (err as Error).message);
    }
  }

  async setupBroker(): Promise<void> {
    try {
      logger.info("Setting up message broker...");
      await this.createConnection();
      await this.createChannel();
      await this.assertQueue(this.queueEmail, true);
      await this.assertQueue(this.queueSlack, true);
      await this.assertQueue(this.queueDiscord, true);
      logger.info("Message broker setup complete");
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

    logger.info("Starting message consumption...");

    await this.channel.consume(this.queueEmail, async (msg) => {
      if (msg) {
        try {
          const content: MailOptions = JSON.parse(msg.content.toString());
          logger.info("Email message received", { content });
          await this.handleEmail(content);
          this.channel!.ack(msg);
        } catch (err) {
          logger.error("Failed to process email message", { error: err });
          this.channel!.nack(msg, false, false);
        }
      }
    });

    await this.channel.consume(this.queueSlack, async (msg) => {
      if (msg) {
        try {
          const content: SlackOptions = JSON.parse(msg.content.toString());
          logger.info("Slack message received", { content });
          await this.handleSlack(content);
          this.channel!.ack(msg);
        } catch (err) {
          logger.error("Failed to process slack message", { error: err });
          this.channel!.nack(msg, false, false);
        }
      }
    });

    await this.channel.consume(this.queueDiscord, async (msg) => {
      if (msg) {
        try {
          const content: DiscordOptions = JSON.parse(msg.content.toString());
          logger.info("Discord message received", { content });
          await this.handleDiscord(content);
          this.channel!.ack(msg);
        } catch (err) {
          logger.error("Failed to process discord message", { error: err });
          this.channel!.nack(msg, false, false);
        }
      }
    });
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
