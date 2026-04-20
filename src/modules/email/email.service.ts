// import nodemailer from 'nodemailer';

// // Ethereal test account create karo
// const createTransporter = async () => {
//   const testAccount = await nodemailer.createTestAccount();

//   const transporter = nodemailer.createTransport({
//     host: 'smtp.ethereal.email',
//     port: 587,
//     secure: false,
//     auth: {
//       user: testAccount.user,
//       pass: testAccount.pass,
//     },
//   });

//   return { transporter, testAccount };
// };

// export const sendEmail = async (
//   recipient: string,
//   subject: string,
//   body: string
// ): Promise<{ messageId: string; previewUrl: string }> => {
//   const { transporter, testAccount } = await createTransporter();

//   const info = await transporter.sendMail({
//     from: '"Velozity Platform" <noreply@velozity.com>',
//     to: recipient,
//     subject,
//     text: body,
//   });

//   const previewUrl = nodemailer.getTestMessageUrl(info) as string;

//   console.log('Email sent! Preview URL:', previewUrl);

//   return {
//     messageId: info.messageId,
//     previewUrl,
//   };
// };


import nodemailer from 'nodemailer';
import db from '../../config/db';
import { addEmailJob } from './email.queue';

// Ethereal test account create karo
const createTransporter = async () => {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return { transporter, testAccount };
};

export const sendEmail = async (
  recipient: string,
  subject: string,
  body: string
): Promise<{ messageId: string; previewUrl: string }> => {
  const { transporter } = await createTransporter();

  const info = await transporter.sendMail({
    from: '"Velozity Platform" <noreply@velozity.com>',
    to: recipient,
    subject,
    text: body,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) as string;
  console.log('Email sent! Preview URL:', previewUrl);

  return {
    messageId: info.messageId,
    previewUrl,
  };
};

// Queue mein email job add karo aur DB mein log karo
export const queueEmail = async (
  recipient: string,
  template: string,
  subject: string,
  body: string,
  tenantId: string
) => {
  // DB mein pending log banao
  await db.emailLog.create({
    data: {
      recipient,
      template,
      status: 'pending',
      tenantId,
      attemptCount: 0,
    },
  });

  // Queue mein job add karo
  await addEmailJob({
    recipient,
    subject,
    body,
    tenantId,
    template,
  });
};