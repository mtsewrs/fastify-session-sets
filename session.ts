import uniq from 'lodash.uniq';
import * as Fastify from 'fastify';
import * as http from 'http';

interface Cookie {
  [key: string]: any;
}

interface CostumRequest extends Fastify.FastifyRequest<http.IncomingMessage> {
  cookies: Cookie;
}

interface CostumReply extends Fastify.FastifyReply<http.ServerResponse> {
  setCookie: (...opt) => void;
}

export default class Session {
  _ctx: any;
  _store: any;
  _options: any;
  _id: any;
  _req: CostumRequest;
  _reply: CostumReply;

  constructor(req: CostumRequest, reply: CostumReply, store, options) {
    this._req = req;
    this._reply = reply;
    this._store = store;
    this._options = options;
  }

  private getSessionId() {
    const options = this._options;
    return (this._id =
      this._id ||
      this._req.cookies[options.key] ||
      this._store.createSessionId(options.byteLength));
  }

  private setCookie(unset?: boolean) {
    const options = this._options;
    const session_id = this.getSessionId();
    this._reply.setCookie(options.key, unset ? '' : session_id, options);
  }

  getKey() {
    return this._store.getSessionKey(this.getSessionId());
  }

  get(fields?) {
    const session_id = this.getSessionId();
    return this._store.get(
      session_id,
      fields ? uniq(fields.concat('id')) : null
    );
  }

  set(values, maxAge?) {
    this.setCookie();
    const session_id = this.getSessionId();
    return this._store.set(session_id, values, maxAge);
  }

  unset(fields, maxAge) {
    this.setCookie();
    const session_id = this.getSessionId();
    return this._store.unset(session_id, fields, maxAge);
  }

  touch(maxAge) {
    this.setCookie();
    const session_id = this.getSessionId();
    return this._store.touch(session_id, maxAge);
  }

  delete() {
    this._id = null;
    this.setCookie(true);
    const session_id = this.getSessionId();
    return this._store.delete(session_id);
  }
}
