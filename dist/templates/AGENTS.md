# AGENTS.md

> Projeto: {{PROJECT_NAME}}
> Prompt Master **universal** de Agent Harness Engineering. Não assume
> stack, framework, banco de dados nem arquitetura.

## Papel do agente

Você está trabalhando dentro de um projeto controlado por Agent Harness
Engineering.

Seu objetivo é entregar mudanças corretas, seguras, verificáveis e bem
documentadas.

Não aja como agente one-shot.

## Ciclo obrigatório

1. Entender o projeto
2. Detectar stack e estrutura
3. Ler a tarefa atual
4. Identificar riscos
5. Selecionar skills relevantes
6. Planejar antes de implementar
7. Implementar em passos pequenos
8. Validar
9. Corrigir falhas
10. Registrar decisões
11. Gerar relatório
12. Só declarar conclusão se os critérios forem cumpridos

## Fontes obrigatórias

Antes de implementar, leia quando existirem:

- `.harness/project-context.md`
- `.harness/current-task.md`
- `.harness/acceptance-criteria.md`
- `.harness/qa-checklist.md`
- `.harness/decisions.md`
- `.harness/failures.md`
- `.agents/skills/`

## Regras universais

- Não assuma a stack sem verificar arquivos do projeto.
- Não altere arquitetura sem necessidade clara.
- Não faça refatorações grandes fora do escopo.
- Não remova funcionalidades sem justificativa.
- Não introduza dependências sem explicar motivo.
- Não hardcode secrets, tokens, senhas ou chaves.
- Não ignore erros de build, lint, typecheck ou testes.
- Não declare conclusão sem validação.
- Não oculte falhas.
- Não modifique arquivos críticos sem registrar decisão.
- Não confunda protótipo com entrega final.
- Não invente comandos que não existem no projeto.
- Não diga que executou algo sem evidência.

## Detecção de projeto

Antes de implementar, verifique arquivos como:

- `package.json`
- `pnpm-lock.yaml`
- `package-lock.json`
- `yarn.lock`
- `pyproject.toml`
- `requirements.txt`
- `go.mod`
- `Cargo.toml`
- `composer.json`
- `pom.xml`
- `build.gradle`
- `Dockerfile`
- `docker-compose.yml`
- `.github/workflows`
- arquivos de configuração do framework
- arquivos de teste
- arquivos de banco/migrations
- README

## Skills

As skills universais ficam em `.agents/skills/<categoria>/<skill>/SKILL.md`
(core, engineering, architecture, quality, security, data, frontend, api,
operations, agent-behavior). Skills específicas de stack só existem se um
**adapter** for instalado (`harness adapter add <nome>`) — nunca no core.

Selecione apenas as skills relevantes à tarefa e ao perfil do projeto.

## Definição de pronto

Uma tarefa só está pronta quando:

- A implementação foi feita
- Os critérios de aceite foram cumpridos
- As validações possíveis foram executadas
- Falhas foram corrigidas ou documentadas
- Decisões técnicas foram registradas
- O relatório foi gerado
- Não há pendência crítica conhecida
