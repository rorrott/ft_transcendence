DC=docker-compose

all: build up

re: down clean all

build:
	docker-compose build --build-arg BUILD_DATE=$(shell date +%s)

up:
	@$(DC) up

down:
	@$(DC) down

clean:
	@docker stop $$(docker ps -qa) 2>/dev/null || true
	@docker rm $$(docker ps -qa) 2>/dev/null || true
	@docker rmi -f $$(docker images -qa) 2>/dev/null || true
	@docker volume rm $$(docker volume ls -q) 2>/dev/null || true
	@docker network rm $$(docker network ls -q | grep -v bridge | grep -v host | grep -v none) 2>/dev/null || true

exec:
	@echo "Available containers:"; \
	docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"; \
	echo ""; \
	read -p "Enter container ID or name: " container_name; \
	docker exec -it $$container_name /bin/sh

logs:
	@echo "Available containers:"; \
	docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"; \
	echo ""; \
	read -p "Enter container ID or name: " container_name; \
	docker logs -f $$container_name

.PHONY: all re build up down clean exec logs