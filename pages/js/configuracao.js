document.addEventListener('DOMContentLoaded', async () => {
  const userForm = document.getElementById('userForm');
  const userList = document.getElementById('userList');
  const usernameSelect = document.getElementById('username');

  async function carregarUsuarios() {
    const usuarios = await window.api.listarUsuarios();
    userList.innerHTML = ''; // Limpar a lista antes de carregar
    usernameSelect.innerHTML = '<option value="">Selecione um usuário</option>'; // Limpar a lista suspensa antes de carregar
    usuarios.forEach(adicionarUsuario);
  }

  function adicionarUsuario(usuario) {
    const row = userList.insertRow();
    row.insertCell(0).innerText = usuario.nome;
    row.insertCell(1).innerText = usuario.permissao;
    const option = document.createElement('option');
    option.value = usuario.id;
    option.text = usuario.nome;
    usernameSelect.appendChild(option);
  }

  if (usernameSelect) {
    usernameSelect.addEventListener('change', async () => {
      const userId = usernameSelect.value;
      if (userId) {
        const usuarios = await window.api.listarUsuarios();
        const usuario = usuarios.find(u => u.id == userId);
        if (usuario) {
          const [userAccess, commissionAccess] = usuario.permissao.split(',');
          document.getElementById('userAccess').value = userAccess;
          document.getElementById('commissionAccess').value = commissionAccess;
        }
      }
    });
  }

  if (userForm) {
    userForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(userForm);
      const userId = formData.get('username');
      const permissao = `${formData.get('userAccess')},${formData.get('commissionAccess')}`;
      await window.api.editarPermissaoUsuario(userId, permissao);
      carregarUsuarios();
    });
  }

  await carregarUsuarios();
});
