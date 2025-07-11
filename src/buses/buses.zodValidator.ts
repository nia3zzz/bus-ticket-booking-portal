import { z } from 'zod';

// this validator has the client extension as another with the same name exists among the admins validators
const getBusesValidatorClient = z.object({
  origin: z
    .string({
      invalid_type_error: 'Origin must be a string.',
    })
    .min(3, 'Origin must be of at least 3 characters.'),

  destination: z
    .string({
      invalid_type_error: 'Destination must be a string.',
    })
    .min(3, 'Destination must be of at least 3 characters.'),

  journeyDate: z.coerce.date({
    required_error: 'Journey date is required.',
    invalid_type_error: 'Journey date must be a date.',
  }),

  busType: z
    .enum(['AC_BUS', 'NONE_AC_BUS', 'SLEEPER_BUS'], {
      invalid_type_error: 'Bus type must be a string.',
    })
    .optional(),

  class: z
    .enum(['ECONOMY', 'BUSINESS', 'FIRSTCLASS'], {
      invalid_type_error: 'Class must be a string.',
    })
    .optional(),
});

// this validator has the client extension as another with the same name exists among the admins validators
const getBusValidatorClient = z.object({
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
});

export { getBusesValidatorClient, getBusValidatorClient };
