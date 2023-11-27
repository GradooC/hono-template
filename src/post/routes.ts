import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { prisma } from '../db';
import { JwtPayload } from '../types/jwt';

import { addPostJsonSchema } from './schemas/add-post-json';
import { idParamSchema } from './schemas/id-param';

export const postRouter = new Hono()
    /**
     * GET /feed
     */
    .get('/feed', async (context) => {
        const { user }: JwtPayload = context.get('jwtPayload');

        const posts = await prisma.post.findMany({
            where: { published: true, authorId: user.id },
            include: {
                author: {
                    select: {
                        email: true,
                        name: true,
                    },
                },
            },
        });

        return context.jsonT(posts);
    })
    /**
     * PUT /publish/:id
     */
    .put(
        '/publish/:id',
        zValidator('param', idParamSchema),
        async (context) => {
            const { user }: JwtPayload = context.get('jwtPayload');
            const { id } = context.req.valid('param');

            const post = await prisma.post.update({
                where: { id: Number(id), authorId: user.id },
                data: { published: true },
            });

            return context.jsonT(post);
        },
    )
    /**
     * GET /:id
     */
    .get('/:id', zValidator('param', idParamSchema), async (context) => {
        const { id } = context.req.valid('param');

        const post = await prisma.post.findUnique({
            where: { id: Number(id) },
        });

        if (!post) {
            return context.jsonT(
                { message: 'There is no post with this id' },
                200,
            );
        }

        return context.jsonT(post);
    })
    /**
     * POST /
     */
    .post('/', zValidator('json', addPostJsonSchema), async (context) => {
        const { user }: JwtPayload = context.get('jwtPayload');
        const { title, content } = context.req.valid('json');

        const result = await prisma.post.create({
            data: {
                title,
                content,
                author: { connect: { email: user.email } },
            },
        });

        return context.jsonT(result);
    })
    /**
     * DELETE /:id
     */
    .delete('/:id', zValidator('param', idParamSchema), async (context) => {
        const { user }: JwtPayload = context.get('jwtPayload');
        const { id } = context.req.valid('param');

        const post = await prisma.post.delete({
            where: { id: Number(id), authorId: user.id },
        });

        return context.jsonT(post);
    });
