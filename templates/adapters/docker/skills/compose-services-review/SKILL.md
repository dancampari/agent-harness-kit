---
name: compose-services-review
description: Use ao revisar docker-compose: serviços, redes, volumes, segredos e dependências.
category: adapter:docker
risk_level: high
---

# Objetivo
Garantir orquestração Compose segura e previsível entre serviços.

# Quando usar
- Alterações em `docker-compose.yml`/`compose.yaml`.
- Novos serviços, redes, volumes ou variáveis de ambiente.
- Configuração de portas expostas e dependências entre serviços.

# Quando não usar
- Projetos sem Compose (apenas Dockerfile único).
- Mudanças não relacionadas à orquestração.

# Regras obrigatórias
- Segredos via `env_file`/secrets, não hardcoded no YAML versionado.
- Expor portas para o host apenas quando necessário; preferir rede interna.
- Volumes nomeados para dados persistentes; evitar bind mounts de paths sensíveis.
- `depends_on` não garante readiness — usar healthcheck/retry na aplicação.
- Fixar versões de imagem; não usar `latest` em serviços.

# Processo
1. Liste serviços, portas publicadas e justifique cada exposição.
2. Verifique origem de variáveis e segredos.
3. Revise volumes (nomeados vs bind) e persistência.
4. Confira redes e isolamento entre serviços.
5. Cheque healthchecks e estratégia de startup.

# Checklist
- [ ] Segredos fora do YAML versionado.
- [ ] Portas expostas mínimas.
- [ ] Volumes nomeados para dados.
- [ ] Imagens com tag fixa.
- [ ] Healthchecks definidos.

# Anti-padrões
- `environment: - PASSWORD=123` no compose commitado.
- `ports: "5432:5432"` de banco exposto sem necessidade.
- Confiar só em `depends_on` para ordem de boot.
- Bind mount de diretório do host com dados críticos.
