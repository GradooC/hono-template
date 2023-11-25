import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { postRouter } from './post';
import { userRouter } from './user';

const app = new Hono();

app.use(
    '/post/*',
    jwt({ secret: process.env.JWT_SECRET || 'DEFAULT_JWT_SECRET' })
);
app.route('/post', postRouter);

app.route('/user', userRouter);

app.notFound((context) => context.json({ message: 'Not Found' }, 404));

app.onError((error, context) =>
    context.json({ message: 'Internal server error', error }, 500)
);
export default app;
