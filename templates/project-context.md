# Contexto do Projeto — {{PROJECT_NAME}}

> Entendimento estável do projeto para o agente. Curto, verdadeiro e
> atualizado. Universal — preencha conforme a stack real (detectada por
> `harness doctor`), sem suposições.

## Visão geral

- O que é o produto / projeto
- Quem usa
- Qual problema resolve

## Stack (preencher com o que existe de fato)

- Linguagem(ns) e gerenciador de pacotes
- Framework(s), se houver
- Persistência / serviços externos, se houver
- Integrações externas, se houver

## Arquitetura (resumo)

- Estrutura de pastas relevante
- Limites de módulos / fronteiras
- Padrões obrigatórios do projeto (validação, erros, contratos)

## Domínio e dados

- Entidades principais
- Se há múltiplos donos/tenants: como o isolamento é feito
- Onde NÃO pode haver vazamento entre contextos

## Segurança

- Fronteiras de autenticação/autorização
- Onde fica configuração sensível / segredos
- O que nunca pode ser exposto

## Convenções

- Padrão de nomes
- Padrão de commits / branches
- Padrão de testes

## Validações disponíveis

- Comandos de lint/typecheck/build/test reais (ou "não há")

## Riscos conhecidos

- (Liste armadilhas recorrentes — alimente com `harness failure add`)
