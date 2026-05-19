---
name: sql-migration-vendor-review
description: Use ao revisar migrações SQL quanto a portabilidade, reversibilidade e impacto em produção.
category: adapter:database
risk_level: high
---

# Objetivo
Garantir migrações de schema seguras, reversíveis e portáveis entre fornecedores de banco.

# Quando usar
- Novas migrações (Prisma, Knex, Alembic, TypeORM, SQL puro).
- Alterações de schema em tabelas com dados de produção.
- Uso de recursos específicos de um fornecedor (Postgres/MySQL/SQLite).

# Quando não usar
- Mudanças de seed/dados não estruturais.
- Projetos sem versionamento de schema.

# Regras obrigatórias
- Toda migração deve ter caminho de rollback (`down`) ou estratégia de reversão documentada.
- Mudanças destrutivas (drop/rename de coluna) exigem migração em fases e backup.
- Recursos específicos de vendor devem ser isolados/documentados se houver meta de portabilidade.
- Adicionar índice/constraint em tabela grande deve considerar lock e estratégia concorrente.
- Migração deve ser idempotente o suficiente para reexecução segura em CI.

# Processo
1. Verifique presença e correção do rollback.
2. Classifique a migração (aditiva vs destrutiva) e exija plano em fases se destrutiva.
3. Identifique sintaxe/tipos específicos de vendor.
4. Avalie impacto de locks em tabelas grandes.
5. Confirme ordem e dependências entre migrações.

# Checklist
- [ ] Rollback definido ou documentado.
- [ ] Mudança destrutiva em fases + backup.
- [ ] Dependências de vendor isoladas.
- [ ] Impacto de lock avaliado.
- [ ] Reexecução segura em CI.

# Anti-padrões
- `DROP COLUMN` direto em produção sem fase intermediária.
- Migração sem `down` em ferramenta que o suporta.
- Tipo proprietário sem nota de portabilidade.
- `CREATE INDEX` bloqueante em tabela enorme sem variante concorrente.
