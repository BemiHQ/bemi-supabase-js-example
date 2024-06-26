# Bemi Prisma Example

You can find a demo and detailed documentation here https://docs.bemi.io.

## System Dependencies

* Docker
  * Supabase
* Devbox
  * Bun (client)
  * Pnpm

## Installation

```
make init
make up-services
cp server/.env.sample server/.env
```

## Development

```
make install
make migrate
make up
```
