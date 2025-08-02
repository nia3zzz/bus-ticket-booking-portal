import { z } from 'zod';

const completePaymentValidator = z.object({
  bookingId: z
    .string({
      required_error: 'Booking id is required.',
      invalid_type_error: 'Booking id must be a string.',
    })
    .length(36, 'Booking id must be 36 characters.'),

  method: z.enum(['ONLINE', 'CASH'], {
    required_error: 'Method is required.',
    invalid_type_error: 'Method must be a string.',
  }),

  amount: z
    .number({
      required_error: 'Amount is required.',
      invalid_type_error: 'Amount must be a string.',
    })
    .nonnegative('Amount can not be negative.'),

  referenceCode: z
    .string({
      required_error: 'Reference code is required.',
      invalid_type_error: 'Reference code must be a string.',
    })
    .length(36, 'Reference code must be 36 characters.'),
});

const getPaymentDataValidator = z.object({
  paymentId: z
    .string({
      required_error: 'Payment id is required.',
      invalid_type_error: 'Payment id must be a string.',
    })
    .length(36, 'Payment id must be 36 characters.'),
});

export { completePaymentValidator, getPaymentDataValidator };
