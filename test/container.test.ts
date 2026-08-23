import 'reflect-metadata'
import { describe, it, expect } from 'vitest'
import { Injectable } from '../src/decorators/injectable.js'
import { Inject } from '../src/decorators/inject.js'
import { container } from '../src/container.js'

@Injectable()
class C { }

@Injectable()
class B {
    constructor(public c: C) { }
}

@Injectable()
class A {
    constructor(public b: B) { }
}
describe('Container', () => {
    it('resolves recursive dependency graph A -> B -> C', () => {
        const app = new container()

        const result = app.resolve(A)

        expect(result).toBeInstanceOf(A)
        expect(result.b).toBeInstanceOf(B)
        expect(result.b.c).toBeInstanceOf(C)
    })
})


it('returns the same instance for singleton', () => {
    @Injectable()
    class X { }

    const app = new container()

    const first = app.resolve(X)
    const second = app.resolve(X)

    expect(first).toBe(second)
})


it('returns a new instance for transient scope', () => {
    @Injectable({ scope: 'transient' })
    class TransientService { }

    const app = new container()

    const first = app.resolve(TransientService)
    const second = app.resolve(TransientService)

    expect(first).not.toBe(second)
})


it('throws a readable error for circular dependencies', () => {
    @Injectable()
    class CycleA { }

    @Injectable()
    class CycleB { }

    Reflect.defineMetadata('design:paramtypes', [CycleB], CycleA)
    Reflect.defineMetadata('design:paramtypes', [CycleA], CycleB)

    const app = new container()

    expect(() => app.resolve(CycleA))
        .toThrow(/CycleA -> CycleB -> CycleA/)
})


it('resolves dependency by Inject token', () => {
    const CONFIG = Symbol.for('CONFIG')

    const config = {
        apiUrl: 'https://example.com'
    }

    @Injectable()
    class ConfigService {
        constructor(@Inject(CONFIG) public config: object) { }
    }

    const app = new container()

    app.register(CONFIG, config)

    const result = app.resolve(ConfigService)

    expect(result.config).toBe(config)
})
