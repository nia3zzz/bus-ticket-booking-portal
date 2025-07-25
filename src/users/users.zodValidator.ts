import { z } from 'zod';

// defining a validator that will validate the req data and send message based on invalid credential
const createUserValidator = z.object({
  firstName: z
    .string({
      required_error: 'First name is required.',
      invalid_type_error: 'First name must be a string.',
    })
    .min(3, 'First name has be more than 3 characters.')
    .max(50, 'First name can not be more than 50 characters.'),

  lastName: z
    .string({
      required_error: 'Last name is required.',
      invalid_type_error: 'Last name must be a string.',
    })
    .min(3, 'Last name has be more than 3 characters.')
    .max(50, 'Last name not be more than 50 characters.'),

  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a string.',
    })
    .email('Please provide a valid email.'),

  phoneNumber: z
    .string({
      required_error: 'Phone number is required.',
      invalid_type_error: 'Phone number must be a string.',
    })
    .length(14, 'A phone number must be 14 characters.'),

  profilePicture: z.object({
    originalName: z.string({
      required_error: 'Image is invalid.',
      invalid_type_error: 'Image is invalid.',
    }),
    encoding: z.string({
      required_error: 'Image is invalid.',
      invalid_type_error: 'Image is invalid.',
    }),
    busBoyMimeType: z
      .string({
        required_error: 'Image is invalid.',
        invalid_type_error: 'Image is invalid.',
      })
      .startsWith('image/', { message: 'Image is invalid.' }),
    path: z.string({
      required_error: 'Image is invalid.',
      invalid_type_error: 'Image is invalid.',
    }),
    size: z
      .number({
        required_error: 'Image is invalid.',
        invalid_type_error: 'Image is invalid.',
      })
      .max(5 * 1024 * 1024, {
        message: 'Image can not be more than 5 megabites.',
      }),
    fileType: z.object({
      ext: z
        .string({
          required_error: 'Image is invalid.',
          invalid_type_error: 'Image is invalid.',
        })
        .refine((val) => ['png', 'jpg', 'jpeg', 'webp'].includes(val), {
          message: 'Image type is invalid.',
        }),
      mime: z
        .string({
          required_error: 'Image is invalid.',
          invalid_type_error: 'Image is invalid.',
        })
        .startsWith('image/', { message: 'Image is invalid.' }),
    }),
  }),

  password: z
    .string({
      required_error: 'Password is required.',
      invalid_type_error: 'Password must be a string.',
    })
    .min(6, 'Password has be more than 6 characters.'),
});

//defining a login validator that will validate the request body of the login route using the folling validator object
const loginValidator = z
  .object({
    email: z
      .string({
        invalid_type_error: 'Email must be a string.',
      })
      .email('Please provide a valid email.')
      .optional(),

    phoneNumber: z
      .string({
        invalid_type_error: 'Phone number must be a string.',
      })
      .length(14, 'A phone number must be 14 characters.')
      .optional(),

    password: z
      .string({
        required_error: 'Password is required.',
        invalid_type_error: 'Password must be a string.',
      })
      .min(6, 'Password has be more than 6 characters.'),
  })
  .refine(
    (data) => {
      return (
        (data.email !== null && data.email !== undefined) ||
        (data.phoneNumber !== null && data.phoneNumber !== undefined)
      );
    },
    { message: 'At least one of email or phone number must be provided.' },
  );

const getDriverClientValidator = z.object({
  driverId: z
    .string({
      required_error: 'Driver id is required.',
      invalid_type_error: 'Driver id must be a string.',
    })
    .length(36, 'Driver id must be 36 characters.'),
});

const updateProfileValidator = z.object({
  firstName: z
    .string({
      required_error: 'First name is required.',
      invalid_type_error: 'First name must be a string.',
    })
    .min(3, 'First name has be more than 3 characters.')
    .max(50, 'First name can not be more than 50 characters.'),

  lastName: z
    .string({
      required_error: 'Last name is required.',
      invalid_type_error: 'Last name must be a string.',
    })
    .min(3, 'Last name has be more than 3 characters.')
    .max(50, 'Last name not be more than 50 characters.'),

  email: z
    .string({
      required_error: 'Email is required.',
      invalid_type_error: 'Email must be a string.',
    })
    .email('Please provide a valid email.'),

  phoneNumber: z
    .string({
      required_error: 'Phone number is required.',
      invalid_type_error: 'Phone number must be a string.',
    })
    .length(14, 'A phone number must be 14 characters.'),

  profilePicture: z.union([
    z
      .string({
        required_error: 'Image is invalid.',
        invalid_type_error: 'Image is invalid.',
      })
      .regex(
        /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}([\/\w\-._~:?#[\]@!$&'()*+,;=]*)?$/,
        'Image is invalid.',
      ),

    z.object({
      originalName: z.string({
        required_error: 'Image is invalid.',
        invalid_type_error: 'Image is invalid.',
      }),
      encoding: z.string({
        required_error: 'Image is invalid.',
        invalid_type_error: 'Image is invalid.',
      }),
      busBoyMimeType: z
        .string({
          required_error: 'Image is invalid.',
          invalid_type_error: 'Image is invalid.',
        })
        .startsWith('image/', { message: 'Image is invalid.' }),
      path: z.string({
        required_error: 'Image is invalid.',
        invalid_type_error: 'Image is invalid.',
      }),
      size: z
        .number({
          required_error: 'Image is invalid.',
          invalid_type_error: 'Image is invalid.',
        })
        .max(5 * 1024 * 1024, {
          message: 'Image can not be more than 5 megabites.',
        }),
      fileType: z.object({
        ext: z
          .string({
            required_error: 'Image is invalid.',
            invalid_type_error: 'Image is invalid.',
          })
          .refine((val) => ['png', 'jpg', 'jpeg', 'webp'].includes(val), {
            message: 'Image type is invalid.',
          }),
        mime: z
          .string({
            required_error: 'Image is invalid.',
            invalid_type_error: 'Image is invalid.',
          })
          .startsWith('image/', { message: 'Image is invalid.' }),
      }),
    }),
  ]),
});

const verifyEmailValidator = z.object({
  verificationId: z
    .string({
      required_error: 'Verification id is required.',
      invalid_type_error: 'Verification id must be a string.',
    })
    .length(36, 'Verification id must be 36 characters.'),

  sixDigitVerificationCode: z
    .string({
      required_error: 'Six digit verification code is required.',
      invalid_type_error: 'Six digit verification code is all numbers.',
    })
    .length(6, 'Six digit verification code must be 6 characters.'),
});

export {
  createUserValidator,
  loginValidator,
  getDriverClientValidator,
  updateProfileValidator,
  verifyEmailValidator,
};
