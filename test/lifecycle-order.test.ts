import 'reflect-metadata'

import {
    afterAll,
    beforeAll,
    describe,
    expect,
    test,
    vi
} from 'vitest'

import {
    createServer,
    type Server
} from 'node:http'

import {
    Injectable
} from '../src/decorators/injectable.js'

import {
    Controller
} from '../src/decorators/controller.js'

import {
    Get,
    Post
} from '../src/decorators/methods.js'

import {
    Body
} from '../src/decorators/params.js'

import type {
    CreateUserDto
} from '../src/dto/create-user.dto.js'

import {
    Router
} from '../src/router.js'

import {
    createDispatcher
} from '../src/dispatcher.js'

import {
    container
} from '../src/container.js'

import {
    NotFoundError
} from '../src/errors/errors.js'

import {
    DeepService
} from '../src/services/deep.service.js'


@Injectable()
@Controller('lifecycle')
class LifecycleController {
    handlerCalls = 0

    constructor(
        private readonly service:
            DeepService
    ) { }


    @Post('order')
    order(
        @Body()
        body: CreateUserDto
    ) {
        return {
            email: body.email
        }
    }


    @Get('guard')
    guardTest() {
        this.handlerCalls++

        return {
            ok: true
        }
    }


    @Get('request-id')
    requestId() {
        return {
            requestId:
                this.service.getRequestId()
        }
    }


    @Get('boom')
    boom() {
        throw new Error('boom')
    }


    @Get('missing')
    missing() {
        throw new NotFoundError(
            'User was not found'
        )
    }
}


describe(
    'request lifecycle',
    () => {
        const router =
            new Router()

        const appContainer =
            new container()

        const lifecycle: string[] = []

        let server: Server
        let baseUrl: string


        beforeAll(
            async () => {
                router.registerController(
                    LifecycleController
                )

                server = createServer(
                    createDispatcher(
                        router,
                        appContainer,
                        lifecycle
                    )
                )

                await new Promise<void>(
                    (resolve) => {
                        server.listen(
                            0,
                            resolve
                        )
                    }
                )

                const address =
                    server.address()

                if (
                    !address ||
                    typeof address === 'string'
                ) {
                    throw new Error(
                        'Server address is not available'
                    )
                }

                baseUrl =
                    `http://127.0.0.1:${address.port}`
            }
        )


        afterAll(
            async () => {
                await new Promise<void>(
                    (
                        resolve,
                        reject
                    ) => {
                        server.close(
                            (error) => {
                                if (error) {
                                    reject(error)
                                } else {
                                    resolve()
                                }
                            }
                        )
                    }
                )
            }
        )


        test(
            'runs lifecycle in exact order',
            async () => {
                lifecycle.length = 0

                const response =
                    await fetch(
                        `${baseUrl}/lifecycle/order`,
                        {
                            method: 'POST',

                            headers: {
                                Authorization:
                                    'Bearer test',

                                'content-type':
                                    'application/json'
                            },

                            body: JSON.stringify({
                                email:
                                    'order@example.com'
                            })
                        }
                    )

                expect(
                    response.status
                ).toBe(201)

                expect(
                    lifecycle
                ).toEqual([
                    'middleware',
                    'guard',
                    'interceptor:before',
                    'pipe',
                    'handler',
                    'interceptor:after'
                ])
            }
        )


        test(
            'guard blocks before handler',
            async () => {
                const controller =
                    appContainer.resolve(
                        LifecycleController
                    )

                const before =
                    controller.handlerCalls

                const response =
                    await fetch(
                        `${baseUrl}/lifecycle/guard`
                    )

                expect(
                    response.status
                ).toBe(403)

                expect(
                    controller.handlerCalls
                ).toBe(before)
            }
        )


        test(
            'unexpected error becomes safe 500',
            async () => {
                const response =
                    await fetch(
                        `${baseUrl}/lifecycle/boom`,
                        {
                            headers: {
                                Authorization:
                                    'Bearer test'
                            }
                        }
                    )

                expect(
                    response.status
                ).toBe(500)

                const text =
                    await response.text()

                expect(text)
                    .not
                    .toMatch(
                        /boom|at .*\.ts:/i
                    )
            }
        )


        test(
            'NotFoundError becomes 404',
            async () => {
                const response =
                    await fetch(
                        `${baseUrl}/lifecycle/missing`,
                        {
                            headers: {
                                Authorization:
                                    'Bearer test'
                            }
                        }
                    )

                expect(
                    response.status
                ).toBe(404)

                const data =
                    await response.json()

                expect(
                    data.message
                ).toMatch(/not found/i)
            }
        )


        test(
            'returns client X-Request-Id',
            async () => {
                const requestId =
                    'my-request-id-123'

                const response =
                    await fetch(
                        `${baseUrl}/lifecycle/request-id`,
                        {
                            headers: {
                                Authorization:
                                    'Bearer test',

                                'X-Request-Id':
                                    requestId
                            }
                        }
                    )

                expect(
                    response.headers.get(
                        'x-request-id'
                    )
                ).toBe(requestId)

                const data =
                    await response.json()

                expect(
                    data.requestId
                ).toBe(requestId)
            }
        )


        test(
            'generated request id reaches deep service',
            async () => {
                const response =
                    await fetch(
                        `${baseUrl}/lifecycle/request-id`,
                        {
                            headers: {
                                Authorization:
                                    'Bearer test'
                            }
                        }
                    )

                const responseId =
                    response.headers.get(
                        'x-request-id'
                    )

                expect(
                    responseId
                ).toBeTruthy()

                const data =
                    await response.json()

                expect(
                    data.requestId
                ).toBe(responseId)
            }
        )


        test(
            'parallel requests do not mix request ids',
            async () => {
                const ids =
                    Array.from(
                        {
                            length: 10
                        },
                        (_, index) =>
                            `request-${index}`
                    )

                const responses =
                    await Promise.all(
                        ids.map(
                            async (
                                requestId
                            ) => {
                                const response =
                                    await fetch(
                                        `${baseUrl}/lifecycle/request-id`,
                                        {
                                            headers: {
                                                Authorization:
                                                    'Bearer test',

                                                'X-Request-Id':
                                                    requestId
                                            }
                                        }
                                    )

                                const data =
                                    await response.json()

                                return {
                                    sent:
                                        requestId,

                                    header:
                                        response.headers.get(
                                            'x-request-id'
                                        ),

                                    body:
                                        data.requestId
                                }
                            }
                        )
                    )

                for (
                    const result
                    of responses
                ) {
                    expect(
                        result.header
                    ).toBe(
                        result.sent
                    )

                    expect(
                        result.body
                    ).toBe(
                        result.sent
                    )
                }
            }
        )


        test(
            'logging interceptor prints duration in ms',
            async () => {
                const spy =
                    vi.spyOn(
                        console,
                        'log'
                    )

                await fetch(
                    `${baseUrl}/lifecycle/request-id`,
                    {
                        headers: {
                            Authorization:
                                'Bearer test'
                        }
                    }
                )

                const output =
                    spy.mock.calls
                        .flat()
                        .join(' ')

                expect(
                    output
                ).toMatch(
                    /GET \/lifecycle\/request-id.*[0-9]+(\.[0-9]+)? ?ms/
                )

                spy.mockRestore()
            }
        )
    }
)