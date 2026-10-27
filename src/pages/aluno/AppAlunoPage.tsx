import React, { useState, useEffect, useRef } from 'react';
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
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Phone,
  Clock,
  Sun,
  Moon,
  Globe,
  User,
  Scale,
  Ruler,
  Sparkles,
  Target,
  ShieldCheck,
  Award,
  Activity
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { toast } from 'sonner';
import type { Aluno, Treino, TreinoExecucao, ExercicioItemTreino, AvaliacaoFisica } from '@/lib/types';
import { extrairAlunoDoLink } from '@/lib/convite';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, type Language } from '@/contexts/LanguageContext';

type AppAlunoPageProps = {
  alunoIdInicial?: string;
  alunos: Aluno[];
  treinos: Treino[];
  avaliacoes?: AvaliacaoFisica[];
  execucoes?: TreinoExecucao[];
  onSalvarExecucao?: (execucao: Omit<TreinoExecucao, 'id'>) => Promise<void>;
  onUpdateAluno?: (id: string, patch: Partial<Aluno>) => Promise<void>;
  onLogout?: () => void;
};

export const AppAlunoPage: React.FC<AppAlunoPageProps> = ({
  alunoIdInicial,
  alunos,
  treinos,
  avaliacoes = [],
  execucoes = [],
  onSalvarExecucao,
  onUpdateAluno,
  onLogout,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Detecção de aluno convidado via parâmetros limpos na URL (?alunoId=...&n=Maria&s=6156)
  const alunoUrlParams = React.useMemo(() => {
    if (typeof window === 'undefined') return null;
    return extrairAlunoDoLink(new URLSearchParams(window.location.search));
  }, []);

  const alunoIdUrl = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('alunoId') || alunoUrlParams?.id || alunoIdInicial
    : alunoIdInicial;

  const alunoConvidado = React.useMemo(() => {
    if (alunoIdUrl) {
      const match = alunos.find((a) => a.id === alunoIdUrl);
      if (match) return match;
    }
    return alunoUrlParams;
  }, [alunoUrlParams, alunoIdUrl, alunos]);

  // Sessão do aluno: só entra direto se já autenticado previamente para este aluno
  const [alunoLogado, setAlunoLogado] = useState<Aluno | null>(() => {
    if (alunoIdInicial) {
      const matchInicial = alunos.find((a) => a.id === alunoIdInicial);
      if (matchInicial) {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('giano_aluno_ativo_id', matchInicial.id);
        }
        return matchInicial;
      }
    }

    const salvo = typeof localStorage !== 'undefined' ? localStorage.getItem('giano_aluno_ativo_id') : null;
    if (alunoIdUrl) {
      if (salvo && salvo === alunoIdUrl) {
        const match = alunos.find((a) => a.id === salvo);
        if (match) return match;
      }
      return null;
    }
    if (salvo) {
      const match = alunos.find((a) => a.id === salvo);
      if (match) return match;
    }
    return null;
  });

  // Atualiza alunoLogado caso alunoIdInicial mude
  useEffect(() => {
    if (alunoIdInicial) {
      const match = alunos.find((a) => a.id === alunoIdInicial);
      if (match) {
        setAlunoLogado(match);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('giano_aluno_ativo_id', match.id);
        }
      }
    }
  }, [alunoIdInicial, alunos]);

  // Estados de Login e Convite
  const [identificadorLogin, setIdentificadorLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [modoTrocarConta, setModoTrocarConta] = useState(false);

  // Estados de Primeiro Acesso e Troca de Senha
  const [alunoPendente, setAlunoPendente] = useState<Aluno | null>(null);
  const [modalPrimeiroAcessoAberto, setModalPrimeiroAcessoAberto] = useState(false);
  const [modalTrocarSenhaAberto, setModalTrocarSenhaAberto] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [verNovaSenha, setVerNovaSenha] = useState(false);

  // Sincroniza alunoLogado quando houver atualização dos alunos (ex: prescrição de treinos)
  useEffect(() => {
    if (alunoLogado) {
      const atualizado = alunos.find((a) => a.id === alunoLogado.id);
      if (atualizado && JSON.stringify(atualizado) !== JSON.stringify(alunoLogado)) {
        setAlunoLogado(atualizado);
      }
    }
  }, [alunos, alunoLogado]);

  // Treinos atribuídos exclusivamente a este aluno
  const treinosDoAluno = React.useMemo(() => {
    if (!alunoLogado?.treinos_ids || alunoLogado.treinos_ids.length === 0) return [];
    return treinos.filter((t) => alunoLogado.treinos_ids?.includes(t.id));
  }, [alunoLogado?.treinos_ids, treinos]);

  // Avaliações físicas exclusivas deste aluno
  const avaliacoesDoAluno = React.useMemo(() => {
    if (!alunoLogado?.id) return [];
    return avaliacoes.filter((a) => a.aluno_id === alunoLogado.id);
  }, [avaliacoes, alunoLogado?.id]);

  const ultimaAvaliacao = avaliacoesDoAluno[avaliacoesDoAluno.length - 1] || null;

  // Histórico de execuções de treino exclusivas deste aluno
  const execucoesDoAluno = React.useMemo(() => {
    if (!alunoLogado?.id) return [];
    return execucoes.filter((e) => e.aluno_id === alunoLogado.id);
  }, [execucoes, alunoLogado?.id]);

  // Cálculos dinâmicos e reais de frequência para o mês atual
  const estatisticasCalendario = React.useMemo(() => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    const diasDoMesSet = new Set<number>();
    execucoesDoAluno.forEach((ex) => {
      if (!ex.data) return;
      const [anoStr, mesStr, diaStr] = ex.data.split('-');
      const ano = parseInt(anoStr, 10);
      const mes = parseInt(mesStr, 10) - 1;
      const dia = parseInt(diaStr, 10);
      if (ano === anoAtual && mes === mesAtual) {
        diasDoMesSet.add(dia);
      }
    });

    const totalDiasNoMes = diasDoMesSet.size;

    let sequencia = 0;
    if (totalDiasNoMes > 0) {
      const hojeDia = hoje.getDate();
      let diaChecagem = diasDoMesSet.has(hojeDia) ? hojeDia : hojeDia - 1;
      while (diaChecagem > 0 && diasDoMesSet.has(diaChecagem)) {
        sequencia++;
        diaChecagem--;
      }
    }

    // Treinos concluídos nesta semana
    const diaSemanaHoje = hoje.getDay();
    const offsetSegunda = (diaSemanaHoje + 6) % 7;
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - offsetSegunda);
    inicioSemana.setHours(0, 0, 0, 0);

    const treinosSemana = execucoesDoAluno.filter((ex) => {
      if (!ex.data) return false;
      const dataEx = new Date(`${ex.data}T00:00:00`);
      return dataEx >= inicioSemana && dataEx <= hoje;
    }).length;

    return {
      totalDiasNoMes,
      sequencia,
      diasDoMesSet,
      treinosSemana,
    };
  }, [execucoesDoAluno]);

  // Estados de Treino
  const [menuAberto, setMenuAberto] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'inicio' | 'treinos' | 'calendario' | 'avaliacoes' | 'metas' | 'plano' | 'chat'>('inicio');
  const [treinoAtivo, setTreinoAtivo] = useState<Treino | null>(() => treinosDoAluno[0] || null);
  const [exercicioIdx, setExercicioIdx] = useState(0);
  const [seriesFeitas, setSeriesFeitas] = useState<Record<string, boolean>>({});
  const [treinoIniciado, setTreinoIniciado] = useState(false);
  const [tempoDescanso, setTempoDescanso] = useState(0);
  const [tempoCronometroDescanso, setTempoCronometroDescanso] = useState<number | null>(null);

  // Referência e handler para upload e compressão da foto de perfil
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida (JPEG, PNG ou WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 400;
          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;

          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            toast.error('Não foi possível processar a imagem.');
            return;
          }

          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, maxDim, maxDim);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

          if (alunoLogado) {
            const alunoAtualizado = { ...alunoLogado, foto_url: compressedBase64 };
            setAlunoLogado(alunoAtualizado);

            if (onUpdateAluno) {
              onUpdateAluno(alunoLogado.id, { foto_url: compressedBase64 });
            }
            toast.success('Foto de perfil atualizada com sucesso! 📸');
          }
        } catch {
          toast.error('Erro ao processar imagem.');
        }
      };
      img.onerror = () => {
        toast.error('Erro ao carregar a imagem selecionada.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      toast.error('Erro ao ler o arquivo selecionado.');
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  // Mantém treinoAtivo sincronizado com treinosDoAluno
  useEffect(() => {
    if (treinosDoAluno.length > 0) {
      if (!treinoAtivo || !treinosDoAluno.some((t) => t.id === treinoAtivo.id)) {
        setTreinoAtivo(treinosDoAluno[0]);
        setExercicioIdx(0);
        setSeriesFeitas({});
        setTreinoIniciado(false);
      }
    } else {
      setTreinoAtivo(null);
      setExercicioIdx(0);
      setSeriesFeitas({});
      setTreinoIniciado(false);
    }
  }, [treinosDoAluno]);

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

  const efetivarEntradaAluno = (aluno: Aluno) => {
    setAlunoLogado(aluno);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_aluno_ativo_id', aluno.id);
      try {
        const salvoAlunos = localStorage.getItem('giano_alunos_db');
        let lista: Aluno[] = salvoAlunos ? JSON.parse(salvoAlunos) : [];
        const idx = lista.findIndex((a) => a.id === aluno.id);
        if (idx >= 0) {
          lista[idx] = { ...lista[idx], ...aluno };
        } else {
          lista = [aluno, ...lista];
        }
        localStorage.setItem('giano_alunos_db', JSON.stringify(lista));
      } catch {}
    }
    setSenhaLogin('');
    setAlunoPendente(null);
  };

  const processarSenhaCorreta = (aluno: Aluno) => {
    setAlunoPendente(aluno);
    setModalPrimeiroAcessoAberto(true);
  };

  const handleLoginConvidado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoConvidado) return;

    if (alunoConvidado.ativo === false) {
      toast.error('Seu acesso está pausado. Fale com seu personal trainer.');
      return;
    }

    const telDigits = alunoConvidado.telefone.replace(/\D/g, '');
    const senhaEsperada = (alunoConvidado.senha && alunoConvidado.senha.trim())
      ? alunoConvidado.senha.trim()
      : (telDigits.slice(-4) || '1234');

    if (senhaLogin.trim() !== senhaEsperada) {
      toast.error('Senha incorreta. A senha provisória são os 4 últimos dígitos do seu WhatsApp.');
      return;
    }

    processarSenhaCorreta(alunoConvidado);
  };

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

    const telDigits = match.telefone.replace(/\D/g, '');
    const senhaEsperada = (match.senha && match.senha.trim())
      ? match.senha.trim()
      : (telDigits.slice(-4) || '1234');

    if (senhaLogin.trim() !== senhaEsperada) {
      toast.error('Senha incorreta. Digite a senha cadastrada com seu personal.');
      return;
    }

    processarSenhaCorreta(match);
  };

  const handleSalvarNovaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha.trim().length < 4) {
      toast.error('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }
    if (novaSenha.trim() !== confirmarNovaSenha.trim()) {
      toast.error('As senhas não coincidem. Digite novamente.');
      return;
    }

    const alunoAlvo = alunoPendente || alunoLogado;
    if (!alunoAlvo) return;

    const novaSenhaFinal = novaSenha.trim();

    try {
      if (onUpdateAluno) {
        await onUpdateAluno(alunoAlvo.id, { senha: novaSenhaFinal });
      }

      const alunoAtualizado = { ...alunoAlvo, senha: novaSenhaFinal };
      efetivarEntradaAluno(alunoAtualizado);

      setModalTrocarSenhaAberto(false);
      setModalPrimeiroAcessoAberto(false);
      setNovaSenha('');
      setConfirmarNovaSenha('');
      toast.success('Senha atualizada com sucesso! Bom treino! 🔥');
    } catch {
      toast.error('Erro ao atualizar senha.');
    }
  };

  const handleLogout = () => {
    setAlunoLogado(null);
    setAlunoPendente(null);
    localStorage.removeItem('giano_aluno_ativo_id');
    setMenuAberto(false);
    if (onLogout) {
      onLogout();
    }
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
    const primeiroNomeConvidado = alunoConvidado?.nome.split(' ')[0] || '';
    const quatroDigitosWhats = alunoConvidado?.telefone
      ? alunoConvidado.telefone.replace(/\D/g, '').slice(-4)
      : '';

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

          {/* CARD DE LOGIN DE CONVITE PERSONALIZADO */}
          {alunoConvidado && !modoTrocarConta ? (
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-2xl backdrop-blur space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-800">
                <div className="size-12 rounded-2xl bg-amber-500 text-neutral-950 font-black text-base flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                  {alunoConvidado.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    Convite de Acesso
                  </span>
                  <h2 className="text-base font-black text-white truncate mt-0.5">
                    Olá, {primeiroNomeConvidado}! 👋
                  </h2>
                  <p className="text-[11px] text-neutral-400 truncate">
                    Seu treino personalizado está pronto.
                  </p>
                </div>
              </div>

              <form onSubmit={handleLoginConvidado} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 flex items-center justify-between mb-1.5">
                    <span>Senha de Acesso Provisória</span>
                    <span className="text-[10px] text-amber-500 font-normal">
                      Padrão: 4 últimos dígitos do WhatsApp
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={verSenha ? 'text' : 'password'}
                      required
                      autoFocus
                      placeholder={`Digite sua senha (ex: ${quatroDigitosWhats || '1234'})`}
                      value={senhaLogin}
                      onChange={(e) => setSenhaLogin(e.target.value)}
                      className="w-full h-12 px-3.5 pr-11 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setVerSenha(!verSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                      title={verSenha ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {verSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Entrar no Meu Treino</span>
                  <ArrowRight className="size-4 stroke-[3]" />
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setModoTrocarConta(true);
                      setSenhaLogin('');
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                  >
                    Não é você? Entrar com outro e-mail ou WhatsApp
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* CARD DE LOGIN PADRÃO */
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 shadow-2xl backdrop-blur space-y-4 animate-in fade-in zoom-in-95 duration-200">
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
                    <span className="text-[10px] text-amber-500">Padrão: 4 últimos dígitos do WhatsApp</span>
                  </label>
                  <div className="relative">
                    <input
                      type={verSenha ? 'text' : 'password'}
                      placeholder="Sua senha"
                      value={senhaLogin}
                      onChange={(e) => setSenhaLogin(e.target.value)}
                      className="w-full h-11 px-3.5 pr-11 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setVerSenha(!verSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                    >
                      {verSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Acessar Meus Treinos</span>
                  <ArrowRight className="size-4 stroke-[3]" />
                </button>

                {alunoConvidado && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setModoTrocarConta(false);
                        setSenhaLogin('');
                      }}
                      className="text-xs text-amber-400 hover:underline cursor-pointer"
                    >
                      Voltar ao convite de {primeiroNomeConvidado}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* MODAL 1: PERGUNTA DE PRIMEIRO ACESSO (DESEJA ALTERAR SENHA AGORA?) */}
          {modalPrimeiroAcessoAberto && alunoPendente && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-white text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="size-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto">
                  <Lock className="size-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    Deseja alterar sua senha agora?
                  </h3>
                  <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                    Você entrou com a senha provisória de primeiro acesso. Deseja criar uma nova senha pessoal agora ou manter a provisória?
                  </p>
                </div>
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalPrimeiroAcessoAberto(false);
                      setModalTrocarSenhaAberto(true);
                    }}
                    className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <KeyRound className="size-4" />
                    <span>Sim, alterar senha agora</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalPrimeiroAcessoAberto(false);
                      efetivarEntradaAluno(alunoPendente);
                      toast.success(`Bem-vindo(a), ${alunoPendente.nome.split(' ')[0]}! 💪`);
                    }}
                    className="w-full h-12 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-sm active:scale-95 transition-all cursor-pointer"
                  >
                    Não, entrar com senha provisória
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL 2: FORMULÁRIO DE ALTERAÇÃO DE SENHA */}
          {modalTrocarSenhaAberto && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-white space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button
                  type="button"
                  onClick={() => {
                    setModalTrocarSenhaAberto(false);
                    if (alunoPendente && !alunoLogado) {
                      efetivarEntradaAluno(alunoPendente);
                    }
                  }}
                  className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl"
                  title="Fechar"
                >
                  <X className="size-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                    <KeyRound className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Criar Nova Senha</h3>
                    <p className="text-xs text-neutral-400">Defina sua senha pessoal para os próximos acessos.</p>
                  </div>
                </div>

                <form onSubmit={handleSalvarNovaSenha} className="space-y-3.5 pt-1">
                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">
                      Nova Senha *
                    </label>
                    <div className="relative">
                      <input
                        type={verNovaSenha ? 'text' : 'password'}
                        required
                        minLength={4}
                        placeholder="Mínimo de 4 caracteres"
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        className="w-full h-11 px-3.5 pr-11 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setVerNovaSenha(!verNovaSenha)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                      >
                        {verNovaSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-1">
                      Confirmar Nova Senha *
                    </label>
                    <input
                      type={verNovaSenha ? 'text' : 'password'}
                      required
                      minLength={4}
                      placeholder="Repita a nova senha"
                      value={confirmarNovaSenha}
                      onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div className="pt-2 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setModalTrocarSenhaAberto(false);
                        if (alunoPendente && !alunoLogado) {
                          efetivarEntradaAluno(alunoPendente);
                        }
                      }}
                      className="flex-1 h-11 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-xs active:scale-95 transition-all cursor-pointer"
                    >
                      Depois
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      Salvar Senha
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const exercicioAtual: ExercicioItemTreino | undefined = treinoAtivo?.exercicios?.[exercicioIdx];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-start select-none">
      {/* CONTAINER MOBILE (Máximo 430px de largura simulando tela de smartphone) */}
      <div className="w-full max-w-md min-h-screen bg-neutral-950 flex flex-col relative sm:border-x sm:border-neutral-800 shadow-2xl overflow-x-hidden">
        
        {/* Input Oculto de Arquivo para Upload da Foto de Perfil */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUploadFoto}
        />

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

            {/* Avatar Clicável para Alteração Rápida de Foto de Perfil */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="size-9 rounded-full bg-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center overflow-hidden border border-amber-500/40 relative cursor-pointer group hover:ring-2 hover:ring-amber-400 transition-all"
              title="Toque para alterar sua foto de perfil"
            >
              {alunoLogado.foto_url ? (
                <img src={alunoLogado.foto_url} alt={alunoLogado.nome} className="size-full object-cover" />
              ) : (
                alunoLogado.nome.slice(0, 2).toUpperCase()
              )}
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Camera className="size-3.5" />
              </div>
            </button>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL BASEADO NA ABA ATIVA */}
        <main className="flex-1 p-4 space-y-4 pb-28">
          
          {/* ======================================================== */}
          {/* ABA 1: INÍCIO (PAINEL GERAL DO ALUNO)                    */}
          {/* ======================================================== */}
          {abaAtiva === 'inicio' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Boas-vindas do Aluno */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 space-y-3 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
                    {alunoLogado.grupo || 'Consultoria VIP'}
                  </span>
                  <span className="text-xs text-neutral-400 font-semibold capitalize">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white">
                    Olá, {alunoLogado.nome.split(' ')[0]}! 👋
                  </h2>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Bem-vindo ao seu aplicativo exclusivo de treino e performance.
                  </p>
                </div>
              </div>

              {/* Status do Treino: Se sem treino -> Alerta amigável; Se com treino -> Card de Ação */}
              {treinosDoAluno.length === 0 ? (
                <div className="p-4.5 rounded-3xl bg-neutral-900/90 border border-amber-500/30 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                        <Clock className="size-4.5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Treino em elaboração</h4>
                        <p className="text-[11px] text-neutral-400">Personal preparando sua ficha</p>
                      </div>
                    </div>
                    <span className="flex size-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-amber-500" />
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Seu treinador está ajustando sua divisão e exercícios. Enquanto isso, aproveite para explorar seu calendário, metas e avaliações!
                  </p>

                  <button
                    onClick={() => setAbaAtiva('treinos')}
                    className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 hover:text-neutral-950 text-amber-400 text-xs font-black border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Ver status em Treinos</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="p-4.5 rounded-3xl bg-gradient-to-r from-amber-500/20 to-neutral-900 border border-amber-500/40 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-2xl bg-amber-500 text-neutral-950 flex items-center justify-center">
                        <Dumbbell className="size-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-amber-400">Treino Ativo</span>
                        <h4 className="font-black text-sm text-white truncate max-w-[200px]">
                          {treinoAtivo?.nome || treinosDoAluno[0].nome}
                        </h4>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-neutral-950 text-[10px] font-black">
                      {treinosDoAluno.length} {treinosDoAluno.length === 1 ? 'ficha' : 'fichas'}
                    </span>
                  </div>

                  <button
                    onClick={() => setAbaAtiva('treinos')}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-450 text-neutral-950 text-xs font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <span>Ir para Treino</span>
                    <ArrowRight className="size-3.5 stroke-[2.5]" />
                  </button>
                </div>
              )}

              {/* Grade de Atalhos Rápidos para Todas as Funcionalidades */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                    Acesso Rápido
                  </h3>
                  <button
                    onClick={() => setMenuAberto(true)}
                    className="text-[11px] font-bold text-amber-500 hover:underline"
                  >
                    Ver Menu Completo
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setAbaAtiva('treinos')}
                    className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Dumbbell className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white group-hover:text-amber-500 transition-colors">
                        Meus Treinos
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        {treinosDoAluno.length > 0 ? `${treinosDoAluno.length} fichas cadastradas` : 'Em preparação'}
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setAbaAtiva('calendario')}
                    className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="size-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <CalendarIcon className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white group-hover:text-amber-500 transition-colors">
                        Calendário
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        {estatisticasCalendario.totalDiasNoMes > 0 
                          ? `${estatisticasCalendario.totalDiasNoMes} ${estatisticasCalendario.totalDiasNoMes === 1 ? 'treino' : 'treinos'} no mês` 
                          : '0 treinos este mês'}
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setAbaAtiva('avaliacoes')}
                    className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="size-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <ClipboardCheck className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white group-hover:text-amber-500 transition-colors">
                        Avaliações
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        {ultimaAvaliacao ? `${ultimaAvaliacao.peso} kg • ${ultimaAvaliacao.altura} m` : 'Aguardando avaliação'}
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setAbaAtiva('metas')}
                    className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <TrendingUp className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white group-hover:text-amber-500 transition-colors">
                        Metas & Métricas
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        {execucoesDoAluno.length > 0 
                          ? `${estatisticasCalendario.treinosSemana} na semana` 
                          : 'Definir com personal'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Resumo do Meu Plano */}
              <div
                onClick={() => setAbaAtiva('plano')}
                className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <CreditCard className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm text-white group-hover:text-amber-500 transition-colors truncate">
                      Meu Plano & Assinatura
                    </h4>
                    <p className="text-xs text-neutral-400">
                      {alunoLogado.valor_mensalidade && alunoLogado.valor_mensalidade > 0
                        ? `R$ ${alunoLogado.valor_mensalidade},00/mês • Venc. dia ${alunoLogado.dia_vencimento || 10}`
                        : 'Plano em definição pelo personal • Sem cobrança ativa'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="size-4 text-neutral-500 shrink-0 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Card de Contato Direto com o Personal */}
              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-850 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-full bg-amber-500 text-neutral-950 font-black flex items-center justify-center text-sm shrink-0">
                    AG
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">André Gianotti</h4>
                    <p className="text-xs text-neutral-400 truncate">Personal Trainer & Coach</p>
                  </div>
                </div>

                <a
                  href={`https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent(
                    `Olá, professor André! Gostaria de falar sobre meus treinos no app.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  title="Falar no WhatsApp"
                >
                  <Phone className="size-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 2: TREINOS (FICHA DO ALUNO OU TELA DE ESPERA)        */}
          {/* ======================================================== */}
          {abaAtiva === 'treinos' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Cabeçalho da Aba com Botão Voltar */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAbaAtiva('inicio')}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                  title="Voltar ao Início"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-white">Meus Treinos</h2>
                  <p className="text-xs text-neutral-400">
                    {treinosDoAluno.length > 0
                      ? (treinoAtivo?.nome || 'Rotina de exercícios')
                      : 'Rotina personalizada'}
                  </p>
                </div>
              </div>

              {treinosDoAluno.length === 0 ? (
                /* Estado sem carga de treino: Mensagem e botão WhatsApp exclusivos aqui */
                <div className="py-10 px-4 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="relative">
                    <div className="size-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10">
                      <Dumbbell className="size-10 stroke-[2] animate-bounce" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-neutral-900 border-2 border-neutral-950 flex items-center justify-center text-amber-500">
                      <Clock className="size-4" />
                    </div>
                  </div>

                  <div className="space-y-2 max-w-xs">
                    <h2 className="text-xl font-black text-white">
                      Olá, {alunoLogado.nome.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      Seu personal trainer está preparando sua rotina e ficha de treinos personalizada.
                    </p>
                    <p className="text-xs text-neutral-500">
                      Assim que seus treinos forem prescritos pela gestão, eles aparecerão automaticamente aqui!
                    </p>
                  </div>

                  <div className="w-full max-w-xs pt-2">
                    <a
                      href={`https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent(
                        `Olá, professor! Acabei de acessar o app Personal Academy. Poderia preparar minha ficha de treinos?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-450 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Phone className="size-4" />
                      <span>Falar com meu Personal no WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : treinoAtivo && exercicioAtual ? (
                <div className="space-y-4">
                  {/* Seletor de Fichas (quando tiver mais de um treino atribuído) */}
                  {treinosDoAluno.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                      {treinosDoAluno.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTreinoAtivo(t);
                            setExercicioIdx(0);
                            setSeriesFeitas({});
                            setTreinoIniciado(false);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            treinoAtivo?.id === t.id
                              ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                              : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {t.nome}
                        </button>
                      ))}
                    </div>
                  )}

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
                          className={`w-full grid grid-cols-4 items-center py-2.5 rounded-xl text-center text-sm font-bold transition-all cursor-pointer ${
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
                      className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 disabled:opacity-30 cursor-pointer"
                    >
                      ← Anterior
                    </button>
                    <span className="text-xs font-bold text-neutral-500">
                      {exercicioIdx + 1} de {treinoAtivo.exercicios.length}
                    </span>
                    <button
                      disabled={exercicioIdx === treinoAtivo.exercicios.length - 1}
                      onClick={() => setExercicioIdx((p) => Math.min(treinoAtivo.exercicios.length - 1, p + 1))}
                      className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 disabled:opacity-30 cursor-pointer"
                    >
                      Próximo →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-neutral-500 space-y-2">
                  <Dumbbell className="size-10 mx-auto text-neutral-700" />
                  <p className="text-sm font-semibold">Nenhum exercício cadastrado nesta ficha.</p>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 3: CALENDÁRIO (FREQUÊNCIA E HISTÓRICO DE TREINOS)    */}
          {/* ======================================================== */}
          {abaAtiva === 'calendario' && (() => {
            const dataHoje = new Date();
            const anoHoje = dataHoje.getFullYear();
            const mesHoje = dataHoje.getMonth();
            const diaHojeNum = dataHoje.getDate();
            const nomeMes = dataHoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const diasNoMesTotal = new Date(anoHoje, mesHoje + 1, 0).getDate();
            const primeiroDiaSemana = new Date(anoHoje, mesHoje, 1).getDay();
            const consistenciaPct = estatisticasCalendario.totalDiasNoMes > 0
              ? Math.min(100, Math.round((estatisticasCalendario.totalDiasNoMes / Math.max(1, Math.round((diaHojeNum / 7) * 4))) * 100))
              : 0;

            return (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAbaAtiva('inicio')}
                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                    title="Voltar ao Início"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <div>
                    <h2 className="text-xl font-black text-white">Calendário de Treinos</h2>
                    <p className="text-xs text-neutral-400">Frequência e histórico de atividade</p>
                  </div>
                </div>

                {/* Estatísticas de Frequência Dinâmicas */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-0.5">
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">No Mês</span>
                    <span className="text-lg font-black text-amber-500">
                      {estatisticasCalendario.totalDiasNoMes} {estatisticasCalendario.totalDiasNoMes === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-0.5">
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">Sequência</span>
                    <span className="text-lg font-black text-emerald-400">
                      {estatisticasCalendario.sequencia} {estatisticasCalendario.sequencia === 1 ? 'dia' : 'dias'} {estatisticasCalendario.sequencia > 0 ? '🔥' : '🌱'}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-center space-y-0.5">
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">Consistência</span>
                    <span className="text-lg font-black text-white">{consistenciaPct}%</span>
                  </div>
                </div>

                {/* Calendário Mensal Estilizado Dinâmico */}
                <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-850 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <h4 className="font-black text-sm text-white capitalize">{nomeMes}</h4>
                    <span className="text-xs text-amber-500 font-bold">Hoje: dia {diaHojeNum}</span>
                  </div>

                  {/* Dias da Semana */}
                  <div className="grid grid-cols-7 text-center text-[10px] font-black uppercase text-neutral-500">
                    <span>D</span>
                    <span>S</span>
                    <span>T</span>
                    <span>Q</span>
                    <span>Q</span>
                    <span>S</span>
                    <span>S</span>
                  </div>

                  {/* Grid de Dias */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
                    {/* Espaços vazios antes do dia 1 */}
                    {Array.from({ length: primeiroDiaSemana }).map((_, i) => (
                      <span key={`vazio-${i}`} className="py-2 text-neutral-800/40">·</span>
                    ))}

                    {/* Dias 1 ao último do mês */}
                    {Array.from({ length: diasNoMesTotal }).map((_, i) => {
                      const dia = i + 1;
                      const treinado = estatisticasCalendario.diasDoMesSet.has(dia);
                      const isHoje = dia === diaHojeNum;

                      return (
                        <div
                          key={dia}
                          className={`py-2 rounded-xl flex flex-col items-center justify-center relative transition-all ${
                            isHoje
                              ? 'bg-amber-500 text-neutral-950 font-black shadow-md shadow-amber-500/20'
                              : treinado
                              ? 'bg-neutral-800 text-amber-400 border border-amber-500/30'
                              : 'text-neutral-400 hover:bg-neutral-850'
                          }`}
                        >
                          <span>{dia}</span>
                          {treinado && !isHoje && (
                            <span className="size-1 rounded-full bg-amber-400 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status de Atividade / Fichas do Aluno */}
                {estatisticasCalendario.totalDiasNoMes === 0 ? (
                  <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-850 text-center space-y-2">
                    <CalendarIcon className="size-8 mx-auto text-neutral-600" />
                    <h4 className="text-sm font-bold text-white">Nenhum treino realizado ainda</h4>
                    <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                      Ao concluir seus treinos na aba <strong>Treinos</strong>, os dias serão marcados automaticamente no calendário para você acompanhar sua frequência.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-850 space-y-2.5">
                    <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-wider">
                      Suas Fichas Ativas
                    </h4>
                    <div className="space-y-2">
                      {treinosDoAluno.map((tr) => (
                        <div key={tr.id} className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between text-xs">
                          <span className="font-bold text-white">{tr.nome}</span>
                          <span className="text-amber-500 font-semibold">{tr.exercicios.length} exercícios</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* ABA 4: AVALIAÇÕES FÍSICAS (MEDIDAS E BIOIMPEDÂNCIA)       */}
          {/* ======================================================== */}
          {abaAtiva === 'avaliacoes' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAbaAtiva('inicio')}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                  title="Voltar ao Início"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-white">Avaliações Físicas</h2>
                  <p className="text-xs text-neutral-400">Medidas corporais e composição física</p>
                </div>
              </div>

              {/* Cards de Métricas Corporais */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold">
                    <Scale className="size-4 text-amber-500" />
                    <span>Peso Atual</span>
                  </div>
                  <p className="text-xl font-black text-white">
                    {ultimaAvaliacao?.peso ? (
                      <>
                        {ultimaAvaliacao.peso} <span className="text-xs font-normal text-neutral-400">kg</span>
                      </>
                    ) : (
                      <span className="text-neutral-500 text-base font-bold">-- kg</span>
                    )}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold">
                    <Ruler className="size-4 text-blue-400" />
                    <span>Altura</span>
                  </div>
                  <p className="text-xl font-black text-white">
                    {ultimaAvaliacao?.altura ? (
                      <>
                        {ultimaAvaliacao.altura} <span className="text-xs font-normal text-neutral-400">m</span>
                      </>
                    ) : (
                      <span className="text-neutral-500 text-base font-bold">-- m</span>
                    )}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold">
                    <Activity className="size-4 text-purple-400" />
                    <span>IMC</span>
                  </div>
                  <p className="text-xl font-black text-white">
                    {(() => {
                      const imcCalc = ultimaAvaliacao?.imc || (ultimaAvaliacao?.peso && ultimaAvaliacao?.altura ? ultimaAvaliacao.peso / (ultimaAvaliacao.altura * ultimaAvaliacao.altura) : null);
                      if (imcCalc) {
                        return (
                          <>
                            {imcCalc.toFixed(1)}{' '}
                            <span className="text-xs font-normal text-emerald-400">
                              ({ultimaAvaliacao?.classificacao_imc || 'Normal'})
                            </span>
                          </>
                        );
                      }
                      return <span className="text-neutral-500 text-base font-bold">--</span>;
                    })()}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-semibold">
                    <Flame className="size-4 text-orange-400" />
                    <span>% Gordura</span>
                  </div>
                  <p className="text-xl font-black text-white">
                    {(() => {
                      const gordura = ultimaAvaliacao?.percentual_gordura ?? ultimaAvaliacao?.gordura_corporal;
                      if (gordura !== undefined && gordura !== null) {
                        return (
                          <>
                            {gordura} <span className="text-xs font-normal text-neutral-400">%</span>
                          </>
                        );
                      }
                      return <span className="text-neutral-500 text-base font-bold">-- %</span>;
                    })()}
                  </p>
                </div>
              </div>

              {/* Tabela de Medidas ou Estado Vazio */}
              {ultimaAvaliacao ? (
                <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-850 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <h4 className="font-black text-sm text-white">Perímetros Corporais</h4>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">
                      {ultimaAvaliacao.data ? new Date(ultimaAvaliacao.data).toLocaleDateString('pt-BR') : 'Última avaliação'}
                    </span>
                  </div>

                  <div className="divide-y divide-neutral-850 text-xs">
                    {Object.entries(ultimaAvaliacao.medidas || {}).map(([chave, valor]) => (
                      <div key={chave} className="py-2 flex items-center justify-between">
                        <span className="text-neutral-400 font-medium capitalize">{chave.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-white">{valor} cm</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-neutral-900 border border-neutral-850 text-center space-y-2.5">
                  <Scale className="size-8 mx-auto text-neutral-600" />
                  <h4 className="font-bold text-sm text-white">Aguardando Primeira Avaliação</h4>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                    Assim que seu personal realizar sua primeira avaliação física e bioimpedância, suas medidas e evolução aparecerão aqui.
                  </p>
                </div>
              )}

              {/* Fotos Comparativas */}
              <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-850 space-y-3">
                <h4 className="font-black text-sm text-white">Fotos de Evolução</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="aspect-[3/4] rounded-2xl bg-neutral-950 border border-dashed border-neutral-800 flex flex-col items-center justify-center text-neutral-600 space-y-1">
                    <Camera className="size-5" />
                    <span className="text-[10px] font-bold">Frente</span>
                  </div>
                  <div className="aspect-[3/4] rounded-2xl bg-neutral-950 border border-dashed border-neutral-800 flex flex-col items-center justify-center text-neutral-600 space-y-1">
                    <Camera className="size-5" />
                    <span className="text-[10px] font-bold">Lateral</span>
                  </div>
                  <div className="aspect-[3/4] rounded-2xl bg-neutral-950 border border-dashed border-neutral-800 flex flex-col items-center justify-center text-neutral-600 space-y-1">
                    <Camera className="size-5" />
                    <span className="text-[10px] font-bold">Costas</span>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400 text-center">
                  Novas fotos são adicionadas a cada ciclo de reavaliação física pelo personal.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ABA 5: METAS E MÉTRICAS (METAS & CONSISTÊNCIA)           */}
          {/* ======================================================== */}
          {abaAtiva === 'metas' && (() => {
            const treinosSemana = estatisticasCalendario.treinosSemana;
            const metaSemanal = 4;
            const pctSemana = Math.min(100, Math.round((treinosSemana / metaSemanal) * 100));

            return (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAbaAtiva('inicio')}
                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                    title="Voltar ao Início"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <div>
                    <h2 className="text-xl font-black text-white">Metas & Métricas</h2>
                    <p className="text-xs text-neutral-400">Seus objetivos e acompanhamento de consistência</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Frequência Semanal Dinâmica */}
                  <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-850 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="size-4.5 text-orange-400" />
                        <h4 className="font-bold text-sm text-white">Frequência Semanal</h4>
                      </div>
                      <span className="text-xs font-black text-emerald-400">
                        {treinosSemana} de {metaSemanal} treinos
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pctSemana}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-neutral-400">
                      {treinosSemana === 0
                        ? 'Você ainda não realizou treinos esta semana. Acesse a aba Treinos para começar! 💪'
                        : treinosSemana >= metaSemanal
                        ? 'Parabéns! Meta semanal concluída com sucesso! 🔥'
                        : `Faltam ${metaSemanal - treinosSemana} ${metaSemanal - treinosSemana === 1 ? 'treino' : 'treinos'} para bater sua meta semanal de ${metaSemanal} sessões! 💪`}
                    </p>
                  </div>

                  {/* Meta de Peso Corporal Dinâmica */}
                  {ultimaAvaliacao?.peso ? (
                    <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-850 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="size-4.5 text-amber-500" />
                          <h4 className="font-bold text-sm text-white">Meta de Peso Corporal</h4>
                        </div>
                        <span className="text-xs font-black text-amber-500">Em acompanhamento</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-neutral-400 font-semibold pt-1">
                        <span>Peso Atual: <strong className="text-white">{ultimaAvaliacao.peso} kg</strong></span>
                        <span>Altura: <strong className="text-white">{ultimaAvaliacao.altura} m</strong></span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-850 text-center space-y-2">
                      <Target className="size-8 mx-auto text-neutral-600" />
                      <h4 className="font-bold text-sm text-white">Metas em Elaboração</h4>
                      <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                        Suas metas personalizadas de peso e composição física serão alinhadas com o personal trainer na primeira avaliação.
                      </p>
                    </div>
                  )}

                  {/* Hidratação Diária */}
                  <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-850 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="size-4.5 text-blue-400" />
                        <h4 className="font-bold text-sm text-white">Hidratação Recomendada</h4>
                      </div>
                      <span className="text-xs font-black text-blue-400">
                        {ultimaAvaliacao?.peso
                          ? `${((ultimaAvaliacao.peso * 35) / 1000).toFixed(1)} L / dia`
                          : '2.5 L / dia'}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      A ingestão diária recomendada (35ml por kg de peso) otimiza a recuperação muscular, a síntese proteica e reduz câimbras.
                    </p>
                  </div>
                </div>

                {/* Dica do Personal */}
                <div className="p-4 rounded-3xl bg-neutral-900/60 border border-neutral-800 space-y-1 text-center">
                  <span className="text-xs font-bold text-amber-500">Filosofia GIANO Performance</span>
                  <p className="text-xs text-neutral-300 italic">
                    "Você não treina apenas corpos, você constrói autoconfiança."
                  </p>
                </div>
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* ABA 6: MEU PLANO (MENSALIDADE, VENCIMENTO E ACESSO)      */}
          {/* ======================================================== */}
          {abaAtiva === 'plano' && (() => {
            const temPlanoAtivo = Boolean(alunoLogado.valor_mensalidade && alunoLogado.valor_mensalidade > 0);

            return (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAbaAtiva('inicio')}
                    className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                    title="Voltar ao Início"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <div>
                    <h2 className="text-xl font-black text-white">Meu Plano & Assinatura</h2>
                    <p className="text-xs text-neutral-400">Detalhes da sua consultoria e pagamentos</p>
                  </div>
                </div>

                {/* Card de Assinatura */}
                {temPlanoAtivo ? (
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black">
                        Acesso Ativo & Liberado
                      </span>
                      <span className="text-xs text-neutral-400 font-bold">Plano Mensal</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-neutral-400 font-medium">Valor da Mensalidade</span>
                      <h3 className="text-3xl font-black text-white">
                        R$ {alunoLogado.valor_mensalidade},00 <span className="text-xs font-normal text-neutral-400">/ mês</span>
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Dia de Vencimento</span>
                        <span className="font-bold text-white">
                          {alunoLogado.dia_vencimento ? `Todo dia ${alunoLogado.dia_vencimento}` : 'A combinar'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Grupo / Categoria</span>
                        <span className="font-bold text-amber-500">{alunoLogado.grupo || 'Consultoria VIP'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Personal Responsável</span>
                        <span className="font-bold text-white">André Gianotti</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black">
                        Plano em Definição
                      </span>
                      <span className="text-xs text-neutral-500 font-bold">Sem cobrança ativa</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-neutral-400 font-medium">Valor da Mensalidade</span>
                      <h3 className="text-2xl font-black text-neutral-300">
                        A combinar com o personal
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Dia de Vencimento</span>
                        <span className="font-bold text-neutral-400">A definir</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Grupo / Categoria</span>
                        <span className="font-bold text-amber-500">{alunoLogado.grupo || 'Geral'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400">Personal Responsável</span>
                        <span className="font-bold text-white">André Gianotti</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão de Envio de Comprovante / Contato Financeiro */}
                <div className="p-4 rounded-3xl bg-neutral-900 border border-neutral-850 space-y-3">
                  <h4 className="font-bold text-sm text-white">Dúvidas Financeiras ou Plano</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Envie seu comprovante de mensalidade ou alinhe os detalhes do seu plano diretamente com seu professor.
                  </p>
                  <a
                    href={`https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent(
                      `Olá, professor André! Gostaria de falar sobre o meu plano no app.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Phone className="size-3.5 text-amber-500" />
                    <span>Falar com Personal via WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })()}

          {/* ======================================================== */}
          {/* ABA 7: CHAT E SUPORTE (COMUNICAÇÃO COM O PERSONAL)       */}
          {/* ======================================================== */}
          {abaAtiva === 'chat' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAbaAtiva('inicio')}
                  className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                  title="Voltar ao Início"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-white">Chat & Contato</h2>
                  <p className="text-xs text-neutral-400">Canal direto com seu Personal Trainer</p>
                </div>
              </div>

              {/* Card Central de Atendimento */}
              <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-850 space-y-4 text-center">
                <div className="size-16 rounded-full bg-amber-500 text-neutral-950 font-black text-xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
                  AG
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-lg text-white">André Gianotti</h3>
                  <p className="text-xs text-neutral-400">Atendimento prioritário para alunos</p>
                </div>

                <a
                  href={`https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent(
                    `Olá, professor André! Gostaria de tirar uma dúvida sobre meus treinos.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-450 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <Phone className="size-4" />
                  <span>Iniciar Conversa no WhatsApp</span>
                </a>
              </div>

              {/* Tópicos de Atendimento Rápido */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400">
                  Tópicos Rápidos (Clique para Enviar)
                </h4>

                <div className="space-y-2">
                  {[
                    { label: 'Dúvida sobre execução de exercício', msg: 'Professor, tenho uma dúvida sobre a execução de um exercício da minha ficha.' },
                    { label: 'Relatar incômodo ou dor muscular/articular', msg: 'Professor, senti um incômodo durante o treino e gostaria da sua orientação.' },
                    { label: 'Solicitar alteração de cargas ou repetições', msg: 'Professor, achei as cargas do meu treino leves/pesadas, poderíamos ajustar?' },
                    { label: 'Agendar nova avaliação física presencial', msg: 'Professor, gostaria de agendar uma nova avaliação física.' },
                  ].map((topico, idx) => (
                    <a
                      key={idx}
                      href={`https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent(topico.msg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-left flex items-center justify-between gap-3 text-xs font-semibold text-neutral-200 hover:text-white transition-all cursor-pointer group"
                    >
                      <span>{topico.label}</span>
                      <ArrowRight className="size-3.5 text-neutral-500 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>

        {/* BARRA FIXA DE AÇÃO INFERIOR COM BOTÃO AMARELO (ESTILO NEXUR - FIGURA 3) */}
        {abaAtiva === 'treinos' && treinoAtivo && (
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-neutral-950/95 border-t border-neutral-850 backdrop-blur z-20">
            {!treinoIniciado ? (
              <button
                onClick={() => {
                  setTreinoIniciado(true);
                  toast.success('Treino iniciado! Bom treino 💪');
                }}
                className="w-full h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-base shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
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
                className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-base shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="size-5" />
                <span>Concluir Treino de Hoje</span>
              </button>
            )}
          </div>
        )}

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
                  <div
                    onClick={() => {
                      setMenuAberto(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-3 cursor-pointer group"
                    title="Toque para alterar sua foto de perfil"
                  >
                    <div className="relative">
                      <div className="size-11 rounded-full bg-amber-500 text-neutral-950 font-black text-sm flex items-center justify-center overflow-hidden border border-amber-500/40">
                        {alunoLogado.foto_url ? (
                          <img src={alunoLogado.foto_url} alt={alunoLogado.nome} className="size-full object-cover" />
                        ) : (
                          alunoLogado.nome.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 size-4.5 rounded-full bg-neutral-900 border border-neutral-700 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="size-2.5" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400">Olá, 👋</p>
                      <p className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                        {alunoLogado.nome.split(' ')[0]}
                      </p>
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

                {/* Opções Permanentes de Conta: Alterar Foto e Alterar Senha */}
                <div className="pt-2 border-t border-neutral-800 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAberto(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-bold text-sm text-left text-neutral-300 hover:text-white hover:bg-neutral-850 transition-colors cursor-pointer"
                  >
                    <Camera className="size-4 text-amber-500" />
                    <span>Alterar Foto de Perfil</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuAberto(false);
                      setModalTrocarSenhaAberto(true);
                    }}
                    className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-bold text-sm text-left text-neutral-300 hover:text-white hover:bg-neutral-850 transition-colors cursor-pointer"
                  >
                    <Lock className="size-4 text-amber-500" />
                    <span>Alterar Senha</span>
                  </button>
                </div>
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

        {/* MODAL DE ALTERAÇÃO DE SENHA QUANDO LOGADO */}
        {modalTrocarSenhaAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-white space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button
                type="button"
                onClick={() => setModalTrocarSenhaAberto(false)}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-xl"
                title="Fechar"
              >
                <X className="size-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                  <KeyRound className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Alterar Minha Senha</h3>
                  <p className="text-xs text-neutral-400">Defina sua nova senha pessoal de acesso.</p>
                </div>
              </div>

              <form onSubmit={handleSalvarNovaSenha} className="space-y-3.5 pt-1">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Nova Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={verNovaSenha ? 'text' : 'password'}
                      required
                      minLength={4}
                      placeholder="Mínimo de 4 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="w-full h-11 px-3.5 pr-11 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setVerNovaSenha(!verNovaSenha)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                    >
                      {verNovaSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1">
                    Confirmar Nova Senha *
                  </label>
                  <input
                    type={verNovaSenha ? 'text' : 'password'}
                    required
                    minLength={4}
                    placeholder="Repita a nova senha"
                    value={confirmarNovaSenha}
                    onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalTrocarSenhaAberto(false)}
                    className="flex-1 h-11 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-xs active:scale-95 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Salvar Senha
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
