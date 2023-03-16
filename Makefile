init:
	docker compose run --rm app bash -c 'sh entrypoints/make/init.sh --target $(TARGET)'

build:
	docker compose run --rm app bash -c 'sh entrypoints/make/build.sh --target $(TARGET)'

plan:
	# docker compose --rm run app bash -c 'cd src/$(TARGET) && yarn upgrade aws-cdk-modules'
	docker compose --rm run app bash -c 'sh entrypoints/make/deploy.sh --target $(TARGET) --environment $(ENV) --command diff'

deploy:
	docker compose --rm run app bash -c 'sh entrypoints/make/deploy.sh --target $(TARGET) --environment $(ENV) --command deploy'

clean:
	docker compose --rm run app bash -c 'sh entrypoints/make/clean.sh'
	docker compose down
	docker system prune -a -f --volumes
