import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  SlidersHorizontal, 
  CheckCircle2, 
  Dumbbell, 
  Calendar, 
  Copy, 
  Sparkles, 
  Clock, 
  X,
  Filter,
  Check,
  ChevronRight,
  TrendingUp,
  Folder
} from 'lucide-react';
import type { Aluno, Treino, Exercicio, PastaExercicio, ExercicioItemTreino } from '@/lib/types';
import { parseMedia } from '@/lib/media.utils';
import { toast } from 'sonner';

interface TreinosAlunoNexurViewProps {
  aluno: Aluno;
  treinos: Treino[];
  exercicios: Exercicio[];
  pastas: PastaExercicio[];
  onVoltar: () => void;
  onUpdateAluno: (id: string, patch: Partial<Aluno>) => Promise<void>;
  onAddTreino: (novo: Omit<Treino, 'id'>) => Promise<Treino | void>;
  onUpdateTreino: (id: string, patch: Partial<Treino>) => Promise<void>;
  onDeleteTreino?: (id: string) => Promise<void>;
}

export const TreinosAlunoNexurView: React.FC<TreinosAlunoNexurViewProps> = ({
  aluno,
  treinos,
  exercicios,
  pastas,
  onVoltar,
  onUpdateAluno,
  onAddTreino,
  onUpdateTreino,
  onDeleteTreino,
}) => {
  // Modo de visualização: 'lista' de treinos do aluno ou 'editor' (split view estilo Nexur)
  const [modo, setModo] = useState<'lista' | 'editor'>('lista');
  const [buscaTreino, setBuscaTreino] = useState('');
  const [menuNovoAberto, setMenuNovoAberto] = useState(false);
  const [modalImportarAberto, setModalImportarAberto] = useState(false);

  // Estados do Editor Split View
  const [treinoEmEdicao, setTreinoEmEdicao] = useState<Treino | null>(null);
  const [nomeTreino, setNomeTreino] = useState('');
  const [descricaoTreino, setDescricaoTreino] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [exerciciosDaFicha, setExerciciosDaFicha] = useState<ExercicioItemTreino[]>([]);
  const [salvandoTreino, setSalvandoTreino] = useState(false);

  // Estados da Biblioteca lateral de exercícios
  const [buscaExercicio, setBuscaExercicio] = useState('');
  const [pastaSelecionada, setPastaSelecionada] = useState<string>('todas');

  const treinosIdsAluno = useMemo(() => aluno.treinos_ids || [], [aluno.treinos_ids]);

  // Lista de treinos associados a este aluno
  const treinosDoAluno = useMemo(() => {
    return treinos.filter((t) => treinosIdsAluno.includes(t.id));
  }, [treinos, treinosIdsAluno]);

  // Treinos filtrados na lista
  const treinosFiltrados = useMemo(() => {
    const termo = buscaTreino.trim().toLowerCase();
    if (!termo) return treinosDoAluno;
    return treinosDoAluno.filter((t) => 
      t.nome.toLowerCase().includes(termo) || 
      (t.descricao && t.descricao.toLowerCase().includes(termo))
    );
  }, [treinosDoAluno, buscaTreino]);

  // Treinos disponíveis na biblioteca que o aluno ainda não possui
  const treinosDisponiveisImportacao = useMemo(() => {
    return treinos.filter((t) => !treinosIdsAluno.includes(t.id));
  }, [treinos, treinosIdsAluno]);

  // Exercícios filtrados na coluna lateral direita
  const exerciciosFiltrados = useMemo(() => {
    return exercicios.filter((ex) => {
      const termo = buscaExercicio.trim().toLowerCase();
      const matchBusca = !termo || 
        ex.titulo.toLowerCase().includes(termo) || 
        ex.equipamento.toLowerCase().includes(termo) || 
        ex.grupo.toLowerCase().includes(termo);

      const matchPasta = pastaSelecionada === 'todas' || ex.pasta_id === pastaSelecionada;
      return matchBusca && matchPasta;
    });
  }, [exercicios, buscaExercicio, pastaSelecionada]);

  // Alterna ativação/desativação de um treino pelo interruptor (toggle)
  const handleToggleTreinoAtivo = async (treinoId: string) => {
    const estaAtivo = treinosIdsAluno.includes(treinoId);
    const novosIds = estaAtivo
      ? treinosIdsAluno.filter((id) => id !== treinoId)
      : [...treinosIdsAluno, treinoId];

    try {
      await onUpdateAluno(aluno.id, { treinos_ids: novosIds });
      const treino = treinos.find((t) => t.id === treinoId);
      const nomeT = treino ? treino.nome : 'Treino';
      if (estaAtivo) {
        toast.info(`"${nomeT}" desativado no app de ${aluno.nome.split(' ')[0]}.`);
      } else {
        toast.success(`"${nomeT}" ativado no app de ${aluno.nome.split(' ')[0]}!`);
      }
    } catch {
      toast.error('Erro ao atualizar status do treino.');
    }
  };

  // Abre o editor para montar um novo treino do zero
  const handleIniciarNovoTreino = () => {
    setTreinoEmEdicao(null);
    setNomeTreino('');
    setDescricaoTreino('');
    setDataInicio(new Date().toLocaleDateString('pt-BR'));
    setDataFim('');
    setExerciciosDaFicha([]);
    setModo('editor');
    setMenuNovoAberto(false);
  };

  // Abre o editor para editar um treino existente
  const handleEditarTreino = (treino: Treino) => {
    setTreinoEmEdicao(treino);
    setNomeTreino(treino.nome);
    setDescricaoTreino(treino.descricao || '');
    setDataInicio(new Date().toLocaleDateString('pt-BR'));
    setDataFim('');
    setExerciciosDaFicha(treino.exercicios || []);
    setModo('editor');
  };

  // Importa um treino da biblioteca geral diretamente para o aluno
  const handleImportarTreinoDaBiblioteca = async (treinoId: string) => {
    if (treinosIdsAluno.includes(treinoId)) return;
    const novosIds = [...treinosIdsAluno, treinoId];
    try {
      await onUpdateAluno(aluno.id, { treinos_ids: novosIds });
      const treino = treinos.find((t) => t.id === treinoId);
      toast.success(`Ficha "${treino?.nome || 'Treino'}" adicionada ao aluno!`);
      setModalImportarAberto(false);
    } catch {
      toast.error('Erro ao importar ficha.');
    }
  };

  // Adiciona um exercício da biblioteca lateral para dentro da ficha em edição
  const handleAdicionarExercicioNaFicha = (exercicio: Exercicio) => {
    const item: ExercicioItemTreino = {
      exercicio_id: exercicio.id,
      titulo: exercicio.titulo,
      series: 4,
      repeticoes: '10-12',
      carga: '—',
      descanso_segundos: 60,
      observacoes: exercicio.orientacoes || '',
      midia: exercicio.midia || exercicio.video_url,
    };
    setExerciciosDaFicha((prev) => [...prev, item]);
    toast.success(`"${exercicio.titulo}" adicionado à ficha!`);
  };

  // Remove um exercício da ficha em edição
  const handleRemoverExercicioDaFicha = (index: number) => {
    setExerciciosDaFicha((prev) => prev.filter((_, i) => i !== index));
  };

  // Atualiza um campo de exercício dentro da ficha (séries, repetições, carga, descanso)
  const handleUpdateExercicioItem = (index: number, campo: keyof ExercicioItemTreino, valor: any) => {
    setExerciciosDaFicha((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item))
    );
  };

  // Salva a ficha de treino montada
  const handleSalvarFicha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeTreino.trim()) {
      toast.error('Informe o nome da rotina de treino.');
      return;
    }

    setSalvandoTreino(true);
    try {
      if (treinoEmEdicao) {
        // Atualiza treino existente
        await onUpdateTreino(treinoEmEdicao.id, {
          nome: nomeTreino.trim(),
          descricao: descricaoTreino.trim(),
          exercicios: exerciciosDaFicha,
        });
        toast.success(`Treino "${nomeTreino.trim()}" atualizado com sucesso!`);
      } else {
        // Cria novo treino
        const novo = await onAddTreino({
          nome: nomeTreino.trim(),
          descricao: descricaoTreino.trim() || 'Treino personalizado',
          professor_id: '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
          exercicios: exerciciosDaFicha,
          created_at: new Date().toISOString(),
        });
        if (novo && 'id' in novo) {
          const novoId = (novo as Treino).id;
          if (!treinosIdsAluno.includes(novoId)) {
            await onUpdateAluno(aluno.id, { treinos_ids: [...treinosIdsAluno, novoId] });
          }
        }
        toast.success(`Treino "${nomeTreino.trim()}" montado e liberado para o aluno!`);
      }
      setModo('lista');
    } catch {
      toast.error('Erro ao salvar treino.');
    } finally {
      setSalvandoTreino(false);
    }
  };

  // Exclui uma ficha de treino
  const handleExcluirTreino = async (treinoId: string, treinoNome: string) => {
    if (!window.confirm(`Deseja desvincular ou excluir a ficha "${treinoNome}"?`)) {
      return;
    }
    try {
      // Remove do aluno
      const novosIds = treinosIdsAluno.filter((id) => id !== treinoId);
      await onUpdateAluno(aluno.id, { treinos_ids: novosIds });
      toast.success(`Ficha "${treinoNome}" removida do aluno.`);
      if (modo === 'editor') {
        setModo('lista');
      }
    } catch {
      toast.error('Erro ao remover ficha.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white pb-12 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* BARRA SUPERIOR CONTEXTUAL (ESTILO NEXUR)                 */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={modo === 'editor' ? () => setModo('lista') : onVoltar}
            className="size-9 rounded-full text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
            title={modo === 'editor' ? 'Voltar para lista de treinos' : 'Voltar para Clientes'}
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            {aluno.foto_url ? (
              <img
                src={aluno.foto_url}
                alt={aluno.nome}
                className="size-9 rounded-full object-cover border border-amber-500/30 shrink-0"
              />
            ) : (
              <div className="size-9 rounded-full bg-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                {aluno.nome.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-black truncate leading-tight">
                {aluno.nome}
              </h1>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {modo === 'editor' ? (treinoEmEdicao ? 'Editando Treino' : 'Novo Treino Personalizado') : 'Painel de Treinos do Atleta'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            {treinosDoAluno.length} {treinosDoAluno.length === 1 ? 'ficha atribuída' : 'fichas atribuídas'}
          </span>
        </div>
      </header>

      {/* ======================================================== */}
      {/* TELA 1: LISTA DE TREINOS DO ALUNO COM TOGGLE SWITCH      */}
      {/* ======================================================== */}
      {modo === 'lista' && (
        <main className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
          {/* Título e Ações Rápidas */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Treinos</h2>

            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalImportarAberto(true)}
                className="h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Importar modelo da biblioteca geral"
              >
                <Copy className="size-3.5" />
                <span className="hidden sm:inline">Importar Ficha</span>
              </button>

              <button
                type="button"
                onClick={handleIniciarNovoTreino}
                className="size-10 sm:h-10 sm:px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                title="Montar novo treino do zero"
              >
                <Plus className="size-5 sm:size-4 stroke-[3]" />
                <span className="hidden sm:inline">Novo Treino</span>
              </button>
            </div>
          </div>

          {/* Barra de Busca de Treinos */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar ficha por nome..."
              value={buscaTreino}
              onChange={(e) => setBuscaTreino(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
          </div>

          {/* Lista de Fichas do Aluno (Estilo Nexur) */}
          <div className="space-y-3">
            {treinosFiltrados.length === 0 ? (
              <div className="p-12 text-center rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 space-y-4">
                <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Dumbbell className="size-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                    Nenhum treino liberado para este atleta
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1">
                    Crie uma nova rotina sob medida ou importe um modelo existente da biblioteca geral.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleIniciarNovoTreino}
                    className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="size-4 stroke-[3]" />
                    <span>Montar Treino do Zero</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalImportarAberto(true)}
                    className="h-10 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>Importar Modelo</span>
                  </button>
                </div>
              </div>
            ) : (
              treinosFiltrados.map((treino) => {
                const isAtivo = treinosIdsAluno.includes(treino.id);
                return (
                  <div
                    key={treino.id}
                    className="group p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-amber-500/40 transition-all shadow-xs flex items-center justify-between gap-4"
                  >
                    {/* Informações da Ficha (Clique abre o editor) */}
                    <div
                      onClick={() => handleEditarTreino(treino)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors truncate">
                          {treino.nome}
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                        {treino.descricao || `${treino.exercicios?.length || 0} exercícios cadastrados`}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-neutral-400" />
                          <span>{treino.exercicios?.length || 0} exercícios</span>
                        </span>
                        <span>•</span>
                        <span>Atualizado recentemente</span>
                      </div>
                    </div>

                    {/* Ações: Editar, Excluir e Toggle Switch */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditarTreino(treino)}
                        className="size-9 rounded-xl text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
                        title="Editar rotina e exercícios"
                      >
                        <Edit3 className="size-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExcluirTreino(treino.id, treino.nome)}
                        className="size-9 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
                        title="Remover treino deste aluno"
                      >
                        <Trash2 className="size-4" />
                      </button>

                      {/* Interruptor (Toggle Switch) estilo Nexur */}
                      <button
                        type="button"
                        onClick={() => handleToggleTreinoAtivo(treino.id)}
                        className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                          isAtivo ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-700'
                        }`}
                        title={isAtivo ? 'Treino liberado no app do aluno (clique para pausar)' : 'Treino pausado (clique para liberar)'}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-md transition-transform transform ${
                            isAtivo ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* TELA 2: MONTADOR SPLIT VIEW (ESTILO NEXUR - PRINT 2)     */}
      {/* ======================================================== */}
      {modo === 'editor' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6">
          <form onSubmit={handleSalvarFicha} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ---------------------------------------------------- */}
            {/* COLUNA DA ESQUERDA: DADOS DO TREINO E EXERCÍCIOS     */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                    <Dumbbell className="size-5 text-amber-500" />
                    <span>{treinoEmEdicao ? 'Editar Treino' : 'Novo Treino'}</span>
                  </h3>
                  {treinoEmEdicao && (
                    <button
                      type="button"
                      onClick={() => handleExcluirTreino(treinoEmEdicao.id, treinoEmEdicao.nome)}
                      className="size-8 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                      title="Excluir treino"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>

                {/* Nome do Treino */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                    Nome do Treino
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Treino A: Tração Explosiva e Estabilidade de Core"
                    value={nomeTreino}
                    onChange={(e) => setNomeTreino(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Vigência: Início e Fim */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                      Início
                    </label>
                    <input
                      type="text"
                      placeholder="dd/MM/yyyy"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                      Fim
                    </label>
                    <input
                      type="text"
                      placeholder="dd/MM/yyyy"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                    Descrição / Observações Gerais
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Deixe aqui observações sobre este treino..."
                    value={descricaoTreino}
                    onChange={(e) => setDescricaoTreino(e.target.value)}
                    className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>
              </div>

              {/* Lista de Exercícios na Ficha */}
              <div className="p-5 sm:p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>Sequência de Exercícios</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/10 text-amber-500">
                      {exerciciosDaFicha.length}
                    </span>
                  </h4>
                  <span className="text-[11px] text-neutral-400">
                    Use o "+" na coluna da direita para adicionar
                  </span>
                </div>

                {exerciciosDaFicha.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 space-y-2">
                    <Dumbbell className="size-7 mx-auto text-neutral-300 dark:text-neutral-700" />
                    <p className="text-xs font-semibold">Nenhum exercício adicionado a este treino.</p>
                    <p className="text-[11px] text-neutral-500">
                      Selecione exercícios no catálogo ao lado para incluir nesta ficha.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exerciciosDaFicha.map((item, idx) => (
                      <div
                        key={`${item.exercicio_id}-${idx}`}
                        className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="size-6 rounded-lg bg-amber-500/15 text-amber-500 font-black text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <h5 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                              {item.titulo}
                            </h5>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoverExercicioDaFicha(idx)}
                            className="size-7 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                            title="Remover exercício"
                          >
                            <X className="size-4" />
                          </button>
                        </div>

                        {/* Parâmetros: Séries, Repetições, Carga e Descanso */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div>
                            <span className="block text-[10px] font-bold text-neutral-500 mb-1">Séries</span>
                            <input
                              type="number"
                              min={1}
                              value={item.series}
                              onChange={(e) => handleUpdateExercicioItem(idx, 'series', parseInt(e.target.value, 10) || 1)}
                              className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <span className="block text-[10px] font-bold text-neutral-500 mb-1">Repetições</span>
                            <input
                              type="text"
                              value={item.repeticoes}
                              onChange={(e) => handleUpdateExercicioItem(idx, 'repeticoes', e.target.value)}
                              className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <span className="block text-[10px] font-bold text-neutral-500 mb-1">Carga</span>
                            <input
                              type="text"
                              value={item.carga}
                              onChange={(e) => handleUpdateExercicioItem(idx, 'carga', e.target.value)}
                              className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>

                          <div>
                            <span className="block text-[10px] font-bold text-neutral-500 mb-1">Descanso (s)</span>
                            <input
                              type="number"
                              step={5}
                              value={item.descanso_segundos}
                              onChange={(e) => handleUpdateExercicioItem(idx, 'descanso_segundos', parseInt(e.target.value, 10) || 0)}
                              className="w-full h-8 px-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        </div>

                        {/* Observações da execução do exercício */}
                        <div>
                          <input
                            type="text"
                            placeholder="Observação da execução (ex: cadência 3010, foco no pico)"
                            value={item.observacoes || ''}
                            onChange={(e) => handleUpdateExercicioItem(idx, 'observacoes', e.target.value)}
                            className="w-full h-7 px-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rodapé de Ações do Montador */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setModo('lista')}
                    className="h-10 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoTreino}
                    className="h-10 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="size-4 stroke-[2.5]" />
                    <span>Salvar Treino</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* COLUNA DA DIREITA: BIBLIOTECA LATERAL DE EXERCÍCIOS  */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              <div className="sticky top-20 p-5 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                    <Dumbbell className="size-4 text-amber-500" />
                    <span>Exercícios</span>
                  </h3>
                  <span className="text-xs font-bold text-neutral-400">
                    {exerciciosFiltrados.length} disponíveis
                  </span>
                </div>

                {/* Busca de Exercício */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar exercício..."
                    value={buscaExercicio}
                    onChange={(e) => setBuscaExercicio(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Filtro por Pasta Muscular */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setPastaSelecionada('todas')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      pastaSelecionada === 'todas'
                        ? 'bg-amber-500 text-neutral-950'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  {pastas.map((pasta) => (
                    <button
                      key={pasta.id}
                      type="button"
                      onClick={() => setPastaSelecionada(pasta.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        pastaSelecionada === pasta.id
                          ? 'bg-amber-500 text-neutral-950'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-white'
                      }`}
                    >
                      {pasta.nome}
                    </button>
                  ))}
                </div>

                {/* Lista com botão '+' rápido (Estilo Nexur) */}
                <div className="max-h-[600px] overflow-y-auto space-y-2 pr-1">
                  {exerciciosFiltrados.length === 0 ? (
                    <p className="p-4 text-center text-xs text-neutral-400">
                      Nenhum exercício encontrado.
                    </p>
                  ) : (
                    exerciciosFiltrados.map((ex) => {
                      const mediaInfo = parseMedia(ex.midia || ex.video_url || '');
                      return (
                        <div
                          key={ex.id}
                          className="group p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/40 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Miniatura do Exercício */}
                            <div className="size-11 rounded-lg bg-neutral-200 dark:bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center text-neutral-400">
                              {mediaInfo.thumbnailUrl ? (
                                <img
                                  src={mediaInfo.thumbnailUrl}
                                  alt={ex.titulo}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Dumbbell className="size-5 opacity-60" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                {ex.titulo}
                              </h5>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                                {ex.equipamento} • {ex.grupo}
                              </p>
                            </div>
                          </div>

                          {/* Botão '+' grande e ágil (igual ao Nexur) */}
                          <button
                            type="button"
                            onClick={() => handleAdicionarExercicioNaFicha(ex)}
                            className="size-8 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-neutral-950 border border-amber-500/20 flex items-center justify-center transition-all active:scale-90 cursor-pointer shrink-0"
                            title={`Adicionar "${ex.titulo}" a esta ficha`}
                          >
                            <Plus className="size-4 stroke-[3]" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </form>
        </main>
      )}

      {/* ======================================================== */}
      {/* MODAL DE IMPORTAÇÃO DE MODELOS DA BIBLIOTECA GERAL       */}
      {/* ======================================================== */}
      {modalImportarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <Copy className="size-5 text-amber-500" />
                <span>Importar Modelo da Biblioteca</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalImportarAberto(false)}
                className="size-8 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Selecione uma ficha da biblioteca geral de treinos para liberar diretamente para {aluno.nome.split(' ')[0]}:
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {treinosDisponiveisImportacao.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-400">
                  Todas as fichas cadastradas já estão atribuídas a este aluno.
                </div>
              ) : (
                treinosDisponiveisImportacao.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleImportarTreinoDaBiblioteca(t.id)}
                    className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {t.nome}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        {t.descricao || `${t.exercicios?.length || 0} exercícios`}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="size-3.5 stroke-[3]" />
                      <span>Atribuir</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setModalImportarAberto(false)}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
