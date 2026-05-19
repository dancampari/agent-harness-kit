---
name: validation-before-done
description: Use antes de declarar qualquer tarefa concluída para validar a entrega contra os critérios.
category: core
risk_level: medium
---

# Objetivo
Garantir que a tarefa só seja considerada concluída após validação real contra os critérios de aceitação.
Evitar entregas parciais ou quebradas apresentadas como prontas.

# Quando usar
- Imediatamente antes de afirmar que a tarefa está pronta.
- Após qualquer alteração que toque comportamento.
- Quando existem critérios de aceitação definidos.
- Antes de entregar para revisão.
- Após resolver um bug.

# Quando não usar
- Ainda em rascunho explicitamente marcado como incompleto.
- Mudança puramente textual sem efeito em comportamento ou build.

# Regras obrigatórias
- Verifique cada critério de aceitação um a um.
- Execute build e testes disponíveis e confira o resultado real.
- Não confie em "deve funcionar"; observe a evidência.
- Trate qualquer critério não atendido como tarefa não concluída.
- Reporte limitações e o que não foi verificado.
- Não silencie nem ignore erros para passar na validação.

# Processo
1. Liste os critérios de aceitação.
2. Verifique cada critério com evidência concreta.
3. Execute build e testes e analise a saída.
4. Reproduza o cenário principal de uso.
5. Registre o que passou, falhou ou ficou sem verificar.
6. Só declare concluído se tudo passou; senão, volte a corrigir.

# Checklist
- [ ] Todos os critérios verificados.
- [ ] Build executado sem erro.
- [ ] Testes executados e analisados.
- [ ] Cenário principal reproduzido.
- [ ] Casos de erro checados.
- [ ] Limitações reportadas.
- [ ] Nenhum critério pendente.

# Anti-padrões
- ❌ Declarar pronto sem rodar nada.
- ❌ Assumir que compila sem verificar.
- ❌ Ignorar testes falhando.
- ❌ Mascarar erros para "passar".
