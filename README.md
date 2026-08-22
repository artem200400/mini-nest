# mini-nest

A small custom IoC container inspired by NestJS.

This project demonstrates how dependency injection works under the hood using TypeScript decorators and `reflect-metadata`.

## Features

- `@Injectable()` decorator
- Recursive dependency resolution through `design:paramtypes`
- Singleton scope by default
- Transient scope with `@Injectable({ scope: 'transient' })`
- `@Inject(token)` for string and symbol tokens
- Manual provider registration
- Circular dependency detection
- Vitest tests
- Docker support

## Requirements

- Node.js 22+
- TypeScript 6.x
- Docker Desktop

## Install

```bash
npm install