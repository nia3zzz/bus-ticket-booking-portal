import { z } from 'zod';

const getBookedTicketValidator = z.object({
  bookingId: z
    .string({
      required_error: 'Booking id is required.',
      invalid_type_error: 'Booking id must be a string.',
    })
    .length(36, 'Booking id must be 36 characters.'),
});

export { getBookedTicketValidator };
