import nodemailer from "nodemailer";
import { MailOptions } from "../typings/base.type";

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false,
  auth: {
    user: "your_email@example.com",
    pass: "your_email_password",
  },
});

export async function sendEmail(to: string | string[], mailOptions: Omit<MailOptions, "to">): Promise<void> {
  const recipients = Array.isArray(to) ? to : [to];

  const sendPromises = recipients.map((recipient) => transporter.sendMail({ ...mailOptions, to: recipient }));

  try {
    await Promise.all(sendPromises);
  } catch (error) {
    console.error("Error sending email(s):", error);
    return;
  }
}
