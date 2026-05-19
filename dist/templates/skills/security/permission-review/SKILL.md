---
name: permission-review
description: Use ao revisar políticas de permissão, papéis e regras de acesso, incluindo isolamento multi-tenant.
category: security
risk_level: high
---

# Objetivo
- Garantir que políticas de acesso reflitam o menor privilégio necessário.
- Assegurar consistência entre papéis, escopos e isolamento de dados.
- Detectar lacunas, sobreposições e privilégios excessivos.

# Quando usar
- Ao criar ou alterar papéis, escopos, grupos ou regras de acesso.
- Ao introduzir novos recursos que exigem controle de permissão.
- Ao revisar isolamento entre tenants, organizações ou ambientes.

# Quando não usar
- Mudanças sem efeito em controle de acesso ou visibilidade de dados.
- Ajustes internos sem atores ou recursos protegidos envolvidos.

# Regras obrigatórias
- Toda permissão concede o mínimo necessário para a função.
- Negação por padrão: nenhum acesso implícito sem regra explícita.
- Permissões avaliadas no servidor, no ponto de acesso ao recurso.
- Isolamento de tenant aplicado independentemente do papel do usuário.
- Mudanças de permissão são revisáveis, versionadas e auditáveis.

# Processo
1. Listar recursos afetados e os papéis/escopos que os acessam.
2. Confirmar que cada concessão segue o menor privilégio.
3. Verificar negação por padrão em caminhos não cobertos.
4. Validar que o isolamento de tenant não depende só do papel.
5. Testar matriz de papéis contra recursos sensíveis.

# Checklist
- [ ] Cada permissão concede apenas o necessário.
- [ ] Acesso negado por padrão sem regra explícita.
- [ ] Permissões avaliadas no servidor, junto ao recurso.
- [ ] Isolamento de tenant garantido além do papel do usuário.
- [ ] Matriz papel x recurso testada para casos sensíveis.
- [ ] Mudanças de permissão versionadas e auditáveis.

# Anti-padrões
❌ Conceder papéis amplos por conveniência ("admin para tudo").
❌ Assumir acesso permitido quando não há regra definida.
❌ Aplicar permissões apenas na UI ou no cliente.
❌ Permitir que um papel elevado ignore o isolamento de tenant.
❌ Alterar políticas de acesso sem rastreabilidade.
