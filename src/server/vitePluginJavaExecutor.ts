import type { Plugin } from 'vite';
import { executeJavaWorker } from './javaExecutor.ts';

export function javaExecutionPlugin(): Plugin {
  return {
    name: 'codeflow-java-execution-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/health' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', worker: 'Java 22.0.1 Executor' }));
          return;
        }

        if (req.url === '/api/execute' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const { code } = JSON.parse(body);
              if (!code) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Code is required' }));
                return;
              }

              // Execute through the real Java worker
              const result = await executeJavaWorker(code);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                status: 'ERROR',
                error: {
                  type: 'InternalServerError',
                  line: 1,
                  message: err.message || 'Worker server failure',
                  detail: String(err),
                },
              }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}
