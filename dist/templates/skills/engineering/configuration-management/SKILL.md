---
name: configuration-management
description: Use ao definir, alterar ou revisar configuração e segredos que variam entre ambientes.
category: engineering
risk_level: medium
---

# Objetivo
Separar configuração do código, mantendo segredos seguros e o comportamento previsível entre ambientes.

# Quando usar
- Ao introduzir um novo parâmetro que muda por ambiente.
- Ao lidar com credenciais, chaves ou endpoints.
- Em revisões de prontidão para implantação.

# Quando não usar
- Para constantes verdadeiramente fixas e universais do domínio.
- Em flags experimentais locais sem impacto compartilhado.
- Quando o valor nunca muda entre ambientes.

# Regras obrigatórias
- Nenhum segredo no controle de versão.
- Configuração injetada por ambiente, não embutida no código.
- Valores padrão seguros e falha explícita quando obrigatório faltar.
- Documentar todas as chaves de configuração esperadas.
- Separar configuração de build da configuração de execução.

# Processo
1. Identifique o que varia por ambiente e o que é fixo.
2. Externalize valores variáveis para a fonte de configuração.
3. Defina obrigatoriedade e padrões seguros.
4. Valide a configuração na inicialização.
5. Documente cada chave e seu propósito.
6. Confirme que nenhum segredo vazou para o repositório.

# Checklist
- [ ] Nenhum segredo versionado
- [ ] Valores variáveis externalizados
- [ ] Padrões seguros definidos
- [ ] Falha clara quando configuração obrigatória ausente
- [ ] Validação na inicialização
- [ ] Chaves documentadas

# Anti-padrões
❌ Segredo hardcoded no código-fonte
❌ Comitar arquivo de ambiente com credenciais
❌ Padrões inseguros silenciosos
❌ Misturar configuração de ambientes diferentes
❌ Chaves de configuração não documentadas
