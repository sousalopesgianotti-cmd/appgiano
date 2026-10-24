export type AppRole = 'admin' | 'professor' | 'aluno';

export type PlanoNome = 'Starter 10' | 'Pro 30' | 'Elite 60' | 'Studio Ilimitado';

export type Professor = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  foto_url?: string;
  plano_nome: PlanoNome;
  limite_alunos: number;
  valor_mensalidade: number; // valor pago pelo professor ao Dono
  ativo: boolean;
  created_at: string;
};

export type UserProfile = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  role: AppRole;
  foto_url?: string;
  limite_alunos: number;
  ativo: boolean;
  created_at?: string;
};

export type Aluno = {
  id: string;
  professor_id: string;
  nome: string;
  email: string;
  telefone: string;
  nascimento: string;
  grupo: string;
  foto_url?: string;
  valor_mensalidade: number;
  dia_vencimento: number;
  ativo: boolean;
  app_liberado: boolean;
  senha?: string;
  created_at?: string;
};

export type ItemMidiaExercicio = {
  id: string;
  arquivo_nome?: string;
  arquivo_url?: string;
  arquivo_tipo?: 'video' | 'imagem' | 'documento' | 'outro';
  link_externo?: string; // youtube, vimeo, drive, etc.
};

export type PastaExercicio = {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  is_default?: boolean;
};

export type Exercicio = {
  id: string;
  professor_id: string;
  pasta_id?: string;
  titulo: string;
  equipamento: string;
  tipo?: string;
  grupo: string;
  grupo_muscular?: string;
  video?: string;
  video_url?: string;
  midia?: string;
  midias?: ItemMidiaExercicio[];
  orientacoes: string;
  is_system?: boolean;
  publico?: boolean;
  ativo?: boolean;
};

export type ExercicioItemTreino = {
  exercicio_id: string;
  titulo: string;
  series: number;
  repeticoes: string;
  carga: string;
  descanso_segundos: number;
  observacoes?: string;
  video_url?: string;
  video?: string;
  midia?: string;
};

export type Treino = {
  id: string;
  professor_id: string;
  nome: string;
  descricao?: string;
  exercicios: ExercicioItemTreino[];
  created_at?: string;
};

export type AlunoTreinoAtribuido = {
  id: string;
  aluno_id: string;
  treino_id: string;
  dias_semana: string[];
  ativo: boolean;
  ordem: number;
  treino?: Treino;
  created_at?: string;
};

export type TreinoExecucao = {
  id: string;
  aluno_id: string;
  treino_id: string;
  data: string;
  duracao_minutos: number;
  observacoes?: string;
  created_at?: string;
};

export type AvaliacaoFisica = {
  id: string;
  aluno_id: string;
  data: string;
  peso: number;
  altura: number;
  gordura_corporal?: number;
  medidas?: Record<string, number>;
  fotos?: { frente?: string; costas?: string; lateral?: string };
  observacoes?: string;
};

export type Mensalidade = {
  id: string;
  professor_id: string;
  aluno_id: string;
  aluno_nome?: string;
  valor: number;
  vencimento: string;
  status: 'paga' | 'pendente' | 'atrasada';
  pago_em?: string;
};
