---
name: project-discovery
description: Use no início de qualquer tarefa para entender o projeto antes de escrever ou alterar código.
category: core
risk_level: low
---

# Objetivo
Construir um entendimento mínimo e confiável do projeto antes de agir.
Reduzir suposições erradas que levam a retrabalho e a soluções que não encaixam no contexto existente.

# Quando usar
- Ao receber uma tarefa em um projeto pouco conhecido.
- Antes de propor uma arquitetura ou grande refatoração.
- Quando os requisitos mencionam partes do sistema ainda não inspecionadas.
- Antes de estimar esforço ou prazo.
- Quando há ambiguidade sobre stack, convenções ou objetivo.

# Quando não usar
- Mudança trivial e isolada em arquivo já totalmente compreendido.
- Tarefa puramente conversacional sem impacto em código.

# Regras obrigatórias
- Leia a documentação raiz e os arquivos de configuração do projeto antes de codar.
- Identifique linguagem, gerenciador de pacotes e como build/test são executados.
- Mapeie os pontos de entrada principais do sistema.
- Não invente caminhos, comandos ou dependências; confirme nos arquivos.
- Registre suposições explicitamente e valide as de maior risco.
- Pare e pergunte se o objetivo permanecer ambíguo após a investigação.

# Processo
1. Liste a estrutura de pastas de alto nível.
2. Leia README/docs e arquivos de configuração de dependências.
3. Descubra comandos de build, teste e execução.
4. Localize os pontos de entrada e módulos centrais.
5. Anote convenções de código observadas.
6. Liste suposições e lacunas; valide as críticas.

# Checklist
- [ ] Linguagem e stack identificadas.
- [ ] Comandos de build/test/run conhecidos.
- [ ] Pontos de entrada localizados.
- [ ] Documentação relevante lida.
- [ ] Convenções do projeto anotadas.
- [ ] Suposições registradas.
- [ ] Lacunas críticas resolvidas ou perguntadas.

# Anti-padrões
- ❌ Começar a editar sem saber como rodar o projeto.
- ❌ Assumir stack ou estrutura por hábito de outros projetos.
- ❌ Ignorar documentação existente.
- ❌ Tratar suposições não verificadas como fatos.
