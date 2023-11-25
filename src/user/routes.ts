import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { sign } from 'hono/jwt';
import { prisma } from '../db';
import { zValidator } from '@hono/zod-validator';
import { signUpJsonSchema } from './schemas/sign-up-json';
import { signInJsonSchema } from './schemas/sign-in-json';

const userRouter = new Hono();

userRouter.post(
    '/sign-up',
    zValidator('json', signUpJsonSchema),
    async (context) => {
        try {
            const { email, password, name } = context.req.valid('json');
            const hashedPassword = await Bun.password.hash(password);

            const user = await prisma.user.create({
                data: { email, name, password: hashedPassword },
                select: {
                    email: true,
                    name: true,
                },
            });

            return context.json(
                {
                    message: 'User registered successfully',
                    user: user,
                },
                201
            );
        } catch (error) {
            return context.json({ message: 'Error occured', error }, 500);
        }
    }
);

userRouter.post(
    '/sign-in',
    zValidator('json', signInJsonSchema),
    async (context) => {
        try {
            const { email, password } = context.req.valid('json');
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                return context.json(
                    {
                        message: 'Invalid username or password',
                    },
                    400
                );
            }

            const isPasswordValid = await Bun.password.verify(
                password,
                user.password
            );

            if (!isPasswordValid) {
                return context.json(
                    {
                        message: 'Invalid username or password',
                    },
                    400
                );
            }

            const userInfo = { email: user.email, id: user.id };

            const accessToken = await sign(
                { user: userInfo },
                process.env.JWT_SECRET || 'DEFAULT_JWT_SECRET'
            );
            const refreshToken = await sign(
                { user: userInfo },
                process.env.JWT_SECRET || 'DEFAULT_JWT_SECRET'
            );

            setCookie(context, 'refresh-token', refreshToken, {
                httpOnly: true,
                sameSite: 'Strict',
            });

            return context.json({
                message: 'Logged in successfully',
                accessToken,
            });
        } catch (error) {
            return context.json({ message: 'Error occured', error }, 500);
        }
    }
);

export { userRouter };
