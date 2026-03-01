import { z } from 'zod';
import { 
  users, communities, listings, auditLogs,
  insertUserSchema, insertCommunitySchema, insertListingSchema,
  loginSchema, registerSchema
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  conflict: z.object({
    message: z.string(),
  })
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: registerSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: loginSchema,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() })
      }
    }
  },
  communities: {
    list: {
      method: 'GET' as const,
      path: '/api/communities' as const,
      responses: {
        200: z.array(z.custom<typeof communities.$inferSelect>()),
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/communities/:id' as const,
      responses: {
        200: z.custom<typeof communities.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/communities' as const,
      input: insertCommunitySchema,
      responses: {
        201: z.custom<typeof communities.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.forbidden,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/communities/:id' as const,
      input: insertCommunitySchema.partial().extend({ version: z.number() }),
      responses: {
        200: z.custom<typeof communities.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        409: errorSchemas.conflict,
      }
    },
    join: {
      method: 'POST' as const,
      path: '/api/communities/:id/join' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/users/:id' as const,
      input: insertUserSchema.partial().extend({ version: z.number() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        409: errorSchemas.conflict,
      }
    }
  },
  listings: {
    list: {
      method: 'GET' as const,
      path: '/api/listings' as const,
      responses: {
        200: z.array(z.custom<typeof listings.$inferSelect>()),
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/listings/:id' as const,
      responses: {
        200: z.custom<typeof listings.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/listings' as const,
      input: insertListingSchema,
      responses: {
        201: z.custom<typeof listings.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/listings/:id' as const,
      input: insertListingSchema.partial().extend({ version: z.number() }),
      responses: {
        200: z.custom<typeof listings.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        409: errorSchemas.conflict,
      }
    }
  },
  auditLogs: {
    list: {
      method: 'GET' as const,
      path: '/api/audit-logs' as const,
      responses: {
        200: z.array(z.custom<typeof auditLogs.$inferSelect>()),
        403: errorSchemas.forbidden,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
