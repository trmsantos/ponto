# Como correr com Docker

## Pré-requisitos
- Docker Desktop instalado
- docker compose (v2)

## Passos rápidos

1. Copiar o ficheiro de configuração:
   ```bash
   cp .env.example .env
   ```

2. Editar `.env` com as configurações desejadas (especialmente `SECRET_KEY`)

3. Construir e iniciar:
   ```bash
   docker compose up --build
   ```

4. Aceder em: http://localhost:8000

## Comandos úteis

```bash
# Iniciar em background
docker compose up -d --build

# Ver logs
docker compose logs -f

# Parar
docker compose down

# Parar e apagar volumes (CUIDADO: apaga a base de dados!)
docker compose down -v

# Criar superuser Django
docker compose exec web python manage.py createsuperuser
```

## Notas
- O frontend é compilado automaticamente durante o `docker build`
- As migrations correm automaticamente ao iniciar
- Os ficheiros media são persistidos em volume Docker
- Para desenvolvimento, continua a usar os terminais separados como habitual
