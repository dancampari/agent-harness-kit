---
name: regression-check
description: Use antes de finalizar uma mudança para confirmar que comportamentos existentes não foram quebrados.
category: quality
risk_level: high
---

# Objetivo
Detectar e prevenir regressões verificando que funcionalidades já existentes continuam corretas após a mudança.

# Quando usar
- Antes de concluir qualquer alteração em código já em uso.
- Ao refatorar, otimizar ou mover código compartilhado.
- Ao corrigir um bug, para evitar reintroduzi-lo no futuro.
- Quando a mudança afeta interfaces, contratos ou dependências comuns.

# Quando não usar
- Código novo isolado sem consumidores ainda.
- Documentação ou arquivos sem efeito em tempo de execução.
- Experimentos descartáveis fora do fluxo principal.

# Regras obrigatórias
- A suíte de testes existente deve passar integralmente antes e depois.
- Todo bug corrigido recebe um teste que falha sem a correção.
- Mudanças em contratos públicos exigem verificação dos consumidores.
- Nenhum teste pode ser desabilitado ou removido para "passar".
- Comportamentos não relacionados não devem mudar de forma silenciosa.

# Processo
1. Mapeie o que a mudança toca e quem depende disso.
2. Execute a suíte completa antes da mudança como linha de base.
3. Aplique a mudança e reexecute a suíte completa.
4. Compare resultados e investigue qualquer diferença.
5. Adicione um teste de regressão para cada defeito corrigido.
6. Valide manualmente fluxos críticos sem cobertura automatizada.

# Checklist
- [ ] Linha de base de testes registrada antes da mudança
- [ ] Suíte completa verde após a mudança
- [ ] Teste de regressão criado para o bug corrigido
- [ ] Consumidores de contratos alterados verificados
- [ ] Nenhum teste desabilitado para forçar aprovação
- [ ] Fluxos críticos sem cobertura validados manualmente

# Anti-padrões
❌ Desabilitar ou apagar testes que falham em vez de investigar
❌ Corrigir bug sem adicionar teste que o capture
❌ Assumir que mudança "pequena" não afeta consumidores
❌ Rodar só os testes da área alterada e ignorar o resto
❌ Aceitar diferença de comportamento sem explicação
