---
name: form-validation-review
description: Use ao revisar formulários para validação correta, mensagens claras e proteção de dados.
category: frontend
risk_level: medium
---

# Objetivo
- Garantir que formulários validem entradas de forma confiável e comuniquem erros com clareza.
- Prevenir envio de dados inválidos e perda de trabalho do usuário.

# Quando usar
- Ao criar ou alterar qualquer formulário com entrada do usuário.
- Ao adicionar campos obrigatórios, formatos ou regras de negócio.
- Antes de liberar fluxos de cadastro, edição ou pagamento.

# Quando não usar
- Projeto sem frontend.
- Tela puramente informativa sem entrada de dados.

# Regras obrigatórias
- Toda regra do cliente deve ter validação equivalente no servidor.
- Mensagens de erro devem ser específicas e ficar próximas ao campo.
- Não validar de forma agressiva antes da primeira interação do campo.
- Estado de envio deve impedir submissões duplicadas.
- Em erro de envio, preservar os dados já preenchidos.

# Processo
1. Liste os campos, formatos e regras obrigatórias.
2. Defina quando validar (ao sair do campo e ao enviar).
3. Implemente mensagens claras associadas a cada campo.
4. Garanta validação espelhada no servidor.
5. Teste casos válidos, inválidos, limites e envio duplicado.
6. Verifique recuperação de dados após falha de envio.

# Checklist
- [ ] Validação do servidor cobre as regras do cliente
- [ ] Mensagens específicas e próximas ao campo
- [ ] Sem erros disparados antes da interação
- [ ] Botão de envio bloqueia duplo clique
- [ ] Dados preservados após falha
- [ ] Casos de limite testados

# Anti-padrões
- ❌ Confiar apenas na validação do cliente
- ❌ Mensagem genérica do tipo "dados inválidos"
- ❌ Marcar campo como inválido antes de o usuário digitar
- ❌ Permitir múltiplos envios do mesmo formulário
- ❌ Limpar o formulário inteiro após um erro
