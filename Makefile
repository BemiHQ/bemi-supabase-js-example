init:
	devbox install

install:
	devbox run --env-file ./server/.env "bun install && \
		cd server && pnpm install && \
		cd ../client && bun install"

up: install
	devbox run "bun run concurrently \"make up-server\" \"make up-client\""

up-server:
	devbox run --env-file ./server/.env "cd server && pnpm supabase functions serve --no-verify-jwt"

up-client:
	devbox run "cd client && PORT=4002 bun run react-scripts start"

up-services:
	devbox run --env-file ./server/.env "cd server && pnpm supabase start"

down-services:
	devbox run --env-file ./server/.env "cd server && pnpm supabase stop"

ps:
	devbox run --env-file ./server/.env "cd server && pnpm supabase status"

sh:
	devbox --env-file ./server/.env shell

migrate:
	devbox run --env-file ./server/.env "cd server && pnpm supabase migration up"
