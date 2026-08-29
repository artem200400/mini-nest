import type {
    IncomingMessage
} from 'node:http'

export class AuthGuard {
    canActivate(
        req: IncomingMessage
    ): boolean {
        const authorization =
            req.headers.authorization

        return Boolean(authorization)
    }
}