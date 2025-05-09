document.addEventListener('DOMContentLoaded', () => {
  const cadastroForm = document.getElementById('cadastroForm');

  cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      showMessage('As senhas não coincidem!', 'error');
      return;
    }

    const result = await window.api.cadastrarUsuario(username, password);
    if (result) {
      showMessage('Usuário cadastrado com sucesso!', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      showMessage('Erro ao cadastrar usuário!', 'error');
    }
  });
});
