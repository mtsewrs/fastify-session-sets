import fastify from 'fastify';
import * as http from 'http';
import { session } from '../index';

interface CostumRequest extends fastify.FastifyRequest<http.IncomingMessage> {
  session: any;
  cookies: any;
  store: any;
}

const app = fastify();

app.register(session, {
  signed: true,
  references: {
    user_id: {}
  }
});

app.get('/set', async (req: CostumRequest) => {
  await req.session.set({
    user_id: 1
  });
  req.session.setCostumCookie('token', 'sometoken');
  return await req.session.get();
});

app.get('/get', async (req: CostumRequest, reply: any) => {
  const data = await req.session.get();
  return JSON.stringify(data, null, 2);
});

app.get('/del', async (req: CostumRequest) => {
  const status = await req.session.delete();
  return { status };
});

app.listen(8081);
