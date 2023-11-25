declare module 'bun' {
    interface Env {
        JWT_ACCESS_TOKEN_SECRET: string;
        JWT_REFRESH_TOKEN_SECRET: string;
    }
}
