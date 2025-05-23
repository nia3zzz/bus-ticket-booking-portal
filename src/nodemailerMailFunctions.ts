import { User } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import * as argon2 from 'argon2';

// if the environmental variables were not provided
if (
  !process.env.NODEMAILER_AUTH_EMAIL ||
  !process.env.NODEMAILER_AUTH_APP_PASSWORD
) {
  throw new Error('Nodemailer environmental variables are not provided.');
}

// create the transporter object which will be used by the send mail functions
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_AUTH_EMAIL,
    pass: process.env.NODEMAILER_AUTH_APP_PASSWORD,
  },
});

// this send email function will be used to send a six digit code to a user when their emails are not authenticated which will work by validating that code by the user
const SendMailToVerifyEmailWithCode = async (
  foundExistingUser: User,
): Promise<string> => {
  try {
    // the random 6 digit code generation variable
    const randomSixDigitCode: number = Math.floor(
      100000 + Math.random() * 900000,
    );

    // this variable holds the html content that is to be sent in the email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Email Verification</h2>
        <p>Hello <strong>${foundExistingUser.firstName || 'User'}</strong>,</p>
        <p>Thank you for registering. Please use the following verification code to verify your email address:</p>
        <div style="font-size: 24px; font-weight: bold; color: #007BFF; margin: 20px 0;">
          ${randomSixDigitCode}
        </div>
        <p>This code will expire in 30 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <br>
        <p>Best regards,<br>Bus Ticket Booking Portal.</p>
      </div>
    `;

    // the message variable holds the object with the neccessary information that is required to call the sendmail function
    const message: {} = {
      from: process.env.NODEMAILER_AUTH_EMAIL,
      to: foundExistingUser.email,
      subject: 'Please verify your email using the sent code.',
      html: htmlContent,
    };

    // this sends the email
    await transporter.sendMail(message);

    // now save the code by hashing it and return it to the service where it was called from
    const hashedRandomSixDigitCode: string = await argon2.hash(
      randomSixDigitCode.toString(),
    );

    return hashedRandomSixDigitCode;
  } catch (error) {
    throw new Error(
      'Something went wrong in SendMailToVerifyEmailWithCode function: ',
      error as undefined,
    );
  }
};

export { SendMailToVerifyEmailWithCode };
