import {
  BookedSeat,
  Booking,
  Bus,
  Payment,
  Route,
  Schedule,
  User,
} from '@prisma/client';
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

// this send email function will be used for sending the invoice of the user's booked seats confirmation for payment that will also include payment redirection feature
const SendMailToProvidePaymentInvoiceAfterBookingSeats = async (
  foundExistingUser: User,
  foundBus: Bus,
  foundRoute: Route,
  foundBooking: Booking,
  foundBookedSeats: BookedSeat,
): Promise<void> => {
  try {
    // create an html content body using the recieved parameters
    const htmlContent: string = `
<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
  <h2 style="color: #007BFF;">Invoice for Your Booked Seats</h2>
  <p>Hello <strong>${foundExistingUser.firstName || 'User'}</strong>,</p>
  <p>Thank you for your purchase of tickets. However, we noticed that your booked tickets are not yet confirmed due to incomplete payment. Please complete the payment to confirm your booking.</p>
  
  <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #007BFF;">
    <h3 style="margin-bottom: 10px;">Ticket Information</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Bus Registration:</strong> ${foundBus.busRegistrationNumber}</li>
      <li><strong>Type:</strong> ${foundBus.busType}</li>
      <li><strong>Class:</strong> ${foundBus.class}</li>
      <li><strong>Fare per Ticket:</strong> ${foundBus.farePerTicket} BDT</li>
    </ul>
  </div>

  <div style="margin: 20px 0; padding: 15px; background-color: #f1f1f1; border-left: 4px solid #28a745;">
    <h3 style="margin-bottom: 10px;">Route Information</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Origin:</strong> ${foundRoute.origin}</li>
      <li><strong>Destination:</strong> ${foundRoute.destination}</li>
      <li><strong>Distance:</strong> ${foundRoute.distanceInKm} km</li>
      <li><strong>Estimated Time:</strong> ${foundRoute.estimatedTimeInMin} minutes</li>
    </ul>
  </div>

  <div style="margin: 20px 0; padding: 15px; background-color: #fefefe; border-left: 4px solid #dc3545;">
    <h3 style="margin-bottom: 10px;">Booking Details</h3>
    <ul style="list-style: none; padding: 0;">
      <li><strong>Journey Date:</strong> ${foundBooking.journeyDate}</li>
      <li><strong>Status:</strong> ${foundBooking.status}</li>
      <li><strong>Total Price:</strong> ${foundBooking.totalPrice} BDT</li>
      <li><strong>Booked Seats:</strong> ${Array.isArray(foundBookedSeats.seatNumbers) ? foundBookedSeats.seatNumbers.join(', ') : foundBookedSeats.seatNumbers}</li>
    </ul>
  </div>

  <div style="margin-top: 30px; padding: 15px; background-color: #fffbe6; border-left: 4px solid #ffc107;">
    <p><strong>Booking ID:</strong> ${foundBooking.id}</p>
    <p>
      <a href="http://localhost:8000/payments/${foundBooking.id}" style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 4px;">
        Complete Payment
      </a>
    </p>
  </div>

  <p>If you have any questions, feel free to contact our support team.</p>
  <p>Best regards,<br>Bus Ticket Booking Portal.</p>
</div>
`;

    // the message variable holds the object with the neccessary information that is required to call the sendmail function
    const message: {} = {
      from: process.env.NODEMAILER_AUTH_EMAIL,
      to: foundExistingUser.email,
      subject: 'Invoice for Your Booked Seats',
      html: htmlContent,
    };

    // this sends the email
    await transporter.sendMail(message);
  } catch (error) {
    throw new Error(
      'Something went wrong in SendMailToProvidePaymentInvoiceAfterBookingSeats function: ',
      error as undefined,
    );
  }
};

//this send email function will be used for sending the email to the client that has confirmed their booked seats by completing their payment and this email will send their confirmed seat's tickets as an pdf
const SendMailToProvideConfirmedTicketsAfterPayment = async (
  foundExistingUser: User,
  ticketPdfUrl: string,
) => {
  try {
    // create an html content body using the recieved parameters
    const htmlContent: string = `    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #28a745;">Payment Successful</h2>
      <p>Hello ${foundExistingUser.firstName || 'User'},</p>
      <p>Thank you for booking with us. Your payment has been successfully processed.</p>
      <p>Please find your ticket PDF at the link below:</p>
      <p>
        <a href="${ticketPdfUrl}" style="color: #007bff; text-decoration: none;" target="_blank">
          👉 View Your Tickets (PDF)
        </a>
      </p>
      <p>If you have any questions, feel free to reply to this email.</p>
      <p>Best regards,<br>Bus Ticket Booking Portal.</p>
    </div>`;

    // the message variable holds the object with the neccessary information that is required to call the sendmail function
    const message: {} = {
      from: process.env.NODEMAILER_AUTH_EMAIL,
      to: foundExistingUser.email,
      subject: 'Your payment has been confirmed, enjoy your journey!',
      html: htmlContent,
    };

    // this sends the email
    await transporter.sendMail(message);
  } catch (error) {
    throw new Error(
      'Something went wrong in SendMailToProvideConfirmedTickets function: ',
      error as undefined,
    );
  }
};

// this send email function will be used for sending email to the client that will include the user's ticket's pdf url from cloudinary
const SendMailToProvideTicketUrlIfCreated = async (
  foundExistingUser: User,
  ticketPdfUrl: string,
): Promise<void> => {
  try {
    // create an html content body using the recieved parameters
    const htmlContent: string = `    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #28a745;">Booked Tickets</h2>
      <p>Hello ${foundExistingUser.firstName || 'User'},</p>
      <p>Thank you for booking with us. Here is the ticket you requested to be sent.</p>
      <p>Please find your ticket PDF at the link below:</p>
      <p>
        <a href="${ticketPdfUrl}" style="color: #007bff; text-decoration: none;" target="_blank">
          👉 View Your Tickets (PDF)
        </a>
      </p>
      <p>If you have any questions, feel free to reply to this email.</p>
      <p>Best regards,<br>Bus Ticket Booking Portal.</p>
    </div>`;

    // the message variable holds the object with the neccessary information that is required to call the sendmail function
    const message: {} = {
      from: process.env.NODEMAILER_AUTH_EMAIL,
      to: foundExistingUser.email,
      subject: 'Your booked tickets you requested to be sent.',
      html: htmlContent,
    };

    // this sends the email
    await transporter.sendMail(message);
  } catch (error) {
    throw new Error(
      'Something went wrong in SendMailToProvideConfirmedTickets function: ',
      error as undefined,
    );
  }
};

export {
  SendMailToVerifyEmailWithCode,
  SendMailToProvidePaymentInvoiceAfterBookingSeats,
  SendMailToProvideConfirmedTicketsAfterPayment,
  SendMailToProvideTicketUrlIfCreated,
};
