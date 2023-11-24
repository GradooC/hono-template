import { object, string } from 'zod';

export const addPostJsonSchema = object({
    title: string(),
    authorEmail: string().email(),
    content: string().optional(),
});
