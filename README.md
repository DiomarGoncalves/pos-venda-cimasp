# Sistema de Ponto de Venda

Este projeto é um sistema de ponto de venda para gerenciamento de vendas, clientes e produtos. A aplicação foi desenvolvida utilizando Electron e possui uma interface em modo escuro para melhor visibilidade.

## Estrutura do Projeto

O projeto é organizado da seguinte forma:

- **pages/**: Contém os arquivos HTML, CSS e JavaScript para a interface do usuário.
  - **css/**: Estilos da aplicação.
    - `style.css`: Estilos principais, incluindo tema escuro.
    - `styles.css`: Estilo adicional (atualmente vazio).
  - **html/**: Páginas da aplicação.
    - `atendimento.html`: Tela para inserção de atendimentos.
    - `comissao.html`: Tela para cálculo de comissões.
    - `configuracao.html`: Tela de configuração para administradores.
    - `garantia.html`: Tela para gerenciamento de garantias.
    - `index.html`: Página inicial do sistema.
    - `login.html`: Tela de login.
    - `venda.html`: Tela para exibição de vendas.
  - **js/**: Scripts JavaScript para interatividade.
    - `renderer.js`: Gerencia a interação do usuário com a interface.

- **public/**: Contém arquivos de configuração e lógica de banco de dados.
  - **database/**: Scripts para interação com o banco de dados.
    - `database.js`: Lógica de operações CRUD.
  - `main.js`: Ponto de entrada da aplicação Electron.
  - `preload.js`: Pré-carregamento de scripts e configurações.

- **package.json**: Configurações do projeto, incluindo dependências e scripts.
- **forge.config.js**: Configuração para o Electron Forge.
- **.hintrc**: Configurações para linting do projeto.
- **.gitignore**: Arquivos e diretórios a serem ignorados pelo Git.
- **.gitattributes**: Atributos específicos para arquivos no repositório Git.

## Como Executar

1. Clone o repositório:
   ```
   git clone <URL do repositório>
   ```

2. Navegue até o diretório do projeto:
   ```
   cd sistema-pos-venda
   ```

3. Instale as dependências:
   ```
   npm install
   ```

4. Inicie a aplicação:
   ```
   npm start
   ```

## Funcionalidades

- Tela de atendimento para registrar contatos e gerenciar chamados.
- Tela de vendas para exibir e gerenciar vendas realizadas.
- Tela de garantias para gerenciar informações de garantia.
- Tela de comissões para calcular e gerenciar comissões de vendas.
- Tela de configuração para administradores ajustarem parâmetros do sistema.
- Exportação de listas em formatos Excel e PDF.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Licença

Este projeto está licenciado sob a [MIT License](LICENSE).