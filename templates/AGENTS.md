# AGENTS.md

> Projeto: {{PROJECT_NAME}}
> Este projeto é controlado por **Agent Harness Engineering**. Leia este
> arquivo antes de qualquer implementação.

## Papel do agente

Você está trabalhando dentro de um projeto controlado por Agent Harness
Engineering. Não execute tarefas como um agente one-shot. Siga o ciclo
obrigatório:

1. Ler contexto
2. Confirmar entendimento
3. Identificar arquivos relevantes
4. Planejar
5. Implementar em passos pequenos
6. Validar
7. Corrigir falhas
8. Registrar decisões
9. Só declarar conclusão após validação

## Fontes obrigatórias

Antes de implementar, leia:

- `.harness/project-context.md`
- `.harness/current-task.md`
- `.harness/acceptance-criteria.md`
- `.harness/qa-checklist.md`
- `.harness/failures.md`
- skills relevantes em `.agents/skills/`

## Regras não negociáveis

- Não declarar conclusão sem rodar validações.
- Não ignorar critérios de aceite.
- Não fazer grandes refatorações fora do escopo.
- Não remover funcionalidades existentes sem justificativa.
- Não criar dependências novas sem explicar a necessidade.
- Não alterar arquitetura sem registrar decisão em `.harness/decisions.md`.
- Não usar valores secretos hardcoded.
- Não quebrar multi-tenant.
- Não ignorar RLS quando o projeto usar Supabase.
- Não enviar mensagens/eventos automáticos sem toggle ou configuração explícita.
- Não implementar webhooks sem idempotência.

## Definição de pronto

Uma tarefa só está pronta quando:

- Código implementado
- Critérios de aceite cumpridos
- Lint executado ou justificado
- Typecheck executado ou justificado
- Build executado ou justificado
- Testes executados ou justificados
- Riscos documentados
- Decisões registradas
- Nenhuma pendência crítica restante

## Skills disponíveis

| Skill | Use para |
|---|---|
| `nextjs-supabase-builder` | Implementar funcionalidades Next.js + Supabase |
| `supabase-rls-reviewer` | Revisar RLS, tenant_id, policies, migrations |
| `n8n-evolution-workflow` | Padronizar workflows n8n + Evolution API v2 |
| `qa-before-done` | Impedir vitória prematura |
| `multi-tenant-security-reviewer` | Revisar isolamento de dados por tenant |
| `webhook-idempotency-reviewer` | Evitar processamento duplicado de webhooks |

## Comandos de apoio (humano/dev roda; o agente não chama LLM)

- `harness validate` — roda lint/typecheck/build/test e gera relatório
- `harness done` — verificação anti-vitória-prematura
- `harness report` — consolida o estado da tarefa
- `harness failure add "..."` — registra falha que vira regra preventiva

> Lembrete final: **na dúvida, não declare vitória.** Rode as validações,
> marque os critérios de aceite e registre decisões.
