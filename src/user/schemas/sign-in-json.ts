import { object, string } from 'zod';

export const signInJsonSchema = object({
    email: string().email(),
    password: string().min(6),
});
