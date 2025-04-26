const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());

//import do modulo de mysql
var mysql = require('mysql2');

//criando a variável conn que vai ter a referência de conexão
//com o banco de dados
var conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "pucPR@1234",
    database: "shopping_oasis",
    port:"3306"
});

//tentando connectar
//a variável con tem a conexão agora
conn.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

const adminMiddleware = async (req, res) => {
    try {
        const [users] = await conn.execute(
            'SELECT tipo FROM usuarios WHERE id = ?'
            [req.userId]
        );
    if (users.length > 0 && users[0].tipo === 'admin')
    {
        return next();
    }
    res.status(403).json({ error: 'Acesso negado'});
} catch (error) {
    res.status(500).json({ error: error.message });
}
};

//API ROTA PARA USUÁRIO
app.get('/api/usuario', function (req, res) {
    let sql = "SELECT u.id, u.nome FROM usuarios u";
    conn.query(sql, function (err, result) {
        if (err) res.status(500).json(err);
        res.status(200).json(result);
    });
});

app.post('/api/usuario', function (req, res) {
    //captura o json com os dados do usuário
    var usuario = req.body;
    //variável sql par armazenar o comando que vai rodar no banco
    var sql = '';
    //valido se o usuário existe pelo id -> caso exista é um update    
    if (usuario.id) {
        sql = `UPDATE usuario SET nome = '${usuario.nome}'
        WHERE id = ${usuario.id}`; 
    } else {
        sql = `INSERT INTO usuario (nome) VALUES 
    ('${usuario.nome}')`;
    }
    //executa o comando de insert ou update
    conn.query(sql, function (err, result) {
        if (err) throw err;
    });
    res.status(201).json(usuario);
});

//endpoint para capturar um usuário por id
app.get('/api/usuario/:id', (req, res) => {
    const { id } = req.params;

    console.log(id)

    let sql = `SELECT u.id, u.nome FROM usuario u WHERE u.id = ${id}`;
    conn.query(sql, function (err, result) {
        if (err) throw err;
        console.log(result)
        res.status(200).json(result[0]);
    });
});

app.listen(PORT, function (err) {
    if (err) console.log(err);
    console.log("Server listening on PORT", PORT);
});