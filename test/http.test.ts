import 'reflect-metadata'

import {
    afterAll,
    beforeAll,
    describe,
    expect,
    test
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
    Body,
    Param,
    Query
} from '../src/decorators/params.js'

import {
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


@Injectable()
class UsersService {
    value = 'users-service'
}


@Injectable()
@Controller('users')
class UsersController {
    lastBody: unknown

    constructor(
        public readonly usersService:
            UsersService
    ) { }

    @Get(':id')
    getUser(
        @Param('id')
        id: string
    ) {
        return {
            id
        }
    }

    @Get()
    getUsers(
        @Query('limit')
        limit: string
    ) {
        return {
            limit
        }
    }

    @Post()
    createUser(
        @Body()
        body: CreateUserDto
    ) {
        this.lastBody = body

        return {
            email: body.email,
            isDto:
                body instanceof CreateUserDto
        }
    }
}


describe(
    'HTTP decorators and dispatcher',
    () => {
        const router =
            new Router()

        const appContainer =
            new container()

        let server: Server
        let baseUrl: string

        beforeAll(
            async () => {
                router.registerController(
                    UsersController
                )

                server = createServer(
                    createDispatcher(
                        router,
                        appContainer
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

                const address = server.address()

                if (!address || typeof address === 'string') {
                    throw new Error('Server address is not available')
                }

                baseUrl = `http://127.0.0.1:${address.port}`
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
            'finds GET /users/:id route',
            async () => {
                const response =
                    await fetch(
                        `${baseUrl}/users/42`
                    )

                expect(
                    response.status
                ).toBe(200)

                const data =
                    await response.json()

                expect(data).toEqual({
                    id: '42'
                })
            }
        )


        test(
            '@Param injects route parameter',
            async () => {
                const response =
                    await fetch(
                        `${baseUrl}/users/777`
                    )

                const data =
                    await response.json()

                expect(data.id)
                    .toBe('777')
            }
        )


        test(
            '@Query injects query parameter',
            async () => {
                const response =
                    await fetch(
                        `${baseUrl}/users?limit=5`
                    )

                const data =
                    await response.json()

                expect(data.limit)
                    .toBe('5')
            }
        )


        test(
            'invalid DTO returns 400 with email error',
            async () => {
                const response =
                    await fetch(
                        `${baseUrl}/users`,
                        {
                            method: 'POST',

                            headers: {
                                'content-type':
                                    'application/json'
                            },

                            body: JSON.stringify({
                                email:
                                    'not-an-email'
                            })
                        }
                    )

                expect(
                    response.status
                ).toBe(400)

                const data =
                    await response.json()

                expect(
                    JSON.stringify(data)
                ).toMatch(/email/i)
            }
        )


        test(
            'valid body reaches handler',
            async () => {
                const response =
                    await fetch(
                        `${baseUrl}/users`,
                        {
                            method: 'POST',

                            headers: {
                                'content-type':
                                    'application/json'
                            },

                            body: JSON.stringify({
                                email:
                                    'test@example.com'
                            })
                        }
                    )

                expect(
                    response.status
                ).toBe(201)

                const data =
                    await response.json()

                expect(data.email)
                    .toBe(
                        'test@example.com'
                    )
            }
        )


        test(
            'handler receives CreateUserDto instance',
            async () => {
                const response =
                    await fetch(
                        `${baseUrl}/users`,
                        {
                            method: 'POST',

                            headers: {
                                'content-type':
                                    'application/json'
                            },

                            body: JSON.stringify({
                                email:
                                    'dto@example.com'
                            })
                        }
                    )

                const data =
                    await response.json()

                expect(data.isDto)
                    .toBe(true)
            }
        )


        test(
            'container injects singleton service into controller',
            () => {
                const controller =
                    appContainer.resolve(
                        UsersController
                    )

                const service =
                    appContainer.resolve(
                        UsersService
                    )

                expect(
                    controller.usersService
                ).toBe(service)
            }
        )
    }
)