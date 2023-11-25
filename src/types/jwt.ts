export type JwtPayload = {
    user: { email: string; id: number };
    exp: number;
};
