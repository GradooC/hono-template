import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { logger } from 'hono/logger';

import { postRouter } from './post';
import { userRouter } from './user';

const app = new Hono();

app.use('*', logger());

app.use('/post/*', jwt({ secret: process.env.JWT_ACCESS_TOKEN_SECRET }));
app.route('/post', postRouter);

app.route('/user', userRouter);

app.notFound((context) => context.json({ message: 'Not Found' }, 404));

export default app;
