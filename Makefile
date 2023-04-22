init:
	docker compose run --rm app bash -c 'sh entrypoints/make/init.sh --target $(TARGET)'

build:
	docker compose run --rm app bash -c 'sh entrypoints/make/build.sh --target $(TARGET)'

bash:
	docker compose run --rm app bash

bootstrap:
	docker compose run --rm app bash -c 'sh entrypoints/make/deploy.sh --profile $(PROFILE) --target $(TARGET) --command bootstrap'

plan:
	docker compose run --rm app bash -c 'sh entrypoints/make/deploy.sh --profile $(PROFILE) --target $(TARGET) --environment $(ENV) --command diff'

deploy:
	docker compose run --rm app bash -c 'sh entrypoints/make/deploy.sh --profile $(PROFILE) --target $(TARGET) --environment $(ENV) --command deploy'

clean:
	docker compose run --rm app bash -c 'sh entrypoints/make/clean.sh'
	docker compose down
	docker system prune -a -f --volumes
