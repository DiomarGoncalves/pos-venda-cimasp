document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const result = await window.api.login(username, password);
        if (result.success) {
          const isAdmin = await window.api.verificarPermissao(username, 'comissão');
          if (isAdmin) {
            const vendas = await window.api.listarVendas();
            vendas.forEach(venda => {
              const prazo = new Date(venda.prazo_fabricacao);
              const hoje = new Date();
              const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
              if (diasRestantes > 0) {
                alert(`Faltam ${diasRestantes} dias para entregar o produto ${venda.produto}`);
              }
            });
            window.location.href = 'comissao.html';
          } else {
            document.getElementById('error-message').innerText = 'Permissão de administrador necessária';
          }
        } else {
          document.getElementById('error-message').innerText = 'Usuário ou senha incorretos';
        }
      });
    }
});