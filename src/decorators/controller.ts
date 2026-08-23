import 'reflect-metadata'
export function Controller(prefix: string) {
    return function (target: Function) {
        Reflect.defineMetadata('controller:prefix', prefix, target)
    }
}