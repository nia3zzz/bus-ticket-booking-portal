import { z } from 'zod';

const addDriverValidator = z.object({
  driverId: z
    .string({
      required_error: 'Driver id is required.',
      invalid_type_error: 'Driver id must be a string.',
    })
    .length(36, 'User id must be 36 characters.'),
});

const addRouteValidator = z.object({
  origin: z.string({
    required_error: 'Origin is required.',
    invalid_type_error: 'Origin must be a string.',
  }),

  destination: z.string({
    required_error: 'Destination is required.',
    invalid_type_error: 'Destination must be a string.',
  }),

  distanceInKm: z.number({
    required_error: 'Distance is required.',
    invalid_type_error: 'Distance must be a number.',
  }),

  estimatedTimeInMin: z.number({
    required_error: 'Estimated time in minutes is required.',
    invalid_type_error: 'Estimated time in minutes must be a number.',
  }),
});

const deleteRouteValidator = z.object({
  routeId: z
    .string({
      required_error: 'Route id is required.',
      invalid_type_error: 'Route id must be a string.',
    })
    .length(36, 'Route id must be 36 characters.'),
});

const createBusValidator = z.object({
  busRegistrationNumber: z
    .string({
      required_error: 'Bus registration number is required.',
      invalid_type_error: 'Bus registration number must be a string',
    })
    .min(12, 'A minimum of 12 characters are supported.')
    .max(20, 'A maximum of 20 characters are supported.'),

  busType: z.enum(['AC_BUS', 'NONE_AC_BUS', 'SLEEPER_BUS'], {
    required_error: 'Bus type is required.',
    invalid_type_error: 'Bus type must be a string',
  }),

  totalSeats: z.coerce
    .number({
      required_error: 'Total seats is required.',
      invalid_type_error: 'Total seats must be a number.',
    })
    .min(33, 'A minimum of 33 seats are supported.')
    .max(60, 'A maximum of 60 seats are supported.'),

  driverId: z
    .string({
      required_error: 'Driver id is required.',
      invalid_type_error: 'Driver id must be a string.',
    })
    .length(36, 'User id must be 36 characters.'),

  busPicture: z.object({
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
});

const createScheduleValidator = z.object({
  busId: z
    .string({
      required_error: 'Bus id is required.',
      invalid_type_error: 'Bus id must be a string.',
    })
    .length(36, 'Bus id must be 36 characters.'),

  routeId: z.string({
    required_error: 'Route id is required.',
    invalid_type_error: 'Route id must be a string.',
  }),

  estimatedDeaurtureTimeDate: z.coerce.date({
    required_error: 'Estimated departure time date is required.',
    invalid_type_error: 'Estimated departure time date must be a date.',
  }),

  estimatedArrivalTimeDate: z.coerce.date({
    required_error: 'Estimated arrival time data is required.',
    invalid_type_error: 'Estimated arrival time date must be a date.',
  }),
});

const startTripValidator = z.object({
  scheduleId: z
    .string({
      required_error: 'Schedule id is required.',
      invalid_type_error: 'Schedule id must be a string.',
    })
    .length(36, 'Schedule id must be 36 characters.'),
});

const getTripsValidator = z
  .object({
    busId: z
      .string({ invalid_type_error: 'Bus id must be a string.' })
      .length(36, 'Bus id must be 36 characters.')
      .optional(),

    routeId: z
      .string({ invalid_type_error: 'Route id must be a string' })
      .length(36, 'Route id must be 36 characters.')
      .optional(),

    scheduleId: z
      .string({ invalid_type_error: 'Schedule id must be a string.' })
      .length(36, 'Schedule id must be 36 characters.')
      .optional(),

    status: z
      .enum(['UNTRACKED', 'PENDING', 'COMPLETED'], {
        invalid_type_error: 'Status must be a string.',
      })
      .optional(),

    limit: z.coerce
      .number({ invalid_type_error: 'Limit must be a number' })
      .nonnegative('Limit can not be negetive.')
      .optional(),

    skip: z.coerce
      .number({ invalid_type_error: 'Skip must be a number' })
      .nonnegative('Skip can not be negetive.')
      .optional(),
  })
  .refine((data) => !(data.scheduleId && (data.busId || data.routeId)), {
    message:
      'Invalid query: if scheduleId is provided, do not provide busId or routeId.',
    path: ['scheduleId'],
  });

const getTripValidator = z.object({
  tripId: z
    .string({
      required_error: 'Trip id is required.',
      invalid_type_error: 'Trip id must be a string.',
    })
    .length(36, 'Trip id must be 36 characters.'),
});

export {
  addDriverValidator,
  addRouteValidator,
  deleteRouteValidator,
  startTripValidator,
  createBusValidator,
  createScheduleValidator,
  getTripsValidator,
  getTripValidator,
};
