include .env.makefile

init:
	docker compose run --rm app bash -c 'bash entrypoints/make/init.sh --target $(TARGET)'

build:
	docker compose run --rm app bash -c 'bash entrypoints/make/build.sh --target $(TARGET)'

bash:
	docker compose run --rm app bash

bootstrap:
	docker compose run --rm app bash -c 'bash entrypoints/make/deploy.sh --target $(TARGET) --command bootstrap --profile $(PROFILE)'

plan:
	docker compose run --rm app bash -c 'bash entrypoints/make/deploy.sh --target $(TARGET) --environment $(ENV) --command diff --profile $(PROFILE)'

deploy:
	docker compose run --rm app bash -c 'bash entrypoints/make/deploy.sh --target $(TARGET) --environment $(ENV) --command deploy --profile $(PROFILE)'

clean:
	docker compose run --rm app bash -c 'bash entrypoints/make/clean.sh'
	docker compose down
	docker system prune -a -f --volumes
