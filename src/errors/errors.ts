export class NotFoundError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'NotFoundError'
    }
}

export type ValidationIssue = {
    field: string
    message: string
}

export class ValidationError extends Error {
    constructor(
        public readonly issues: ValidationIssue[]
    ) {
        super('Validation failed')
        this.name = 'ValidationError'
    }
}