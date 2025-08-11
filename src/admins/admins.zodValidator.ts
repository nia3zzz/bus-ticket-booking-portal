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

const createBusValidator = z
  .object({
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

    class: z.enum(['ECONOMY', 'BUSINESS', 'FIRSTCLASS'], {
      required_error: 'Class is required.',
      invalid_type_error: 'Class must be a string.',
    }),

    farePerTicket: z.coerce
      .number({
        required_error: 'Fare per ticket is required.',
        invalid_type_error: 'Fare per ticket must be a string.',
      })
      .nonnegative('Fare per ticket can not be negative.'),

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
  })
  .refine(
    (data) =>
      (data.busType === 'NONE_AC_BUS' &&
        !['BUSINESS', 'FIRSTCLASS'].includes(data.class)) ||
      (data.busType === 'AC_BUS' && data.class !== 'ECONOMY') ||
      (data.busType === 'SLEEPER_BUS' &&
        !['ECONOMY', 'BUSINESS'].includes(data.class)),
    {
      message: 'Invalid combination of bus type and class.',
      path: ['class'],
    },
  );

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

  estimatedDepartureTimeDate: z.coerce.date({
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

const updateTripStatusValidator = z.object({
  tripId: z
    .string({
      required_error: 'Trip id is required.',
      invalid_type_error: 'Trip id must be a string.',
    })
    .length(36, 'Trip id must be 36 characters.'),

  status: z.enum(['UNTRACKED', 'COMPLETED'], {
    required_error: 'Status is required.',
    invalid_type_error: 'Status must be a string.',
  }),
});

const getBusesValidator = z.object({
  busType: z
    .enum(['AC_BUS', 'NONE_AC_BUS', 'SLEEPER_BUS'], {
      invalid_type_error: 'Status must be a string.',
    })
    .optional(),
});

const getBusValidator = z.object({
  busId: z
    .string({
      required_error: 'Bus id is required.',
      invalid_type_error: 'Bus id must be a string.',
    })
    .length(36, 'Bus id must be 36 characters.'),
});

const updateBusValidator = z.object({
  busId: z
    .string({
      required_error: 'Bus id is required.',
      invalid_type_error: 'Bus id must be a string.',
    })
    .length(36, 'Bus id must be 36 characters.'),

  driverId: z
    .string({
      required_error: 'Driver id is required.',
      invalid_type_error: 'Driver id must be a string.',
    })
    .length(36, 'User id must be 36 characters.'),

  busPicture: z
    .object({
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
    })
    .optional(),
});

const getSchedulesValidator = z.object({
  driverId: z
    .string({
      invalid_type_error: 'Driver id must be a string.',
    })
    .length(36, 'Driver id must be 36 characters.')
    .optional(),

  routeId: z
    .string({
      invalid_type_error: 'Route id must be a string.',
    })
    .length(36, 'Route id must be 36 characters.')
    .optional(),

  limit: z.coerce
    .number({ invalid_type_error: 'Limit must be a number' })
    .nonnegative('Limit can not be negetive.')
    .optional(),

  skip: z.coerce
    .number({ invalid_type_error: 'Skip must be a number' })
    .nonnegative('Skip can not be negetive.')
    .optional(),
});

const updateScheduleValidator = z.object({
  scheduleId: z
    .string({
      required_error: 'Schedule id is required.',
      invalid_type_error: 'Schedule id must be a string.',
    })
    .length(36, 'Schedule id must be 36 characters.'),

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

  estimatedDepartureTimeDate: z.coerce.date({
    required_error: 'Estimated departure time date is required.',
    invalid_type_error: 'Estimated departure time date must be a date.',
  }),

  estimatedArrivalTimeDate: z.coerce.date({
    required_error: 'Estimated arrival time data is required.',
    invalid_type_error: 'Estimated arrival time date must be a date.',
  }),
});

const getTicketDataValidator = z.object({
  bookingId: z
    .string({
      required_error: 'Booking id is required.',
      invalid_type_error: 'Booking id must be a string.',
    })
    .length(36, 'Booking id must be 36 characters.'),
});

const getBookedSeatsDataValidator = z.object({
  scheduleId: z
    .string({
      required_error: 'Schedule is required.',
      invalid_type_error: 'Schedule id must be a string.',
    })
    .length(36, 'Schedule id must be 36 characters.'),

  journeyDate: z.coerce.date({
    required_error: 'Journey date is required.',
    invalid_type_error: 'Journey date must be a date.',
  }),
});

const getRefundsValidator = z.object({
  isMoneyRefunded: z
    .enum(['true', 'false'], {
      invalid_type_error: 'Is money refunded must be a true or false.',
    })
    .optional(),
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
  updateTripStatusValidator,
  getBusesValidator,
  getBusValidator,
  updateBusValidator,
  getSchedulesValidator,
  updateScheduleValidator,
  getTicketDataValidator,
  getBookedSeatsDataValidator,
  getRefundsValidator,
};
