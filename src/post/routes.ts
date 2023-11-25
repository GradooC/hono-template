import { Hono } from 'hono';
import { prisma } from '../db';
import { zValidator } from '@hono/zod-validator';
import { addPostJsonSchema } from './schemas/add-post-json';
import { idParamSchema } from './schemas/id-param';
import { JwtPayload } from '../types/jwt';

const postRouter = new Hono();

postRouter.get('/feed', async (context) => {
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

    return context.json(posts);
});

postRouter.get('/:id', zValidator('param', idParamSchema), async (context) => {
    const { id } = context.req.valid('param');

    const post = await prisma.post.findUnique({
        where: { id: Number(id) },
    });

    return context.json(post);
});

postRouter.post('/', zValidator('json', addPostJsonSchema), async (context) => {
    const { user }: JwtPayload = context.get('jwtPayload');
    const { title, content } = context.req.valid('json');

    const result = await prisma.post.create({
        data: {
            title,
            content,
            author: { connect: { email: user.email } },
        },
    });

    return context.json(result);
});

postRouter.put(
    '/publish/:id',
    zValidator('param', idParamSchema),
    async (context) => {
        const { id } = context.req.valid('param');

        const post = await prisma.post.update({
            where: { id: Number(id) },
            data: { published: true },
        });

        return context.json(post);
    }
);

postRouter.delete(
    '/:id',
    zValidator('param', idParamSchema),
    async (context) => {
        const { id } = context.req.valid('param');

        const post = await prisma.post.delete({
            where: { id: Number(id) },
        });

        return context.json(post);
    }
);

export { postRouter };
