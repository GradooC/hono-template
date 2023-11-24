import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { postRouter } from './post';
import { userRouter } from './user';

const app = new Hono();

app.use('/post/*', jwt({ secret: process.env.JWT_SECRET || 'DEFAULT_JWT_SECRET' }));
app.route('/post', postRouter);

app.route('/user', userRouter);

export default app;
