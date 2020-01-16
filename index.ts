import * as http from 'http';
import fp from 'fastify-plugin';
import fastify from 'fastify';
import { getMS } from './utils';
import Session from './session';
import Store from './store';

interface CostumRequest extends fastify.FastifyRequest<http.IncomingMessage> {
  session: any;
}

interface DecoratedInstance
  extends fastify.FastifyInstance<
  http.Server,
  http.IncomingMessage,
  http.ServerResponse
  > {
  createSession: (
    request: fastify.FastifyRequest<http.IncomingMessage>,
    reply: fastify.FastifyReply<http.ServerResponse>
  ) => void;
}

export const session = fp((fastify: DecoratedInstance, options: any, next) => {
  options.key = options.key || 'sid';
  options.secret = options.secret || 'session-secret';
  options.overwrite = true;
  options.httpOnly = options.httpOnly !== false;
  options.signed = options.signed !== false;
  options.maxAge = getMS(options.maxAge || '28 days');

  const store = new Store(options);

  fastify.register(require('fastify-cookie'), {
    secret: options.secret,
    parseOptions: options,
  })

  fastify.decorate('createSession', (req, reply) => {
    return new Session(req, reply, store, options);
  });

  fastify.addHook('preHandler', (request: CostumRequest, reply, done) => {
    const FastifySession = fastify.createSession(request, reply);
    request.session = Object.assign(FastifySession, {
      store,
      options
    })
    done();
  });

  next();
});

export { Session, Store }
