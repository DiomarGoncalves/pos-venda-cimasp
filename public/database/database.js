const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join("\\\\192.168.1.2\\publica\\Diomar Gonçalves\\banco de dados", "PosVenda.db");
const db = new sqlite3.Database(dbPath);

// Criação das tabelas
db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON;`);

  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          senha TEXT NOT NULL,
          permissao TEXT NOT NULL DEFAULT 'padrão'
      )`);

  db.run(`CREATE TABLE IF NOT EXISTS atendimentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          telefone TEXT NOT NULL,
          nome TEXT NOT NULL,
          endereco TEXT,
          motivo TEXT NOT NULL,
          usuario_id INTEGER NOT NULL,
          data_inicio TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'aberto',
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )`);

  db.run(`CREATE TABLE IF NOT EXISTS vendas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          atendimento_id INTEGER NOT NULL,
          telefone TEXT NOT NULL,
          nome TEXT NOT NULL,
          endereco TEXT,
          motivo TEXT NOT NULL,
          usuario_id INTEGER NOT NULL,
          data_inicio TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'fechado',
          produto TEXT NOT NULL,
          preco_custo REAL NOT NULL,
          preco_venda REAL NOT NULL,
          data_venda TEXT NOT NULL,
          vendedor TEXT NOT NULL,
          cliente TEXT NOT NULL,
          nota_fiscal TEXT NOT NULL,
          pedido_venda TEXT NOT NULL,
          prazo_fabricacao TEXT NOT NULL,
          FOREIGN KEY (atendimento_id) REFERENCES atendimentos(id) ON DELETE CASCADE
      )`);

  db.run(`CREATE TABLE IF NOT EXISTS garantias (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          atendimento_id INTEGER NOT NULL,
          telefone TEXT NOT NULL,
          nome TEXT NOT NULL,
          endereco TEXT,
          motivo TEXT NOT NULL,
          usuario_id INTEGER NOT NULL,
          data_inicio TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'fechado',
          data_servico TEXT NOT NULL,
          prestador TEXT NOT NULL,
          nota TEXT,
          peca_substituida TEXT,
          valor REAL NOT NULL,
          FOREIGN KEY (atendimento_id) REFERENCES atendimentos(id) ON DELETE CASCADE
      )`);

  db.run(`CREATE TABLE IF NOT EXISTS comissoes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          venda_id INTEGER NOT NULL,
          porcentagem REAL NOT NULL,
          FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE
      )`);

  db.run(`CREATE TABLE IF NOT EXISTS historico_atendimentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          telefone TEXT NOT NULL,
          nome TEXT NOT NULL,
          endereco TEXT,
          motivo TEXT NOT NULL,
          usuario_id INTEGER NOT NULL,
          data_inicio TEXT NOT NULL,
          data_fim TEXT NOT NULL,
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )`);

  // Adicionar coluna status na tabela atendimentos se não existir
  db.run(
    `ALTER TABLE atendimentos ADD COLUMN status TEXT NOT NULL DEFAULT 'aberto'`,
    (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.error("Erro ao adicionar coluna status:", err.message);
      }
    }
  );
});

// Funções para inserir dados
function inserirUsuario(nome, senha) {
  return new Promise((resolve, reject) => {
    const permissao = nome === "admin" ? "admin,yes" : ""; // Permissões padrão
    db.run(
      `INSERT INTO usuarios (nome, senha, permissao) VALUES (?, ?, ?)`,
      [nome, senha, permissao],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

function inserirAtendimento(
  telefone,
  nome,
  endereco,
  motivo,
  usuario_id,
  data_inicio
) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO atendimentos (telefone, nome, endereco, motivo, usuario_id, data_inicio) VALUES (?, ?, ?, ?, ?, ?)`,
      [telefone, nome, endereco, motivo, usuario_id, data_inicio],
      function (err) {
        if (err) {
          reject(err);
        } else {
          console.log("Atendimento inserido com ID:", this.lastID); // Log para depuração
          resolve(this.lastID);
        }
      }
    );
  });
}

function inserirVenda(
  atendimento_id,
  telefone,
  nome,
  endereco,
  motivo,
  usuario_id,
  data_inicio,
  produto,
  preco_custo,
  preco_venda,
  data_venda,
  vendedor,
  cliente,
  nota_fiscal,
  pedido_venda,
  prazo_fabricacao
) {
  return new Promise((resolve, reject) => {
    console.log("Dados recebidos para inserir venda:", {
      atendimento_id,
      telefone,
      nome,
      endereco,
      motivo,
      usuario_id,
      data_inicio,
      produto,
      preco_custo,
      preco_venda,
      data_venda,
      vendedor,
      cliente,
      nota_fiscal,
      pedido_venda,
      prazo_fabricacao,
    }); // Log para depuração
    db.run(
      `INSERT INTO vendas (atendimento_id, telefone, nome, endereco, motivo, usuario_id, data_inicio, status, produto, preco_custo, preco_venda, data_venda, vendedor, cliente, nota_fiscal, pedido_venda, prazo_fabricacao) VALUES (?, ?, ?, ?, ?, ?, ?, 'fechado', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        atendimento_id,
        telefone,
        nome,
        endereco,
        motivo,
        usuario_id,
        data_inicio,
        produto,
        preco_custo,
        preco_venda,
        data_venda,
        vendedor,
        cliente,
        nota_fiscal,
        pedido_venda,
        prazo_fabricacao,
      ],
      function (err) {
        if (err) {
          console.error("Erro ao inserir venda Database:", err.message); // Log para depuração
          reject(err);
        } else {
          console.log("Venda inserida com ID:", this.lastID); // Log para depuração
          resolve(this.lastID);
        }
      }
    );
  });
}

function inserirGarantia(
  atendimento_id,
  telefone,
  nome,
  endereco,
  motivo,
  usuario_id,
  data_inicio,
  data_servico,
  prestador,
  nota,
  peca_substituida,
  valor
) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO garantias (atendimento_id, telefone, nome, endereco, motivo, usuario_id, data_inicio, data_servico, prestador, nota, peca_substituida, valor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        atendimento_id,
        telefone,
        nome,
        endereco,
        motivo,
        usuario_id,
        data_inicio,
        data_servico,
        prestador,
        nota,
        peca_substituida,
        valor,
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          console.log("Garantia inserida com ID:", this.lastID); // Log para depuração
          resolve(this.lastID);
        }
      }
    );
  });
}

function inserirComissao(venda_id, porcentagem) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO comissoes (venda_id, porcentagem) VALUES (?, ?)`,
      [venda_id, porcentagem],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

// Funções para listar dados
function listarUsuarios() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM usuarios`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function listarAtendimentos() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM atendimentos WHERE status = 'aberto'`,
      [],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

function listarVendas() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM vendas`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function listarGarantias() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM garantias`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function listarComissoes() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM comissoes`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function listarConfiguracoes() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM configuracoes`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function listarHistoricoAtendimentos() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM historico_atendimentos`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Funções para editar dados
function editarAtendimento(id, telefone, nome, endereco, motivo, usuario_id) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE atendimentos SET telefone = ?, nome = ?, endereco = ?, motivo = ?, usuario_id = ? WHERE id = ?`,
      [telefone, nome, endereco, motivo, usuario_id, id],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}

function editarPermissaoUsuario(id, permissao) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE usuarios SET permissao = ? WHERE id = ?`,
      [permissao, id],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
}

// Funções para excluir dados
function excluirAtendimento(id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM atendimentos WHERE id = ?`,
      [id],
      function (err, row) {
        if (err) {
          reject(err);
        } else {
          const data_fim = new Date().toLocaleString();
          db.run(
            `INSERT INTO historico_atendimentos (telefone, nome, endereco, motivo, usuario_id, data_inicio, data_fim) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              row.telefone,
              row.nome,
              row.endereco,
              row.motivo,
              row.usuario_id,
              row.data_inicio,
              data_fim,
            ],
            function (err) {
              if (err) {
                reject(err);
              } else {
                db.run(
                  `DELETE FROM atendimentos WHERE id = ?`,
                  [id],
                  function (err) {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(this.changes);
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  });
}

function excluirVenda(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM vendas WHERE id = ?`, [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

function excluirConfiguracao(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM configuracoes WHERE id = ?`, [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

// Função para autenticar usuário
function autenticarUsuario(username, password) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM usuarios WHERE nome = ? AND senha = ?`,
      [username, password],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

// Função para obter permissões de usuário
function obterPermissaoUsuario(username, permissao) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM usuarios WHERE nome = ? AND permissao LIKE ?`,
      [username, `%${permissao}%`],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
}

function salvarConfiguracao(usuario, acesso) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO configuracoes (usuario, acesso) VALUES (?, ?)`,
      [usuario, acesso],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

module.exports = {
  inserirUsuario,
  inserirAtendimento,
  inserirVenda,
  inserirGarantia,
  inserirComissao,
  listarUsuarios,
  listarAtendimentos,
  listarVendas,
  listarGarantias,
  listarComissoes,
  listarConfiguracoes,
  listarHistoricoAtendimentos,
  editarAtendimento,
  excluirAtendimento,
  excluirVenda,
  excluirConfiguracao,
  autenticarUsuario,
  obterPermissaoUsuario,
  salvarConfiguracao,
  editarPermissaoUsuario,
};
