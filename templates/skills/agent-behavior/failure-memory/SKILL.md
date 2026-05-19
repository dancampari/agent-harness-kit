---
name: failure-memory
description: Use ao encontrar uma falha ou erro para registrá-lo e evitar repeti-lo na mesma sessão.
category: agent-behavior
risk_level: low
---

# Objetivo
Registrar falhas, causas e correções para não repetir os mesmos erros.
Transformar cada erro em aprendizado aplicável imediatamente.

# Quando usar
- Ao encontrar um erro, falha de build ou teste quebrado.
- Quando uma abordagem tentada não funcionou.
- Ao descobrir uma armadilha ou restrição do projeto.
- Antes de repetir uma ação que já falhou antes.
- Ao retomar uma tarefa interrompida.

# Quando não usar
- Erro trivial já resolvido e sem chance de recorrer.
- Situação sem qualquer aprendizado reaproveitável.

# Regras obrigatórias
- Anote o que falhou, a causa raiz e a correção.
- Consulte falhas anteriores antes de repetir uma abordagem.
- Não tente a mesma solução fracassada sem mudar algo.
- Registre restrições descobertas do ambiente ou projeto.
- Mantenha o registro curto e factível.
- Aplique o aprendizado nas próximas decisões da sessão.

# Processo
1. Ao falhar, capture o sintoma exato.
2. Identifique a causa raiz, não só o sintoma.
3. Registre falha, causa e o que corrigiu.
4. Antes de nova tentativa, consulte o registro.
5. Ajuste a abordagem com base no aprendizado.
6. Atualize o registro se a causa mudar.

# Checklist
- [ ] Sintoma capturado.
- [ ] Causa raiz identificada.
- [ ] Correção registrada.
- [ ] Registro consultado antes de repetir.
- [ ] Abordagem ajustada após falha.
- [ ] Restrições anotadas.
- [ ] Registro curto e útil.

# Anti-padrões
- ❌ Repetir a mesma ação esperando resultado diferente.
- ❌ Tratar sintoma e ignorar a causa.
- ❌ Não registrar e esquecer a lição.
- ❌ Registro extenso e inutilizável.
