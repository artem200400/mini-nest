import {
    z,
    type ZodType
} from 'zod'

import {
    ValidationError
} from '../errors/errors.js'

export class ZodValidationPipe {
    transform<T>(
        value: unknown,
        schema: ZodType<T>
    ): T {
        const result =
            schema.safeParse(value)

        if (!result.success) {
            throw new ValidationError(
                result.error.issues.map(
                    (issue) => ({
                        field:
                            issue.path.join('.'),
                        message:
                            issue.message
                    })
                )
            )
        }

        return result.data
    }
}