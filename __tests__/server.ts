import request from 'supertest';
import fastify from 'fastify';
import * as http from 'http';
import FastifySession from '../index';

interface CostumRequest extends fastify.FastifyRequest<http.IncomingMessage> {
  session: any;
  cookies: any
}

const app = fastify();

app
  .register(require('fastify-cookie'))
  .register(FastifySession);

app.get('/set', async (req: CostumRequest) => {
  await req.session.set({
    user_id: 1
  })
  const session = await req.session.get()

  return { data: session };
});

describe('Server', () => {

  const server = request(app.server);

  beforeAll(() => {
    return app.ready();
  })

  it('should have a session', async () => {
    const response = await server.get('/set');
    expect(response.status).toBe(200);
    expect(response.type).toBe('application/json');
    expect(response.body.data.user_id).toBe('1');
  });
});
