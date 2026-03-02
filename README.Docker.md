# 🐳 Como correr com Docker

## Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado
- docker compose v2

## Início rápido

### 1. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Editar .env com as configurações desejadas (especialmente SECRET_KEY)
```

### 2. Construir e iniciar
```bash
docker compose up --build
```

### 3. Aceder à aplicação
- **Aplicação**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin

## Comandos úteis

| Comando | Descrição |
|---------|-----------|
| `docker compose up --build` | Construir e iniciar (primeira vez) |
| `docker compose up -d` | Iniciar em background |
| `docker compose down` | Parar os containers |
| `docker compose down -v` | Parar e apagar volumes (⚠️ apaga a BD!) |
| `docker compose logs -f` | Ver logs em tempo real |
| `docker compose logs -f web` | Ver apenas logs da aplicação |
| `docker compose exec web python manage.py createsuperuser` | Criar utilizador admin |
| `docker compose exec web python manage.py shell` | Django shell |

## O que acontece ao `docker compose up --build`

1. **Build do Frontend** — O Webpack compila o React em modo produção
2. **Build do Backend** — Python + dependências instaladas
3. **MySQL** inicia e aguarda estar pronto
4. **Migrations** correm automaticamente
5. **Static files** são coletados
6. **Gunicorn** inicia com 3 workers na porta 8000

## Notas
- Para desenvolvimento local, continua a usar os terminais separados como habitual
- Os dados da base de dados são persistidos num volume Docker (`mysql_data`)
- Os ficheiros media (uploads) são persistidos em `media_data`
