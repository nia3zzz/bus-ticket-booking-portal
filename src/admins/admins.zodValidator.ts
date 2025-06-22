import { z } from 'zod';

const addDriverValidator = z.object({
  driverId: z
    .string({
      required_error: 'Driver id is required.',
      invalid_type_error: 'Driver id must be a string.',
    })
    .length(36, 'User id must be 24 characters.'),
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
    .length(36, 'Route id must be 24 characters.'),
});

export { addDriverValidator, addRouteValidator, deleteRouteValidator };
