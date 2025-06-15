const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function popularLojas() {
    const conn = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "pucPR@123",
        database: "shopping_oasis",
        port: "3306"
    });

    try {
        // Todas as lojas com suas informações completas
        const LOJAS = [
            {
                nome: "Baff's",
                cnpj: "00.000.000/0001-01",
                telefone: "(41) 99999-9999",
                email: "baffs@example.com",
                descricao: "Loja especializada em acessórios modernos e artigos de luxo",
                categoria: "varejo",
                imagem: "BAFF'S1.jpeg"
            },
            {
                nome: "Biscoite",
                cnpj: "00.000.000/0001-02",
                telefone: "(41) 98888-8888",
                email: "biscoite@example.com",
                descricao: "Padaria artesanal com doces e salgados premium",
                categoria: "restaurante",
                imagem: "BISCOITE1.jpeg"
            },
            {
                nome: "Donajo",
                cnpj: "00.000.000/0001-03",
                telefone: "(41) 97777-7777",
                email: "donajo@example.com",
                descricao: "Restaurante de comida caseira com toque especial",
                categoria: "restaurante",
                imagem: "DONAJO1.jpeg"
            },
            {
                nome: "Fannie",
                cnpj: "00.000.000/0001-04",
                telefone: "(41) 96666-6666",
                email: "fannie@example.com",
                descricao: "Boutique feminina com as últimas tendências da moda",
                categoria: "varejo",
                imagem: "FANNIE1.jpeg"
            },
            {
                nome: "O Francês",
                cnpj: "00.000.000/0001-05",
                telefone: "(41) 95555-5555",
                email: "ofrances@example.com",
                descricao: "Autêntica padaria francesa com produtos importados",
                categoria: "restaurante",
                imagem: "OFRANCES1.jpeg"
            },
            {
                nome: "Spruzzo",
                cnpj: "00.000.000/0001-06",
                telefone: "(41) 94444-4444",
                email: "spruzzo@example.com",
                descricao: "Gelateria e café com produtos italianos artesanais",
                categoria: "restaurante",
                imagem: "SPRUZZO1.jpeg"
            },
            {
                nome: "Surch",
                cnpj: "00.000.000/0001-07",
                telefone: "(41) 93333-3333",
                email: "surch@example.com",
                descricao: "Eletrônicos e gadgets das melhores marcas mundiais",
                categoria: "varejo",
                imagem: "SURCH1.jpeg"
            },
            {
                nome: "TechSmart",
                cnpj: "00.000.000/0001-08",
                telefone: "(41) 92222-2222",
                email: "techsmart@example.com",
                descricao: "Loja de tecnologia com assistência técnica especializada",
                categoria: "varejo",
                imagem: "TECHSMART1.jpeg"
            }
        ];

        for (const loja of LOJAS) {
            try {
                const imagePath = path.join(__dirname, 'public', 'images', 'LOJAS', loja.imagem);
                const imagemBuffer = await fs.readFile(imagePath);
                const finalImagePath = path.join('public', 'images', 'LOJAS', loja.imagem);
                
                await conn.execute(`
                    INSERT INTO lojas (
                        nome_negocio, cnpj, telefone, email, descricao,
                        categoria, imagem_blob, imagem_path, status, id_usuario_solicitante
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    loja.nome, loja.cnpj, loja.telefone, loja.email, loja.descricao,
                    loja.categoria, imagemBuffer, finalImagePath, "aprovado", 1
                ]);
                
                console.log(`Loja '${loja.nome}' inserida com sucesso!`);
            } catch (e) {
                console.error(`Erro na loja ${loja.nome}:`, e.message);
                // Mostra o caminho completo que tentou acessar para ajudar no debug
                console.error(`Caminho tentado: ${path.join(__dirname, 'public', 'images', 'LOJAS', loja.imagem)}`);
            }
        }

        console.log("Processo concluído!");
    } catch (error) {
        console.error("Erro geral:", error);
    } finally {
        await conn.end();
    }
}

popularLojas();