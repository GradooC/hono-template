import { object, string } from 'zod';

export const addPostJsonSchema = object({
    title: string(),
    content: string().optional(),
});
