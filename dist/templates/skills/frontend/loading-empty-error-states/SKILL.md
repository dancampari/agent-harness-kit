---
name: loading-empty-error-states
description: Use ao revisar telas para tratar estados de carregamento, vazio e erro de forma explícita.
category: frontend
risk_level: low
---

# Objetivo
- Garantir que toda tela com dados assíncronos trate carregamento, vazio e erro de forma clara.
- Evitar telas em branco, travadas ou sem explicação para o usuário.

# Quando usar
- Ao criar ou alterar telas que buscam dados externos.
- Ao adicionar listas, detalhes ou painéis dependentes de requisição.
- Antes de liberar fluxos com latência variável.

# Quando não usar
- Projeto sem frontend.
- Conteúdo totalmente estático sem dados assíncronos.

# Regras obrigatórias
- Todo carregamento de dados deve ter indicação visual de progresso.
- Estado vazio deve ser explícito e orientar o próximo passo.
- Erro deve mostrar mensagem compreensível e opção de tentar de novo.
- Não exibir estrutura quebrada enquanto os dados não chegam.
- Diferenciar "sem resultados" de "falha ao carregar".

# Processo
1. Mapeie os quatro estados: carregando, sucesso, vazio e erro.
2. Defina a UI de cada estado antes de implementar.
3. Implemente indicador de carregamento adequado ao tempo esperado.
4. Crie mensagem de vazio com ação sugerida.
5. Trate erro com mensagem clara e ação de repetir.
6. Teste cada estado simulando latência e falhas.

# Checklist
- [ ] Estado de carregamento visível
- [ ] Estado vazio explícito e orientador
- [ ] Estado de erro com mensagem clara
- [ ] Ação de tentar novamente disponível no erro
- [ ] Vazio e erro são distintos
- [ ] Sem layout quebrado durante a espera

# Anti-padrões
- ❌ Tela em branco enquanto os dados carregam
- ❌ Tratar lista vazia como se fosse erro
- ❌ Engolir o erro sem avisar o usuário
- ❌ Mostrar erro técnico cru sem orientação
- ❌ Não oferecer forma de repetir a operação
