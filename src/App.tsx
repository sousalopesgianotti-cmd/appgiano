import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ClientesPage } from '@/pages/professor/ClientesPage';
import { AppAlunoPage } from '@/pages/aluno/AppAlunoPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { DEFAULT_EXERCICIOS } from '@/lib/exercicios.data';
import type { Aluno, Treino, AppRole } from '@/lib/types';
import { Smartphone, Monitor } from 'lucide-react';

// Dados iniciais espelhados nas referências visuais aprovadas pelo usuário
const ALUNOS_INICIAIS: Aluno[] = [
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
  },
  {
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    professor_id: "8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d",
    nome: "André Teste Treino",
    email: "andre@email.com",
    telefone: "11988887777",
    nascimento: "21/08/1971",
    grupo: "Consultoria",
    valor_mensalidade: 150,
    dia_vencimento: 5,
    ativo: true,
    app_liberado: true,
  },
  {
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    professor_id: "8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d",
    nome: "Gustavo Ferreira da Silva",
    email: "gustavo@email.com",
    telefone: "11977776666",
    nascimento: "21/11/2005",
    grupo: "Atleta",
    valor_mensalidade: 200,
    dia_vencimento: 15,
    ativo: true,
    app_liberado: true,
  },
  {
    id: "a1b2c3d4-0003-4000-8000-000000000003",
    professor_id: "8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d",
    nome: "Maria Jose Moreira",
    email: "mariajose@email.com",
    telefone: "11966665555",
    nascimento: "25/05/1970",
    grupo: "Condicionamento",
    valor_mensalidade: 150,
    dia_vencimento: 10,
    ativo: true,
    app_liberado: true,
  },
  {
    id: "a1b2c3d4-0004-4000-8000-000000000004",
    professor_id: "8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d",
    nome: "Sérgio Darduini",
    email: "sergio@email.com",
    telefone: "11955554444",
    nascimento: "07/06/1971",
    grupo: "Grupo 1",
    valor_mensalidade: 160,
    dia_vencimento: 20,
    ativo: true,
    app_liberado: true,
  },
];

const TREINOS_INICIAIS: Treino[] = [
  {
    id: "tr_supino_1",
    professor_id: "8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d",
    nome: "Treino A — Peito & Tríceps",
    descricao: "Foco em força e hipertrofia",
    exercicios: [
      {
        exercicio_id: "ex_supino_reto",
        titulo: "Supino Reto com Barra",
        series: 4,
        repeticoes: "12 - 10 - 8 - 8",
        carga: "20kg",
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
];

function AppContent() {
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return window.location.pathname.startsWith('/app') || params.has('alunoId');
    }
    return false;
  });

  const [currentTab, setCurrentTab] = useState('clientes');
  const [userRole, setUserRole] = useState<AppRole>('professor');

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
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('giano_alunos_db');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return ALUNOS_INICIAIS;
  });

  // Salva no localStorage a cada alteração
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_alunos_db', JSON.stringify(alunos));
    }
  }, [alunos]);

  const handleAddAluno = async (novo: Omit<Aluno, 'id' | 'professor_id'>) => {
    const alunoCriado: Aluno = {
      ...novo,
      id: crypto.randomUUID(),
      professor_id: '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
      created_at: new Date().toISOString(),
    };
    setAlunos((prev) => [alunoCriado, ...prev]);
  };

  const handleUpdateAluno = async (id: string, patch: Partial<Aluno>) => {
    setAlunos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
    );
  };

  const handleDeleteAluno = async (id: string) => {
    setAlunos((prev) => prev.filter((a) => a.id !== id));
  };

  // Se não houver usuário autenticado, exibe a tela de login
  if (!currentUser) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  // Se estiver na rota do aluno (/app)
  if (isMobileView) {
    return (
      <div className="relative min-h-screen bg-neutral-950">
        {/* Botão de alternância flutuante de demonstração */}
        <button
          onClick={() => {
            setIsMobileView(false);
            if (typeof window !== 'undefined' && window.history) {
              window.history.pushState({}, '', '/');
            }
          }}
          className="fixed top-3 right-3 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-700 text-xs font-bold text-neutral-300 hover:text-white shadow-xl backdrop-blur"
          title="Voltar ao Painel do Personal"
        >
          <Monitor className="size-3.5 text-amber-500" />
          <span>Painel Personal</span>
        </button>

        <AppAlunoPage
          alunoIdInicial={currentUser.role === 'aluno' ? currentUser.id : undefined}
          alunos={alunos}
          treinos={TREINOS_INICIAIS}
          onLogout={handleLogout}
        />
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  // Painel Web Principal (Personal Trainer & ADM)
  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans selection:bg-amber-500/30">
      {/* Barra Lateral Retrátil (Estilo Nexur) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        userRole={userRole}
        userName={currentUser.nome}
        onLogout={handleLogout}
      />

      {/* Área Central de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabeçalho Superior com Frase e Idiomas */}
        <Header
          onOpenAppAluno={() => {
            setIsMobileView(true);
            if (typeof window !== 'undefined' && window.history) {
              window.history.pushState({}, '', '/app');
            }
          }}
        />

        {/* Conteúdo Dinâmico Baseado na Aba */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'clientes' && (
            <ClientesPage
              alunos={alunos}
              limiteAlunos={25}
              onAddAluno={handleAddAluno}
              onUpdateAluno={handleUpdateAluno}
              onDeleteAluno={handleDeleteAluno}
              onSelectAlunoTreinos={() => {
                setIsMobileView(true);
                if (typeof window !== 'undefined' && window.history) {
                  window.history.pushState({}, '', '/app');
                }
              }}
            />
          )}

          {currentTab === 'exercicios' && (
            <div className="p-8 max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black tracking-tight">Biblioteca de Exercícios</h1>
                  <p className="text-xs text-neutral-500 mt-1">
                    Catálogo completo com vídeos de execução e orientações posturais ({DEFAULT_EXERCICIOS.length} cadastrados)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {DEFAULT_EXERCICIOS.map((ex) => (
                  <div
                    key={ex.id}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                        {ex.grupo}
                      </span>
                      <h3 className="font-bold text-sm leading-snug">{ex.titulo}</h3>
                      <p className="text-xs text-neutral-500 line-clamp-2">{ex.orientacoes}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-400">
                      Equipamento: {ex.equipamento}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentTab !== 'clientes' && currentTab !== 'exercicios' && (
            <div className="p-12 text-center text-neutral-400 space-y-2">
              <h2 className="text-xl font-bold text-neutral-700 dark:text-neutral-300 capitalize">
                {currentTab}
              </h2>
              <p className="text-xs">Módulo pronto para expansão.</p>
            </div>
          )}
        </main>
      </div>

      {/* Botão flutuante para testar o App do Aluno no Celular */}
      <button
        onClick={() => {
          setIsMobileView(true);
          if (typeof window !== 'undefined' && window.history) {
            window.history.pushState({}, '', '/app');
          }
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow-2xl shadow-amber-500/30 active:scale-95 transition-all"
        title="Abrir Pré-visualização do App do Aluno"
      >
        <Smartphone className="size-4 stroke-[2.5]" />
        <span>Ver App do Aluno</span>
      </button>

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
