import fastify from 'fastify';
import * as http from 'http';
import FastifySession from 'fastify-session-sets';

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
    user_id: 2
  })
  return { status: 'ok' };
});

app.get('/get', async (req: CostumRequest) => {
  const session = await req.session.session.get()
  return { data: session };
});

app.listen(8080)