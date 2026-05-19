---
name: safe-refactor
description: Use ao reestruturar código existente sem alterar comportamento observável, garantindo segurança da mudança.
category: engineering
risk_level: high
---

# Objetivo
Melhorar a estrutura interna do código preservando o comportamento externo e evitando regressões.

# Quando usar
- Antes de adicionar funcionalidade sobre código difícil de evoluir.
- Quando há duplicação ou acoplamento que bloqueia mudanças.
- Ao reduzir complexidade de um módulo crítico.

# Quando não usar
- Sem cobertura mínima de testes ou plano de verificação.
- Misturado com correção de bug ou nova funcionalidade no mesmo commit.
- Sob pressão de incidente, quando o objetivo é apenas estabilizar.

# Regras obrigatórias
- Refatoração e mudança de comportamento nunca no mesmo commit.
- Garantir verificação antes (testes ou caracterização do comportamento atual).
- Passos pequenos e reversíveis, com validação a cada etapa.
- Interface pública mantida ou versionada de forma explícita.
- Rollback claro definido antes de iniciar.

# Processo
1. Caracterize o comportamento atual com testes ou observações.
2. Defina o alvo da refatoração e o critério de sucesso.
3. Aplique uma transformação pequena por vez.
4. Verifique o comportamento após cada passo.
5. Faça commits atômicos e descritivos.
6. Revise o resultado final contra o comportamento original.

# Checklist
- [ ] Comportamento coberto antes de iniciar
- [ ] Nenhuma mudança funcional incluída
- [ ] Passos pequenos e commitados separadamente
- [ ] Interface pública preservada ou versionada
- [ ] Verificação passou após cada etapa
- [ ] Plano de rollback disponível

# Anti-padrões
❌ Refatorar sem nenhuma rede de verificação
❌ Misturar correção e reestruturação no mesmo commit
❌ Big bang: reescrever tudo de uma vez
❌ Alterar assinatura pública sem versionar ou avisar
❌ Adiar testes para "depois da refatoração"
