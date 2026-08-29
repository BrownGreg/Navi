# Dockerfile — ai-service (FastAPI), tout le backend Navi.

FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN addgroup --system --gid 1001 aiservice \
  && adduser --system --uid 1001 --gid 1001 aiservice \
  && mkdir -p /data && chown aiservice:aiservice /data

USER aiservice
EXPOSE 8000

# /data : volume monte pour la persistance SQLite (voir AI_SERVICE_DATABASE_URL
# dans docker-compose.yml), pour survivre aux redemarrages du conteneur.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
