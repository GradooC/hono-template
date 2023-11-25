import { string, object } from 'zod';

export const idParamSchema = object({
    id: string().regex(/^\d+$/),
});
