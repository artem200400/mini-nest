## HTTP decorators

`@Controller()` зберігає базовий шлях контролера у metadata, а `@Get()` і `@Post()` зберігають HTTP-метод та шлях конкретного методу.

Параметр-декоратор знає, куди підставити значення, завдяки `parameterIndex`. Наприклад, у методі `getUser(@Param('id') id, @Query('limit') limit)` декоратор `@Param('id')` отримує індекс `0`, а `@Query('limit')` — індекс `1`. Декоратори лише зберігають цю інформацію у metadata. Пізніше dispatcher читає metadata, формує масив аргументів у правильному порядку та викликає метод контролера.

Dispatcher реалізований на стандартному `node:http` без Express, Fastify або NestJS. Він знаходить маршрут через Router, отримує controller через IoC container з Part 1, будує аргументи для `@Param`, `@Query` та `@Body`, запускає validation pipe і серіалізує результат у JSON.

DTO validation реалізована через `class-validator` та `class-transformer`. Plain JSON body перетворюється на instance DTO перед викликом handler.
