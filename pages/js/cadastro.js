document.addEventListener('DOMContentLoaded', () => {
  const cadastroForm = document.getElementById('cadastroForm');
  cadastroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const result = await window.api.cadastrarUsuario(username, password);
    if (result) {
      window.location.href = 'login.html';
    } else {
      document.getElementById('error-message').innerText = 'Erro ao cadastrar usuário';
    }
  });
});
