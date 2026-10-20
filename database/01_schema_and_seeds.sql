-- ==============================================================================
-- GIANO / Personal Academy - Banco de Dados Independente (Supabase / PostgreSQL)
-- ==============================================================================

-- 1. Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Professores
CREATE TABLE IF NOT EXISTS public.professores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    foto_url TEXT,
    limite_alunos INT DEFAULT 30,
    status_assinatura TEXT DEFAULT 'ativo',
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Alunos
CREATE TABLE IF NOT EXISTS public.alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID REFERENCES public.professores(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    nascimento TEXT,
    grupo TEXT DEFAULT 'Geral',
    valor_mensalidade NUMERIC(10,2) DEFAULT 0,
    dia_vencimento INT DEFAULT 10,
    ativo BOOLEAN DEFAULT TRUE,
    app_liberado BOOLEAN DEFAULT TRUE,
    senha TEXT DEFAULT '1234',
    foto_url TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Exercícios
CREATE TABLE IF NOT EXISTS public.exercicios (
    id TEXT PRIMARY KEY,
    professor_id TEXT DEFAULT 'giano_system',
    titulo TEXT NOT NULL,
    equipamento TEXT,
    tipo TEXT,
    grupo TEXT NOT NULL,
    video TEXT,
    midia TEXT,
    orientacoes TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Treinos
CREATE TABLE IF NOT EXISTS public.treinos (
    id TEXT PRIMARY KEY,
    professor_id UUID REFERENCES public.professores(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Itens do Treino (Exercícios no treino)
CREATE TABLE IF NOT EXISTS public.treino_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treino_id TEXT REFERENCES public.treinos(id) ON DELETE CASCADE,
    exercicio_id TEXT REFERENCES public.exercicios(id) ON DELETE CASCADE,
    ordem INT DEFAULT 1,
    series INT DEFAULT 3,
    repeticoes TEXT DEFAULT '10-12',
    carga TEXT,
    descanso_segundos INT DEFAULT 60,
    observacoes TEXT
);

-- 7. Associação Aluno-Treino
CREATE TABLE IF NOT EXISTS public.aluno_treinos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
    treino_id TEXT REFERENCES public.treinos(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT TRUE,
    atribuido_em TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Histórico de Execuções de Treino
CREATE TABLE IF NOT EXISTS public.execucoes_treino (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
    treino_id TEXT,
    duracao_segundos INT DEFAULT 0,
    concluido_em TIMESTAMPTZ DEFAULT NOW(),
    detalhes JSONB
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execucoes_treino ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Permissivas para a chave ANON
CREATE POLICY "Permitir leitura total anon" ON public.professores FOR SELECT USING (true);
CREATE POLICY "Permitir modificação total anon" ON public.professores FOR ALL USING (true);

CREATE POLICY "Permitir leitura alunos" ON public.alunos FOR SELECT USING (true);
CREATE POLICY "Permitir modificação alunos" ON public.alunos FOR ALL USING (true);

CREATE POLICY "Permitir leitura exercicios" ON public.exercicios FOR SELECT USING (true);
CREATE POLICY "Permitir modificação exercicios" ON public.exercicios FOR ALL USING (true);

CREATE POLICY "Permitir leitura treinos" ON public.treinos FOR SELECT USING (true);
CREATE POLICY "Permitir modificação treinos" ON public.treinos FOR ALL USING (true);

CREATE POLICY "Permitir leitura treino_itens" ON public.treino_itens FOR SELECT USING (true);
CREATE POLICY "Permitir modificação treino_itens" ON public.treino_itens FOR ALL USING (true);

CREATE POLICY "Permitir leitura aluno_treinos" ON public.aluno_treinos FOR SELECT USING (true);
CREATE POLICY "Permitir modificação aluno_treinos" ON public.aluno_treinos FOR ALL USING (true);

CREATE POLICY "Permitir leitura execucoes" ON public.execucoes_treino FOR SELECT USING (true);
CREATE POLICY "Permitir inserção execucoes" ON public.execucoes_treino FOR ALL USING (true);

-- ==============================================================================
-- DADOS INICIAIS (SEED)
-- ==============================================================================

-- Professor Padrão / Dono
INSERT INTO public.professores (id, nome, email, telefone, limite_alunos, status_assinatura)
VALUES (
    '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
    'André Gianotti',
    'andre@giano.com.br',
    '11999990000',
    50,
    'ativo'
) ON CONFLICT (id) DO NOTHING;

-- Alunos Iniciais (Conforme Telas de Referência)
INSERT INTO public.alunos (id, professor_id, nome, email, telefone, nascimento, grupo, valor_mensalidade, dia_vencimento, ativo, app_liberado, senha)
VALUES 
(
    '7132f4da-920a-4bb0-9db2-ab6af05c5d7a',
    '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
    'Murillo Moreira',
    'murillofaixapreta@gmail.com',
    '11999996692',
    '15/06/2008',
    'Hipertrofia',
    180.00,
    10,
    true,
    true,
    '6692'
),
(
    'a1b2c3d4-0001-4000-8000-000000000001',
    '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
    'André Teste Treino',
    'andre@email.com',
    '11988887777',
    '21/08/1971',
    'Consultoria',
    150.00,
    5,
    true,
    true,
    '1234'
),
(
    'a1b2c3d4-0002-4000-8000-000000000002',
    '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
    'Gustavo Ferreira da Silva',
    'gustavo@email.com',
    '11977776666',
    '21/11/2005',
    'Atleta',
    200.00,
    15,
    true,
    true,
    '1234'
),
(
    'a1b2c3d4-0003-4000-8000-000000000003',
    '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
    'Maria Jose Moreira',
    'mariajose@email.com',
    '11966665555',
    '25/05/1970',
    'Condicionamento',
    150.00,
    10,
    true,
    true,
    '1234'
),
(
    'a1b2c3d4-0004-4000-8000-000000000004',
    '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
    'Sérgio Darduini',
    'sergio@email.com',
    '11955554444',
    '07/06/1971',
    'Grupo 1',
    160.00,
    20,
    true,
    true,
    '1234'
)
ON CONFLICT (id) DO NOTHING;
