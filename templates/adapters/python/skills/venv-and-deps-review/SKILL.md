---
name: venv-and-deps-review
description: Use ao revisar ambientes virtuais, pinning de dependências e reprodutibilidade em Python.
category: adapter:python
risk_level: medium
---

# Objetivo
Garantir ambientes Python isolados e dependências reproduzíveis e seguras.

# Quando usar
- Alterações em `requirements.txt`, `Pipfile`, `poetry.lock` ou `uv.lock`.
- Introdução de novas dependências de terceiros.
- Configuração de ambiente de CI/Docker para Python.

# Quando não usar
- Mudanças apenas em código sem alterar dependências.
- Projetos não-Python.

# Regras obrigatórias
- Dependências de produção devem ter versão pinada (ou lockfile commitado).
- Nunca instalar pacotes globalmente; usar venv/virtualenv/`uv`.
- Separar dependências de dev (testes/lint) das de produção.
- Não confiar em índices de pacotes não oficiais sem justificativa.
- `requirements.txt` gerado deve refletir o estado real do ambiente.

# Processo
1. Verifique se há lockfile ou pinning explícito.
2. Confirme separação dev vs prod.
3. Cheque fonte dos pacotes (PyPI oficial vs índice custom).
4. Valide que o ambiente é criado isolado em CI/Docker.
5. Procure dependências abandonadas ou com CVEs conhecidos.

# Checklist
- [ ] Versões pinadas / lockfile commitado.
- [ ] venv usado, sem instalação global.
- [ ] Dev e prod separados.
- [ ] Índice de pacotes confiável.
- [ ] Sem dependências vulneráveis óbvias.

# Anti-padrões
- `pip install` sem versão em produção.
- Misturar `pytest`/`black` nas deps de runtime.
- `--index-url` apontando para fonte não verificada.
- Instalar pacotes no Python do sistema.
