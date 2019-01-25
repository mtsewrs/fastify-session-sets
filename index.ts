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

export default fp((fastify: DecoratedInstance, options: any, next) => {
  options.key = options.key || 'session-id';
  options.overwrite = true;
  options.httpOnly = options.httpOnly !== false;
  options.signed = options.signed !== false;
  options.maxAge = getMS(options.maxAge || '28 days');

  const store = new Store(options);

  fastify.decorate('createSession', (req, reply) => {
    return {
      session: new Session(req, reply, store, options),
      store,
      options,
      getReferenceKey
    };
  });

  fastify.addHook('preHandler', (request: CostumRequest, reply, done) => {
    request.session = fastify.createSession(request, reply);
    done();
  });

  next();

  function getReferenceKey(field, value) {
    return store.getReferenceKey(field, value);
  }
});
