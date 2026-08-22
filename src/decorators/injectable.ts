
import "reflect-metadata";
type scope = 'singleton' | 'transient'
type Something = {
    scope: scope

}
export function Injectable(type?: Something) {
    let currentScope: scope
    if (type) {
        currentScope = type.scope
    } else {
        currentScope = 'singleton'
    }
    return function forclass(target: Function) {
        Reflect.defineMetadata('Injectable', true, target)
        Reflect.defineMetadata('scope', currentScope, target)
    }
}