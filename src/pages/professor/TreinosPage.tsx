import React, { useState, useMemo } from 'react';
import {
  Library,
  Plus,
  Search,
  X,
  Dumbbell,
  Clock,
  Layers,
  Edit3,
  Trash2,
  Copy,
  Eye,
  Check,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Printer,
  Sparkles,
  Play,
  Flame,
  FileText,
  Paperclip,
  Activity
} from 'lucide-react';
import type { Treino, ExercicioItemTreino, Exercicio, PastaExercicio } from '@/lib/types';
import { ViewModeToggle } from '@/components/common/ViewModeToggle';
import { parseMedia } from '@/lib/media.utils';
import { toast } from 'sonner';

interface TreinosPageProps {
  treinos: Treino[];
  exercicios: Exercicio[];
  pastas: PastaExercicio[];
  onAddTreino: (novo: Omit<Treino, 'id'>) => Promise<void>;
  onUpdateTreino: (id: string, patch: Partial<Treino>) => Promise<void>;
  onDeleteTreino: (id: string) => Promise<void>;
  onDuplicateTreino: (treino: Treino) => Promise<void>;
}

export const TreinosPage: React.FC<TreinosPageProps> = ({
  treinos = [],
  exercicios = [],
  pastas = [],
  onAddTreino,
  onUpdateTreino,
  onDeleteTreino,
  onDuplicateTreino,
}) => {
  const [busca, setBusca] = useState('');
  const [modoVisualizacao, setModoVisualizacao] = useState<'grade' | 'lista'>('grade');

  // Drawer de Criação / Edição de Treino
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [treinoEmEdicao, setTreinoEmEdicao] = useState<Treino | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formExercicios, setFormExercicios] = useState<ExercicioItemTreino[]>([]);
  const [salvando, setSalvando] = useState(false);

  // Modal Seletor de Exercícios para incluir no treino
  const [pickerAberto, setPickerAberto] = useState(false);
  const [buscaPicker, setBuscaPicker] = useState('');
  const [pastaFiltroPicker, setPastaFiltroPicker] = useState<string>('todas');

  // Modal de Ficha Completa do Treino (Visualização / Impressão)
  const [treinoVisualizando, setTreinoVisualizando] = useState<Treino | null>(null);

  // Mapa rápido de exercícios por ID para recuperar fotos e orientações originais
  const exerciciosMap = useMemo(() => {
    const map = new Map<string, Exercicio>();
    exercicios.forEach((ex) => {
      map.set(ex.id, ex);
    });
    return map;
  }, [exercicios]);

  // Filtragem de treinos pela busca (nome, descrição ou exercícios contidos)
  const treinosFiltrados = useMemo(() => {
    if (!busca.trim()) return treinos;
    const termo = busca.toLowerCase();
    return treinos.filter((t) => {
      const matchNome = t.nome.toLowerCase().includes(termo);
      const matchDesc = t.descricao?.toLowerCase().includes(termo);
      const matchEx = t.exercicios.some((ex) =>
        ex.titulo.toLowerCase().includes(termo) ||
        ex.observacoes?.toLowerCase().includes(termo)
      );
      return matchNome || matchDesc || matchEx;
    });
  }, [treinos, busca]);

  // Exercícios disponíveis no Picker modal filtrados por busca e pasta
  const exerciciosNoPicker = useMemo(() => {
    return exercicios.filter((ex) => {
      if (pastaFiltroPicker !== 'todas' && ex.pasta_id !== pastaFiltroPicker) {
        return false;
      }
      if (buscaPicker.trim()) {
        const termo = buscaPicker.toLowerCase();
        return (
          ex.titulo.toLowerCase().includes(termo) ||
          ex.equipamento.toLowerCase().includes(termo) ||
          ex.orientacoes?.toLowerCase().includes(termo)
        );
      }
      return true;
    });
  }, [exercicios, pastaFiltroPicker, buscaPicker]);

  // Abertura do Drawer para Criar Treino Novo
  const handleAbrirCriacao = () => {
    setTreinoEmEdicao(null);
    setFormNome('');
    setFormDescricao('');
    setFormExercicios([]);
    setDrawerAberto(true);
  };

  // Abertura do Drawer para Editar Treino Existente
  const handleAbrirEdicao = (treino: Treino) => {
    setTreinoEmEdicao(treino);
    setFormNome(treino.nome);
    setFormDescricao(treino.descricao || '');
    setFormExercicios(treino.exercicios || []);
    setDrawerAberto(true);
  };

  // Adicionar exercício selecionado do Picker para a rotina
  const handleSelecionarExercicioNoPicker = (ex: Exercicio) => {
    // Pega a primeira mídia disponível para miniatura do item de treino
    const primeiraMidia = ex.midias?.[0]?.arquivo_url || ex.midia || ex.video;
    const novoItem: ExercicioItemTreino = {
      exercicio_id: ex.id,
      titulo: ex.titulo,
      series: 4,
      repeticoes: '10-12',
      carga: 'Carga moderada',
      descanso_segundos: 60,
      observacoes: ex.orientacoes ? ex.orientacoes.slice(0, 80) : '',
      midia: primeiraMidia,
      video: ex.video,
    };
    setFormExercicios((prev) => [...prev, novoItem]);
    toast.success(`"${ex.titulo}" adicionado ao treino!`);
  };

  // Atualizar campo específico de um exercício no formulário
  const handleAtualizarItemTreino = (index: number, campo: keyof ExercicioItemTreino, valor: any) => {
    setFormExercicios((prev) => {
      const copia = [...prev];
      copia[index] = { ...copia[index], [campo]: valor };
      return copia;
    });
  };

  // Remover exercício da lista do treino
  const handleRemoverItemTreino = (index: number) => {
    setFormExercicios((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Mover exercício para cima ou para baixo
  const handleMoverItem = (index: number, direcao: 'cima' | 'baixo') => {
    if (direcao === 'cima' && index === 0) return;
    if (direcao === 'baixo' && index === formExercicios.length - 1) return;

    setFormExercicios((prev) => {
      const novoIndex = direcao === 'cima' ? index - 1 : index + 1;
      const copia = [...prev];
      const [removido] = copia.splice(index, 1);
      copia.splice(novoIndex, 0, removido);
      return copia;
    });
  };

  // Salvar Treino (Criação ou Edição)
  const handleSalvarTreino = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formNome.trim()) {
      toast.error('Informe o nome da rotina de treino (ex: Treino A — Peito e Tríceps).');
      return;
    }

    if (formExercicios.length === 0) {
      toast.error('Adicione ao menos um exercício ao treino.');
      return;
    }

    setSalvando(true);
    try {
      if (treinoEmEdicao) {
        await onUpdateTreino(treinoEmEdicao.id, {
          nome: formNome.trim(),
          descricao: formDescricao.trim(),
          exercicios: formExercicios,
        });
        toast.success(`Treino "${formNome}" atualizado com sucesso!`);
      } else {
        await onAddTreino({
          professor_id: '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
          nome: formNome.trim(),
          descricao: formDescricao.trim(),
          exercicios: formExercicios,
        });
        toast.success(`Treino "${formNome}" cadastrado na biblioteca!`);
      }
      setDrawerAberto(false);
    } catch {
      toast.error('Erro ao salvar treino.');
    } finally {
      setSalvando(false);
    }
  };

  // Duplicar treino
  const handleDuplicar = async (treino: Treino, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onDuplicateTreino(treino);
      toast.success(`Cópia de "${treino.nome}" criada com sucesso!`);
    } catch {
      toast.error('Erro ao duplicar treino.');
    }
  };

  // Excluir treino
  const handleExcluir = async (treino: Treino, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja excluir o treino "${treino.nome}"?`)) {
      try {
        await onDeleteTreino(treino.id);
        toast.success(`Treino "${treino.nome}" excluído.`);
      } catch {
        toast.error('Erro ao excluir treino.');
      }
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* CABEÇALHO DA BIBLIOTECA DE TREINOS                       */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
              Gestão de Treinos
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs font-semibold text-neutral-400">
              {treinos.length} rotinas cadastradas
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-2.5 mt-0.5">
            <Library className="size-7 text-amber-500" />
            <span>Biblioteca de Treinos</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Prescreva rotinas e fichas de treinamento completas para seus alunos com séries, repetições e vídeos de execução.
          </p>
        </div>

        <button
          onClick={handleAbrirCriacao}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-450 active:scale-95 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>Novo Treino</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* BARRA DE PESQUISA, RESUMO E TOGGLE MODO CARD / LISTA     */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome do treino, objetivo ou exercício..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800">
              📋 {treinosFiltrados.length} {treinosFiltrados.length === 1 ? 'treino' : 'treinos'}
            </span>
          </div>

          {/* Toggle Modo Card / Modo Lista estilo Nexur */}
          <ViewModeToggle mode={modoVisualizacao} onChange={setModoVisualizacao} />
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONTEÚDO PRINCIPAL: MODO CARD (GRADE) OU MODO LISTA      */}
      {/* ======================================================== */}
      {treinosFiltrados.length === 0 ? (
        /* Estado Vazio Amigável */
        <div className="p-12 sm:p-16 text-center rounded-3xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 space-y-4">
          <div className="size-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
            <Library className="size-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white">
              {busca ? 'Nenhum treino encontrado' : 'Nenhum treino cadastrado'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {busca
                ? `Nenhum treino corresponde ao termo "${busca}". Tente outra busca.`
                : 'Crie sua primeira rotina de treinamento personalizada selecionando exercícios da sua biblioteca.'}
            </p>
          </div>
          <button
            onClick={handleAbrirCriacao}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-450 active:scale-95 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Criar Primeiro Treino</span>
          </button>
        </div>
      ) : modoVisualizacao === 'grade' ? (
        /* MODO CARD (GRADE DE TREINOS) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {treinosFiltrados.map((treino) => {
            const totalExercicios = treino.exercicios?.length || 0;
            const totalSeries = treino.exercicios?.reduce((acc, curr) => acc + (Number(curr.series) || 0), 0) || 0;

            return (
              <div
                key={treino.id}
                className="group rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/40 bg-white dark:bg-neutral-900 p-5 flex flex-col justify-between shadow-xs hover:shadow-xl transition-all relative overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Topo do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Dumbbell className="size-5" />
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                        {totalExercicios} {totalExercicios === 1 ? 'exercício' : 'exercícios'}
                      </span>
                      {totalSeries > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                          {totalSeries} séries
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Informações do Treino */}
                  <div className="space-y-1">
                    <h3 className="font-black text-base sm:text-lg text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors line-clamp-1">
                      {treino.nome}
                    </h3>
                    {treino.descricao && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {treino.descricao}
                      </p>
                    )}
                  </div>

                  {/* Mini Preview dos Exercícios no Card */}
                  <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      <span>Sequência</span>
                      <span>Séries & Carga</span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {treino.exercicios.slice(0, 4).map((item, idx) => {
                        return (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-850/60 border border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="size-5 rounded-md bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px] font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                                {item.titulo}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 text-[11px] font-bold text-amber-500">
                              <span>{item.series}x {item.repeticoes}</span>
                            </div>
                          </div>
                        );
                      })}

                      {totalExercicios > 4 && (
                        <p className="text-[11px] font-semibold text-neutral-400 text-center pt-1">
                          + {totalExercicios - 4} outros exercícios na ficha
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rodapé com Ações do Card */}
                <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setTreinoVisualizando(treino)}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Ver Ficha Completa"
                  >
                    <Eye className="size-3.5" />
                    <span>Ver Ficha</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDuplicar(treino, e)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                      title="Duplicar treino"
                    >
                      <Copy className="size-4" />
                    </button>

                    <button
                      onClick={() => handleAbrirEdicao(treino)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                      title="Editar treino"
                    >
                      <Edit3 className="size-4" />
                    </button>

                    <button
                      onClick={(e) => handleExcluir(treino, e)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Excluir treino"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODO LISTA DE TREINOS */
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden shadow-xs">
          {treinosFiltrados.map((treino) => {
            const totalExercicios = treino.exercicios?.length || 0;
            const totalSeries = treino.exercicios?.reduce((acc, curr) => acc + (Number(curr.series) || 0), 0) || 0;

            return (
              <div
                key={treino.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-850/40 transition-colors group"
              >
                {/* Informações Principais */}
                <div
                  onClick={() => setTreinoVisualizando(treino)}
                  className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Dumbbell className="size-5" />
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                        {treino.nome}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-black text-neutral-600 dark:text-neutral-300">
                        {totalExercicios} {totalExercicios === 1 ? 'exercício' : 'exercícios'}
                      </span>
                      {totalSeries > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black">
                          {totalSeries} séries
                        </span>
                      )}
                    </div>

                    {treino.descricao && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                        {treino.descricao}
                      </p>
                    )}

                    {/* Resumo dos exercícios em pílulas */}
                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto text-[11px] text-neutral-400">
                      <span className="font-semibold text-neutral-500 shrink-0">Exercícios:</span>
                      {treino.exercicios.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium truncate max-w-[130px]"
                        >
                          {item.titulo}
                        </span>
                      ))}
                      {totalExercicios > 3 && (
                        <span className="text-[10px] text-neutral-400 font-bold shrink-0">
                          +{totalExercicios - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações da Lista */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setTreinoVisualizando(treino)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-amber-500 hover:text-amber-500 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 transition-all cursor-pointer"
                    title="Ver Ficha Completa"
                  >
                    <Eye className="size-3.5" />
                    <span>Ver Ficha</span>
                  </button>

                  <button
                    onClick={(e) => handleDuplicar(treino, e)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Duplicar treino"
                  >
                    <Copy className="size-4" />
                  </button>

                  <button
                    onClick={() => handleAbrirEdicao(treino)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Editar treino"
                  >
                    <Edit3 className="size-4" />
                  </button>

                  <button
                    onClick={(e) => handleExcluir(treino, e)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Excluir treino"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER LATERAL: CRIAR OU EDITAR TREINO (SLIDE-OVER)      */}
      {/* ======================================================== */}
      {drawerAberto && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setDrawerAberto(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col justify-between">
              
              {/* Topo do Drawer */}
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                    <Library className="size-5 text-amber-500" />
                    <span>{treinoEmEdicao ? 'Editar Treino' : 'Novo Treino'}</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Preencha o nome da rotina e monte a sequência de exercícios da ficha.
                  </p>
                </div>

                <button
                  onClick={() => setDrawerAberto(false)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Corpo do Formulário */}
              <form onSubmit={handleSalvarTreino} id="form-treino" className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Nome do Treino */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Nome do Treino <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Treino A — Peito & Tríceps"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-sm font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Descrição / Objetivo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Objetivo / Descrição do Treino
                  </label>
                  <input
                    type="text"
                    value={formDescricao}
                    onChange={(e) => setFormDescricao(e.target.value)}
                    placeholder="Ex: Foco em força, hipertrofia e técnica de movimento"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-sm font-semibold text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Bloco de Exercícios do Treino */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                        Exercícios da Ficha ({formExercicios.length})
                      </h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Organize a ordem, séries, repetições e orientações técnicas.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPickerAberto(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-450 active:scale-95 text-neutral-950 font-black text-xs shadow-sm flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Plus className="size-3.5 stroke-[2.5]" />
                      <span>Adicionar da Biblioteca</span>
                    </button>
                  </div>

                  {formExercicios.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/30 space-y-2">
                      <Dumbbell className="size-8 text-neutral-400 mx-auto" />
                      <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        Nenhum exercício adicionado a este treino
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        Clique em "Adicionar da Biblioteca" para escolher exercícios de peito, pernas, costas, etc.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formExercicios.map((item, index) => {
                        return (
                          <div
                            key={index}
                            className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-850/60 space-y-3"
                          >
                            {/* Linha do Topo do Item */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="size-6 rounded-lg bg-amber-500 text-neutral-950 text-xs font-black flex items-center justify-center shrink-0">
                                  {index + 1}
                                </span>
                                <h4 className="font-black text-sm text-neutral-900 dark:text-white truncate">
                                  {item.titulo}
                                </h4>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoverItem(index, 'cima')}
                                  className="p-1 rounded-lg text-neutral-400 hover:text-amber-500 disabled:opacity-20 cursor-pointer"
                                  title="Mover para cima"
                                >
                                  <ArrowUp className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === formExercicios.length - 1}
                                  onClick={() => handleMoverItem(index, 'baixo')}
                                  className="p-1 rounded-lg text-neutral-400 hover:text-amber-500 disabled:opacity-20 cursor-pointer"
                                  title="Mover para baixo"
                                >
                                  <ArrowDown className="size-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoverItemTreino(index)}
                                  className="p-1 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                                  title="Remover exercício"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inputs de Séries, Reps, Carga e Descanso */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div>
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">
                                  Séries
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={item.series}
                                  onChange={(e) => handleAtualizarItemTreino(index, 'series', Number(e.target.value))}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">
                                  Repetições
                                </label>
                                <input
                                  type="text"
                                  value={item.repeticoes}
                                  onChange={(e) => handleAtualizarItemTreino(index, 'repeticoes', e.target.value)}
                                  placeholder="Ex: 10-12"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">
                                  Carga / Peso
                                </label>
                                <input
                                  type="text"
                                  value={item.carga}
                                  onChange={(e) => handleAtualizarItemTreino(index, 'carga', e.target.value)}
                                  placeholder="Ex: 20kg"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-neutral-500 uppercase">
                                  Descanso (seg)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="5"
                                  value={item.descanso_segundos}
                                  onChange={(e) => handleAtualizarItemTreino(index, 'descanso_segundos', Number(e.target.value))}
                                  placeholder="60"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-900 text-xs font-bold text-neutral-900 dark:text-white"
                                />
                              </div>
                            </div>

                            {/* Observação Técnica do Exercício */}
                            <div>
                              <input
                                type="text"
                                value={item.observacoes || ''}
                                onChange={(e) => handleAtualizarItemTreino(index, 'observacoes', e.target.value)}
                                placeholder="Observação técnica (ex: 3s descida, pico de contração, drop-set...)"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-900 text-xs text-neutral-700 dark:text-neutral-300 placeholder:text-neutral-400"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </form>

              {/* Rodapé do Drawer com Ações */}
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerAberto(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="form-treino"
                  disabled={salvando}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-450 active:scale-95 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {salvando ? 'Salvando...' : treinoEmEdicao ? 'Atualizar Treino' : 'Salvar Treino'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PICKER: SELEÇÃO DE EXERCÍCIOS PARA ADICIONAR       */}
      {/* ======================================================== */}
      {pickerAberto && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header do Picker */}
            <div className="p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base sm:text-lg text-neutral-900 dark:text-white flex items-center gap-2">
                  <Dumbbell className="size-5 text-amber-500" />
                  <span>Selecionar Exercício da Biblioteca</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Clique para adicionar à rotina de treino atual.
                </p>
              </div>
              <button
                onClick={() => setPickerAberto(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Filtros do Picker */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-850/50 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                <input
                  type="text"
                  value={buscaPicker}
                  onChange={(e) => setBuscaPicker(e.target.value)}
                  placeholder="Buscar por nome ou equipamento..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-white"
                />
              </div>

              <select
                value={pastaFiltroPicker}
                onChange={(e) => setPastaFiltroPicker(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-750 bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-900 dark:text-white"
              >
                <option value="todas">Todas as Pastas</option>
                {pastas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista com scroll dos exercícios para escolher */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {exerciciosNoPicker.length === 0 ? (
                <div className="p-12 text-center text-neutral-400 space-y-2">
                  <Dumbbell className="size-8 mx-auto text-neutral-500" />
                  <p className="text-xs font-bold">Nenhum exercício encontrado</p>
                </div>
              ) : (
                exerciciosNoPicker.map((ex) => {
                  const mediaInfo = parseMedia(ex.video, ex.midia);
                  const jaAdicionado = formExercicios.some((f) => f.exercicio_id === ex.id);

                  return (
                    <div
                      key={ex.id}
                      className="p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/40 bg-white dark:bg-neutral-850 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Miniatura limpa */}
                        <div className="size-12 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                          {mediaInfo.thumbnailUrl ? (
                            <img
                              src={mediaInfo.thumbnailUrl}
                              alt={ex.titulo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Dumbbell className="size-5 text-neutral-500" />
                          )}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white truncate">
                            {ex.titulo}
                          </h4>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {ex.equipamento} • {ex.tipo || 'Musculação'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelecionarExercicioNoPicker(ex)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          jaAdicionado
                            ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-amber-500 hover:text-neutral-950'
                            : 'bg-amber-500 hover:bg-amber-450 text-neutral-950 shadow-sm'
                        }`}
                      >
                        {jaAdicionado ? (
                          <>
                            <Check className="size-3.5" />
                            <span>Adicionar de novo</span>
                          </>
                        ) : (
                          <>
                            <Plus className="size-3.5 stroke-[2.5]" />
                            <span>Adicionar</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer do Picker */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
              <button
                type="button"
                onClick={() => setPickerAberto(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-450 text-neutral-950 font-black text-xs"
              >
                Concluir Seleção ({formExercicios.length} adicionados)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL FICHA COMPLETA DO TREINO (VISUALIZAÇÃO / DETALHES) */}
      {/* ======================================================== */}
      {treinoVisualizando && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header da Ficha */}
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
                    Ficha Técnica de Treino
                  </span>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs font-semibold text-neutral-400">
                    {treinoVisualizando.exercicios.length} exercícios
                  </span>
                </div>
                <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
                  {treinoVisualizando.nome}
                </h2>
                {treinoVisualizando.descricao && (
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                    {treinoVisualizando.descricao}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-amber-500 hover:border-amber-500 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Imprimir Ficha"
                >
                  <Printer className="size-4" />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>

                <button
                  onClick={() => setTreinoVisualizando(null)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo da Ficha (Cards dos Exercícios) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {treinoVisualizando.exercicios.map((item, idx) => {
                const exOriginal = exerciciosMap.get(item.exercicio_id);
                const mediaInfo = parseMedia(item.video || exOriginal?.video, item.midia || exOriginal?.midia);
                const isVideo = mediaInfo.isVideo;

                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Miniatura do Exercício */}
                      <div className="relative size-16 sm:size-20 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center">
                        {mediaInfo.thumbnailUrl ? (
                          <img
                            src={mediaInfo.thumbnailUrl}
                            alt={item.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Dumbbell className="size-7 text-neutral-500" />
                        )}

                        {/* Selo Play apenas se for vídeo */}
                        {isVideo && (
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <div className="size-6 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow">
                              <Play className="size-3 fill-neutral-950 ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dados Técnicos */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="size-5 rounded bg-amber-500 text-neutral-950 text-[11px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h4 className="font-black text-sm sm:text-base text-neutral-900 dark:text-white truncate">
                            {item.titulo}
                          </h4>
                        </div>

                        {item.observacoes && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                            💡 {item.observacoes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Pílulas de Séries, Reps, Carga e Descanso */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 self-stretch sm:self-center justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-200 dark:border-neutral-800">
                      <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">Séries</span>
                        <span className="text-xs font-black text-neutral-900 dark:text-white">{item.series}</span>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">Reps</span>
                        <span className="text-xs font-black text-amber-500">{item.repeticoes}</span>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">Carga</span>
                        <span className="text-xs font-black text-neutral-900 dark:text-white">{item.carga || '-'}</span>
                      </div>

                      <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
                        <span className="text-[10px] font-bold text-neutral-400 block uppercase">Descanso</span>
                        <span className="text-xs font-black text-neutral-900 dark:text-white">{item.descanso_segundos}s</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé da Ficha */}
            <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850/50 flex items-center justify-between">
              <button
                onClick={() => {
                  const targetTreino = treinoVisualizando;
                  setTreinoVisualizando(null);
                  handleAbrirEdicao(targetTreino);
                }}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:border-amber-500 hover:text-amber-500 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="size-3.5" />
                <span>Editar este Treino</span>
              </button>

              <button
                onClick={() => setTreinoVisualizando(null)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-450 text-neutral-950 font-black text-xs cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
