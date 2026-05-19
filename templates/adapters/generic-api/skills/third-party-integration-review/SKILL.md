---
name: third-party-integration-review
description: Use ao revisar integrações com APIs externas: credenciais, resiliência e tratamento de erro.
category: adapter:generic-api
risk_level: high
---

# Objetivo
Tornar integrações com APIs de terceiros seguras, resilientes e observáveis.

# Quando usar
- Chamadas a APIs externas (REST/GraphQL/webhooks).
- Configuração de credenciais, tokens ou clientes HTTP.
- Tratamento de falhas, timeouts e limites de taxa.

# Quando não usar
- Comunicação puramente interna sem dependência externa.
- Mudanças sem impacto em chamadas externas.

# Regras obrigatórias
- Credenciais via variáveis de ambiente/secret manager; nunca hardcoded ou commitadas.
- Toda chamada externa deve ter timeout e tratamento de erro explícito.
- Implementar retry com backoff apenas em erros idempotentes/transitórios.
- Respeitar rate limits e tratar HTTP 429 (Retry-After).
- Validar/normalizar a resposta externa antes de usá-la (não confiar no schema).

# Processo
1. Liste integrações e onde as credenciais vêm.
2. Verifique timeout e tratamento de erro por chamada.
3. Avalie política de retry/backoff e idempotência.
4. Cheque tratamento de rate limit e respostas inesperadas.
5. Confirme logging sem vazar segredos/PII.

# Checklist
- [ ] Credenciais fora do código.
- [ ] Timeout em todas as chamadas.
- [ ] Retry/backoff só onde seguro.
- [ ] Rate limit tratado.
- [ ] Resposta validada; logs sem segredos.

# Anti-padrões
- Token de API no código-fonte.
- `fetch` sem timeout travando o processo.
- Retry infinito em erro 4xx não recuperável.
- Logar payload completo com credenciais/PII.
