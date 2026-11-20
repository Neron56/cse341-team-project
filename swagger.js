import swaggerJsdoc from 'swagger-jsdoc';
import { fileURLToPath } from 'node:url';

const swaggerDocument = swaggerJsdoc({
  failOnErrors: true,
  definition: {
    openapi: '3.0.0',
    info: { title: 'Kizuna Rail API', version: '1.0.0' },
    servers: [{ url: '/' }]
  },
  apis: [fileURLToPath(new URL('./src/routes/api-routes.js', import.meta.url)).replaceAll('\\', '/')]
});

export default swaggerDocument;
