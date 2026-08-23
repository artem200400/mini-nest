import {
    validate,
    type ValidationError
} from 'class-validator'

import {
    plainToInstance
} from 'class-transformer'

type Constructor<T extends object = any> =
    new (...args: any[]) => T

export type ValidationDetail = {
    field: string
    constraints: Record<string, string>
}

export class ValidationException extends Error {
    constructor(
        public readonly errors: ValidationDetail[]
    ) {
        super('Validation failed')
    }
}

export class ValidationPipe {
    async transform(
        value: unknown,
        metatype: Constructor
    ) {
        const instance =
            plainToInstance(
                metatype,
                value as object
            )

        const errors: ValidationError[] =
            await validate(instance)

        if (errors.length > 0) {
            const details: ValidationDetail[] =
                errors.map((error) => ({
                    field: error.property,

                    constraints:
                        error.constraints ?? {}
                }))

            throw new ValidationException(details)
        }

        return instance
    }
}