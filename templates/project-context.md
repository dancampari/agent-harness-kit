# Contexto do Projeto — {{PROJECT_NAME}}

> Este documento dá ao agente o entendimento estável do projeto.
> Mantenha-o curto, verdadeiro e atualizado.

## Visão geral

- O que é o produto / projeto
- Quem usa
- Qual problema resolve

## Stack

- Linguagens / frameworks principais
- Banco de dados / serviços (ex.: Supabase, Postgres)
- Integrações (ex.: Evolution API v2, n8n, gateways)

## Arquitetura (resumo)

- Estrutura de pastas relevante
- Limites de módulos
- Padrões obrigatórios (tipagem, validação de input, tratamento de erro)

## Multi-tenant

- Como o isolamento por tenant funciona (coluna `tenant_id`? schema?)
- Quais entidades são por tenant
- Onde NÃO pode haver vazamento entre tenants

## Segurança

- RLS ativo? Em quais tabelas?
- Onde ficam segredos / variáveis de ambiente
- O que nunca pode ir para o client

## Convenções

- Padrão de nomes
- Padrão de commits / branches
- Padrão de testes

## Riscos conhecidos

- (Liste armadilhas recorrentes — alimente com `harness failure add`)
