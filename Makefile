up:
	sudo docker compose -f docker-compose.yml down
	sudo docker compose -f docker-compose.yml up --build 
	sudo docker image prune -f

down:
	sudo docker compose -f docker-compose.yml down
	sudo docker image prune -f

restart:
	make down
	make up

upwithlogs:
	@sudo docker compose -f docker-compose.yml up --build -d
	@sudo docker image prune -f
	@trap 'echo "\nShutting down..."; sudo docker compose down; sudo docker image prune -f' INT EXIT; \
	sudo docker compose logs -f api-gateway user-service monitor-service worker

lint:
	prettier --write "./API_GATEWAY/src/**/*.ts" "./MONITOR_SERVICE/src/**/*.ts" "./USER_SERVICE/src/**/*.ts" "./USER_SERVICE/__test__/*/*.ts" "./WORKER/src/**/*.ts"




