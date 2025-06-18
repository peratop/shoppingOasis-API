const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function popularEventos() {
    const conn = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "pucPR@123",
        database: "shopping_oasis",
        port: "3306"
    });

    try {
        const EVENTOS = [
            {
                nome: "Clubinho do livro",
                email: "clubinhodolivro@example.com",
                imagem: path.join(__dirname, 'public', 'images', 'EVENTOS', 'evento1.jpeg')
            },
            {
                nome: "Clube do Livro",
                email: "clubedolivro@example.com",
                imagem: path.join(__dirname, 'public', 'images', 'EVENTOS', 'evento2.jpeg')
            },
            {
                nome: "Cama Elástica",
                email: "camaelastica@example.com",
                imagem: path.join(__dirname, 'public', 'images', 'EVENTOS', 'evento3.jpeg')
            },
            {
                nome: "Grand Arraia",
                email: "grandarraia@example.com",
                imagem: path.join(__dirname, 'public', 'images', 'EVENTOS', 'evento4.jpeg')
            }
        ];

        for (const evento of EVENTOS) {
            try {
                const imagemBuffer = await fs.readFile(evento.imagem);
                
                await conn.execute(`
                    INSERT INTO eventos (
                        nome_evento, email_contato, data_inicio, data_fim,
                        horario_inicio, horario_fim, piso, tipo_evento,
                        imagem_blob, imagem_path, descricao, status, id_usuario_solicitante
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    evento.nome, evento.email, "2025-07-15", "2025-07-16",
                    "14:00:00", "18:00:00", "1", "cultural",
                    imagemBuffer, evento.imagem, `Descrição do ${evento.nome}`, "aprovado", 1
                ]);
                
                console.log(`Evento '${evento.nome}' inserido com sucesso!`);
            } catch (e) {
                console.error(`Erro no evento ${evento.nome}:`, e.message);
            }
        }

        console.log("Processo concluído!");
    } catch (error) {
        console.error("Erro geral:", error);
    } finally {
        await conn.end();
    }
}

popularEventos();