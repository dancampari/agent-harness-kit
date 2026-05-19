---
name: packaging-pyproject-review
description: Use ao revisar pyproject.toml, metadados de build e configuração de empacotamento.
category: adapter:python
risk_level: low
---

# Objetivo
Assegurar que `pyproject.toml` siga padrões PEP 517/518/621 e produza pacotes corretos.

# Quando usar
- Alterações em `pyproject.toml`, `setup.py` ou `setup.cfg`.
- Configuração de build-system ou entry points.
- Preparação de release/publicação no PyPI.

# Quando não usar
- Projetos sem empacotamento (apenas scripts internos).
- Mudanças não relacionadas a metadados de pacote.

# Regras obrigatórias
- `[build-system]` deve declarar `requires` e `build-backend`.
- Metadados em `[project]` (nome, versão, `requires-python`) devem estar completos.
- Versão deve seguir versionamento semântico ou esquema declarado.
- `dependencies` não devem conter pacotes de desenvolvimento.
- Entry points/console scripts devem apontar para callables existentes.

# Processo
1. Valide a tabela `[build-system]`.
2. Confira metadados obrigatórios em `[project]`.
3. Verifique `requires-python` coerente com o código.
4. Cheque que dependências opcionais usam `[project.optional-dependencies]`.
5. Confirme inclusão correta de pacotes/dados (`tool.setuptools`/`hatch`).

# Checklist
- [ ] `build-system` declarado.
- [ ] Metadados completos.
- [ ] `requires-python` coerente.
- [ ] Extras separados de deps core.
- [ ] Entry points válidos.

# Anti-padrões
- Misturar `setup.py` legado com `pyproject` sem necessidade.
- Versão hardcoded divergente do código.
- Dependências de teste em `[project].dependencies`.
- Pacotes ou data files não incluídos no build.
