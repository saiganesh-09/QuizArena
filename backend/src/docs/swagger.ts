import type { OpenAPIV3 } from 'openapi-types';

/**
 * OpenAPI 3.0 specification for the QuizArena API.
 *
 * This spec is served at GET /api-docs via swagger-ui-express.
 * It documents every endpoint with request bodies, success schemas,
 * and error responses (400, 401, 403, 404, 409, 500).
 */
export const swaggerSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'QuizArena API',
    version: '1.0.0',
    description:
      'Multi-role quiz platform API with secure JWT cookie auth, ' +
      'role-based access control (admin, instructor, candidate), ' +
      'a fail-safe examination engine, and aggregated analytics.\n\n' +
      '## Authentication\n' +
      'All authenticated endpoints require a valid JWT in an HTTP-only ' +
      'cookie named `qa_token`. The cookie is set by the `/auth/login` ' +
      'and `/auth/signup` endpoints and cleared by `/auth/logout`.',
  },
  servers: [
    { url: '/api', description: 'API base path' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Admin', description: 'Admin-only endpoints' },
    { name: 'Instructor', description: 'Instructor-only endpoints' },
    { name: 'Candidate', description: 'Candidate-only endpoints' },
    { name: 'Health', description: 'Health check' },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'qa_token',
        description: 'HTTP-only JWT cookie set by /auth/login',
      },
    },
    schemas: {
      ApiError: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Email is required' },
            },
          },
        },
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '507f1f77bcf86cd799439011' },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane@test.com' },
          role: { type: 'string', enum: ['admin', 'instructor', 'candidate'] },
          status: { type: 'string', enum: ['active', 'suspended'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SignupRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'role'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: {
            type: 'string',
            minLength: 8,
            maxLength: 128,
            description: 'Must contain uppercase, lowercase, number, and special character',
          },
          role: { type: 'string', enum: ['instructor', 'candidate'] },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      Quiz: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'scheduled', 'live', 'completed', 'cancelled'] },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          durationMinutes: { type: 'integer' },
          createdBy: { type: 'string' },
          questionCount: { type: 'integer' },
          participantCount: { type: 'integer' },
          cancelledAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateQuizRequest: {
        type: 'object',
        required: ['title', 'startTime', 'endTime', 'durationMinutes'],
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 200 },
          description: { type: 'string', maxLength: 2000 },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          durationMinutes: { type: 'integer', minimum: 1, maximum: 300 },
          instructorId: { type: 'string', description: 'Admin-only: assign instructor' },
        },
      },
      EditQuizRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 200 },
          description: { type: 'string', maxLength: 2000 },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          durationMinutes: { type: 'integer', minimum: 1, maximum: 300 },
        },
      },
      Question: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          type: { type: 'string', enum: ['single-choice', 'multi-select', 'true-false'] },
          text: { type: 'string' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
              },
            },
          },
          points: { type: 'integer' },
        },
      },
      CreateQuestionRequest: {
        type: 'object',
        required: ['type', 'text', 'options', 'correctOptionIds', 'points'],
        properties: {
          type: { type: 'string', enum: ['single-choice', 'multi-select', 'true-false'] },
          text: { type: 'string', minLength: 3, maxLength: 1000 },
          options: {
            type: 'array',
            minItems: 2,
            items: {
              type: 'object',
              required: ['id', 'text'],
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
              },
            },
          },
          correctOptionIds: { type: 'array', items: { type: 'string' }, minItems: 1 },
          points: { type: 'integer', minimum: 1, maximum: 100 },
        },
      },
      Participant: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          addedAt: { type: 'string', format: 'date-time' },
        },
      },
      AttemptStart: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          quizId: { type: 'string' },
          status: { type: 'string', enum: ['in-progress', 'submitted', 'auto-submitted'] },
          startedAt: { type: 'string', format: 'date-time' },
          deadlineAt: { type: 'string', format: 'date-time' },
          durationMinutes: { type: 'integer' },
          questions: { type: 'array', items: { $ref: '#/components/schemas/Question' } },
        },
        description: 'Questions returned WITHOUT correctOptionIds for security.',
      },
      SubmitAnswersRequest: {
        type: 'object',
        required: ['answers'],
        properties: {
          answers: {
            type: 'array',
            items: {
              type: 'object',
              required: ['questionId', 'selectedOptionIds'],
              properties: {
                questionId: { type: 'string' },
                selectedOptionIds: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      AttemptResult: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          quizId: { type: 'string' },
          quizTitle: { type: 'string' },
          status: { type: 'string', enum: ['submitted', 'auto-submitted'] },
          score: { type: 'integer' },
          maxScore: { type: 'integer' },
          percentage: { type: 'integer' },
          timeTakenSeconds: { type: 'integer' },
          autoSubmitted: { type: 'boolean' },
          submittedAt: { type: 'string', format: 'date-time' },
          answers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionId: { type: 'string' },
                questionText: { type: 'string' },
                selectedOptionIds: { type: 'array', items: { type: 'string' } },
                correctOptionIds: { type: 'array', items: { type: 'string' } },
                isCorrect: { type: 'boolean' },
                awardedPoints: { type: 'integer' },
                maxPoints: { type: 'integer' },
              },
            },
          },
        },
      },
      InstructorResults: {
        type: 'object',
        properties: {
          quizId: { type: 'string' },
          quizTitle: { type: 'string' },
          totalAssigned: { type: 'integer' },
          totalCompleted: { type: 'integer' },
          completionRate: { type: 'integer' },
          averageScore: { type: 'integer' },
          highestScore: { type: 'integer' },
          lowestScore: { type: 'integer' },
          scoreDistribution: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string' },
                count: { type: 'integer' },
              },
            },
          },
          candidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                attemptId: { type: 'string' },
                candidateId: { type: 'string' },
                candidateName: { type: 'string' },
                candidateEmail: { type: 'string' },
                rank: { type: 'integer' },
                score: { type: 'integer' },
                maxScore: { type: 'integer' },
                percentage: { type: 'integer' },
                remark: { type: 'string' },
                timeTakenSeconds: { type: 'integer' },
                status: { type: 'string' },
                submittedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          page: { type: 'integer' },
          totalPages: { type: 'integer' },
          total: { type: 'integer' },
        },
      },
      InstructorAttemptDetail: {
        type: 'object',
        properties: {
          attemptId: { type: 'string' },
          quizId: { type: 'string' },
          quizTitle: { type: 'string' },
          candidateId: { type: 'string' },
          candidateName: { type: 'string' },
          candidateEmail: { type: 'string' },
          rank: { type: 'integer' },
          score: { type: 'integer' },
          maxScore: { type: 'integer' },
          percentage: { type: 'integer' },
          remark: { type: 'string' },
          correctCount: { type: 'integer' },
          totalQuestions: { type: 'integer' },
          timeTakenSeconds: { type: 'integer' },
          status: { type: 'string' },
          startedAt: { type: 'string', format: 'date-time', nullable: true },
          submittedAt: { type: 'string', format: 'date-time', nullable: true },
          answers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionId: { type: 'string' },
                questionText: { type: 'string' },
                questionType: { type: 'string' },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { id: { type: 'string' }, text: { type: 'string' } },
                  },
                },
                correctOptionIds: { type: 'array', items: { type: 'string' } },
                selectedOptionIds: { type: 'array', items: { type: 'string' } },
                awardedPoints: { type: 'integer' },
                maxPoints: { type: 'integer' },
                isCorrect: { type: 'boolean' },
              },
            },
          },
        },
      },
      AdminAnalytics: {
        type: 'object',
        properties: {
          quizCount: { type: 'integer' },
          quizzesByStatus: {
            type: 'object',
            properties: {
              draft: { type: 'integer' },
              scheduled: { type: 'integer' },
              live: { type: 'integer' },
              completed: { type: 'integer' },
              cancelled: { type: 'integer' },
            },
          },
          totalCandidates: { type: 'integer' },
          totalInstructors: { type: 'integer' },
          totalAttempts: { type: 'integer' },
          totalCompletedAttempts: { type: 'integer' },
          attemptCompletionRate: { type: 'integer' },
          averageScore: { type: 'integer' },
        },
      },
      PaginatedList: {
        type: 'object',
        properties: {
          items: { type: 'array', items: {} },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    // ---- Health ----
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns 200 OK if the server is running.',
        responses: {
          '200': { description: 'Server is healthy' },
        },
      },
    },

    // ---- Auth ----
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Sign up a new instructor or candidate',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SignupRequest' } } },
        },
        responses: {
          '201': {
            description: 'Account created. Sets qa_token cookie.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } },
          },
          '400': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
          '409': { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with email + password',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': {
            description: 'Login successful. Sets qa_token cookie.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } },
          },
          '401': { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out (clear the JWT cookie)',
        description: 'Idempotent — works whether or not the user is authenticated.',
        responses: {
          '200': { description: 'Cookie cleared' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the current authenticated user',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': { description: 'Current user profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } } } },
          '401': { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
        },
      },
    },

    // ---- Admin ----
    '/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users (paginated, searchable)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'instructor', 'candidate'] } },
        ],
        responses: {
          '200': { description: 'Paginated user list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedList' } } } },
          '401': { description: 'Not authenticated' },
          '403': { description: 'Not an admin' },
        },
      },
    },
    '/admin/quizzes': {
      get: {
        tags: ['Admin'],
        summary: 'List all quizzes (paginated, searchable)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Paginated quiz list' },
          '401': { description: 'Not authenticated' },
          '403': { description: 'Not an admin' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Create a new quiz (assigns an instructor)',
        security: [{ cookieAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateQuizRequest' } } } },
        responses: {
          '201': { description: 'Quiz created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Quiz' } } } },
          '400': { description: 'Validation error' },
          '401': { description: 'Not authenticated' },
          '403': { description: 'Not an admin' },
        },
      },
    },
    '/admin/quizzes/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Get a quiz by ID',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Quiz details' },
          '401': { description: 'Not authenticated' },
          '403': { description: 'Not an admin' },
          '404': { description: 'Quiz not found' },
        },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Edit a quiz (draft/scheduled only)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/EditQuizRequest' } } } },
        responses: {
          '200': { description: 'Quiz updated' },
          '400': { description: 'Validation error or invalid state transition' },
          '403': { description: 'Not an admin' },
          '404': { description: 'Quiz not found' },
          '409': { description: 'Quiz is live/completed/cancelled' },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete a quiz (draft only)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Quiz deleted' },
          '403': { description: 'Not an admin' },
          '404': { description: 'Quiz not found' },
          '409': { description: 'Quiz is not in draft status' },
        },
      },
    },
    '/admin/quizzes/{id}/cancel': {
      post: {
        tags: ['Admin'],
        summary: 'Cancel a quiz (soft-delete — sets status to cancelled)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Quiz cancelled' },
          '403': { description: 'Not an admin' },
          '404': { description: 'Quiz not found' },
          '409': { description: 'Quiz is already completed or cancelled' },
        },
      },
    },
    '/admin/analytics': {
      get: {
        tags: ['Admin'],
        summary: 'Platform-wide analytics summary',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'instructorId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Analytics summary', content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminAnalytics' } } } },
          '401': { description: 'Not authenticated' },
          '403': { description: 'Not an admin' },
        },
      },
    },

    // ---- Instructor ----
    '/instructor/quizzes': {
      get: {
        tags: ['Instructor'],
        summary: 'List the instructor\'s own quizzes (paginated, searchable)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Paginated quiz list' },
          '401': { description: 'Not authenticated' },
          '403': { description: 'Not an instructor' },
        },
      },
    },
    '/instructor/quizzes/{id}': {
      get: {
        tags: ['Instructor'],
        summary: 'Get the instructor\'s own quiz by ID',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Quiz details' },
          '401': { description: 'Not authenticated' },
          '403': { description: 'Not the owner' },
          '404': { description: 'Quiz not found' },
        },
      },
      patch: {
        tags: ['Instructor'],
        summary: 'Edit the instructor\'s own quiz (draft/scheduled only)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/EditQuizRequest' } } } },
        responses: {
          '200': { description: 'Quiz updated' },
          '400': { description: 'Validation error' },
          '403': { description: 'Not the owner' },
          '404': { description: 'Quiz not found' },
          '409': { description: 'Quiz is live/completed/cancelled' },
        },
      },
      delete: {
        tags: ['Instructor'],
        summary: 'Delete the instructor\'s own quiz (draft only)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Quiz deleted' },
          '403': { description: 'Not the owner' },
          '404': { description: 'Quiz not found' },
          '409': { description: 'Quiz is not in draft status' },
        },
      },
    },
    '/instructor/quizzes/{id}/cancel': {
      post: {
        tags: ['Instructor'],
        summary: 'Cancel the instructor\'s own quiz',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Quiz cancelled' },
          '403': { description: 'Not the owner' },
          '404': { description: 'Quiz not found' },
          '409': { description: 'Quiz is already completed or cancelled' },
        },
      },
    },
    '/instructor/quizzes/{id}/publish': {
      post: {
        tags: ['Instructor'],
        summary: 'Publish a quiz (draft → scheduled → live based on timing)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Quiz published' },
          '403': { description: 'Not the owner' },
          '404': { description: 'Quiz not found' },
          '409': { description: 'Quiz not ready (missing questions/participants/schedule)' },
        },
      },
    },
    '/instructor/quizzes/{id}/questions': {
      get: {
        tags: ['Instructor'],
        summary: 'List questions for the instructor\'s quiz',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Question list (includes correctOptionIds)' },
          '403': { description: 'Not the owner' },
          '404': { description: 'Quiz not found' },
        },
      },
      post: {
        tags: ['Instructor'],
        summary: 'Add a question to the instructor\'s quiz',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateQuestionRequest' } } } },
        responses: {
          '201': { description: 'Question added' },
          '400': { description: 'Validation error' },
          '403': { description: 'Not the owner' },
          '404': { description: 'Quiz not found' },
          '409': { description: 'Quiz is live/completed/cancelled' },
        },
      },
    },
    '/instructor/quizzes/{id}/participants': {
      get: {
        tags: ['Instructor'],
        summary: 'List participants for the instructor\'s quiz',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Participant list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Participant' } } } } },
          '403': { description: 'Not the owner' },
          '404': { description: 'Quiz not found' },
        },
      },
      post: {
        tags: ['Instructor'],
        summary: 'Add a participant by email',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } } } } },
        responses: {
          '201': { description: 'Participant added' },
          '400': { description: 'Validation error' },
          '403': { description: 'Not the owner' },
          '404': { description: 'Quiz or user not found' },
          '409': { description: 'Quiz is live/completed/cancelled or user is not a candidate' },
        },
      },
    },
    '/instructor/quizzes/{id}/results': {
      get: {
        tags: ['Instructor'],
        summary: 'Get aggregated results for the instructor\'s quiz',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['score', 'timeTakenSeconds', 'submittedAt', 'candidateName'] } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: {
          '200': { description: 'Aggregated results', content: { 'application/json': { schema: { $ref: '#/components/schemas/InstructorResults' } } } },
          '403': { description: 'Not the owner' },
          '404': { description: 'Quiz not found' },
        },
      },
    },
    '/instructor/quizzes/{id}/results/{attemptId}': {
      get: {
        tags: ['Instructor'],
        summary: 'Get one candidate\'s submitted attempt in detail',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'attemptId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Attempt detail', content: { 'application/json': { schema: { $ref: '#/components/schemas/InstructorAttemptDetail' } } } },
          '403': { description: 'Not the owner' },
          '404': { description: 'Quiz or submitted attempt not found' },
        },
      },
    },

    // ---- Candidate ----
    '/candidate/quizzes': {
      get: {
        tags: ['Candidate'],
        summary: 'List quizzes assigned to the candidate (paginated, searchable)',
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Paginated quiz list (metadata only, no questions)' },
          '401': { description: 'Not authenticated' },
          '403': { description: 'Not a candidate' },
        },
      },
    },
    '/candidate/quizzes/{id}': {
      get: {
        tags: ['Candidate'],
        summary: 'Get quiz details (metadata only, no questions/answers)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Quiz metadata' },
          '401': { description: 'Not authenticated' },
          '403': { description: 'Not assigned to this quiz' },
          '404': { description: 'Quiz not found' },
        },
      },
    },
    '/candidate/quizzes/{id}/start': {
      post: {
        tags: ['Candidate'],
        summary: 'Start or resume a quiz attempt',
        description: 'Returns questions WITHOUT correctOptionIds. Enforces: quiz is live, candidate is assigned, no existing attempt (or resumes in-progress one).',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Attempt started/resumed', content: { 'application/json': { schema: { $ref: '#/components/schemas/AttemptStart' } } } },
          '401': { description: 'Not authenticated' },
          '403': { description: 'Not assigned to this quiz' },
          '404': { description: 'Quiz not found' },
          '409': { description: 'Quiz is not live, or attempt already submitted' },
        },
      },
    },
    '/candidate/quizzes/{id}/submit': {
      post: {
        tags: ['Candidate'],
        summary: 'Submit quiz answers (scores the attempt once)',
        description: 'Idempotent — re-submitting returns the existing scored attempt. Time guard: submissions past the deadline are marked auto-submitted.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitAnswersRequest' } } } },
        responses: {
          '200': { description: 'Attempt scored', content: { 'application/json': { schema: { $ref: '#/components/schemas/AttemptResult' } } } },
          '401': { description: 'Not authenticated' },
          '403': { description: 'Not assigned to this quiz' },
          '404': { description: 'Quiz or attempt not found' },
          '409': { description: 'Attempt already submitted' },
        },
      },
    },
    '/candidate/quizzes/{id}/attempt': {
      get: {
        tags: ['Candidate'],
        summary: 'Get the current attempt state (for resume/refresh)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Current attempt state' },
          '401': { description: 'Not authenticated' },
          '404': { description: 'No attempt found' },
        },
      },
    },
    '/candidate/quizzes/{id}/result': {
      get: {
        tags: ['Candidate'],
        summary: 'Get the candidate\'s own result (with correct answers)',
        description: 'Returns 409 if the attempt is not yet submitted. Correct answers are revealed ONLY after submission.',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Candidate result with per-question breakdown', content: { 'application/json': { schema: { $ref: '#/components/schemas/AttemptResult' } } } },
          '401': { description: 'Not authenticated' },
          '404': { description: 'No attempt found' },
          '409': { description: 'Attempt not yet submitted' },
        },
      },
    },
  },
};
