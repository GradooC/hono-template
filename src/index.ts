import { Hono } from 'hono';
import { logger } from 'hono/logger';

import { authMiddleware } from './common/middlewares/auth';
import { postRouter } from './post';
import { userRouter } from './user';

export type AppType = typeof app;

const app = new Hono()
    .use('*', logger())
    .route('/user', userRouter)
    .use('*', authMiddleware)
    .route('/post', postRouter);

export default app;
