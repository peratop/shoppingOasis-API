const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const SECRET = 'segreto-seguro'; 
const router = express.Router();

app.use('/api', router);
app.use(express.json({ limit: '10mb' }));
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
    const { nome, email, senha, senhaAtual } = req.body;

    if (!nome || !email || !senhaAtual) {
        return res.status(400).json({ error: "Nome, email e senha atual são obrigatórios." });
    }

    // Busca o hash da senha atual no banco
    const sqlBusca = "SELECT senha FROM usuarios WHERE id = ?";
    conn.query(sqlBusca, [id], function (err, result) {
        if (err) return res.status(500).json({ error: "Erro ao buscar usuário." });
        if (result.length === 0) return res.status(404).json({ error: "Usuário não encontrado." });

        const hashSalvo = result[0].senha;
        bcrypt.compare(senhaAtual, hashSalvo, (err, match) => {
            if (err) return res.status(500).json({ error: "Erro ao validar senha." });
            if (!match) return res.status(401).json({ error: "Senha atual incorreta." });

            // Se o usuário quer trocar a senha
            if (senha) {
                bcrypt.hash(senha, saltRounds, (err, hash) => {
                    if (err) return res.status(500).json({ error: "Erro ao criptografar a nova senha." });
                    const sql = "UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?";
                    conn.query(sql, [nome, email, hash, id], function (err, result) {
                        if (err) return res.status(500).json(err);
                        res.status(200).json({ message: "Usuário atualizado com sucesso!" });
                    });
                });
            } else {
                // Só atualiza nome/email
                const sql = "UPDATE usuarios SET nome = ?, email = ? WHERE id = ?";
                conn.query(sql, [nome, email, id], function (err, result) {
                    if (err) return res.status(500).json(err);
                    res.status(200).json({ message: "Usuário atualizado com sucesso!" });
                });
            }
        });
    });
});

// Deletar usuário
app.delete('/api/usuario/:id', function (req, res) {
    const { id } = req.params;
    const sql = "DELETE FROM usuarios WHERE id = ?";
    conn.query(sql, [id], function (err, result) {
        if (err) return res.status(500).json({ error: err.message });
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
  
// --- ROTAS LOJAS ---

// Rota GET para todas as lojas (aprovadas)
app.get('/api/loja', async (req, res) => {
    try {
        const [lojas] = await conn.promise().query(`
            SELECT 
                id,
                nome_negocio,
                categoria,
                email,
                telefone,
                descricao,
                imagem_blob,
                status
            FROM lojas
            WHERE status = 'aprovado'
        `);

        const lojasComImagens = lojas.map(loja => ({
            ...loja,
            imagem_base64: loja.imagem_blob ? loja.imagem_blob.toString('base64') : null
        }));

        res.status(200).json(lojasComImagens);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar lojas" });
    }
});

// Rota POST para criar/atualizar lojas
app.post('/api/loja', async (req, res) => {
    try {
        const loja = req.body;
        let sql, params;

        if (loja.id) {
            sql = "UPDATE lojas SET nome_negocio = ?, cnpj = ?, telefone = ?, email = ?, descricao = ?, categoria = ?, status = ? WHERE id = ?";
            params = [
                loja.nome_negocio,
                loja.cnpj,
                loja.telefone,
                loja.email,
                loja.descricao,
                loja.categoria,
                loja.status || 'pendente',
                loja.id
            ];
        } else {
            sql = "INSERT INTO lojas (nome_negocio, cnpj, telefone, email, descricao, categoria, status, id_usuario_solicitante) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            params = [
                loja.nome_negocio,
                loja.cnpj,
                loja.telefone,
                loja.email,
                loja.descricao,
                loja.categoria,
                loja.status || 'pendente',
                loja.id_usuario_solicitante || 1
            ];
        }

        const [result] = await conn.promise().query(sql, params);
        const lojaId = loja.id || result.insertId;

        if (loja.imagem_base64) {
            const imagemBuffer = Buffer.from(loja.imagem_base64, 'base64');
            await conn.promise().query(
                'UPDATE lojas SET imagem_blob = ? WHERE id = ?',
                [imagemBuffer, lojaId]
            );
        }

        const [lojaAtualizada] = await conn.promise().query('SELECT * FROM lojas WHERE id = ?', [lojaId]);
        res.status(201).json(lojaAtualizada[0]);
    } catch (error) {
        console.error("Erro ao salvar loja:", error);
        res.status(500).json({ error: "Erro ao salvar loja" });
    }
});

app.listen(PORT, function (err) {
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});

// Rota GET para loja específica
router.get('/api/loja/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [lojas] = await conn.promise().query('SELECT * FROM lojas WHERE id = ?', [id]);

        if (lojas.length === 0) {
            return res.status(404).json({ error: 'Loja não encontrada' });
        }

        const loja = {
            ...lojas[0],
            imagem_base64: lojas[0].imagem_blob ? lojas[0].imagem_blob.toString('base64') : null
        };

        res.status(200).json(loja);
    } catch (error) {
        console.error("Erro ao buscar loja:", error);
        res.status(500).json({ error: "Erro ao buscar loja" });
    }
});

// ---ROTAS EVENTOS---

app.get('/api/evento', async (req, res) => {
  try {
    const [eventos] = await conn.promise().query(`
      SELECT 
        id,
        nome_evento,
        email_contato,
        data_inicio,
        data_fim,
        imagem_blob,
        status,
        DATE_FORMAT(data_inicio, '%d/%m/%Y') as data_inicio_formatada,
        DATE_FORMAT(data_fim, '%d/%m/%Y') as data_fim_formatada,
        descricao
      FROM eventos
      WHERE status = 'aprovado'
    `);

    const eventosComImagens = eventos.map(evento => ({
      ...evento,
      imagem_base64: evento.imagem_blob ? evento.imagem_blob.toString('base64') : null
    }));

    res.status(200).json(eventosComImagens);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar eventos" });
  }
});

// Rota POST para criar/atualizar eventos
router.post('/api/evento', async (req, res) => {
  try {
    const evento = req.body;
    let sql, params;

    if (evento.id) {
      sql = "UPDATE eventos SET nome_evento = ?, email_contato = ?, data_inicio = ?, data_fim = ?, horario_inicio = ?, horario_fim = ?, piso = ?, tipo_evento = ?, descricao = ?, status = ? WHERE id = ?";
      params = [
        evento.nome_evento,
        evento.email_contato,
        evento.data_inicio,
        evento.data_fim,
        evento.horario_inicio,
        evento.horario_fim,
        evento.piso,
        evento.tipo_evento,
        evento.descricao,
        evento.status,
        evento.id
      ];
    } else {
      sql = "INSERT INTO eventos (nome_evento, email_contato, data_inicio, data_fim, horario_inicio, horario_fim, piso, tipo_evento, descricao, status, id_usuario_solicitante) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      params = [
        evento.nome_evento,
        evento.email_contato,
        evento.data_inicio,
        evento.data_fim,
        evento.horario_inicio,
        evento.horario_fim,
        evento.piso,
        evento.tipo_evento,
        evento.descricao,
        evento.status || 'pendente',
        evento.id_usuario_solicitante || 1
      ];
    }

    const [result] = await conn.promise().query(sql, params);
    const eventoId = evento.id || result.insertId;

    // Se tiver imagem para upload
    if (evento.imagem_base64) {
      const imagemBuffer = Buffer.from(evento.imagem_base64, 'base64');
      await conn.promise().query(
        'UPDATE eventos SET imagem_blob = ? WHERE id = ?',
        [imagemBuffer, eventoId]
      );
    }

    const [eventoAtualizado] = await conn.promise().query('SELECT * FROM eventos WHERE id = ?', [eventoId]);
    res.status(201).json(eventoAtualizado[0]);
  } catch (error) {
    console.error("Erro ao salvar evento:", error);
    res.status(500).json({ error: "Erro ao salvar evento" });
  }
});

// Rota GET para evento específico
router.get('/api/evento/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [eventos] = await conn.promise().query(`
      SELECT *, 
        DATE_FORMAT(data_inicio, '%d/%m/%Y') as data_inicio_formatada,
        DATE_FORMAT(data_fim, '%d/%m/%Y') as data_fim_formatada
      FROM eventos 
      WHERE id = ?
    `, [id]);

    if (eventos.length === 0) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    const evento = {
      ...eventos[0],
      imagem_base64: eventos[0].imagem_blob ? eventos[0].imagem_blob.toString('base64') : null
    };

    res.status(200).json(evento);
  } catch (error) {
    console.error("Erro ao buscar evento:", error);
    res.status(500).json({ error: "Erro ao buscar evento" });
  }
});

// Rota DELETE para evento
router.delete('/api/evento/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await conn.promise().query('DELETE FROM eventos WHERE id = ?', [id]);
    res.status(200).json({ message: 'Evento deletado com sucesso!' });
  } catch (error) {
    console.error("Erro ao deletar evento:", error);
    res.status(500).json({ error: "Erro ao deletar evento" });
  }
});

// Função auxiliar para formatar datas
function formatarData(data) {
  if (!data) return '';
  const date = new Date(data);
  return date.toLocaleDateString('pt-BR');
}

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
