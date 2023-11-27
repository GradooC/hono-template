import { env } from 'hono/adapter';
import { createMiddleware } from 'hono/factory';
import { jwt } from 'hono/jwt';

import { Env } from '../../types/env';

export const authMiddleware = createMiddleware(async (context, next) => {
    const { JWT_ACCESS_TOKEN_SECRET } = env<Env>(context);
    const handler = jwt({ secret: JWT_ACCESS_TOKEN_SECRET });
    await handler(context, next);
});
