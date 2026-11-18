import express from 'express';
import http from 'http';
import cors from 'cors';
import { json } from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

import { typeDefs } from './schema/typeDefs';
import { resolvers } from './resolvers';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Build GraphQL executable schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // Set up WebSocket server for GraphQL Subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer({ schema }, wsServer);

  // Set up Apollo Server
  const server = new ApolloServer({
    schema,
    plugins: [
      // Proper shutdown for the HTTP server
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for the WebSocket server
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  // Middleware
  app.use(cors());
  app.use(json());

  // ALB / ECS Container Health Check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'devops-graphql-ecs-fargate',
      uptime: process.uptime(),
      useLambda: process.env.USE_LAMBDA === 'true',
    });
  });

  // Mount Apollo Server GraphQL endpoint
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => ({
        token: req.headers.authorization,
        requestId: req.headers['x-request-id'] || `req-${Date.now()}`,
      }),
    })
  );

  // Start listening
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 Apollo GraphQL Server ready on port ${PORT}`);
    console.log(`📡 HTTP Queries & Mutations: http://localhost:${PORT}/graphql`);
    console.log(`⚡ WebSocket Subscriptions:   ws://localhost:${PORT}/graphql`);
    console.log(`🩺 Health Check endpoint:    http://localhost:${PORT}/health`);
    console.log(`⚙️  Mode: ${process.env.USE_LAMBDA === 'true' ? 'AWS Lambda Invocations' : 'Direct DB Fallback'}`);
    console.log(`=======================================================`);
  });

  // Graceful shutdown on ECS task termination (SIGTERM)
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Gracefully stopping ECS Fargate container...`);
    await server.stop();
    httpServer.close(() => {
      console.log('✅ HTTP server closed. Task stopped cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
  console.error('❌ Failed to start Apollo GraphQL server:', error);
  process.exit(1);
});
