const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Criação das tabelas
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        senha TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS atendimentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telefone TEXT NOT NULL,
        nome TEXT NOT NULL,
        endereco TEXT,
        motivo TEXT NOT NULL,
        usuario_id INTEGER NOT NULL,
        data_inicio TEXT NOT NULL,
        anexos TEXT,
        status TEXT NOT NULL DEFAULT 'aberto',
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
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
        anexos TEXT,
        status TEXT NOT NULL DEFAULT 'fechado',
        produto TEXT NOT NULL,
        preco_custo REAL NOT NULL,
        preco_venda REAL NOT NULL,
        data_venda TEXT NOT NULL,
        vendedor TEXT NOT NULL,
        FOREIGN KEY (atendimento_id) REFERENCES atendimentos(id)
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
        anexos TEXT,
        status TEXT NOT NULL DEFAULT 'fechado',
        data_servico TEXT NOT NULL,
        prestador TEXT NOT NULL,
        FOREIGN KEY (atendimento_id) REFERENCES atendimentos(id)
    )`);

    // Adicionar coluna status na tabela atendimentos se não existir
    db.run(`ALTER TABLE atendimentos ADD COLUMN status TEXT NOT NULL DEFAULT 'aberto'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Erro ao adicionar coluna status:', err.message);
        }
    });
});

// Funções para inserir dados
function inserirUsuario(nome, senha) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO usuarios (nome, senha) VALUES (?, ?)`, [nome, senha], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

function inserirAtendimento(telefone, nome, endereco, motivo, usuario_id, data_inicio, anexos) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO atendimentos (telefone, nome, endereco, motivo, usuario_id, data_inicio, anexos) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [telefone, nome, endereco, motivo, usuario_id, data_inicio, anexos], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log('Atendimento inserido com ID:', this.lastID); // Log para depuração
                    resolve(this.lastID);
                }
            });
    });
}

function inserirVenda(atendimento_id, telefone, nome, endereco, motivo, usuario_id, data_inicio, anexos, produto, preco_custo, preco_venda, data_venda, vendedor) {
    return new Promise((resolve, reject) => {
        console.log('Dados recebidos para inserir venda:', { atendimento_id, telefone, nome, endereco, motivo, usuario_id, data_inicio, anexos, produto, preco_custo, preco_venda, data_venda, vendedor }); // Log para depuração
        db.run(`INSERT INTO vendas (atendimento_id, telefone, nome, endereco, motivo, usuario_id, data_inicio, anexos, produto, preco_custo, preco_venda, data_venda, vendedor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [atendimento_id, telefone, nome, endereco, motivo, usuario_id, data_inicio, anexos, produto, preco_custo, preco_venda, data_venda, vendedor], function(err) {
                if (err) {
                    console.error('Erro ao inserir venda:', err.message); // Log para depuração
                    reject(err);
                } else {
                    console.log('Venda inserida com ID:', this.lastID); // Log para depuração
                    resolve(this.lastID);
                }
            });
    });
}

function inserirGarantia(atendimento_id, telefone, nome, endereco, motivo, usuario_id, data_inicio, anexos, data_servico, prestador) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO garantias (atendimento_id, telefone, nome, endereco, motivo, usuario_id, data_inicio, anexos, data_servico, prestador) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [atendimento_id, telefone, nome, endereco, motivo, usuario_id, data_inicio, anexos, data_servico, prestador], function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log('Garantia inserida com ID:', this.lastID); // Log para depuração
                    resolve(this.lastID);
                }
            });
    });
}

function inserirAnexos(id, anexosStr) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE vendas SET anexos = ? WHERE id = ?`, [anexosStr, id], function(err) {
            if (err) {
                reject(err);
            } else {
                console.log('Anexos inseridos com sucesso para venda com ID:', id); // Log para depuração
                resolve(this.changes);
            }
        });
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
        db.all(`SELECT * FROM atendimentos WHERE status = 'aberto'`, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
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

// Funções para editar dados
function editarAtendimento(id, telefone, nome, endereco, motivo, usuario_id, anexos) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE atendimentos SET telefone = ?, nome = ?, endereco = ?, motivo = ?, usuario_id = ?, anexos = ? WHERE id = ?`,
            [telefone, nome, endereco, motivo, usuario_id, anexos, id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            });
    });
}

// Funções para excluir dados
function excluirAtendimento(id) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM atendimentos WHERE id = ?`, [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

function excluirVenda(id) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM vendas WHERE id = ?`, [id], function(err) {
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
        db.get(`SELECT * FROM usuarios WHERE nome = ? AND senha = ?`, [username, password], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

module.exports = {
    inserirUsuario,
    inserirAtendimento,
    inserirVenda,
    inserirGarantia,
    inserirAnexos,
    listarUsuarios,
    listarAtendimentos,
    listarVendas,
    listarGarantias,
    editarAtendimento,
    excluirAtendimento,
    excluirVenda,
    autenticarUsuario
};