---
name: multi-tenant-security-reviewer
description: Use para revisar isolamento de dados por tenant em qualquer feature que leia/grave dados operacionais. Não use para projetos single-tenant nem para revisão exclusiva de RLS de banco (use supabase-rls-reviewer).
---

# multi-tenant-security-reviewer

## Objetivo

Revisar o isolamento de dados por tenant, impedindo qualquer mistura de
dados entre empresas, barbearias, escritórios ou clientes.

## Quando usar

- Toda feature que cria/lê entidades operacionais
- Endpoints novos que recebem ou retornam dados de negócio
- Queries administrativas e relatórios

## Quando não usar

- Projeto comprovadamente single-tenant
- Revisão puramente de policy SQL → use `supabase-rls-reviewer`

## Regras obrigatórias

- Toda entidade operacional deve pertencer a um tenant.
- Não misturar dados entre empresas/barbearias/escritórios/clientes.
- APIs devem validar o tenant do requisitante.
- Queries administrativas devem ser explicitamente protegidas.
- Logs devem preservar `tenant_id` (para auditoria), sem dados sensíveis.

## Checklist de validação

- [ ] Toda nova tabela/entidade tem dono (tenant) definido
- [ ] Toda query de leitura filtra por tenant do usuário
- [ ] Toda escrita grava o `tenant_id` correto
- [ ] Endpoints rejeitam acesso a tenant diferente do autenticado
- [ ] Rotas admin têm verificação de papel/escopo explícita
- [ ] Logs incluem `tenant_id` e não vazam segredos

## Exemplos

```ts
if (resource.tenantId !== session.tenantId) {
  return forbidden(); // nunca retornar dado de outro tenant
}
```

## Anti-padrões

- ❌ Buscar por id sem checar o tenant dono
- ❌ Endpoint admin sem verificação de escopo
- ❌ Cache/lista compartilhada entre tenants
- ❌ Log sem `tenant_id`, impossibilitando auditoria
