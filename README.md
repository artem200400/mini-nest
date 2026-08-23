# mini-nest

A small custom IoC container and HTTP framework inspired by NestJS.

This project demonstrates how dependency injection, decorators, routing, HTTP dispatching and DTO validation work under the hood using TypeScript, `reflect-metadata` and the standard `node:http` module.

## Features

### Part 1 — IoC Container

- `@Injectable()` decorator
- Recursive dependency resolution through `design:paramtypes`
- Singleton scope by default
- Transient scope with `@Injectable({ scope: 'transient' })`
- `@Inject(token)` for string and symbol tokens
- Manual provider registration
- Circular dependency detection
- IoC container based on runtime metadata

### Part 2 — HTTP Layer

- `@Controller(prefix)` decorator
- `@Get(path)` decorator
- `@Post(path)` decorator
- `@Param(name)` parameter decorator
- `@Query(name)` parameter decorator
- `@Body()` parameter decorator
- Router built from decorator metadata
- Dynamic route parameters such as `/users/:id`
- Dispatcher based on standard `node:http`
- JSON body parsing
- JSON responses
- HTTP 404 handling
- DTO transformation
- DTO validation
- HTTP 400 validation responses
- Integration with the IoC container from Part 1
- Vitest tests
- Docker support

## Requirements

- Node.js 22+
- TypeScript 6.x
- Docker Desktop

## Install

```bash
npm install
```
