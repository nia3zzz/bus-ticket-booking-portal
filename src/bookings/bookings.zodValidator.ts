import { number, z } from 'zod';

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

export { createBookingValidator };
