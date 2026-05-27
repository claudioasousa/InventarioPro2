-- SCHEMA SQL PARA INVENTÁRIO PATRIMONIAL MUNICIPAL
-- Banco de dados: PostgreSQL

-- 1. Tabela de Setores
CREATE TABLE IF NOT EXISTS setores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sigla VARCHAR(10) NOT NULL UNIQUE,
    descricao VARCHAR(255),
    responsavel VARCHAR(100),
    email_contato VARCHAR(100),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Categoria de Bens
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    descricao VARCHAR(255),
    depreciacao_anual_pct DECIMAL(5, 2) DEFAULT 10.00
);

-- 3. Tabela de Usuários (Controle de Perfis)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    cargo VARCHAR(100),
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('Administrador', 'Operador', 'Consulta')),
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_ultimo_login TIMESTAMP
);

-- 4. Tabela de Patrimônios (Bens Móveis)
CREATE TABLE IF NOT EXISTS patrimonios (
    id SERIAL PRIMARY KEY,
    numero_patrimonical VARCHAR(50) NOT NULL UNIQUE, -- Código de barras / Tombamento
    tombamento VARCHAR(50) UNIQUE,                  -- Número alternativo ou chapa de tombamento
    descricao TEXT NOT NULL,
    categoria_id INT REFERENCES categorias(id) ON DELETE RESTRICT,
    quantidade INT DEFAULT 1 CHECK (quantidade >= 1),
    estado_conservacao VARCHAR(15) NOT NULL CHECK (estado_conservacao IN ('Ótimo', 'Bom', 'Regular', 'Ruim', 'Inservível')),
    localizacao_atual VARCHAR(150),
    setor_id INT REFERENCES setores(id) ON DELETE RESTRICT,
    data_aquisicao DATE NOT NULL,
    valor_estimado DECIMAL(12, 2) NOT NULL CHECK (valor_estimado >= 0),
    observacoes TEXT,
    foto_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de Movimentações
CREATE TABLE IF NOT EXISTS movimentacoes (
    id SERIAL PRIMARY KEY,
    patrimonio_id INT NOT NULL REFERENCES patrimonios(id) ON DELETE CASCADE,
    setor_origem_id INT REFERENCES setores(id) ON DELETE SET NULL,
    setor_destino_id INT NOT NULL REFERENCES setores(id) ON DELETE RESTRICT,
    usuario_id INT REFERENCES users(id) ON DELETE SET NULL,
    usuario_nome VARCHAR(100) NOT NULL, -- Nome copiado para histórico estático
    data_movimentacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT NOT NULL,
    observacoes TEXT
);

-- 6. Tabela de Anexos / Documentos Associados
CREATE TABLE IF NOT EXISTS anexos (
    id SERIAL PRIMARY KEY,
    patrimonio_id INT NOT NULL REFERENCES patrimonios(id) ON DELETE CASCADE,
    nome_arquivo VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(100) NOT NULL,
    arquivo_base64 TEXT NOT NULL, -- Para armazenamento inline/mock ou link
    tamanho_bytes INT NOT NULL,
    data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabela de Auditoria (Logs do Sistema)
CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(100) NOT NULL,
    acao VARCHAR(100) NOT NULL, -- e.g., 'LOGIN', 'CREATE_PATRIMONIO', 'UPDATE_PATRIMONIO', 'DELETE_PATRIMONIO', 'TRANSFER'
    detalhes TEXT,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_origem VARCHAR(45)
);

-- Índices para melhoria de performance em consultas complexas
CREATE INDEX IF NOT EXISTS idx_patrimonios_setor ON patrimonios(setor_id);
CREATE INDEX IF NOT EXISTS idx_patrimonios_categoria ON patrimonios(categoria_id);
CREATE INDEX IF NOT EXISTS idx_patrimonios_ativo ON patrimonios(ativo);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_patrimonio ON movimentacoes(patrimonio_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_data ON auditoria(data_registro);

-- Inserção de dados básicos padrão
INSERT INTO setores (nome, sigla, descricao, responsavel, email_contato) VALUES
('Gabinete do Prefeito', 'GAB', 'Gabinete central do poder executivo municipal', 'Dr. Roberto Mendes', 'gab@municipio.gov.br'),
('Secretaria Municipal de Saúde', 'SESAU', 'Gestão regional de saúde e hospitais', 'Dra. Helena Souza', 'sesau@municipio.gov.br'),
('Secretaria Municipal de Educação', 'SEDUC', 'Gestão de escolas e institutos de ensino', 'Prof. Marcos Lima', 'seduc@municipio.gov.br'),
('Tecnologia da Informação', 'SETIC', 'Gestão de rede, computadores e sistemas municipais', 'Eng. Pedro Rocha', 'setic@municipio.gov.br'),
('Secretaria de Administração', 'SEMAD', 'Recursos humanos e logística institucional', 'Ana Clara Santos', 'semad@municipio.gov.br');

INSERT INTO categorias (nome, codigo, descricao, depreciacao_anual_pct) VALUES
('Equipamentos de TI', 'ETI', 'Notebooks, servidores, impressoras e periféricos', 15.00),
('Mobiliário Administrativo', 'MOBA', 'Mesas, cadeiras de escritório, armários e balcões', 10.00),
('Veículos Automotivos', 'VEIC', 'Carros oficiais, ambulâncias e caminhonetes', 20.00),
('Equipamentos Hospitalares', 'EHP', 'Monitores, leitos, e ventiladores', 12.00),
('Eletrodomésticos e Refrigeração', 'ELR', 'Condicionadores de ar, freezers e refrigeradores', 12.50);

-- Senha padrão provisória em texto puro simulando hash para os inserts iniciais
-- Senha recomendada: admin123 (hash real)
INSERT INTO users (nome, email, password_hash, cargo, perfil, ativo) VALUES
('Administrador Geral (Patrimônio)', 'admin@patrimonio.gov.br', '$2a$10$f6B0K8qC1qgPhy27UfI8M.wO5oEpP8V1U7DOfYj7rYnUsc1M4M3W2', 'Diretor de Patrimônio', 'Administrador', true),
('Operador Seccional TI', 'operador@patrimonio.gov.br', '$2a$10$f6B0K8qC1qgPhy27UfI8M.wO5oEpP8V1U7DOfYj7rYnUsc1M4M3W2', 'Técnico de Almoxarifado', 'Operador', true),
('Consulta Auditoria', 'consulta@patrimonio.gov.br', '$2a$10$f6B0K8qC1qgPhy27UfI8M.wO5oEpP8V1U7DOfYj7rYnUsc1M4M3W2', 'Controlador Interno', 'Consulta', true);
