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
  await req.session.session.set({
    user_id: 1
  })
  const session = await req.session.session.get()

  return { data: session };
});

describe('Server', () => {
  test('should respond as expected', async () => {
    await app.ready();
    const response = await request(app.server).get('/set');
    expect(response.status).toBe(200);
    expect(response.type).toBe('application/json');
    expect(response.body.data.user_id).toBe('1');
  });
});
