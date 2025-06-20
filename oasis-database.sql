-- Criação do banco de dados
DROP DATABASE IF EXISTS shopping_oasis;
CREATE DATABASE shopping_oasis;
USE shopping_oasis;

-- Tabela de usuários (para cadastro de clientes)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    tipo ENUM('cliente', 'admin') DEFAULT 'cliente'
);

-- Inserção do usuário admin fixo (id = 1)
INSERT INTO usuarios (id, nome, email, senha, tipo) VALUES 
(1, 'Adm', 'admin@oasis.com', '$2b$10$39Fp1dtBoRN7UZGHB2/CCeFmtm7KHzhS2fsYAVVh.pWz3rMkdJyk2', 'admin');

-- Tabela de lojas (para cadastro de negócios)
CREATE TABLE lojas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_negocio VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    telefone VARCHAR(15),
    email VARCHAR(100) NOT NULL,
    descricao TEXT,
    categoria ENUM('restaurante', 'varejo', 'servicos', 'bem-estar', 'escritorios') NOT NULL,
    imagem_path VARCHAR(255),
    status ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente',
    data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_usuario_solicitante INT,
    FOREIGN KEY (id_usuario_solicitante) REFERENCES usuarios(id)
);

-- Tabela de eventos
CREATE TABLE eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_evento VARCHAR(100) NOT NULL,
    email_contato VARCHAR(100) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    horario_inicio TIME NOT NULL,
    horario_fim TIME,
    piso ENUM('1', '2', '3'),
    tipo_evento ENUM('cultural', 'comercial', 'educacional') NOT NULL,
    imagem_path VARCHAR(255),
    descricao TEXT,
    status ENUM('pendente', 'aprovado', 'rejeitado') DEFAULT 'pendente',
    data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_usuario_solicitante INT,
    FOREIGN KEY (id_usuario_solicitante) REFERENCES usuarios(id)
);
ALTER TABLE lojas ADD COLUMN imagem_blob LONGBLOB;
ALTER TABLE eventos ADD COLUMN imagem_blob LONGBLOB;