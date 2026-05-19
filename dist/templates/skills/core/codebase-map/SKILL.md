---
name: codebase-map
description: Use para mapear onde vivem os componentes relevantes antes de alterar código existente.
category: core
risk_level: low
---

# Objetivo
Produzir um mapa enxuto das partes do código relevantes à tarefa atual.
Permitir mudanças localizadas e seguras, evitando duplicação e efeitos colaterais.

# Quando usar
- Antes de modificar um fluxo que cruza vários módulos.
- Ao investigar a origem de um bug.
- Antes de adicionar funcionalidade que pode já existir parcialmente.
- Para entender dependências entre componentes.
- Antes de uma refatoração de médio porte.

# Quando não usar
- Arquivo único, autocontido e já compreendido.
- Tarefa sem leitura ou alteração de código.

# Regras obrigatórias
- Busque por nomes, símbolos e termos do domínio antes de assumir onde algo está.
- Siga as referências de quem chama e de quem é chamado.
- Identifique pontos de extensão antes de criar código novo.
- Não conclua o mapa com base em um único arquivo.
- Documente os arquivos-chave e suas responsabilidades.
- Verifique se já existe implementação semelhante antes de duplicar.

# Processo
1. Defina os termos-chave da tarefa (domínio e técnicos).
2. Busque esses termos por todo o repositório.
3. Abra os arquivos mais relevantes e leia o essencial.
4. Trace dependências de entrada e de saída.
5. Marque os pontos de mudança e os pontos de extensão.
6. Resuma o mapa em poucas linhas.

# Checklist
- [ ] Termos-chave definidos.
- [ ] Busca ampla executada.
- [ ] Arquivos centrais lidos.
- [ ] Dependências traçadas.
- [ ] Pontos de mudança identificados.
- [ ] Código duplicado descartado como opção.
- [ ] Mapa resumido.

# Anti-padrões
- ❌ Editar o primeiro arquivo que parece certo.
- ❌ Ignorar quem consome o código alterado.
- ❌ Criar função nova que duplica algo existente.
- ❌ Mapear só metade do fluxo.
