import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { logger } from 'hono/logger';

import { postRouter } from './post';
import { userRouter } from './user';

export type AppType = typeof app;

const app = new Hono()
    .use('*', logger())
    .route('/user', userRouter)
    .use('*', jwt({ secret: process.env.JWT_ACCESS_TOKEN_SECRET }))
    .route('/post', postRouter);

export default app;
