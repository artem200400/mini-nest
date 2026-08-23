import 'reflect-metadata'

type HttpMethod = 'GET' | 'POST'

function Route(method: HttpMethod, path: string) {
    return function (
        target: object,
        propertyKey: string | symbol
    ) {
        Reflect.defineMetadata(
            'route',
            { method, path },
            target,
            propertyKey
        )
    }
}

export function Get(path: string = '') {
    return Route('GET', path)
}

export function Post(path: string = '') {
    return Route('POST', path)
}