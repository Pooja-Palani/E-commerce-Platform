import { z } from 'zod';
import {
  users, communities, listings, auditLogs, bookings, orders, platformSettings,
  insertUserSchema, insertCommunitySchema, insertListingSchema, insertPlatformSettingsSchema,
  loginSchema, registerSchema, posts, comments
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
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/communities/:id' as const,
      responses: {
        200: z.object({ message: z.string() }),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
      }
    },
    posts: {
      list: {
        method: 'GET' as const,
        path: '/api/communities/:id/posts' as const,
        responses: {
          200: z.array(z.custom<typeof posts.$inferSelect>()),
        }
      },
      create: {
        method: 'POST' as const,
        path: '/api/communities/:id/posts' as const,
        input: z.object({
          title: z.string().min(1),
          content: z.string().min(1),
        }),
        responses: {
          201: z.custom<typeof posts.$inferSelect>(),
          400: errorSchemas.validation,
        }
      }
    }
  },
  posts: {
    get: {
      method: "GET" as const,
      path: "/api/posts/:id" as const,
      responses: {
        200: z.custom<typeof posts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    comments: {
      list: {
        method: "GET" as const,
        path: "/api/posts/:id/comments" as const,
        responses: {
          200: z.array(z.custom<typeof comments.$inferSelect>()),
        },
      },
      create: {
        method: "POST" as const,
        path: "/api/posts/:id/comments" as const,
        input: z.object({
          content: z.string().min(1),
        }),
        responses: {
          201: z.custom<typeof comments.$inferSelect>(),
          400: errorSchemas.validation,
        },
      },
    },
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
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/users/:id' as const,
      responses: {
        200: z.object({ message: z.string() }),
        403: errorSchemas.forbidden,
        404: errorSchemas.notFound,
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
  bookings: {
    list: {
      method: "GET" as const,
      path: "/api/bookings" as const,
      responses: {
        200: z.array(z.custom<typeof bookings.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/bookings" as const,
      input: z.object({
        listingId: z.string(),
        bookingDate: z.string().or(z.date()),
      }),
      responses: {
        201: z.custom<typeof bookings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  orders: {
    list: {
      method: "GET" as const,
      path: "/api/orders" as const,
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/orders" as const,
      input: z.object({
        listingId: z.string(),
        logisticsPreference: z.enum(["PICKUP", "DELIVERY_SUPPORT"]).optional(),
        deliveryAddress: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof orders.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  auditLogs: {
    list: {
      method: "GET" as const,
      path: "/api/audit-logs" as const,
      responses: {
        200: z.array(z.custom<typeof auditLogs.$inferSelect>()),
        403: errorSchemas.forbidden,
      },
    },
  },
  admin: {
    analytics: {
      method: 'GET' as const,
      path: '/api/admin/analytics' as const,
      responses: {
        200: z.object({
          metrics: z.object({
            communities: z.number(),
            totalUsers: z.number(),
            activeServices: z.number(),
            totalRevenue: z.number(),
            commission: z.number(),
          }),
          revenueTrend: z.array(z.object({
            name: z.string(),
            revenue: z.number(),
          })),
          userGrowth: z.array(z.object({
            name: z.string(),
            users: z.number(),
          })),
          serviceCategories: z.array(z.object({
            name: z.string(),
            value: z.number(),
            color: z.string(),
          })),
        }),
        403: errorSchemas.forbidden,
      }
    },
    settings: {
      get: {
        method: 'GET' as const,
        path: '/api/admin/settings' as const,
        responses: {
          200: z.custom<typeof platformSettings.$inferSelect>(),
          403: errorSchemas.forbidden,
        }
      },
      update: {
        method: 'PUT' as const,
        path: '/api/admin/settings' as const,
        input: insertPlatformSettingsSchema.partial(),
        responses: {
          200: z.custom<typeof platformSettings.$inferSelect>(),
          403: errorSchemas.forbidden,
        }
      }
    },
  },
  manager: {
    analytics: {
      method: 'GET' as const,
      path: '/api/manager/analytics' as const,
      responses: {
        200: z.object({
          actionCenter: z.object({
            pendingApprovals: z.number(),
            reportedListings: z.number(),
            disputedBookings: z.number(),
            lowRatedServices: z.number(),
          }),
          snapshot: z.object({
            totalMembers: z.number(),
            activeSellers: z.number(),
            totalListings: z.number(),
            weeklyGrowth: z.number(),
            monthlyGmv: z.number(),
            platformCommission: z.number(),
          }),
          weeklyBookingsTrend: z.array(z.object({
            name: z.string(),
            bookings: z.number(),
          })),
          monthlyRevenueTrend: z.array(z.object({
            name: z.string(),
            revenue: z.number(),
          })),
        }),
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
