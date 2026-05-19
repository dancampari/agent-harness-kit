---
name: dockerfile-review
description: Use ao revisar Dockerfile quanto a segurança, tamanho de imagem e reprodutibilidade.
category: adapter:docker
risk_level: high
---

# Objetivo
Produzir imagens Docker pequenas, reproduzíveis e seguras.

# Quando usar
- Criação ou alteração de `Dockerfile`.
- Mudança de base image, build multi-stage ou camadas.
- Ajustes de usuário, portas ou entrypoint.

# Quando não usar
- Mudanças apenas em código sem alterar build da imagem.
- Projetos sem containerização.

# Regras obrigatórias
- Base image com tag fixa (não `latest`); preferir imagens slim/distroless.
- Não rodar como root; criar e usar usuário não privilegiado.
- Segredos nunca em `ARG`/`ENV` persistidos na imagem.
- Usar multi-stage para não vazar toolchain/artefatos de build.
- `.dockerignore` deve excluir `node_modules`, `.git`, segredos e artefatos.

# Processo
1. Verifique base image e fixação de tag.
2. Confirme `USER` não-root no estágio final.
3. Procure segredos em camadas/histórico (`ARG`/`ENV`/`COPY`).
4. Avalie multi-stage e ordem de camadas para cache.
5. Revise `.dockerignore` e `HEALTHCHECK`.

# Checklist
- [ ] Base image com tag fixa.
- [ ] Execução como não-root.
- [ ] Sem segredos na imagem.
- [ ] Multi-stage quando há build.
- [ ] `.dockerignore` adequado.

# Anti-padrões
- `FROM node:latest`.
- Container rodando como root em produção.
- `ENV API_KEY=...` na imagem.
- `COPY . .` sem `.dockerignore`, inflando a imagem.
