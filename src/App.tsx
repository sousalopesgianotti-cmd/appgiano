import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ClientesPage } from '@/pages/professor/ClientesPage';
import { AppAlunoPage } from '@/pages/aluno/AppAlunoPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ConfiguracoesPage } from '@/pages/professor/ConfiguracoesPage';
import { ProfessoresPage } from '@/pages/admin/ProfessoresPage';
import { PlanosPage } from '@/pages/admin/PlanosPage';
import { ExerciciosPage } from '@/pages/professor/ExerciciosPage';
import { TreinosPage } from '@/pages/professor/TreinosPage';
import { DEFAULT_EXERCICIOS, PASTAS_PADRAO } from '@/lib/exercicios.data';
import type { Aluno, Treino, AppRole, Professor, Exercicio, PastaExercicio, AvaliacaoFisica, TreinoExecucao } from '@/lib/types';
import { extrairAlunoDoLink } from '@/lib/convite';
import { Monitor } from 'lucide-react';

// Sincronização e limpeza automática de dados mock legados na versão oficial de produção
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  const PROD_RELEASE_KEY = 'giano_v2_empty_aluno_treinos';
  if (localStorage.getItem(PROD_RELEASE_KEY) !== 'v2') {
    localStorage.removeItem('giano_professores_db');
    localStorage.removeItem('giano_alunos_db');
    localStorage.removeItem('giano_avaliacoes_db');
    localStorage.removeItem('giano_execucoes_db');
    localStorage.setItem(PROD_RELEASE_KEY, 'v2');
  }
}

// Dados iniciais de Alunos
const ALUNOS_INICIAIS: Aluno[] = [
  {
    id: "a1b2c3d4-0003-4000-8000-000000000003",
    professor_id: "8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d",
    nome: "Maria Jose Moreira",
    email: "mariajose@email.com",
    telefone: "11966665555",
    nascimento: "25/05/1970",
    grupo: "Condicionamento",
    valor_mensalidade: 0,
    dia_vencimento: 0,
    ativo: true,
    app_liberado: true,
    senha: "5555",
    treinos_ids: [],
  },
  {
    id: "7132f4da-920a-4bb0-9db2-ab6af05c5d7a",
    professor_id: "8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d",
    nome: "Murillo Moreira",
    email: "murillofaixapreta@gmail.com",
    telefone: "11999996692",
    nascimento: "15/06/2008",
    grupo: "Hipertrofia",
    valor_mensalidade: 180,
    dia_vencimento: 10,
    ativo: true,
    app_liberado: true,
    senha: "6692",
    treinos_ids: [],
  },
];

const TREINOS_INICIAIS: Treino[] = [
  {
    id: "tr_peito_triceps_1",
    professor_id: "8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d",
    nome: "Treino A — Peito & Tríceps",
    descricao: "Foco em força, hipertrofia e estabilização de escápulas",
    exercicios: [
      {
        exercicio_id: "ex_supino_reto",
        titulo: "Supino Reto com Barra",
        series: 4,
        repeticoes: "12 - 10 - 8 - 8",
        carga: "20kg de cada lado",
        descanso_segundos: 90,
        observacoes: "Rest-Pause na última série (8 reps + 15s desc. + máx)",
        midia: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
      },
      {
        exercicio_id: "ex_crucifixo_inclinado",
        titulo: "Supino Inclinado com Halteres",
        series: 3,
        repeticoes: "10-12",
        carga: "16kg",
        descanso_segundos: 60,
        observacoes: "Manter escápulas aduzidas e descida controlada em 3s.",
        midia: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80",
      },
      {
        exercicio_id: "ex_triceps_corda",
        titulo: "Tríceps na Polia (Corda)",
        series: 4,
        repeticoes: "12-15",
        carga: "25kg",
        descanso_segundos: 45,
        observacoes: "Abrir a corda no ponto de contração máxima.",
        midia: "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=800&q=80",
      },
    ],
  },
  {
    id: "tr_costas_biceps_2",
    professor_id: "8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d",
    nome: "Treino B — Costas & Bíceps",
    descricao: "Foco em densidade dorsal e pico de contração de bíceps",
    exercicios: [
      {
        exercicio_id: "ex_puxada_alta",
        titulo: "Puxada Frontal Aberta",
        series: 4,
        repeticoes: "10-12",
        carga: "45kg",
        descanso_segundos: 60,
        observacoes: "Puxar direcionando os cotovelos para a cintura.",
        midia: "https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=800&q=80",
      },
      {
        exercicio_id: "ex_remada_curvada",
        titulo: "Remada Curvada com Barra",
        series: 4,
        repeticoes: "8-10",
        carga: "30kg",
        descanso_segundos: 75,
        observacoes: "Tronco firme a 45 graus, sem balançar a lombar.",
        midia: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
      },
      {
        exercicio_id: "ex_rosca_direta",
        titulo: "Rosca Direta com Barra W",
        series: 3,
        repeticoes: "10-12",
        carga: "12kg cada lado",
        descanso_segundos: 60,
        observacoes: "Manter os cotovelos colados ao tronco.",
        midia: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",
      },
    ],
  },
  {
    id: "tr_pernas_completo_3",
    professor_id: "8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d",
    nome: "Treino C — Pernas Completo",
    descricao: "Quadríceps, posteriores, glúteos e panturrilhas",
    exercicios: [
      {
        exercicio_id: "ex_agachamento_livre",
        titulo: "Agachamento Livre com Barra",
        series: 4,
        repeticoes: "10-8-8-6",
        carga: "40kg cada lado",
        descanso_segundos: 90,
        observacoes: "Descer até passar a linha de 90 graus com controle.",
        midia: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80",
      },
      {
        exercicio_id: "ex_leg_press_45",
        titulo: "Leg Press 45º",
        series: 4,
        repeticoes: "12-15",
        carga: "160kg",
        descanso_segundos: 60,
        observacoes: "Pés na largura dos ombros, não travar joelhos no topo.",
        midia: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
      },
      {
        exercicio_id: "ex_cadeira_extensora",
        titulo: "Cadeira Extensora",
        series: 3,
        repeticoes: "12-15",
        carga: "45kg",
        descanso_segundos: 45,
        observacoes: "Pausa de 2 segundos no pico de contração máxima.",
        midia: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80",
      },
    ],
  },
];

// Dados iniciais de Professores para gestão do Dono do Produto (SaaS)
const PROFESSORES_INICIAIS: Professor[] = [
  {
    id: "8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d",
    nome: "André Gianotti (Dono do Produto)",
    email: "sousalopesgianotti@gmail.com",
    telefone: "11988887777",
    plano_nome: "Studio Ilimitado",
    limite_alunos: 9999,
    valor_mensalidade: 0,
    ativo: true,
    created_at: "2026-01-01T00:00:00Z",
  },
];

function AppContent() {
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (
        window.location.pathname.startsWith('/app') ||
        params.has('alunoId') ||
        params.has('c') ||
        params.has('convite')
      );
    }
    return false;
  });

  // Modo de visualização híbrido: 'owner' (Dono da plataforma) ou 'trainer' (Personal)
  const [viewMode, setViewMode] = useState<'owner' | 'trainer'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('giano_view_mode') as 'owner' | 'trainer';
      if (saved === 'owner' || saved === 'trainer') return saved;
    }
    return 'owner';
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_view_mode', viewMode);
    }
  }, [viewMode]);

  const [currentTab, setCurrentTab] = useState(() => {
    return viewMode === 'owner' ? 'professores' : 'clientes';
  });
  const [userRole, setUserRole] = useState<AppRole>('professor');

  // Gestão de Professores no SaaS (persiste no localStorage)
  const [professores, setProfessores] = useState<Professor[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('giano_professores_db');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return PROFESSORES_INICIAIS;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_professores_db', JSON.stringify(professores));
    }
  }, [professores]);

  const handleAddProfessor = async (novo: Omit<Professor, 'id' | 'created_at'>) => {
    const profCriado: Professor = {
      ...novo,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    setProfessores((prev) => [profCriado, ...prev]);
  };

  const handleUpdateProfessor = async (id: string, patch: Partial<Professor>) => {
    setProfessores((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  };

  const handleDeleteProfessor = async (id: string) => {
    setProfessores((prev) => prev.filter((p) => p.id !== id));
  };

  // Gestão de sessão de autenticação (persiste no localStorage)
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    nome: string;
    email: string;
    role: 'professor' | 'aluno';
  } | null>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('giano_auth_session');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return null;
  });

  const handleLogin = (session: { id: string; nome: string; email: string; role: 'professor' | 'aluno' }) => {
    setCurrentUser(session);
    setUserRole(session.role);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_auth_session', JSON.stringify(session));
      if (session.role === 'aluno') {
        localStorage.setItem('giano_aluno_ativo_id', session.id);
      }
    }
    if (session.role === 'aluno') {
      setIsMobileView(true);
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({}, '', '/app');
      }
    } else {
      setIsMobileView(false);
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({}, '', '/');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsMobileView(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('giano_auth_session');
      localStorage.removeItem('giano_aluno_ativo_id');
    }
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', '/');
    }
    toast.info('Sessão encerrada com sucesso.');
  };

  // Gestão de alunos local com sincronização automática
  const [alunos, setAlunos] = useState<Aluno[]>(() => {
    let listaAtual = ALUNOS_INICIAIS;
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('giano_alunos_db');
      if (saved) {
        try {
          listaAtual = JSON.parse(saved);
        } catch {}
      }
    }
    // Sincroniza aluno vindo pelo link limpo de convite (alunoId + n + s)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const alunoUrl = extrairAlunoDoLink(params);
      if (alunoUrl) {
        const idx = listaAtual.findIndex((a) => a.id === alunoUrl.id);
        if (idx >= 0) {
          listaAtual[idx] = { ...listaAtual[idx], ...alunoUrl };
        } else {
          listaAtual = [alunoUrl, ...listaAtual];
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('giano_alunos_db', JSON.stringify(listaAtual));
        }
      }
    }
    return listaAtual;
  });

  // Salva no localStorage a cada alteração
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_alunos_db', JSON.stringify(alunos));
    }
  }, [alunos]);

  const handleAddAluno = async (novo: Omit<Aluno, 'id' | 'professor_id'>): Promise<Aluno> => {
    const alunoCriado: Aluno = {
      ...novo,
      id: crypto.randomUUID(),
      professor_id: '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
      treinos_ids: [],
      created_at: new Date().toISOString(),
    };
    setAlunos((prev) => [alunoCriado, ...prev]);
    return alunoCriado;
  };

  const handleUpdateAluno = async (id: string, patch: Partial<Aluno>) => {
    setAlunos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  };

  // Gestão de Avaliações Físicas (persiste no localStorage)
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFisica[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('giano_avaliacoes_db');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_avaliacoes_db', JSON.stringify(avaliacoes));
    }
  }, [avaliacoes]);

  // Gestão de Histórico e Execuções de Treino por Aluno (persiste no localStorage)
  const [execucoes, setExecucoes] = useState<TreinoExecucao[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('giano_execucoes_db');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_execucoes_db', JSON.stringify(execucoes));
    }
  }, [execucoes]);

  const handleSalvarExecucao = async (nova: Omit<TreinoExecucao, 'id'>) => {
    const item: TreinoExecucao = {
      ...nova,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    setExecucoes((prev) => [item, ...prev]);
  };

  const handleDeleteAluno = async (id: string) => {
    setAlunos((prev) => prev.filter((a) => a.id !== id));
    setAvaliacoes((prev) => prev.filter((av) => av.aluno_id !== id));
    setExecucoes((prev) => prev.filter((ex) => ex.aluno_id !== id));
  };

  // Gestão das Pastas Musculares
  const [pastas, setPastas] = useState<PastaExercicio[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('giano_pastas_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return PASTAS_PADRAO;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_pastas_v1', JSON.stringify(pastas));
    }
  }, [pastas]);

  const handleAddPasta = async (nova: Omit<PastaExercicio, 'id'>) => {
    const pastaCriada: PastaExercicio = {
      ...nova,
      id: `pasta_${crypto.randomUUID().slice(0, 8)}`,
    };
    setPastas((prev) => [...prev, pastaCriada]);
  };

  const handleUpdatePasta = async (id: string, patch: Partial<PastaExercicio>) => {
    setPastas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  };

  const handleDeletePasta = async (id: string) => {
    setPastas((prev) => prev.filter((p) => p.id !== id));
    setExercicios((prev) => prev.filter((e) => e.pasta_id !== id));
  };

  // Gestão da biblioteca de exercícios (persiste no localStorage com carga inicial de 4 por pasta)
  const [exercicios, setExercicios] = useState<Exercicio[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const savedV7 = localStorage.getItem('giano_exercicios_v7');
      if (savedV7) {
        try {
          return JSON.parse(savedV7);
        } catch {}
      }
      // Se o usuário já criou exercícios locais (ex: Flexão Inclinada), mescla mantendo-os
      const savedV6 = localStorage.getItem('giano_exercicios_v6');
      if (savedV6) {
        try {
          const userEx = JSON.parse(savedV6) as Exercicio[];
          const idsDefault = new Set(DEFAULT_EXERCICIOS.map((d) => d.id));
          const novosDoUsuario = userEx.filter((u) => !idsDefault.has(u.id));
          return [...DEFAULT_EXERCICIOS, ...novosDoUsuario];
        } catch {}
      }
    }
    return DEFAULT_EXERCICIOS;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_exercicios_v7', JSON.stringify(exercicios));
    }
  }, [exercicios]);

  const handleAddExercicio = async (novo: Omit<Exercicio, 'id'>) => {
    const exercicioCriado: Exercicio = {
      ...novo,
      id: crypto.randomUUID(),
    };
    setExercicios((prev) => [exercicioCriado, ...prev]);
  };

  const handleUpdateExercicio = async (id: string, patch: Partial<Exercicio>) => {
    setExercicios((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  const handleDeleteExercicio = async (id: string) => {
    setExercicios((prev) => prev.filter((e) => e.id !== id));
  };

  // Gestão da biblioteca de Treinos (persiste no localStorage)
  const [treinos, setTreinos] = useState<Treino[]>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('giano_treinos_db_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return TREINOS_INICIAIS;
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_treinos_db_v1', JSON.stringify(treinos));
    }
  }, [treinos]);

  const handleAddTreino = async (novo: Omit<Treino, 'id'>): Promise<Treino> => {
    const treinoCriado: Treino = {
      ...novo,
      id: `tr_${crypto.randomUUID().slice(0, 8)}`,
      created_at: new Date().toISOString(),
    };
    setTreinos((prev) => [treinoCriado, ...prev]);
    return treinoCriado;
  };

  const handleUpdateTreino = async (id: string, patch: Partial<Treino>) => {
    setTreinos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  };

  const handleDeleteTreino = async (id: string) => {
    setTreinos((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDuplicateTreino = async (treino: Treino) => {
    const duplicado: Treino = {
      ...treino,
      id: `tr_${crypto.randomUUID().slice(0, 8)}`,
      nome: `${treino.nome} (Cópia)`,
      created_at: new Date().toISOString(),
    };
    setTreinos((prev) => [duplicado, ...prev]);
  };

  // Verifica se é rota direta de aluno (/app) ou convite (?c, ?convite, ?alunoId)
  const isAcessoAluno = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return (
        window.location.pathname.startsWith('/app') ||
        params.has('c') ||
        params.has('convite') ||
        params.has('alunoId')
      );
    }
    return false;
  };

  // Se for rota de aluno/convite OU se o usuário logado for Aluno OU se o professor estiver no modo mobile de teste
  if (isAcessoAluno() || (currentUser && (currentUser.role === 'aluno' || isMobileView))) {
    return (
      <div className="relative min-h-screen bg-neutral-950">
        {/* Botão de retorno ao painel visível EXCLUSIVAMENTE para o Professor logado testando o app */}
        {currentUser?.role === 'professor' && (
          <button
            onClick={() => {
              setIsMobileView(false);
              if (typeof window !== 'undefined' && window.history) {
                window.history.pushState({}, '', '/');
              }
            }}
            className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-700 text-xs font-bold text-neutral-300 hover:text-white shadow-xl backdrop-blur cursor-pointer"
            title="Voltar ao Painel do Personal"
          >
            <Monitor className="size-3.5 text-amber-500" />
            <span>Painel Personal</span>
          </button>
        )}

        <AppAlunoPage
          alunoIdInicial={currentUser?.role === 'aluno' ? currentUser.id : undefined}
          alunos={alunos}
          treinos={treinos}
          avaliacoes={avaliacoes}
          execucoes={execucoes}
          onSalvarExecucao={handleSalvarExecucao}
          onUpdateAluno={handleUpdateAluno}
          onLogout={handleLogout}
        />
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  // Se não houver usuário autenticado no painel, exibe a tela de login
  if (!currentUser) {
    return (
      <>
        <LoginPage
          alunos={alunos}
          professores={professores}
          onLogin={handleLogin}
        />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  // Painel Web Principal (Personal Trainer & ADM)
  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-amber-500/30">
      {/* Barra Lateral Retrátil (Estilo Nexur) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        viewMode={viewMode}
        userRole={userRole}
        userName={currentUser.nome}
        onLogout={handleLogout}
      />

      {/* Área Central de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabeçalho Superior com Frase e Idiomas */}
        <Header
          viewMode={viewMode}
          onViewModeChange={(m) => {
            setViewMode(m);
            setCurrentTab(m === 'owner' ? 'professores' : 'clientes');
          }}
          isSuperAdmin={true}
          onOpenAppAluno={() => {
            setIsMobileView(true);
            if (typeof window !== 'undefined' && window.history) {
              window.history.pushState({}, '', '/app');
            }
          }}
        />

        {/* Conteúdo Dinâmico Baseado na Aba */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'professores' && (
            <ProfessoresPage
              professores={professores}
              alunos={alunos}
              onAddProfessor={handleAddProfessor}
              onUpdateProfessor={handleUpdateProfessor}
              onDeleteProfessor={handleDeleteProfessor}
            />
          )}

          {currentTab === 'planos' && (
            <PlanosPage />
          )}

          {currentTab === 'clientes' && (
            <ClientesPage
              alunos={alunos}
              treinos={treinos}
              exercicios={exercicios}
              pastas={pastas}
              limiteAlunos={viewMode === 'owner' ? 9999 : 50}
              onAddAluno={handleAddAluno}
              onUpdateAluno={handleUpdateAluno}
              onDeleteAluno={handleDeleteAluno}
              onAddTreino={handleAddTreino}
              onUpdateTreino={handleUpdateTreino}
              onDeleteTreino={handleDeleteTreino}
              onSelectAlunoTreinos={(aluno) => {
                setIsMobileView(true);
                if (typeof window !== 'undefined' && window.history) {
                  window.history.pushState({}, '', `/app?alunoId=${aluno.id}`);
                }
              }}
            />
          )}

          {currentTab === 'exercicios' && (
            <ExerciciosPage
              exercicios={exercicios}
              pastas={pastas}
              onAddExercicio={handleAddExercicio}
              onUpdateExercicio={handleUpdateExercicio}
              onDeleteExercicio={handleDeleteExercicio}
              onAddPasta={handleAddPasta}
              onUpdatePasta={handleUpdatePasta}
              onDeletePasta={handleDeletePasta}
            />
          )}

          {currentTab === 'treinos' && (
            <TreinosPage
              treinos={treinos}
              exercicios={exercicios}
              pastas={pastas}
              onAddTreino={handleAddTreino}
              onUpdateTreino={handleUpdateTreino}
              onDeleteTreino={handleDeleteTreino}
              onDuplicateTreino={handleDuplicateTreino}
            />
          )}

          {currentTab === 'configuracoes' && (
            <ConfiguracoesPage />
          )}

          {currentTab !== 'professores' && currentTab !== 'planos' && currentTab !== 'clientes' && currentTab !== 'exercicios' && currentTab !== 'treinos' && currentTab !== 'configuracoes' && (
            <div className="p-12 text-center text-neutral-400 space-y-2">
              <h2 className="text-xl font-bold text-neutral-700 dark:text-neutral-300 capitalize">
                {currentTab}
              </h2>
              <p className="text-xs">Módulo pronto para expansão.</p>
            </div>
          )}
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
