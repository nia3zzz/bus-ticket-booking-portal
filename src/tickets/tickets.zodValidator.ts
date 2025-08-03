import { z } from 'zod';

const getBookedTicketValidator = z.object({
  bookingId: z
    .string({
      required_error: 'Booking id is required.',
      invalid_type_error: 'Booking id must be a string.',
    })
    .length(36, 'Booking id must be 36 characters.'),
});

const refundTicketValidator = z.object({
  ticketId: z
    .string({
      required_error: 'Ticket id is required.',
      invalid_type_error: 'Ticket id must be a string.',
    })
    .length(36, 'Ticket id must be 36 characters.'),

  reason: z
    .string({
      required_error: 'Reason for refund is required.',
      invalid_type_error: 'Reason must be a string.',
    })
    .min(1, 'Reason for refund must be longer.')
    .max(130, 'Reason for refund must be shorter.'),
});

export { getBookedTicketValidator, refundTicketValidator };
