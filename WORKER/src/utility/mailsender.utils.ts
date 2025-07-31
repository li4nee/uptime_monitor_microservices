import nodemailer from "nodemailer";
import { MailOptions } from "../typings/base.type";
import { GlobalSettings } from "../globalSettings";
import { logger } from "./logger.utils";

const transporter = nodemailer.createTransport({
  service:"gmail",
  auth: {
    user: GlobalSettings.mail.user,
    pass: GlobalSettings.mail.pass,
  },
});


export async function sendEmail(to: string | string[], mailOptions: Omit<MailOptions, "to">): Promise<void> {
  const recipients = Array.isArray(to) ? to : [to];

  const sendPromises = recipients.map((recipient) => transporter.sendMail({ ...mailOptions, to: recipient }));

  try {
    await Promise.all(sendPromises);
  } catch (error) {
    logger.error("Error sending email:", error);
    return;
  }
}
