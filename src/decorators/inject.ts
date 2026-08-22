
export function Inject(token: string | symbol) {
    return function sss(target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
        const existingTokens = Reflect.getMetadata('inject:tokens', target) ?? []
        existingTokens[parameterIndex] = token
        Reflect.defineMetadata('inject:tokens', existingTokens, target)

    }

}