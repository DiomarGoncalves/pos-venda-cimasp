const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join("\\\\192.168.1.2\\publica\\POS-VENDAS\\sistema\\banco de dados", "PosVenda.db");
const db = new sqlite3.Database(dbPath);

// const dbPath = path.join("\\\\192.168.1.2\\publica\\Diomar Gonçalves\\banco de dados", "PosVenda.db"); // link do banco de dados do servidor fisico

db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON;`);

  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          senha TEXT NOT NULL,
          permissao TEXT NOT NULL DEFAULT 'padrão'
      )`);

  db.run(`CREATE TABLE IF NOT EXISTS assistencias (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          of TEXT NOT NULL,
          equipamento TEXT NOT NULL,
          chassi TEXT NOT NULL,
          cliente TEXT NOT NULL,
          dataFabricacao TEXT NOT NULL,
          dataAberturaChamado TEXT NOT NULL,
          tecnico TEXT NOT NULL,
          tipoAssistencia TEXT NOT NULL,
          localAssistencia TEXT NOT NULL,
          contato TEXT NOT NULL,
          telefone TEXT NOT NULL,
          problemaApresentado TEXT NOT NULL,
          fornecedor TEXT NOT NULL,
          peca TEXT NOT NULL,
          observacoes TEXT NOT NULL,
          dataAtendimento TEXT NOT NULL,
          tecnicoResponsavel TEXT NOT NULL,
          custoPecaMaoObra REAL NOT NULL,
          custoViagemFrete REAL NOT NULL,
          devolucaoPeca TEXT NOT NULL,
          garantiaFornecedor TEXT NOT NULL,
          solucaoTecnica TEXT NOT NULL
      )`);

  db.run(`CREATE TABLE IF NOT EXISTS equipamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL
      )`);

  db.run(`CREATE TABLE IF NOT EXISTS vendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedidoNectar TEXT NOT NULL,
    numeroNota TEXT NOT NULL,
    produto TEXT NOT NULL,
    valor REAL NOT NULL,
    dataCotacao TEXT NOT NULL,
    dataVenda TEXT NOT NULL,
    vendedor TEXT NOT NULL,
    situacao TEXT NOT NULL DEFAULT 'Em Cotação',
    cliente TEXT
  )`);
});

function inserirUsuario(nome, senha) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO usuarios (nome, senha, permissao) VALUES (?, ?, ?)`,
      [nome, senha, "padrão"],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function autenticarUsuario(username, password) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM usuarios WHERE nome = ? AND senha = ?`,
      [username, password],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function listarUsuarios() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM usuarios`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function inserirAssistencia(assistencia) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO assistencias (
      of, equipamento, chassi, cliente, dataFabricacao, dataAberturaChamado, tecnico, tipoAssistencia, localAssistencia, contato, telefone, problemaApresentado, fornecedor, peca, observacoes, dataAtendimento, tecnicoResponsavel, custoPecaMaoObra, custoViagemFrete, devolucaoPeca, garantiaFornecedor, solucaoTecnica
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      assistencia.of,
      assistencia.equipamento,
      assistencia.chassi,
      assistencia.cliente,
      assistencia.dataFabricacao,
      assistencia.dataAberturaChamado,
      assistencia.tecnico,
      assistencia.tipoAssistencia,
      assistencia.localAssistencia,
      assistencia.contato,
      assistencia.telefone,
      assistencia.problemaApresentado,
      assistencia.fornecedor,
      assistencia.peca,
      assistencia.observacoes,
      assistencia.dataAtendimento,
      assistencia.tecnicoResponsavel,
      assistencia.custoPecaMaoObra,
      assistencia.custoViagemFrete,
      assistencia.devolucaoPeca,
      assistencia.garantiaFornecedor,
      assistencia.solucaoTecnica
    ];
    db.run(query, values, function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function listarAssistencias() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM assistencias`, [], (err, rows) => {
      if (err) {
        console.error('Erro ao listar assistências:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function editarAssistencia(id, assistencia) {
  return new Promise((resolve, reject) => {
    const query = `UPDATE assistencias SET of = ?, equipamento = ?, chassi = ?, cliente = ?, dataFabricacao = ?, dataAberturaChamado = ?, tecnico = ?, tipoAssistencia = ?, localAssistencia = ?, contato = ?, telefone = ?, problemaApresentado = ?, fornecedor = ?, peca = ?, observacoes = ?, dataAtendimento = ?, tecnicoResponsavel = ?, custoPecaMaoObra = ?, custoViagemFrete = ?, devolucaoPeca = ?, garantiaFornecedor = ?, solucaoTecnica = ? WHERE id = ?`;
    const values = [...Object.values(assistencia), id];
    db.run(query, values, function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

function excluirAssistencia(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM assistencias WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

function inserirEquipamento(nome) {
  return new Promise((resolve, reject) => {
    db.run(`INSERT INTO equipamentos (nome) VALUES (?)`, [nome], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function listarEquipamentos() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM equipamentos`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function excluirEquipamento(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM equipamentos WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

function editarPermissaoUsuario(userId, permissao) {
  return new Promise((resolve, reject) => {
    const query = `UPDATE usuarios SET permissao = ? WHERE id = ?`;
    db.run(query, [permissao, userId], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

function inserirVenda(venda) {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO vendas (pedidoNectar, numeroNota, produto, valor, dataCotacao, dataVenda, vendedor, situacao, cliente) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      venda.pedidoNectar,
      venda.numeroNota,
      venda.produto,
      venda.valor,
      venda.dataCotacao,
      venda.dataVenda,
      venda.vendedor,
      venda.situacao || 'Em Cotação',
      venda.cliente || ''
    ];
    db.run(query, values, function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
}

function listarVendas() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT *, (valor * 0.025) as comissao FROM vendas`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function editarVenda(id, venda) {
  return new Promise((resolve, reject) => {
    const query = `UPDATE vendas SET pedidoNectar = ?, numeroNota = ?, produto = ?, valor = ?, dataCotacao = ?, dataVenda = ?, vendedor = ?, situacao = ?, cliente = ? WHERE id = ?`;
    const values = [
      venda.pedidoNectar,
      venda.numeroNota,
      venda.produto,
      venda.valor,
      venda.dataCotacao,
      venda.dataVenda,
      venda.vendedor,
      venda.situacao,
      venda.cliente || '',
      id
    ];
    db.run(query, values, function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

function excluirVenda(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM vendas WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

module.exports = {
  inserirUsuario,
  autenticarUsuario,
  listarUsuarios,
  inserirAssistencia,
  listarAssistencias,
  editarAssistencia,
  excluirAssistencia,
  inserirEquipamento,
  listarEquipamentos,
  excluirEquipamento,
  editarPermissaoUsuario,
  inserirVenda,
  listarVendas,
  editarVenda,
  excluirVenda,
};
