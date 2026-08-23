import 'reflect-metadata'

import type {
    IncomingMessage,
    ServerResponse
} from 'node:http'

import { Router } from './router.js'
import { container } from './container.js'

import {
    ValidationException,
    ValidationPipe
} from './pipes/validation.pipe.js'

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

    res.end(JSON.stringify(data))
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
        Buffer.concat(chunks).toString('utf8')

    if (!text) {
        return {}
    }

    return JSON.parse(text)
}

function shouldValidate(
    metatype: any
): boolean {
    if (!metatype) {
        return false
    }

    const ignoredTypes = [
        String,
        Number,
        Boolean,
        Object,
        Array
    ]

    return !ignoredTypes.includes(metatype)
}

export function createDispatcher(
    router: Router,
    appContainer: container
) {
    const validationPipe =
        new ValidationPipe()

    async function dispatch(
        req: IncomingMessage,
        res: ServerResponse
    ) {
        try {
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
                        message: 'Route not found'
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

            const paramTypes: any[] =
                Reflect.getMetadata(
                    'design:paramtypes',
                    prototype,
                    route.handlerName
                ) ?? []

            const args =
                new Array(paramTypes.length)

            let parsedBody: unknown = undefined

            for (
                const [indexText, metadata]
                of Object.entries(paramMetadata)
            ) {
                const index = Number(indexText)

                if (metadata.type === 'param') {
                    if (metadata.name) {
                        args[index] =
                            params[metadata.name]
                    }
                }

                if (metadata.type === 'query') {
                    if (metadata.name) {
                        args[index] =
                            url.searchParams.get(
                                metadata.name
                            )
                    }
                }

                if (metadata.type === 'body') {
                    if (parsedBody === undefined) {
                        parsedBody =
                            await readBody(req)
                    }

                    const metatype =
                        paramTypes[index]

                    if (
                        shouldValidate(metatype)
                    ) {
                        args[index] =
                            await validationPipe.transform(
                                parsedBody,
                                metatype
                            )
                    } else {
                        args[index] =
                            parsedBody
                    }
                }
            }

            const handler =
                controller[
                route.handlerName
                ]

            const result =
                await handler.apply(
                    controller,
                    args
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
            if (
                error
                instanceof ValidationException
            ) {
                sendJson(
                    res,
                    400,
                    {
                        errors: error.errors
                    }
                )

                return
            }

            if (
                error instanceof SyntaxError
            ) {
                sendJson(
                    res,
                    400,
                    {
                        message:
                            'Invalid JSON body'
                    }
                )

                return
            }

            sendJson(
                res,
                500,
                {
                    message:
                        'Internal server error'
                }
            )
        }
    }

    return (
        req: IncomingMessage,
        res: ServerResponse
    ) => {
        void dispatch(req, res)
    }
}