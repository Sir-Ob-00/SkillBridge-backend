/**
 * OpenAPI specification for the SkillBridge API.
 * Documents the onboarding / verification flow plus key reference endpoints.
 */
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'SkillBridge API',
    version: '1.0.0',
    description:
      'Backend API for the SkillBridge marketplace (Student + Artisan mobile apps, Admin dashboard).',
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          details: { type: 'object' },
        },
      },
      PublicUser: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['student', 'artisan', 'admin', 'super_admin'] },
          phone: { type: 'string', nullable: true },
          profileImageUrl: { type: 'string', nullable: true },
          isSuspended: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: { user: { $ref: '#/components/schemas/PublicUser' } },
          },
          message: { type: 'string' },
        },
      },
      AuthSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/PublicUser' },
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
            },
          },
          message: { type: 'string' },
        },
      },
      ApplicationStatus: {
        type: 'string',
        enum: [
          'PENDING_PROFILE',
          'PENDING_REVIEW',
          'UNDER_REVIEW',
          'CHANGES_REQUESTED',
          'ACTIVE',
          'REJECTED',
        ],
      },
      VerificationReviewStatus: {
        type: 'string',
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
      },
      OnboardingStatus: {
        type: 'object',
        properties: {
          artisanId: { type: 'string' },
          applicationStatus: { $ref: '#/components/schemas/ApplicationStatus' },
          verification: {
            nullable: true,
            type: 'object',
            properties: {
              reviewStatus: { $ref: '#/components/schemas/VerificationReviewStatus' },
              institution: { type: 'string' },
              studentIdNumber: { type: 'string' },
              hasImage: { type: 'boolean' },
            },
          },
          steps: {
            type: 'object',
            properties: {
              personal: { type: 'boolean' },
              business: { type: 'boolean' },
              skills: { type: 'boolean' },
              services: { type: 'boolean' },
              availability: { type: 'boolean' },
              portfolio: { type: 'boolean' },
              studentVerification: { type: 'boolean' },
            },
          },
          canSubmit: { type: 'boolean' },
          missing: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { email: { type: 'string' }, password: { type: 'string' } },
                required: ['email', 'password'],
              },
              example: { email: 'student@example.com', password: 'Password123' },
            },
          },
        },
        responses: {
          200: {
            description: 'Tokens issued',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthSuccess' },
                example: {
                  success: true,
                  data: {
                      user: {
                        id: 'clx000000000000000000000001',
                        name: 'Jane Doe',
                        email: 'student@example.com',
                        role: 'student',
                      },
                      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                  message: 'Logged in successfully.',
                },
              },
            },
          },
          401: { $ref: '#/components/schemas/Error' },
          403: {
            $ref: '#/components/schemas/Error',
            description: 'Returned when the account is suspended',
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account (no email verification required)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['student', 'artisan'], default: 'student' },
                  phone: { type: 'string' },
                },
                required: ['name', 'email', 'password'],
              },
              example: {
                name: 'Jane Doe',
                email: 'student@example.com',
                password: 'Password123',
                role: 'student',
                phone: '0241234567',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account created; JWT tokens issued',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterSuccess' },
                example: {
                  success: true,
                  data: {
                    user: {
                      id: 'clx000000000000000000000001',
                      name: 'Jane Doe',
                      email: 'student@example.com',
                      role: 'student',
                    },
                  },
                  message: 'Account created successfully.',
                },
              },
            },
          },
          409: { $ref: '#/components/schemas/Error' },
          400: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    '/onboarding/status': {
      get: {
        tags: ['Onboarding'],
        summary: 'Get current onboarding progress and application status',
        responses: {
          200: {
            description: 'Onboarding status',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/OnboardingStatus' } } },
          },
        },
      },
    },
    '/onboarding/personal': {
      patch: {
        tags: ['Onboarding'],
        summary: 'Update personal information (name, phone, avatarUrl)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  avatarUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated status' } },
      },
    },
    '/onboarding/business': {
      patch: {
        tags: ['Onboarding'],
        summary: 'Update business information (bio, pricing, skills, categories, ...)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  businessName: { type: 'string' },
                  bio: { type: 'string' },
                  pricingFrom: { type: 'number' },
                  yearsOfExperience: { type: 'integer' },
                  location: { type: 'string' },
                  categories: { type: 'array', items: { type: 'string' } },
                  skills: { type: 'array', items: { type: 'string' } },
                  profileImageUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated status' } },
      },
    },
    '/onboarding/skills': {
      patch: {
        tags: ['Onboarding'],
        summary: 'Replace artisan skills',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { skills: { type: 'array', items: { type: 'string' } } },
                required: ['skills'],
              },
            },
          },
        },
        responses: { 200: { description: 'Updated status' }, 400: { $ref: '#/components/schemas/Error' } },
      },
    },
    '/onboarding/services': {
      patch: {
        tags: ['Onboarding'],
        summary: 'Replace artisan services',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  services: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        durationMinutes: { type: 'integer' },
                        category: { type: 'string' },
                      },
                    },
                  },
                },
                required: ['services'],
              },
            },
          },
        },
        responses: { 200: { description: 'Updated status' } },
      },
    },
    '/onboarding/availability': {
      patch: {
        tags: ['Onboarding'],
        summary: 'Replace weekly availability',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  slots: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        day: { type: 'string' },
                        startTime: { type: 'string' },
                        endTime: { type: 'string' },
                      },
                    },
                  },
                },
                required: ['slots'],
              },
            },
          },
        },
        responses: { 200: { description: 'Updated status' } },
      },
    },
    '/onboarding/portfolio': {
      get: {
        tags: ['Onboarding'],
        summary: 'List portfolio images',
        responses: { 200: { description: 'Portfolio items' } },
      },
      post: {
        tags: ['Onboarding'],
        summary: 'Add a portfolio image (multipart/form-data: image, title, description)',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: { type: 'string', format: 'binary' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' } },
      },
      patch: {
        tags: ['Onboarding'],
        summary: 'Update portfolio item captions',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                      },
                    },
                  },
                },
                required: ['items'],
              },
            },
          },
        },
        responses: { 200: { description: 'Updated status' } },
      },
    },
    '/onboarding/portfolio/{id}': {
      delete: {
        tags: ['Onboarding'],
        summary: 'Delete a portfolio image',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },
    '/onboarding/student-verification': {
      patch: {
        tags: ['Onboarding'],
        summary: 'Submit student verification (institution, student ID, optional image)',
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  institution: { type: 'string' },
                  studentIdNumber: { type: 'string' },
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated status' } },
      },
    },
    '/onboarding/submit': {
      post: {
        tags: ['Onboarding'],
        summary: 'Submit the application for admin review (requires all steps complete)',
        responses: {
          201: { description: 'Submitted (status = PENDING_REVIEW)' },
          400: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    '/admin/verifications': {
      get: {
        tags: ['Admin', 'Verification'],
        summary: 'List artisan applications by status (default PENDING_REVIEW)',
        responses: { 200: { description: 'Paginated applications' } },
      },
    },
    '/admin/verifications/{id}': {
      get: {
        tags: ['Admin', 'Verification'],
        summary: 'Get a single application',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Application' } },
      },
    },
    '/admin/verifications/{id}/approve': {
      patch: {
        tags: ['Admin', 'Verification'],
        summary: 'Approve application (status = ACTIVE)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { note: { type: 'string' } } },
            },
          },
        },
        responses: { 200: { description: 'Approved' } },
      },
    },
    '/admin/verifications/{id}/reject': {
      patch: {
        tags: ['Admin', 'Verification'],
        summary: 'Reject application (status = REJECTED)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { note: { type: 'string' } }, required: ['note'] },
            },
          },
        },
        responses: { 200: { description: 'Rejected' } },
      },
    },
    '/admin/verifications/{id}/request-changes': {
      patch: {
        tags: ['Admin', 'Verification'],
        summary: 'Request changes (status = CHANGES_REQUESTED)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { note: { type: 'string' } }, required: ['note'] },
            },
          },
        },
        responses: { 200: { description: 'Changes requested' } },
      },
    },
    '/skills': {
      get: {
        tags: ['Catalog'],
        summary: 'List available skills',
        responses: { 200: { description: 'Skills' } },
      },
    },
    '/artisans/me/revenue': {
      get: {
        tags: ['Artisan', 'Earnings'],
        summary: "Get the authenticated artisan's total earnings",
        responses: {
          200: {
            description: 'Earnings from completed bookings',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: { artisanId: 'clx0000000000000000000000ab', totalEarned: 1250.0, completedBookings: 12 },
                },
              },
            },
          },
          401: { $ref: '#/components/schemas/Error' },
        },
      },
    },
    '/artisans/{id}/revenue': {
      get: {
        tags: ['Artisan', 'Earnings'],
        summary: "Get an artisan's total earnings by profile id",
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Earnings from completed bookings',
            content: {
              'application/json': {
                example: {
                  success: true,
                  data: { artisanId: 'clx0000000000000000000000ab', totalEarned: 1250.0, completedBookings: 12 },
                },
              },
            },
          },
          404: { $ref: '#/components/schemas/Error' },
        },
      },
    },
  },
};

export { openApiSpec };
