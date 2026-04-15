# Prerequisites

## Required Tools

- [UV](https://docs.astral.sh/uv/getting-started/installation/) (Python package manager) — required for all `make` targets
- [Node.js 22+](https://nodejs.org/) and npm
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) (for databases and deployment)
- Python 3.12+ (UV will install this automatically)

## Install UV

UV must be installed before running any `make` commands (`install`, `lint`, `test`, `deploy`, etc.):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

After installation, restart your shell or run `source $HOME/.local/bin/env` so that `uv` is on your `PATH`.

Verify with:

```bash
uv --version
```

See the [UV installation docs](https://docs.astral.sh/uv/getting-started/installation/) for alternative methods (Homebrew, pip, etc.).
