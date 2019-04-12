import fastify from 'fastify';
import * as http from 'http';
import FastifySession from '../index';

interface CostumRequest extends fastify.FastifyRequest<http.IncomingMessage> {
  session: any;
  cookies: any;
  store: any;
}

const app = fastify();

app.register(require('fastify-cookie')).register(FastifySession, {
  references: {
    user_id: {}
  }
});

app.get('/set', async (req: CostumRequest) => {
  await req.session.set({
    user_id: 2
  });
  return { status: 'ok' };
});

app.get('/get', async (req: CostumRequest) => {
  const data = await req.session.get();
  return { data };
});

app.get('/delete_all', async (req: CostumRequest) => {
  const status = await req.session.store.delete_all('user_id', 2);
  return { status };
});

app.listen(8080);
