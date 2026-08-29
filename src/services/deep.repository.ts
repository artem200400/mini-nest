import {
    Injectable
} from '../decorators/injectable.js'

import {
    requestContext
} from '../context/request-context.js'

@Injectable()
export class DeepRepository {
    getRequestId() {
        return requestContext.getRequestId()
    }
}