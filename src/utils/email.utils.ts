import { env } from '../env';

import nodemailer, { Transporter } from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

type TextEmailOptions = {
  email: string;
  subject: string;
  message: string;
};

export const sendTextEmail = async (options: TextEmailOptions) => {
  // 1) Create a transporter
  const transporter: Transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    auth: {
      user: env.EMAIL_USERNAME,
      pass: env.EMAIL_PASSWORD,
    },
  });

  // 2) Define the email options
  const mailOptions: Mail.Options = {
    from: 'Naveed Maqbool <naveed@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};
