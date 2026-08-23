import 'reflect-metadata'

export function Param(name: string) {
    return function (
        target: object,
        propertyKey: string | symbol,
        parameterIndex: number
    ) {
        const existingParams =
            Reflect.getMetadata('route:params', target, propertyKey) ?? {}

        existingParams[parameterIndex] = {
            type: 'param',
            name: name
        }

        Reflect.defineMetadata(
            'route:params',
            existingParams,
            target,
            propertyKey
        )
    }

}
export function Query(name: string) {
    return function (
        target: object,
        propertyKey: string | symbol,
        parameterIndex: number
    ) {
        const existingParams =
            Reflect.getMetadata('route:params', target, propertyKey) ?? {}
        existingParams[parameterIndex] = {
            type: 'query',
            name: name
        }

        Reflect.defineMetadata(
            'route:params',
            existingParams,
            target,
            propertyKey
        )
    }
}
export function Body() {
    return function (
        target: object,
        propertyKey: string | symbol,
        parameterIndex: number
    ) {
        const existingParams =
            Reflect.getMetadata('route:params', target, propertyKey) ?? {}

        existingParams[parameterIndex] = {
            type: 'body'

        }

        Reflect.defineMetadata(
            'route:params',
            existingParams,
            target,
            propertyKey
        )
    }
}