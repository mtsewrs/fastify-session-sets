# fastify-session-sets

> This is a ported version from https://github.com/koajs/redis-session-sets

A redis session for Fastify that creates sets for specific values.

Use-case: you want to know all the sessions related to a user so that if the user resets his/her password, you destroy all the sessions.

Specifics:

Stores sessions as hash sets
Stores cross references as sets
Functional API

## Example

```javascript
import fastify from 'fastify';
import FastifySession from 'fastify-session-sets';

const app = fastify();

app
  .register(require('fastify-cookie'))
  .register(require('fastify-session-sets'));

app.get('/set', async (req) => {
  await req.session.set({
    user_id: 2
  })
  return { status: 'ok' };
});

app.get('/get', async (req) => {
  const session = await req.session.get()
  return { data: session };
});

app.get('/delete_all', async (req) => {
  // deleting all the sessions associated with `user_id` of 2
  const status = await req.session.store.delete_all('user_id', 2); // return true if successful 
  return { status: status };
});

app.listen(8080)
```