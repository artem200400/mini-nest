import type {
    IncomingMessage
} from 'node:http'

export class LoggingInterceptor {
    async intercept<T>(
        req: IncomingMessage,
        next: () => Promise<T>,
        lifecycle?: string[]
    ): Promise<T> {
        lifecycle?.push(
            'interceptor:before'
        )

        const start =
            performance.now()

        const result =
            await next()

        const duration =
            performance.now() - start

        lifecycle?.push(
            'interceptor:after'
        )

        const method =
            req.method ?? 'UNKNOWN'

        const pathname =
            new URL(
                req.url ?? '/',
                'http://localhost'
            ).pathname

        console.log(
            `${method} ${pathname} — ${duration.toFixed(1)} ms`
        )

        return result
    }
}