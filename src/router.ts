import 'reflect-metadata'

type Constructor = new (...args: any[]) => any

type RouteInfo = {
    method: 'GET' | 'POST'
    path: string
    handlerName: string
    Controller: Constructor
}

export class Router {
    routes: RouteInfo[] = []

    registerController(Controller: Constructor) {
        const prefix =
            Reflect.getMetadata('controller:prefix', Controller) ?? ''

        const prototype = Controller.prototype

        const methodNames =
            Object.getOwnPropertyNames(prototype)

        for (const methodName of methodNames) {
            const route = Reflect.getMetadata(
                'route',
                prototype,
                methodName
            )

            if (route) {
                const cleanPrefix = prefix.replace(/^\/+|\/+$/g, '')
                const cleanPath = route.path.replace(/^\/+|\/+$/g, '')

                const fullPath =
                    '/' + [cleanPrefix, cleanPath]
                        .filter(Boolean)
                        .join('/')

                this.routes.push({
                    method: route.method,
                    path: fullPath,
                    handlerName: methodName,
                    Controller
                })
            }
        }
    }

    findRoute(method: string, pathname: string) {
        for (const route of this.routes) {
            if (route.method !== method) {
                continue
            }

            const routeParts = route.path.split('/')
            const pathParts = pathname.split('/')

            if (routeParts.length !== pathParts.length) {
                continue
            }

            const params: Record<string, string> = {}
            let matched = true

            for (let i = 0; i < routeParts.length; i++) {
                const routePart = routeParts[i]!
                const pathPart = pathParts[i]!

                if (routePart.startsWith(':')) {
                    const paramName = routePart.slice(1)

                    params[paramName] = decodeURIComponent(pathPart)
                } else if (routePart !== pathPart) {
                    matched = false
                    break
                }
            }

            if (matched) {
                return {
                    route,
                    params
                }
            }
        }

        return undefined
    }
}