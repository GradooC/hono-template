/**
 * Returns jwt token expiration time for hono/jwt middleware
 * @see https://github.com/honojs/hono/blob/main/src/utils/jwt/jwt.ts#L126
 *
 * @param hours number of hours of token life
 */
export function getExpirationTime(hours: number) {
    const time = (Date.now() + 1000 * 60 * 60 * hours) / 1000;
    return Math.floor(time);
}
