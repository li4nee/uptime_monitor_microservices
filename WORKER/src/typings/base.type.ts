export class CustomError {
  statusCode: number;
  message: string | null;

  constructor(message: string, statusCode: number) {
    this.statusCode = statusCode;
    this.message = message;
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = "Internal server error") {
    super(message, 500);
  }
}

export interface MailOptions {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export interface SlackOptions {
  channel: string;
  text: string;
}

export interface DiscordOptions {
  channelId: string;
  content: string;
}
