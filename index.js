const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const SECRET = 'segreto-seguro'; 

app.use(express.json());
app.use(cors());

var mysql = require('mysql2');

// Conexão do banco
var conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "pucPR@1234",
    database: "shopping_oasis",
    port: "3306"
});

conn.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

// Middleware 
const adminMiddleware = async (req, res, next) => {
    try {
        const [users] = await conn.promise().execute(
            'SELECT tipo FROM usuarios WHERE id = ?',
            [req.userId]
        );
        if (users.length > 0 && users[0].tipo === 'admin') {
            return next();
        }
        res.status(403).json({ error: 'Acesso negado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  
    jwt.verify(token, SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Token inválido' });
      req.user = user;
      next();
    });
  }
  

// --- ROTAS USUARIO

app.get('/api/usuario', function (req, res) {
    let sql = "SELECT u.id, u.nome FROM usuarios u";
    conn.query(sql, function (err, result) {
        if (err) return res.status(500).json(err);
        res.status(200).json(result);
    });
});

app.post('/api/usuario', function (req, res) {
    var usuario = req.body;
    if (usuario.id) {
        sql = "UPDATE usuarios SET nome = ? WHERE id = ?";
        conn.query(sql, [usuario.nome, usuario.id], function (err, result) {
            if (err) return res.status(500).json(err);
            res.status(201).json(usuario);
        });
    } else {
        sql = "INSERT INTO usuarios (nome) VALUES (?)";
        conn.query(sql, [usuario.nome], function (err, result) {
            if (err) return res.status(500).json(err);
            usuario.id = result.insertId;
            res.status(201).json(usuario);
        });
    }
});

app.get('/api/usuario/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT id, nome, email, senha FROM usuarios WHERE id = ?";
    conn.query(sql, [id], function (err, result) {
        if (err) return res.status(500).json(err);
        if (result.length === 0) return res.status(404).json({ error: "Usuário não encontrado." });
        res.status(200).json(result[0]);
    });
});

app.put('/api/usuario/:id', (req, res) => {
    const { id } = req.params;
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    bcrypt.hash(senha, saltRounds, (err, hash) => {
        if (err) return res.status(500).json({ error: "Erro ao criptografar a senha." });

        const sql = "UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?";
        conn.query(sql, [nome, email, hash, id], function (err, result) {
            if (err) return res.status(500).json(err);
            res.status(200).json({ message: "Usuário atualizado com sucesso!" });
        });
    });
});


app.delete('/api/usuario/:id', function (req, res) {
    const { id } = req.params;
    let sql = "DELETE FROM usuarios WHERE id = ?";
    conn.query(sql, [id], function (err, result) {
        if (err) return res.status(500).json(err);
        res.status(200).json({ message: 'Usuário deletado com sucesso!' });
    });
});
//rota protegida ADM
app.get('/api/admin/dashboard', verificarToken, (req, res) => {
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    res.json({ msg: 'Bem-vindo, admin!' });
  });
  app.get('/api/stats/usuarios', (req, res) => {
    const sql = "SELECT COUNT(*) AS total FROM usuarios";
    conn.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result[0]);
    });
});
  
// ---ROTAS LOJAS---

app.get('/api/loja', function (req, res) {
    let sql = "SELECT * FROM lojas";
    const { status } = req.query;
    if (status) {
        sql += " WHERE status = ?";
        conn.query(sql, [status], function (err, result) {
            if (err) return res.status(500).json(err);
            res.status(200).json(result);
        });
    } else {
        conn.query(sql, function (err, result) {
            if (err) return res.status(500).json(err);
            res.status(200).json(result);
        });
    }
});

app.post('/api/loja', function (req, res) {
    var loja = req.body;
    if (loja.id) {
        sql = "UPDATE lojas SET nome = ? WHERE id = ?";
        conn.query(sql, [loja.nome, loja.id], function (err, result) {
            if (err) return res.status(500).json(err);
            res.status(201).json(loja);
        });
    } else {
        sql = "INSERT INTO lojas (nome) VALUES (?)";
        conn.query(sql, [loja.nome], function (err, result) {
            if (err) return res.status(500).json(err);
            loja.id = result.insertId;
            res.status(201).json(loja);
        });
    }
});

app.get('/api/loja/:id', (req, res) => {
    const { id } = req.params;
    let sql = "SELECT l.id, l.nome FROM lojas l WHERE l.id = ?";
    conn.query(sql, [id], function (err, result) {
        if (err) return res.status(500).json(err);
        res.status(200).json(result[0]);
    });
});

app.delete('/api/loja/:id', function (req, res) {
    const { id } = req.params;
    let sql = "DELETE FROM lojas WHERE id = ?";
    conn.query(sql, [id], function (err, result) {
        if (err) return res.status(500).json(err);
        res.status(200).json({ message: 'Loja deletada com sucesso!' });
    });
});
app.get('/api/stats/lojas', (req, res) => {
    const sql = "SELECT COUNT(*) AS total FROM lojas WHERE status = 'aprovado'";
    conn.query(sql, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(result[0]);
    });
});

// ---ROTAS EVENTOS---

app.get('/api/evento', function (req, res) {
    let sql = "SELECT * FROM eventos";
    const { status } = req.query;
    if (status) {
        sql += " WHERE status = ?";
        conn.query(sql, [status], function (err, result) {
            if (err) return res.status(500).json(err);
            res.status(200).json(result);
        });
    } else {
        conn.query(sql, function (err, result) {
            if (err) return res.status(500).json(err);
            res.status(200).json(result);
        });
    }
});


app.post('/api/evento', function (req, res) {
    var evento = req.body;
    if (evento.id) {
        sql = "UPDATE eventos SET nome = ? WHERE id = ?";
        conn.query(sql, [evento.nome, evento.id], function (err, result) {
            if (err) return res.status(500).json(err);
            res.status(201).json(evento);
        });
    } else {
        sql = "INSERT INTO eventos (nome) VALUES (?)";
        conn.query(sql, [evento.nome], function (err, result) {
            if (err) return res.status(500).json(err);
            evento.id = result.insertId;
            res.status(201).json(evento);
        });
    }
});

app.get('/api/evento/:id', (req, res) => {
    const { id } = req.params;
    let sql = "SELECT e.id, e.nome FROM eventos e WHERE e.id = ?";
    conn.query(sql, [id], function (err, result) {
        if (err) return res.status(500).json(err);
        res.status(200).json(result[0]);
    });
});

app.delete('/api/evento/:id', function (req, res) {
    const { id } = req.params;
    let sql = "DELETE FROM eventos WHERE id = ?";
    conn.query(sql, [id], function (err, result) {
        if (err) return res.status(500).json(err);
        res.status(200).json({ message: 'Evento deletado com sucesso!' });
    });
});

// =================== INICIAR SERVIDOR ====================

app.listen(PORT, function (err) {
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});
app.post('/api/login', function (req, res) {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({ error: 'Usuário e senha obrigatórios' });
    }

    const sql = "SELECT * FROM usuarios WHERE nome = ?";
    conn.query(sql, [usuario], function (err, result) {
        if (err) return res.status(500).json({ error: err.message });

        if (result.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const usuarioDB = result[0];

        bcrypt.compare(senha, usuarioDB.senha, (err, match) => {
            if (err) return res.status(500).json({ error: err.message });

            if (match) {
                const token = jwt.sign(
                    { id: usuarioDB.id, tipo: usuarioDB.tipo },
                    SECRET,
                    { expiresIn: '1h' }
                  );
                  
                  res.status(200).json({
                    message: 'Login bem-sucedido',
                    token,
                    user: { id: usuarioDB.id, nome: usuarioDB.nome, tipo: usuarioDB.tipo }
                  });
                  
            } else {
                res.status(401).json({ error: 'Credenciais inválidas' });
            }
        });
    });
});

//ROTA PARA o CADASTRO
app.post('/api/cadastro', function (req, res) {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ error: "Campos obrigatórios não preenchidos." });
    }

    bcrypt.hash(senha, saltRounds, (err, hash) => {
        if (err) return res.status(500).json({ error: "Erro ao gerar hash da senha." });

        const sql = "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)";
        conn.query(sql, [nome, email, hash], function (err, result) {
            if (err) return res.status(500).json({ error: err.message });

            res.status(201).json({ message: "Usuário cadastrado com sucesso!", id: result.insertId });
        });
    });
});
