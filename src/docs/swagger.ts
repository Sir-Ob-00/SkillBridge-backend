import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { openApiSpec } from './openapi';

/** Serves the Swagger UI at `/api-docs`. */
export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
};
