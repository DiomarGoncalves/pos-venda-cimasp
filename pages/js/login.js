document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await window.api.login(username, password);
            if (response.success) {
                console.log('Login com username:', username);
                // Redirecionar para a página principal
                window.location.href = 'assistenciaTecnica.html';
            } else {
                alert('Usuário ou senha inválidos.');
            }
        } catch (error) {
            console.error('Erro ao realizar login:', error);
        }
    });
});