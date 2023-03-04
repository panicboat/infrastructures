build:
	docker compose build
	docker compose run app bash -c 'sh entrypoints/make/build.sh --target $(TARGET)'

init:
	docker compose run app bash -c 'sh entrypoints/make/init.sh --target $(TARGET)'

plan:
	docker compose run app bash -c 'sh entrypoints/make/deploy.sh --target $(TARGET) --environment $(ENV) --command diff'

deploy:
	docker compose run app bash -c 'sh entrypoints/make/deploy.sh --target $(TARGET) --environment $(ENV) --command deploy'

clean:
	docker compose run app bash -c 'sh entrypoints/make/clean.sh'
	docker compose down
	docker system prune -a -f --volumes
