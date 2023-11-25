import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import { prisma } from '../db';
import { zValidator } from '@hono/zod-validator';
import { signUpJsonSchema } from './schemas/sign-up-json';
import { signInJsonSchema } from './schemas/sign-in-json';
import { getExpirationTime } from '../common/lib/date';
import { REFRESH_TOKEN_COOKIE_NAME } from '../common/constants/cookie';

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
                { user: userInfo, exp: getExpirationTime(1) },
                process.env.JWT_ACCESS_TOKEN_SECRET
            );

            const refreshToken = await sign(
                { user: userInfo, exp: getExpirationTime(24) },
                process.env.JWT_REFRESH_TOKEN_SECRET
            );

            setCookie(context, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
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

userRouter.get('/refresh', async (context) => {
    try {
        const refreshToken = getCookie(context, REFRESH_TOKEN_COOKIE_NAME);

        if (!refreshToken) {
            return context.json({ message: 'Refresh token is missing' }, 401);
        }

        const decodedPayload = await verify(
            refreshToken,
            process.env.JWT_REFRESH_TOKEN_SECRET
        );

        const userInfo = decodedPayload.user;

        const accessToken = await sign(
            { user: userInfo, exp: getExpirationTime(1) },
            process.env.JWT_ACCESS_TOKEN_SECRET
        );

        return context.json({
            message: 'Token is refreshed successfully',
            accessToken,
        });
    } catch (error) {
        return context.json(
            { message: 'Refresh token is invalid', error },
            401
        );
    }
});

export { userRouter };
