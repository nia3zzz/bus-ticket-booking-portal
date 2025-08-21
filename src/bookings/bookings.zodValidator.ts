import { z } from 'zod';

const createBookingValidator = z.object({
  scheduleId: z
    .string({
      required_error: 'Schedule id is required.',
      invalid_type_error: 'Schedule id must be a string.',
    })
    .length(36, 'Schedule id must be 36 characters.'),

  journeyDate: z.coerce.date({
    required_error: 'Journey date is required.',
    invalid_type_error: 'Journey date must be a date.',
  }),

  seats: z.array(
    z
      .number({
        required_error: 'Seat number is required.',
        invalid_type_error: 'Seat number must be a date.',
      })
      .positive(),
  ),
});

const getBookingsValidator = z.object({
  refunded: z
    .enum(['true', 'false'], {
      invalid_type_error: 'Is refunded must be a true or false.',
    })
    .optional(),
});

const getBookingValidator = z.object({
  bookingId: z
    .string({
      required_error: 'Booking id is required.',
      invalid_type_error: 'Booking id must be a string.',
    })
    .length(36, 'Booking id must be 36 characters.'),
});

export { createBookingValidator, getBookingValidator, getBookingsValidator };
