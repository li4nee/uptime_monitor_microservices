import nodemailer from "nodemailer";

interface MailOptions {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false,
  auth: {
    user: "your_email@example.com",
    pass: "your_email_password",
  },
});

export async function sendMail(options: MailOptions): Promise<void> {
  await transporter.sendMail(options);
}

export async function sendBulkMail(
  recipients: string[],
  mailOptions: Omit<MailOptions, "to">,
): Promise<void> {
  const sendPromises = recipients.map((recipient) =>
    transporter.sendMail({ ...mailOptions, to: recipient }),
  );
  try {
    await Promise.all(sendPromises);
    return;
  } catch (error) {
    console.error("Error sending bulk emails:", error);
    return;
  }
}
