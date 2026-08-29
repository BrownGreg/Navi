# Dockerfile — ai-service (FastAPI), tout le backend Navi.

FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN addgroup --system --gid 1001 aiservice \
  && adduser --system --uid 1001 --gid 1001 aiservice \
  && mkdir -p /data && chown aiservice:aiservice /data \
  && chown -R aiservice:aiservice /app

USER aiservice
EXPOSE 8000

# /data : volume monte pour la persistance SQLite (voir AI_SERVICE_DATABASE_URL
# dans docker-compose.yml), pour survivre aux redemarrages du conteneur. /app
# est aussi chown vers aiservice (ci-dessus) car sans volume monte (ex: Render
# sans AI_SERVICE_DATABASE_URL renseignee), config.py retombe sur son defaut
# relatif sqlite:///./navi.db, resolu dans /app - qui doit rester writable par
# l'utilisateur non-root.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
