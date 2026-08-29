import 'reflect-metadata'

import {
    randomUUID
} from 'node:crypto'

import type {
    IncomingMessage,
    ServerResponse
} from 'node:http'

import {
    Router
} from './router.js'

import {
    container
} from './container.js'

import {
    AuthGuard
} from './guards/auth.guard.js'

import {
    LoggingInterceptor
} from './interceptors/logging.interceptor.js'

import {
    ZodValidationPipe
} from './pipes/zod-validation.pipe.js'

import {
    ExceptionFilter
} from './filters/exception.filter.js'

import {
    requestContext
} from './context/request-context.js'

import {
    CreateUserSchema
} from './dto/create-user.dto.js'


type ParamMetadata = {
    type: 'body' | 'param' | 'query'
    name?: string
}


function sendJson(
    res: ServerResponse,
    statusCode: number,
    data: unknown
) {
    res.statusCode = statusCode

    res.setHeader(
        'content-type',
        'application/json; charset=utf-8'
    )

    res.end(
        JSON.stringify(data)
    )
}


async function readBody(
    req: IncomingMessage
): Promise<unknown> {
    const chunks: Buffer[] = []

    for await (const chunk of req) {
        chunks.push(
            Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk)
        )
    }

    if (chunks.length === 0) {
        return {}
    }

    const text =
        Buffer.concat(chunks)
            .toString('utf8')

    if (!text) {
        return {}
    }

    return JSON.parse(text)
}


export function createDispatcher(
    router: Router,
    appContainer: container,
    lifecycle?: string[]
) {
    const guard =
        new AuthGuard()

    const interceptor =
        new LoggingInterceptor()

    const validationPipe =
        new ZodValidationPipe()

    const exceptionFilter =
        new ExceptionFilter()


    async function handleRequest(
        req: IncomingMessage,
        res: ServerResponse
    ) {
        const requestIdHeader =
            req.headers['x-request-id']

        const requestId =
            typeof requestIdHeader === 'string'
                ? requestIdHeader
                : randomUUID()

        res.setHeader(
            'x-request-id',
            requestId
        )


        await requestContext.run(
            requestId,
            async () => {
                try {
                    lifecycle?.push('middleware')

                    const method =
                        req.method ?? 'GET'

                    const url =
                        new URL(
                            req.url ?? '/',
                            'http://localhost'
                        )

                    const found =
                        router.findRoute(
                            method,
                            url.pathname
                        )

                    if (!found) {
                        sendJson(
                            res,
                            404,
                            {
                                message:
                                    'Route not found'
                            }
                        )

                        return
                    }


                    lifecycle?.push('guard')

                    const allowed =
                        guard.canActivate(req)

                    if (!allowed) {
                        sendJson(
                            res,
                            403,
                            {
                                message:
                                    'Forbidden'
                            }
                        )

                        return
                    }


                    const {
                        route,
                        params
                    } = found


                    const controller =
                        appContainer.resolve(
                            route.Controller
                        )


                    const prototype =
                        route.Controller.prototype


                    const paramMetadata:
                        Record<number, ParamMetadata> =
                        Reflect.getMetadata(
                            'route:params',
                            prototype,
                            route.handlerName
                        ) ?? {}


                    const args: unknown[] = []

                    let parsedBody:
                        unknown = undefined


                    const executeHandler =
                        async () => {

                            for (
                                const [
                                    indexText,
                                    metadata
                                ]
                                of Object.entries(
                                    paramMetadata
                                )
                            ) {
                                const index =
                                    Number(indexText)

                                if (
                                    metadata.type
                                    === 'param'
                                ) {
                                    if (
                                        metadata.name
                                    ) {
                                        args[index] =
                                            params[
                                            metadata.name
                                            ]
                                    }
                                }


                                if (
                                    metadata.type
                                    === 'query'
                                ) {
                                    if (
                                        metadata.name
                                    ) {
                                        args[index] =
                                            url.searchParams
                                                .get(
                                                    metadata.name
                                                )
                                    }
                                }


                                if (
                                    metadata.type
                                    === 'body'
                                ) {
                                    if (
                                        parsedBody
                                        === undefined
                                    ) {
                                        parsedBody =
                                            await readBody(
                                                req
                                            )
                                    }

                                    lifecycle?.push(
                                        'pipe'
                                    )

                                    args[index] =
                                        validationPipe
                                            .transform(
                                                parsedBody,
                                                CreateUserSchema
                                            )
                                }
                            }


                            lifecycle?.push(
                                'handler'
                            )

                            const handler =
                                controller[
                                route.handlerName
                                ]

                            return await handler.apply(
                                controller,
                                args
                            )
                        }


                    const result =
                        await interceptor.intercept(
                            req,
                            executeHandler,
                            lifecycle
                        )


                    const statusCode =
                        method === 'POST'
                            ? 201
                            : 200


                    sendJson(
                        res,
                        statusCode,
                        result
                    )
                } catch (error) {
                    exceptionFilter.catch(
                        error,
                        res
                    )
                }
            }
        )
    }


    return (
        req: IncomingMessage,
        res: ServerResponse
    ) => {
        void handleRequest(
            req,
            res
        )
    }
}