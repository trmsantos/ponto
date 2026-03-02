# Stage 1: Build frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend (Django)
FROM python:3.11-slim AS backend
WORKDIR /app

# System dependencies
# - default-libmysqlclient-dev for mysqlclient
# - unixodbc-dev for pyodbc (SQL Server)
# - libpq-dev for psycopg2
# - gcc/g++ for C extensions
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    pkg-config \
    unixodbc-dev \
    libpq-dev \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

# Copy application code
COPY . .

# Copy compiled frontend assets
COPY --from=frontend-builder /app/frontend/static/ ./frontend/static/

# Create directories for media and static files
RUN mkdir -p /app/media /app/staticfiles

# Entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
