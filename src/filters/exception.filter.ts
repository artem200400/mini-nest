import type {
    ServerResponse
} from 'node:http'

import {
    NotFoundError,
    ValidationError
} from '../errors/errors.js'

function sendJson(
    res: ServerResponse,
    statusCode: number,
    body: unknown
) {
    res.statusCode = statusCode

    res.setHeader(
        'content-type',
        'application/json; charset=utf-8'
    )

    res.end(
        JSON.stringify(body)
    )
}

export class ExceptionFilter {
    catch(
        error: unknown,
        res: ServerResponse
    ) {
        if (
            error instanceof NotFoundError
        ) {
            sendJson(
                res,
                404,
                {
                    message: error.message
                }
            )

            return
        }

        if (
            error instanceof ValidationError
        ) {
            sendJson(
                res,
                400,
                {
                    errors: error.issues
                }
            )

            return
        }

        sendJson(
            res,
            500,
            {
                message:
                    'Internal server error'
            }
        )
    }
}