---
name: api-contract-review
description: Use ao revisar contratos de API para consistência, versionamento e compatibilidade.
category: api
risk_level: medium
---

# Objetivo
- Garantir que o contrato de API (REST, RPC ou GraphQL) seja claro, estável e versionado.
- Evitar quebras silenciosas para consumidores existentes.

# Quando usar
- Ao criar um novo endpoint ou operação.
- Ao alterar formato de requisição, resposta ou códigos de erro.
- Antes de publicar mudanças que afetam consumidores.

# Quando não usar
- Projeto sem API exposta ou consumida.
- Protótipo interno sem nenhum consumidor.

# Regras obrigatórias
- Todo campo deve ter nome, tipo e obrigatoriedade definidos.
- Mudanças incompatíveis exigem nova versão, não alteração no contrato atual.
- Erros devem usar formato e códigos previsíveis e documentados.
- Campos opcionais não podem virar obrigatórios sem versionamento.
- Contrato e implementação devem permanecer sincronizados.

# Processo
1. Liste entradas, saídas e códigos de erro de cada operação.
2. Classifique mudanças como compatíveis ou incompatíveis.
3. Aplique versionamento quando houver quebra.
4. Documente o contrato junto à implementação.
5. Valide a resposta real contra o contrato declarado.
6. Comunique mudanças aos consumidores antes de publicar.

# Checklist
- [ ] Campos com tipo e obrigatoriedade definidos
- [ ] Mudanças incompatíveis versionadas
- [ ] Formato de erro padronizado
- [ ] Documentação alinhada com a implementação
- [ ] Resposta real validada contra o contrato
- [ ] Consumidores avisados de mudanças

# Anti-padrões
- ❌ Renomear ou remover campo sem versionar
- ❌ Tornar campo opcional obrigatório no mesmo contrato
- ❌ Retornar erros em formatos inconsistentes
- ❌ Documentação divergente da resposta real
- ❌ Mudar semântica de um campo mantendo o nome
