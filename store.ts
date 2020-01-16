import { randomBytes } from 'crypto';
import Redis from 'ioredis';
import { getMS } from './utils';

export default class Store {
  client?: Redis.Redis;
  maxAge?: number;
  prefix?: string;
  references?: Map<any, any>;
  byteLength?: number;

  constructor(options) {
    this.client = options.client || new Redis();
    this.maxAge = getMS(options.maxAge || '28 days');

    // name space for all keys
    this.prefix = '';
    if (options.prefix) this.prefix = options.prefix;
    else if (options.namespace)
      this.prefix = `fastify-redis-session-sets:${options.namespace}`;

    // keys to cross reference
    // in the future, this will allow objects
    this.references = new Map();

    const references = options.references;
    if (references) {
      for (const key of Object.keys(references)) {
        this.references.set(key, references[key] || {});
      }
    }

    this.byteLength = options.byteLength || 18;
  }

  public async delete_all(field, value) {
    try {
      const key = this.getReferenceKey(field, value);
      const session_ids = await this.client.smembers(key);
      await Promise.all(
        session_ids.map(session_id => {
          // deletes the session and removes the session from all the referenced sets
          return this.delete(session_id);
        })
      );

      return true;
    } catch (error) {
      console.error(error)
      return false;
    }
  }

  public async getActiveSessions(field, value) {
    const key = this.getReferenceKey(field, value);
    const session_ids = await this.client.smembers(key);
    return await Promise.all(
      session_ids.map(session_id => {
        // deletes the session and removes the session from all the referenced sets
        return this.get(session_id);
      })
    );
  }

  createSessionId() {
    return randomBytes(this.byteLength).toString('base64');
  }

  getSessionKey(session_id) {
    return `${this.prefix}:${session_id}`;
  }

  getReferenceKey(field, value) {
    return `${this.prefix}:${field}:${value}`;
  }

  get(session_id, fields?: string) {
    const key = this.getSessionKey(session_id);
    if (!Array.isArray(fields)) return this.client.hgetall(key);
    return this.client.hmget(key, fields).then(values => {
      const out = {};
      for (let i = 0; i < fields.length; i++) {
        out[fields[i]] = values[i];
      }
      return out;
    });
  }

  set(session_id?, values?, maxAge?) {
    const key = this.getSessionKey(session_id);
    const references = this.references;
    const HMSET = ['hmset', key, 'id', session_id];
    const multi = [HMSET, ['pexpire', key, getMS(maxAge || this.maxAge)]];
    for (const field of Object.keys(values)) {
      const value = values[field];
      HMSET.push(field, value);
      if (references.has(field)) {
        // associate this field's value with this session
        multi.push(['sadd', this.getReferenceKey(field, value), session_id]);
      }
    }

    return this.client.multi(multi).exec();
  }

  unset(session_id?, fields?, maxAge?) {
    const key = this.getSessionKey(session_id);
    const references = this.references;

    const HDEL = ['hdel', key];
    const multi: any = [HDEL, ['pexpire', key, getMS(maxAge || this.maxAge)]];

    for (const field of fields) {
      HDEL.push(field);
    }

    if (!fields.some(field => references.has(field)))
      return this.client.multi(multi).exec();

    return this.get(
      session_id,
      fields.filter(field => references.has(field))
    ).then(session => {
      for (const field of Object.keys(session)) {
        multi.push([
          'srem',
          this.getReferenceKey(field, session[field]),
          session_id
        ]);
      }

      return this.client.multi(multi).exec();
    });
  }

  touch(session_id?, maxAge?) {
    const key = this.getSessionKey(session_id);
    return this.client.pexpire(key, getMS(maxAge || this.maxAge));
  }

  delete(session_id) {
    const key = this.getSessionKey(session_id);
    const references = this.references;
    const referencedFields: any = [];
    for (const field of references.keys()) {
      referencedFields.push(field);
    }

    const multi = [['del', key]];

    return Promise.resolve(
      referencedFields.length ? this.client.hmget(key, referencedFields) : []
    ).then(results => {
      for (let i = 0; i < results.length; i += 2) {
        multi.push([
          'srem',
          this.getReferenceKey(results[i], results[i + 1]),
          session_id
        ]);
      }

      return this.client.multi(multi).exec();
    });
  }
}
