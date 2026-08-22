type Constructor = new (...args: any[]) => any
export class container {
    instances = new Map()
    providers = new Map()
    register(token: string | symbol, value: any) {
        this.providers.set(token, value)
    }
    resolve(Target: Constructor, path: Set<Constructor> = new Set()): any {

        let isInjectable = Reflect.getMetadata('Injectable', Target)
        const scope = Reflect.getMetadata('scope', Target)
        if (isInjectable) {

        } else {
            throw new Error(`Class ${Target.name} is not marked with @Injectable()`);

        }
        if (this.instances.has(Target) && scope !== 'transient') {

            return this.instances.get(Target)
        }
        if (path.has(Target)) {
            let chain = [...path, Target]
            const chainNames = chain.map(cls => cls.name)
            const chainText = chainNames.join(" -> ")
            throw new Error(`Circular dependency detected: ${chainText}`)

        }
        path.add(Target)

        const injectTokens = Reflect.getMetadata('inject:tokens', Target) ?? []
        let paramTypes: Constructor[] = Reflect.getMetadata('design:paramtypes', Target) ?? []
        const dependencies = paramTypes.map((paramType, index) => {
            if (injectTokens[index]) {
                if (this.providers.has(injectTokens[index])) {
                    return this.providers.get(injectTokens[index])
                }
                else {
                    throw new Error(`No provider registered for token ${injectTokens[index]} `);
                }
            }
            else {
                return this.resolve(paramType, path)
            }

        })

        const instance = new Target(...dependencies)
        if (scope !== 'transient') {
            this.instances.set(Target, instance)
        }
        path.delete(Target)

        return instance

    }
}