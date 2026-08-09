.PHONY: start-services stop-services setup-backend run-backend run-worker

start-services:
	docker-compose up -d

stop-services:
	docker-compose down

setup-backend:
	cd backend && pip install -r requirements.txt && python manage.py migrate

run-backend:
	cd backend && python manage.py runserver

run-worker:
	cd backend && celery -A backend worker -l info

run-frontend:
	cd frontend && npm run dev
