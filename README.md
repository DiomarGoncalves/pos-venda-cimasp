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

## Funcionalidades

- Gerenciamento de assistência técnica com campos essenciais.
- Gerenciamento de anexos com upload e visualização.
- **Gerenciamento de permissões de usuários**: Controle de acesso por níveis de permissão.
- **Navegação pelo menu do Electron**: Acesse rapidamente as páginas do sistema pelo menu superior.

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).