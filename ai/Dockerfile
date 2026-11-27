FROM python:3.12-slim
WORKDIR /srv
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
# Trained model bundles from the ml/ export step are baked into the image.
# (docker-compose mounts ./artifacts over this for local runs.)
COPY artifacts /models
ENV MODEL_DIR=/models
EXPOSE 8000
# Hosts such as Railway assign PORT; 8000 locally.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
