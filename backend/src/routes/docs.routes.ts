import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../docs/swagger';

export const docsRouter = Router();

/**
 * Serve the Swagger UI at /api-docs.
 * The spec is generated from the OpenAPI document in src/docs/swagger.ts.
 */
docsRouter.use('/', swaggerUi.serve);
docsRouter.get('/', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui { max-width: 1200px; margin: 0 auto; }',
  customSiteTitle: 'QuizArena API Docs',
}));
