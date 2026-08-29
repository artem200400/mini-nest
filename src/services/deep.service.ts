import {
    Injectable
} from '../decorators/injectable.js'

import {
    DeepRepository
} from './deep.repository.js'

@Injectable()
export class DeepService {
    constructor(
        private readonly repository:
            DeepRepository
    ) { }

    getRequestId() {
        return this.repository.getRequestId()
    }
}