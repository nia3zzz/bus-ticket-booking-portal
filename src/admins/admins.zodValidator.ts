import { z } from 'zod';

const createDriverValidtor = z.object({
  driverId: z
    .string({
      required_error: 'Driver id is required.',
      invalid_type_error: 'Driver id must be a string.',
    })
    .length(36, 'User id must be 24 characters.'),
});

export { createDriverValidtor };
