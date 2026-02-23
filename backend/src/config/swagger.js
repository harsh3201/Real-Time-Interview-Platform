const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Real-Time Interview Platform API',
            version: '1.0.0',
            description: 'A comprehensive interview scheduling and management platform with real-time features',
            contact: {
                name: 'API Support',
                email: 'support@interviewplatform.com',
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 5000}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john@example.com' },
                        role: { type: 'string', enum: ['candidate', 'admin'], example: 'candidate' },
                        created_at: { type: 'string', format: 'date-time' },
                    },
                },
                Interview: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Frontend Developer Interview' },
                        scheduled_time: { type: 'string', format: 'date-time' },
                        created_by: { type: 'integer', example: 1 },
                        status: { type: 'string', enum: ['scheduled', 'active', 'completed', 'cancelled'], example: 'scheduled' },
                    },
                },
                Booking: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        user_id: { type: 'integer', example: 2 },
                        interview_id: { type: 'integer', example: 1 },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'An error occurred' },
                        error: { type: 'string', example: 'Error details' },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
