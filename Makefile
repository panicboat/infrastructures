build:
	docker compose build
	docker compose run aws-cdk bash -c 'sh entrypoints/make/build.sh'

bash:
	docker compose run aws-cdk bash

init:
	docker compose run aws-cdk bash -c 'sh entrypoints/make/init.sh --target $(TARGET)'

deploy:
	docker compose run aws-cdk bash -c 'sh entrypoints/make/deploy.sh --target $(TARGET) --environment $(ENV)'

clean:
	docker compose down
	docker system prune -a -f --volumes
