import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { getCookie, setCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';

import { REFRESH_TOKEN_COOKIE_NAME } from '../common/constants/cookie';
import { getExpirationTime } from '../common/lib/date';
import { prisma } from '../db';
import { Env } from '../types/env';

import { signInJsonSchema } from './schemas/sign-in-json';
import { signUpJsonSchema } from './schemas/sign-up-json';

export const userRouter = new Hono()
    /**
     * POST /sign-up
     */
    .post('/sign-up', zValidator('json', signUpJsonSchema), async (context) => {
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

            return context.jsonT(
                {
                    message: 'User registered successfully',
                    user: user,
                },
                201,
            );
        } catch (error) {
            return context.jsonT({ message: 'Error occured', error }, 500);
        }
    })
    /**
     * POST /sign-in
     */
    .post('/sign-in', zValidator('json', signInJsonSchema), async (context) => {
        try {
            const { email, password } = context.req.valid('json');
            const { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } =
                env<Env>(context);

            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user) {
                return context.jsonT(
                    {
                        message: 'Invalid username or password',
                    },
                    400,
                );
            }

            const isPasswordValid = await Bun.password.verify(
                password,
                user.password,
            );

            if (!isPasswordValid) {
                return context.jsonT(
                    {
                        message: 'Invalid username or password',
                    },
                    400,
                );
            }

            const userInfo = { email: user.email, id: user.id };

            const accessToken = await sign(
                { user: userInfo, exp: getExpirationTime(1) },
                JWT_ACCESS_TOKEN_SECRET,
            );

            const refreshToken = await sign(
                { user: userInfo, exp: getExpirationTime(24) },
                JWT_REFRESH_TOKEN_SECRET,
            );

            setCookie(context, REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
                httpOnly: true,
                sameSite: 'Strict',
            });

            return context.jsonT({
                message: 'Logged in successfully',
                accessToken,
            });
        } catch (error) {
            return context.jsonT({ message: 'Error occured', error }, 500);
        }
    })
    /**
     * GET /refresh
     */
    .get('/refresh', async (context) => {
        try {
            const refreshToken = getCookie(context, REFRESH_TOKEN_COOKIE_NAME);
            const { JWT_ACCESS_TOKEN_SECRET, JWT_REFRESH_TOKEN_SECRET } =
                env<Env>(context);

            if (!refreshToken) {
                return context.jsonT(
                    { message: 'Refresh token is missing' },
                    401,
                );
            }

            const decodedPayload = await verify(
                refreshToken,
                JWT_REFRESH_TOKEN_SECRET,
            );

            const userInfo = decodedPayload.user;

            const accessToken = await sign(
                { user: userInfo, exp: getExpirationTime(1) },
                JWT_ACCESS_TOKEN_SECRET,
            );

            return context.jsonT({
                message: 'Token is refreshed successfully',
                accessToken,
            });
        } catch (error) {
            return context.jsonT(
                { message: 'Refresh token is invalid', error },
                401,
            );
        }
    });
