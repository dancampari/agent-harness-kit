---
name: npm-scripts-review
description: Use ao revisar scripts em package.json, lifecycle hooks e cadeias de build/test/start.
category: adapter:node
risk_level: medium
---

# Objetivo
Garantir que os scripts npm sejam previsíveis, seguros e reprodutíveis entre ambientes.

# Quando usar
- Há alterações em `scripts` no `package.json`.
- Novos lifecycle hooks (`preinstall`, `postinstall`, `prepare`) foram adicionados.
- CI/CD depende de comandos npm/yarn/pnpm.

# Quando não usar
- Mudanças apenas em dependências sem alterar scripts.
- Projetos sem `package.json` (não é Node).

# Regras obrigatórias
- Nunca aprovar `postinstall`/`preinstall` que baixem e executem código remoto sem revisão.
- Builds devem usar `npm ci` (lockfile determinístico), não `npm install`, em CI.
- Variáveis de ambiente sensíveis não podem estar hardcoded em scripts.
- Scripts cross-plataforma: evitar `rm -rf`/`&&` que quebram no Windows; preferir ferramentas como `rimraf`/`cross-env`.
- `start` não deve rodar build implícito que mascare falhas.

# Processo
1. Liste todos os scripts e classifique (build, test, lint, start, hooks).
2. Verifique lifecycle hooks por execução de código externo ou efeitos colaterais.
3. Confirme uso de lockfile e `npm ci` em pipelines.
4. Cheque portabilidade de comandos shell.
5. Valide que segredos vêm de env, não de literais.

# Checklist
- [ ] Lifecycle hooks revisados e justificados.
- [ ] `npm ci` usado em CI.
- [ ] Sem segredos hardcoded.
- [ ] Comandos portáveis (Windows/Linux/macOS).
- [ ] `test`/`lint` falham com exit code != 0.

# Anti-padrões
- `postinstall` com `curl ... | bash`.
- `npm install` em CI gerando builds não determinísticos.
- `cross-env` ausente com variáveis inline (`VAR=x cmd`) em Windows.
- Script `build` silenciando erros com `|| true`.
