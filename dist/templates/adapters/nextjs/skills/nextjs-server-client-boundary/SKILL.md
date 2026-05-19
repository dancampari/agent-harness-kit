---
name: nextjs-server-client-boundary
description: Use ao revisar Server/Client Components, Server Actions e exposição de segredos no Next.js.
category: adapter:nextjs
risk_level: high
---

# Objetivo
Proteger a fronteira server/client do Next.js, evitando vazamento de segredos e uso indevido de APIs.

# Quando usar
- Componentes com diretiva `"use client"` ou `"use server"`.
- Server Actions e mutações de dados.
- Acesso a variáveis de ambiente ou segredos.

# Quando não usar
- Código 100% client-side sem dados sensíveis.
- Mudanças sem impacto na fronteira server/client.

# Regras obrigatórias
- Segredos só em código server; nunca em Client Components ou em `NEXT_PUBLIC_*`.
- Server Actions devem validar e autorizar entrada (não confiar no cliente).
- Não importar módulos só-server em Client Components.
- Dados passados de Server para Client Component devem ser serializáveis e mínimos.
- `NEXT_PUBLIC_` apenas para valores realmente públicos.

# Processo
1. Marque cada componente como server ou client.
2. Rastreie acesso a env/segredos e confirme que fica no server.
3. Revise Server Actions: validação, autorização, idempotência.
4. Verifique imports só-server em código client.
5. Cheque payload Server→Client (tamanho e sensibilidade).

# Checklist
- [ ] Segredos somente no server.
- [ ] Server Actions validam e autorizam.
- [ ] Sem import server em Client Component.
- [ ] Payload Server→Client mínimo e serializável.
- [ ] `NEXT_PUBLIC_` só para dados públicos.

# Anti-padrões
- Chave de API em `NEXT_PUBLIC_API_KEY`.
- Server Action confiando em `userId` enviado pelo cliente.
- `import 'fs'` em componente `"use client"`.
- Passar objeto enorme/sensível do server para o client.
