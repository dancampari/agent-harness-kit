---
name: composer-review
description: Use ao revisar composer.json/composer.lock, autoload e scripts do Composer.
category: adapter:php
risk_level: medium
---

# Objetivo
Garantir gestão de dependências PHP segura, determinística e com autoload correto.

# Quando usar
- Alterações em `composer.json` ou `composer.lock`.
- Mudanças em `autoload`/`autoload-dev` ou scripts do Composer.
- Atualização de pacotes de terceiros.

# Quando não usar
- Mudanças apenas de código sem tocar dependências.
- Projetos sem Composer.

# Regras obrigatórias
- `composer.lock` deve ser commitado e usado com `composer install --no-dev` em produção.
- Constraints de versão devem evitar `*` em pacotes críticos.
- `scripts` (post-install/post-update) não podem executar código remoto não revisado.
- Autoload deve seguir PSR-4; rodar `dump-autoload` quando mudar mapeamento.
- `minimum-stability` não deve ser `dev` em produção sem justificativa.

# Processo
1. Verifique presença e consistência do `composer.lock`.
2. Avalie constraints de versão (evitar `*`/`dev-master`).
3. Revise scripts de lifecycle do Composer.
4. Confira mapeamento PSR-4 do autoload.
5. Cheque `require` vs `require-dev` corretamente separados.

# Checklist
- [ ] `composer.lock` commitado.
- [ ] Constraints específicas, sem `*` em pacotes-chave.
- [ ] Scripts revisados.
- [ ] Autoload PSR-4 consistente.
- [ ] dev separado de prod.

# Anti-padrões
- `"pacote": "*"` em produção.
- Ignorar `composer.lock` no VCS.
- `composer install` (com dev) em servidor de produção.
- Script de post-install baixando binários sem verificação.
