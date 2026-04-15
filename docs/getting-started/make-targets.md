# Make Targets

## Backend

| Command | Description |
|---------|-------------|
| `make install` | Install/update UV, then install backend dependencies |
| `make debug` | Start backend with hot-reload on port 8000 |
| `make lint` | Check backend code with ruff (read-only) |
| `make format` | Auto-fix backend lint issues and format code |
| `make test` | Run backend test suite with pytest |
| `make migrate` | Apply database migrations with Alembic |

## Frontend

| Command | Description |
|---------|-------------|
| `make frontend-install` | Update npm to latest, then install frontend dependencies |
| `make frontend-dev` | Start SvelteKit dev server on port 5173 |
| `make frontend-build` | Build frontend for production |

## Full Stack

| Command | Description |
|---------|-------------|
| `make deploy` | Build and start all Docker services |
| `make clean` | Stop containers, remove volumes, clear caches |

## Documentation

| Command | Description |
|---------|-------------|
| `make docs-serve` | Start MkDocs dev server with live reload (port 8080) |
| `make docs-build` | Build documentation site (output in `site/`) |
