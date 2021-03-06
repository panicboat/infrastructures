build:
	docker compose build
	docker compose run aws-cdk bash -c 'sh entrypoints/make/build.sh'

bash:
	docker compose run aws-cdk bash

init:
	docker compose run aws-cdk bash -c 'sh entrypoints/make/init.sh --target $(TARGET)'

diff:
	docker compose run aws-cdk bash -c 'sh entrypoints/make/deploy.sh --target $(TARGET) --environment $(ENV) --command diff'

deploy:
	docker compose run aws-cdk bash -c 'sh entrypoints/make/deploy.sh --target $(TARGET) --environment $(ENV) --command deploy'

clean:
	docker compose down
	docker system prune -a -f --volumes
