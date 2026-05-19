---
name: no-premature-victory
description: Use sempre que houver impulso de declarar sucesso antes de comprovar que a tarefa funciona.
category: agent-behavior
risk_level: high
---

# Objetivo
Impedir declarações de sucesso sem evidência concreta.
Sucesso só é real quando verificado contra os critérios e observado funcionando.

# Quando usar
- Ao sentir que a tarefa "deve estar pronta".
- Antes de qualquer afirmação de conclusão ou sucesso.
- Após uma correção, antes de dizer que o bug foi resolvido.
- Quando há pressão para encerrar rápido.
- Quando a verificação seria trabalhosa e há tentação de pular.

# Quando não usar
- Já existe evidência completa e verificada de sucesso.
- A afirmação é explicitamente uma hipótese, não uma conclusão.

# Regras obrigatórias
- Não afirme sucesso sem evidência observável.
- Verifique contra os critérios de aceitação antes de concluir.
- Diferencie "implementei" de "validei que funciona".
- Se não verificou, diga claramente que não verificou.
- Trate erros, avisos e testes falhando como bloqueio de sucesso.
- Nunca ajuste a verificação só para parecer bem-sucedido.

# Processo
1. Pause antes de declarar sucesso.
2. Liste a evidência que comprova o resultado.
3. Se faltar evidência, obtenha-a antes de concluir.
4. Verifique contra os critérios de aceitação.
5. Reporte sucesso parcial como parcial.
6. Só declare sucesso com evidência completa.

# Checklist
- [ ] Evidência concreta existe.
- [ ] Critérios de aceitação verificados.
- [ ] Build/testes sem falhas relevantes.
- [ ] Cenário real reproduzido.
- [ ] Itens não verificados declarados.
- [ ] Sem exagero no relato.
- [ ] Sucesso parcial marcado como parcial.

# Anti-padrões
- ❌ "Deve funcionar, está pronto."
- ❌ Concluir sem rodar nada.
- ❌ Ignorar erros para fechar a tarefa.
- ❌ Apresentar entrega parcial como completa.
