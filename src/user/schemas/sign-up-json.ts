import { object, string } from 'zod';

export const signUpJsonSchema = object({
    email: string().email(),
    password: string().min(6),
    name: string().optional(),
});
