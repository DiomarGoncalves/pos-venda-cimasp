# Sistema de Assistência Técnica

Este projeto é um sistema simplificado para gerenciamento de assistência técnica e anexos.

## Estrutura do Projeto

O projeto é organizado da seguinte forma:

- **pages/**: Contém os arquivos HTML, CSS e JavaScript para a interface do usuário.
  - **html/**: Páginas da aplicação.
    - `assistenciaTecnica.html`: Tela para gerenciar assistência técnica.
    - `anexos.html`: Tela para gerenciar anexos.
  - **js/**: Scripts JavaScript para interatividade.
    - `assistenciaTecnica.js`: Gerencia a interação do usuário com a tela de assistência técnica.
    - `anexos.js`: Gerencia a interação do usuário com a tela de anexos.

- **public/**: Contém arquivos de configuração e lógica de banco de dados.
  - **database/**: Scripts para interação com o banco de dados.
    - `database.js`: Lógica de operações CRUD.
  - `main.js`: Ponto de entrada da aplicação Electron.
  - `preload.js`: Pré-carregamento de scripts e configurações.

- **package.json**: Configurações do projeto, incluindo dependências e scripts.

## Como Executar

1. Clone o repositório:
   ```bash
   git clone <URL do repositório>
   ```

2. Navegue até o diretório do projeto:
   ```bash
   cd sistema-assistencia-tecnica
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```

4. Inicie a aplicação:
   ```bash
   npm start
   ```

## Sistema de Atualização Automática

O sistema possui atualização automática integrada que:

- Verifica atualizações automaticamente a cada 10 minutos
- Baixa atualizações em segundo plano
- Notifica o usuário quando uma atualização está pronta
- Permite instalação imediata ou adiada
- Funciona através do GitHub Releases (via Electron Forge Publisher)

### Para Desenvolvedores

Para publicar uma nova versão:

1. Atualize a versão no `package.json`
2. Faça commit das mudanças
3. Execute: `npm run make` (gera os instaladores)
4. Execute: `npm run publish` (publica no GitHub Releases)
5. Ou use: `npm run make-and-publish` (faz tudo de uma vez)

### Configuração do GitHub

1. Crie um Personal Access Token no GitHub:
   - Vá em https://github.com/settings/tokens
   - Clique "Generate new token" → "Fine-grained token"
   - Selecione o repositório do projeto
   - Permissões: Contents (Read and Write), Metadata (Read-only)

2. Configure o token no ambiente:
   - Windows: `setx GITHUB_TOKEN "SEU_TOKEN_AQUI"`
   - Linux/macOS: `export GITHUB_TOKEN="SEU_TOKEN_AQUI"`

3. O Electron Forge irá automaticamente:
   - Criar uma release no GitHub
   - Anexar os instaladores gerados
   - Gerar notas de release automaticamente

## Funcionalidades

- Gerenciamento de assistência técnica com campos essenciais.
- Gerenciamento de anexos com upload e visualização.
- Sistema de atualização automática
- Notificações de novas versões
- Cache local com sincronização

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).