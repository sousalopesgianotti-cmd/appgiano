import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  Circle, 
  Menu, 
  X, 
  Calendar as CalendarIcon, 
  ClipboardCheck, 
  TrendingUp, 
  CreditCard, 
  MessageSquare, 
  Bell, 
  LogOut, 
  Dumbbell, 
  Flame, 
  Timer, 
  Camera, 
  Lock,
  ArrowRight,
  Sun,
  Moon,
  Globe
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { toast } from 'sonner';
import type { Aluno, Treino, TreinoExecucao, ExercicioItemTreino } from '@/lib/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, type Language } from '@/contexts/LanguageContext';

type AppAlunoPageProps = {
  alunoIdInicial?: string;
  alunos: Aluno[];
  treinos: Treino[];
  onSalvarExecucao?: (execucao: Omit<TreinoExecucao, 'id'>) => Promise<void>;
};

export const AppAlunoPage: React.FC<AppAlunoPageProps> = ({
  alunoIdInicial,
  alunos,
  treinos,
  onSalvarExecucao,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Sessão do aluno
  const [alunoLogado, setAlunoLogado] = useState<Aluno | null>(() => {
    if (alunoIdInicial) {
      const match = alunos.find((a) => a.id === alunoIdInicial);
      if (match) return match;
    }
    const salvo = typeof localStorage !== 'undefined' ? localStorage.getItem('giano_aluno_ativo_id') : null;
    if (salvo) {
      const match = alunos.find((a) => a.id === salvo);
      if (match) return match;
    }
    return alunos[0] || null;
  });

  // Estados de Login (se não logado)
  const [identificadorLogin, setIdentificadorLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');

  // Estados de Treino
  const [menuAberto, setMenuAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'inicio' | 'treinos' | 'calendario' | 'avaliacoes' | 'metas' | 'plano' | 'chat'>('inicio');
  const [treinoAtivo, setTreinoAtivo] = useState<Treino | null>(() => treinos[0] || null);
  const [exercicioIdx, setExercicioIdx] = useState(0);
  const [seriesFeitas, setSeriesFeitas] = useState<Record<string, boolean>>({});
  const [treinoIniciado, setTreinoIniciado] = useState(false);
  const [tempoDescanso, setTempoDescanso] = useState(0);
  const [tempoCronometroDescanso, setTempoCronometroDescanso] = useState<number | null>(null);

  // Tick do descanso
  useEffect(() => {
    if (tempoCronometroDescanso === null || tempoCronometroDescanso <= 0) return;
    const interval = setInterval(() => {
      setTempoCronometroDescanso((prev) => {
        if (prev === null || prev <= 1) {
          toast.success('Descanso concluído! Próxima série 💪');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tempoCronometroDescanso]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const limpo = identificadorLogin.trim().toLowerCase();
    const digits = limpo.replace(/\D/g, '');

    const match = alunos.find((a) => {
      if (a.email.toLowerCase() === limpo) return true;
      const telDigits = a.telefone.replace(/\D/g, '');
      if (digits && telDigits.endsWith(digits)) return true;
      return false;
    });

    if (!match) {
      toast.error('Aluno não encontrado. Verifique seu WhatsApp ou e-mail.');
      return;
    }

    if (match.ativo === false) {
      toast.error('Seu acesso está pausado. Fale com seu personal trainer.');
      return;
    }

    // Se aluno tem senha cadastrada, valida
    if (match.senha && match.senha.trim().length > 0) {
      if (senhaLogin.trim() !== match.senha.trim()) {
        toast.error('Senha incorreta. Verifique a senha com seu personal.');
        return;
      }
    }

    setAlunoLogado(match);
    localStorage.setItem('giano_aluno_ativo_id', match.id);
    toast.success(`Bem-vindo(a), ${match.nome.split(' ')[0]}! 💪`);
  };

  const handleLogout = () => {
    setAlunoLogado(null);
    localStorage.removeItem('giano_aluno_ativo_id');
    setMenuAberto(false);
  };

  const toggleSerie = (exIdx: number, serieNum: number, descanso: number) => {
    const key = `${exIdx}_${serieNum}`;
    const novoStatus = !seriesFeitas[key];
    setSeriesFeitas((prev) => ({ ...prev, [key]: novoStatus }));

    if (novoStatus) {
      setTempoCronometroDescanso(descanso || 60);
      toast.success(`Série ${serieNum} concluída! Descanso iniciado ⏱️`);
    }
  };

  const concluirTreinoGeral = async () => {
    if (!alunoLogado || !treinoAtivo) return;
    try {
      if (onSalvarExecucao) {
        await onSalvarExecucao({
          aluno_id: alunoLogado.id,
          treino_id: treinoAtivo.id,
          data: new Date().toISOString().split('T')[0] || '',
          duracao_minutos: 45,
          observacoes: 'Treino concluído pelo app',
        });
      }
      toast.success('Parabéns! Treino de hoje concluído com sucesso! 🔥');
      setTreinoIniciado(false);
      setSeriesFeitas({});
    } catch {
      toast.error('Erro ao registrar treino.');
    }
  };

  // Se não logado -> Tela de login dedicada
  if (!alunoLogado) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <Logo size="lg" showTagline />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Área do Atleta</h1>
            <p className="text-xs text-neutral-400">
              Acesse seus treinos personalizados, cronômetro e evolução física.
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-2xl backdrop-blur space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                  WhatsApp ou E-mail
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: 11999999999 ou seu@email.com"
                  value={identificadorLogin}
                  onChange={(e) => setIdentificadorLogin(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 flex items-center justify-between mb-1.5">
                  <span>Senha de Acesso</span>
                  <span className="text-[10px] text-amber-500">Se cadastrada</span>
                </label>
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={senhaLogin}
                  onChange={(e) => setSenhaLogin(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Acessar Meus Treinos</span>
                <ArrowRight className="size-4 stroke-[3]" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const exercicioAtual: ExercicioItemTreino | undefined = treinoAtivo?.exercicios?.[exercicioIdx];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-start select-none">
      {/* CONTAINER MOBILE (Máximo 430px de largura simulando tela de smartphone) */}
      <div className="w-full max-w-md min-h-screen bg-neutral-950 flex flex-col relative sm:border-x sm:border-neutral-800 shadow-2xl overflow-x-hidden">
        
        {/* HEADER MOBILE COM MENU E AVATAR */}
        <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-md px-4 py-3 border-b border-neutral-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuAberto(true)}
              className="size-9 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white"
              title="Abrir Menu"
            >
              <Menu className="size-5" />
            </button>
            <Logo size="sm" showTagline={false} />
          </div>

          <div className="flex items-center gap-2">
            {tempoCronometroDescanso !== null && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black text-xs animate-pulse">
                <Timer className="size-3.5" />
                <span>{tempoCronometroDescanso}s</span>
              </span>
            )}

            <div className="size-9 rounded-full bg-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center overflow-hidden border border-amber-500/40">
              {alunoLogado.foto_url ? (
                <img src={alunoLogado.foto_url} alt={alunoLogado.nome} className="size-full object-cover" />
              ) : (
                alunoLogado.nome.slice(0, 2).toUpperCase()
              )}
            </div>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL: TELA DE EXECUÇÃO DO TREINO (ESTILO NEXUR - FIGURA 3) */}
        <main className="flex-1 p-4 space-y-4 pb-28">
          {treinoAtivo && exercicioAtual ? (
            <div className="space-y-4">
              {/* Título do Exercício com Botão de Notas */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
                    Exercício {exercicioIdx + 1} de {treinoAtivo.exercicios.length}
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-white mt-0.5">
                    {exercicioAtual.titulo}
                  </h2>
                </div>
              </div>

              {/* TABELA DE SÉRIES (ESTILO EXATO DA FIGURA 3) */}
              <div className="rounded-2xl bg-neutral-900 border border-neutral-850 p-3 space-y-2">
                {/* Cabeçalho da Tabela */}
                <div className="grid grid-cols-4 text-[10px] font-black uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800 text-center">
                  <span>REPS</span>
                  <span>CARGA (KG)</span>
                  <span>DESCANSO</span>
                  <span>SÉRIE</span>
                </div>

                {/* Linhas das Séries */}
                {Array.from({ length: exercicioAtual.series || 3 }).map((_, sIdx) => {
                  const serieNum = sIdx + 1;
                  const key = `${exercicioIdx}_${serieNum}`;
                  const feita = !!seriesFeitas[key];

                  return (
                    <button
                      key={sIdx}
                      onClick={() => toggleSerie(exercicioIdx, serieNum, exercicioAtual.descanso_segundos || 60)}
                      className={`w-full grid grid-cols-4 items-center py-2.5 rounded-xl text-center text-sm font-bold transition-all ${
                        feita
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'hover:bg-neutral-850 text-neutral-200'
                      }`}
                    >
                      <span>{exercicioAtual.repeticoes || '10-12'}</span>
                      <span>{exercicioAtual.carga || '20kg'}</span>
                      <span className="text-xs text-neutral-400">
                        {Math.floor((exercicioAtual.descanso_segundos || 60) / 60)}:
                        {String((exercicioAtual.descanso_segundos || 60) % 60).padStart(2, '0')}
                      </span>
                      <span className="flex justify-center">
                        {feita ? (
                          <CheckCircle2 className="size-5 text-emerald-400" />
                        ) : (
                          <span className="size-6 rounded-full border border-neutral-700 flex items-center justify-center text-xs font-black text-neutral-400">
                            {serieNum}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}

                {/* Observações técnicas */}
                {exercicioAtual.observacoes && (
                  <div className="pt-2 text-xs text-neutral-400 border-t border-neutral-800 leading-relaxed">
                    💡 <strong>Obs:</strong> {exercicioAtual.observacoes}
                  </div>
                )}
              </div>

              {/* MÍDIA / VÍDEO DEMONSTRATIVO NO CENTRO (FIGURA 3) */}
              <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-850 aspect-[4/3] flex items-center justify-center">
                {exercicioAtual.midia ? (
                  <img
                    src={exercicioAtual.midia}
                    alt={exercicioAtual.titulo}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-neutral-500">
                    <Dumbbell className="size-12 stroke-[1.5]" />
                    <span className="text-xs font-semibold">Execução do movimento</span>
                  </div>
                )}
              </div>

              {/* NAVEGADOR ENTRE EXERCÍCIOS */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  disabled={exercicioIdx === 0}
                  onClick={() => setExercicioIdx((p) => Math.max(0, p - 1))}
                  className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 disabled:opacity-30"
                >
                  ← Anterior
                </button>
                <span className="text-xs font-bold text-neutral-500">
                  {exercicioIdx + 1} de {treinoAtivo.exercicios.length}
                </span>
                <button
                  disabled={exercicioIdx === treinoAtivo.exercicios.length - 1}
                  onClick={() => setExercicioIdx((p) => Math.min(treinoAtivo.exercicios.length - 1, p + 1))}
                  className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 disabled:opacity-30"
                >
                  Próximo →
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-neutral-500 space-y-2">
              <Dumbbell className="size-10 mx-auto text-neutral-700" />
              <p className="text-sm font-semibold">Nenhum treino prescrito para hoje.</p>
            </div>
          )}
        </main>

        {/* BARRA FIXA DE AÇÃO INFERIOR COM BOTÃO AMARELO (ESTILO NEXUR - FIGURA 3) */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-neutral-950/95 border-t border-neutral-850 backdrop-blur z-20">
          {!treinoIniciado ? (
            <button
              onClick={() => {
                setTreinoIniciado(true);
                toast.success('Treino iniciado! Bom treino 💪');
              }}
              className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-base shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <div className="size-8 rounded-full bg-neutral-950 text-amber-500 flex items-center justify-center">
                <Play className="size-4 fill-current ml-0.5" />
              </div>
              <div className="text-left">
                <p className="leading-tight text-sm font-black">Iniciar treino</p>
                <p className="text-[10px] font-bold text-neutral-900/80">Registre seu histórico e acompanhe sua evolução</p>
              </div>
            </button>
          ) : (
            <button
              onClick={concluirTreinoGeral}
              className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-base shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="size-5" />
              <span>Concluir Treino de Hoje</span>
            </button>
          )}
        </div>

        {/* MENU LATERAL DESLIZANTE / DRAWER (ESTILO EXATO DA FIGURA 4) */}
        {menuAberto && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop escurecido */}
            <div
              onClick={() => setMenuAberto(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            />

            {/* Gaveta Lateral */}
            <div className="relative w-4/5 max-w-xs bg-neutral-900 border-r border-neutral-800 p-5 flex flex-col justify-between z-50 animate-in slide-in-from-left duration-200">
              <div className="space-y-6">
                {/* Topo do Drawer: Avatar + Saudação + Fechar (Figura 4) */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-amber-500 text-neutral-950 font-black text-sm flex items-center justify-center">
                      {alunoLogado.foto_url ? (
                        <img src={alunoLogado.foto_url} alt={alunoLogado.nome} className="size-full object-cover rounded-full" />
                      ) : (
                        alunoLogado.nome.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400">Olá, 👋</p>
                      <p className="text-sm font-black text-white">{alunoLogado.nome.split(' ')[0]}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setMenuAberto(false)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Lista de Opções do Drawer (Figura 4) */}
                <nav className="space-y-1">
                  {[
                    { id: 'inicio', label: 'Início', icon: Flame },
                    { id: 'treinos', label: 'Treinos', icon: Dumbbell },
                    { id: 'calendario', label: 'Calendário', icon: CalendarIcon },
                    { id: 'avaliacoes', label: 'Avaliações', icon: ClipboardCheck },
                    { id: 'metas', label: 'Metas e Métricas', icon: TrendingUp },
                    { id: 'plano', label: 'Meu Plano', icon: CreditCard },
                    { id: 'chat', label: 'Chat', icon: MessageSquare },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = abaAtiva === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setAbaAtiva(item.id as any);
                          setMenuAberto(false);
                        }}
                        className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-bold text-sm text-left transition-colors ${
                          isActive
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
                        }`}
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Rodapé do Drawer */}
              <div className="pt-4 border-t border-neutral-800 space-y-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold text-sm transition-colors"
                >
                  <LogOut className="size-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
