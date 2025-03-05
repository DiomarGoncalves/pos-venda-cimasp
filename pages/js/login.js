document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const result = await window.api.login(username, password);
        if (result.success) {
          window.location.href = 'index.html';
        } else {
          document.getElementById('error-message').innerText = 'Usuário ou senha incorretos';
        }
      });
    }
});