import React, { useState, useMemo } from 'react';
import { 
  Dumbbell, 
  Search, 
  Plus, 
  List, 
  LayoutGrid, 
  RefreshCw, 
  X, 
  UploadCloud, 
  Link as LinkIcon, 
  Check, 
  Filter, 
  Play, 
  Video as VideoIcon, 
  Edit3, 
  Trash2, 
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import type { Exercicio } from '@/lib/types';
import { toast } from 'sonner';

interface ExerciciosPageProps {
  exercicios: Exercicio[];
  onAddExercicio: (novo: Omit<Exercicio, 'id'>) => Promise<void>;
  onUpdateExercicio: (id: string, patch: Partial<Exercicio>) => Promise<void>;
  onDeleteExercicio: (id: string) => Promise<void>;
}

type TabOrigem = 'todos' | 'giano' | 'proprio' | 'ativos' | 'inativos';

const EQUIPAMENTOS_OPCOES = [
  'Todos',
  'Chão',
  'Barra',
  'Halteres',
  'Máquina',
  'Polia',
  'Kettlebell',
  'Elástico',
  'Peso Corporal',
  'Solo / Colchonete',
  'Bola Suíça',
  'Corda',
  'Outro',
];

const TIPOS_OPCOES = [
  'Todos',
  'Funcional',
  'Musculação',
  'Força',
  'Mobilidade',
  'Alongamento',
  'Aeróbico',
  'Potência',
];

const GRUPOS_MUSCULARES = [
  'Todos',
  'Mobilidade',
  'Abdominal',
  'Peito',
  'Costas',
  'Biceps',
  'Triceps',
  'Ombros',
  'Pernas',
  'Quadriceps',
  'Posterior',
  'Glúteos',
  'Panturrilha',
  'Corpo Inteiro',
];

export const ExerciciosPage: React.FC<ExerciciosPageProps> = ({
  exercicios,
  onAddExercicio,
  onUpdateExercicio,
  onDeleteExercicio,
}) => {
  // Filtros principais
  const [tabAtiva, setTabAtiva] = useState<TabOrigem>('todos');
  const [busca, setBusca] = useState('');
  const [equipamentoFiltro, setEquipamentoFiltro] = useState('Todos');
  const [grupoFiltro, setGrupoFiltro] = useState('Todos');
  const [modoVisualizacao, setModoVisualizacao] = useState<'lista' | 'grade'>('lista');

  // Estado do Drawer Lateral (Slide-over)
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [exercicioEmEdicao, setExercicioEmEdicao] = useState<Exercicio | null>(null);

  // Campos do formulário no Drawer
  const [formTitulo, setFormTitulo] = useState('');
  const [formEquipamento, setFormEquipamento] = useState('Chão');
  const [formTipo, setFormTipo] = useState('Funcional');
  const [formGrupo, setFormGrupo] = useState('Mobilidade');
  const [formOrientacoes, setFormOrientacoes] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formMidiaUrl, setFormMidiaUrl] = useState('');
  const [videoPreviewLocal, setVideoPreviewLocal] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Contagens para as pílulas do topo (Fiel à referência da Nexur)
  const contagens = useMemo(() => {
    const total = exercicios.length;
    const giano = exercicios.filter((e) => e.is_system || e.professor_id === 'giano_system').length;
    const proprio = exercicios.filter((e) => !e.is_system && e.professor_id !== 'giano_system').length;
    const ativos = exercicios.filter((e) => e.ativo).length;
    const inativos = exercicios.filter((e) => !e.ativo).length;
    return { total, giano, proprio, ativos, inativos };
  }, [exercicios]);

  // Lista filtrada e ordenada em ordem alfabética (A a Z)
  const exerciciosFiltrados = useMemo(() => {
    return exercicios
      .filter((ex) => {
        // Filtro por Tab
        if (tabAtiva === 'giano' && !(ex.is_system || ex.professor_id === 'giano_system')) return false;
        if (tabAtiva === 'proprio' && (ex.is_system || ex.professor_id === 'giano_system')) return false;
        if (tabAtiva === 'ativos' && !ex.ativo) return false;
        if (tabAtiva === 'inativos' && ex.ativo) return false;

        // Filtro por Equipamento
        if (equipamentoFiltro !== 'Todos' && ex.equipamento.toLowerCase() !== equipamentoFiltro.toLowerCase()) {
          return false;
        }

        // Filtro por Grupo Muscular
        if (grupoFiltro !== 'Todos' && ex.grupo.toLowerCase() !== grupoFiltro.toLowerCase()) {
          return false;
        }

        // Filtro por Busca de Texto
        if (busca.trim()) {
          const termo = busca.toLowerCase();
          const matchTitulo = ex.titulo.toLowerCase().includes(termo);
          const matchGrupo = ex.grupo.toLowerCase().includes(termo);
          const matchEquip = ex.equipamento.toLowerCase().includes(termo);
          const matchOrienta = ex.orientacoes?.toLowerCase().includes(termo);
          if (!matchTitulo && !matchGrupo && !matchEquip && !matchOrienta) return false;
        }

        return true;
      })
      .sort((a, b) => a.titulo.localeCompare(b.titulo));
  }, [exercicios, tabAtiva, equipamentoFiltro, grupoFiltro, busca]);

  const handleAbrirCriacao = () => {
    setExercicioEmEdicao(null);
    setFormTitulo('');
    setFormEquipamento('Chão');
    setFormTipo('Funcional');
    setFormGrupo('Mobilidade');
    setFormOrientacoes('');
    setFormVideoUrl('/videos/exemplo_execucao.mp4'); // Vídeo local padrão do Nexur
    setFormMidiaUrl('');
    setVideoPreviewLocal('/videos/exemplo_execucao.mp4');
    setDrawerAberto(true);
  };

  const handleAbrirEdicao = (ex: Exercicio) => {
    setExercicioEmEdicao(ex);
    setFormTitulo(ex.titulo);
    setFormEquipamento(ex.equipamento);
    setFormTipo(ex.tipo || 'Musculação');
    setFormGrupo(ex.grupo);
    setFormOrientacoes(ex.orientacoes || '');
    setFormVideoUrl(ex.video || '');
    setFormMidiaUrl(ex.midia || '');
    setVideoPreviewLocal(ex.video || ex.midia || null);
    setDrawerAberto(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoPreviewLocal(url);
      setFormVideoUrl(url);
      toast.success(`Arquivo ${file.name} carregado para demonstração.`);
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      toast.error('Informe o título do exercício.');
      return;
    }

    setSalvando(true);
    try {
      const dados = {
        titulo: formTitulo.trim(),
        equipamento: formEquipamento,
        tipo: formTipo,
        grupo: formGrupo,
        orientacoes: formOrientacoes.trim(),
        video: formVideoUrl.trim() || '/videos/exemplo_execucao.mp4',
        midia: formMidiaUrl.trim() || 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80',
        professor_id: '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
        is_system: false,
        ativo: true,
      };

      if (exercicioEmEdicao) {
        await onUpdateExercicio(exercicioEmEdicao.id, dados);
        toast.success(`Exercício "${formTitulo}" atualizado com sucesso!`);
      } else {
        await onAddExercicio(dados);
        toast.success(`Exercício "${formTitulo}" adicionado à sua biblioteca!`);
      }
      setDrawerAberto(false);
    } catch {
      toast.error('Erro ao salvar exercício.');
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleAtivo = async (ex: Exercicio) => {
    const novoStatus = !ex.ativo;
    await onUpdateExercicio(ex.id, { ativo: novoStatus });
    if (novoStatus) {
      toast.success(`"${ex.titulo}" ativado na sua biblioteca.`);
    } else {
      toast.info(`"${ex.titulo}" desativado.`);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* ======================================================== */}
      {/* TOPO: TÍTULO, CONTADORES/PÍLULAS & AÇÕES RÁPIDAS         */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
            Exercícios
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Catálogo completo com demonstrações em vídeo/GIF e orientações técnicas.
          </p>
        </div>

        {/* Botões de Ação no Topo Direito (Recarregar, Alternar Lista/Grade, + Novo) */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => toast.info('Biblioteca atualizada.')}
            className="size-9 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shadow-sm transition-all"
            title="Recarregar"
          >
            <RefreshCw className="size-4" />
          </button>

          {/* Alternador Lista / Grade */}
          <div className="flex items-center p-1 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm">
            <button
              onClick={() => setModoVisualizacao('lista')}
              className={`p-1.5 rounded-lg transition-all ${
                modoVisualizacao === 'lista'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
              title="Modo Lista"
            >
              <List className="size-4" />
            </button>
            <button
              onClick={() => setModoVisualizacao('grade')}
              className={`p-1.5 rounded-lg transition-all ${
                modoVisualizacao === 'grade'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
              title="Modo Grade"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>

          {/* Botão Amarelo / Dourado + Novo Exercício */}
          <button
            onClick={handleAbrirCriacao}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-450 active:scale-95 text-neutral-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            title="Cadastrar Novo Exercício com Vídeo"
          >
            <Plus className="size-4 stroke-[3]" />
            <span>Novo Exercício</span>
          </button>
        </div>
      </div>

      {/* Pílulas de Filtro Rápido (Idênticas ao Nexur) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none text-xs font-bold">
        <button
          onClick={() => setTabAtiva('todos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
            tabAtiva === 'todos'
              ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850'
          }`}
        >
          <Dumbbell className="size-3.5 text-neutral-400" />
          <span>{contagens.total} exercícios</span>
        </button>

        <button
          onClick={() => setTabAtiva('giano')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
            tabAtiva === 'giano'
              ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850'
          }`}
        >
          <span className="size-2 rounded-full bg-amber-500" />
          <span>{contagens.giano} giano</span>
        </button>

        <button
          onClick={() => setTabAtiva('proprio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
            tabAtiva === 'proprio'
              ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850'
          }`}
        >
          <span className="size-2 rounded-full bg-neutral-400" />
          <span>{contagens.proprio} próprio</span>
        </button>

        <button
          onClick={() => setTabAtiva('ativos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
            tabAtiva === 'ativos'
              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850'
          }`}
        >
          <span className="size-2 rounded-full bg-emerald-500" />
          <span>{contagens.ativos} ativos</span>
        </button>

        <button
          onClick={() => setTabAtiva('inativos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
            tabAtiva === 'inativos'
              ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-850'
          }`}
        >
          <span className="size-2 rounded-full bg-neutral-400" />
          <span>{contagens.inativos} inativos</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* BARRA DE BUSCA, TAGS ATIVAS & FILTROS DROPDOWN           */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar exercício pelo nome ou orientação..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          {/* Filtro por Grupo Muscular */}
          <div className="flex items-center gap-2">
            <select
              value={grupoFiltro}
              onChange={(e) => setGrupoFiltro(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              {GRUPOS_MUSCULARES.map((g) => (
                <option key={g} value={g}>
                  Grupo: {g}
                </option>
              ))}
            </select>

            {/* Filtro por Equipamento */}
            <select
              value={equipamentoFiltro}
              onChange={(e) => setEquipamentoFiltro(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            >
              {EQUIPAMENTOS_OPCOES.map((eq) => (
                <option key={eq} value={eq}>
                  Equipamento: {eq}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags Ativas de Filtro */}
        {(tabAtiva !== 'todos' || equipamentoFiltro !== 'Todos' || grupoFiltro !== 'Todos' || busca.trim()) && (
          <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800/60 flex-wrap">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Filtros ativos:
            </span>

            {tabAtiva !== 'todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                Origem: {tabAtiva}
                <button onClick={() => setTabAtiva('todos')} className="hover:text-amber-800">
                  <X className="size-3" />
                </button>
              </span>
            )}

            {grupoFiltro !== 'Todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold">
                Grupo: {grupoFiltro}
                <button onClick={() => setGrupoFiltro('Todos')} className="hover:text-neutral-900">
                  <X className="size-3" />
                </button>
              </span>
            )}

            {equipamentoFiltro !== 'Todos' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold">
                Equipamento: {equipamentoFiltro}
                <button onClick={() => setEquipamentoFiltro('Todos')} className="hover:text-neutral-900">
                  <X className="size-3" />
                </button>
              </span>
            )}

            {busca.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold">
                Busca: "{busca}"
                <button onClick={() => setBusca('')} className="hover:text-neutral-900">
                  <X className="size-3" />
                </button>
              </span>
            )}

            <button
              onClick={() => {
                setTabAtiva('todos');
                setGrupoFiltro('Todos');
                setEquipamentoFiltro('Todos');
                setBusca('');
              }}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 underline ml-auto"
            >
              Limpar todos
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* EXIBIÇÃO: MODO LISTA (ESTILO NEXUR) OU MODO GRADE         */}
      {/* ======================================================== */}
      {modoVisualizacao === 'lista' ? (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden shadow-sm">
          {exerciciosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 space-y-2">
              <Dumbbell className="size-8 mx-auto opacity-40" />
              <p className="text-sm font-semibold">Nenhum exercício encontrado com esses filtros.</p>
            </div>
          ) : (
            exerciciosFiltrados.map((ex) => {
              const temVideo = Boolean(ex.video);
              const videoSrc = ex.video || '/videos/exemplo_execucao.mp4';

              return (
                <div
                  key={ex.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-850/40 transition-colors group"
                >
                  {/* Lado Esquerdo: Miniatura Viva em Vídeo/GIF + Título e Tags */}
                  <div 
                    onClick={() => handleAbrirEdicao(ex)}
                    className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  >
                    {/* Miniatura Viva (Vídeo em loop ou Imagem) */}
                    <div className="relative size-16 sm:size-20 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-center group-hover:border-amber-500/50 transition-colors">
                      {temVideo ? (
                        <video
                          src={videoSrc}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : ex.midia ? (
                        <img
                          src={ex.midia}
                          alt={ex.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Dumbbell className="size-6 text-neutral-500" />
                      )}

                      {/* Tag de vídeo discreta */}
                      {temVideo && (
                        <div className="absolute top-1 right-1 size-4 rounded bg-black/70 flex items-center justify-center text-white text-[8px]">
                          <Play className="size-2 fill-white ml-0.5" />
                        </div>
                      )}
                    </div>

                    {/* Título & Detalhes Biomecânicos */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                          {ex.titulo}
                        </h3>
                        {ex.is_system && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                            GIANO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
                        <span className="italic font-medium">
                          {ex.grupo}, {ex.tipo || 'Mobilidade'}
                        </span>
                        <span>•</span>
                        {/* Badge de Equipamento com Ícone Amarelo */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                          <span className="size-1.5 rounded-full bg-amber-500" />
                          <span>{ex.equipamento}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Switch Amarelo Ativo / Inativo & Ação */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleToggleAtivo(ex)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        ex.ativo ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                      title={ex.ativo ? 'Ativo na biblioteca (Clique para desativar)' : 'Inativo (Clique para ativar)'}
                    >
                      <span
                        className={`inline-block size-4 transform rounded-full bg-white shadow-md transition-transform ${
                          ex.ativo ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    <button
                      onClick={() => handleAbrirEdicao(ex)}
                      className="size-8 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                      title="Editar Exercício"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Modo Grade */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {exerciciosFiltrados.map((ex) => {
            const videoSrc = ex.video || '/videos/exemplo_execucao.mp4';
            return (
              <div
                key={ex.id}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm flex flex-col justify-between hover:border-amber-500/40 transition-all group"
              >
                {/* Miniatura de Vídeo Viva */}
                <div 
                  onClick={() => handleAbrirEdicao(ex)}
                  className="relative aspect-video bg-neutral-950 overflow-hidden cursor-pointer"
                >
                  <video
                    src={videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur text-[10px] font-black uppercase text-amber-400 border border-amber-400/30">
                      {ex.equipamento}
                    </span>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                      {ex.titulo}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                      {ex.grupo} • {ex.tipo || 'Mobilidade'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                    <span className="text-[11px] font-bold text-neutral-400">
                      {ex.is_system ? 'Banco GIANO' : 'Próprio'}
                    </span>

                    <button
                      onClick={() => handleToggleAtivo(ex)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        ex.ativo ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                    >
                      <span
                        className={`inline-block size-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                          ex.ativo ? 'translate-x-4.5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* GAVETA LATERAL (SLIDE-OVER DRAWER) PARA CADASTRO / EDIÇÃO */}
      {/* ======================================================== */}
      {drawerAberto && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Backdrop Escurecido com clique para fechar */}
          <div
            onClick={() => setDrawerAberto(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              
              {/* Topo do Drawer */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Dumbbell className="size-5 text-amber-500" />
                  <h2 className="text-lg font-black text-neutral-900 dark:text-white">
                    {exercicioEmEdicao ? 'Editar Exercício' : 'Novo Exercício'}
                  </h2>
                </div>
                <button
                  onClick={() => setDrawerAberto(false)}
                  className="size-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Corpo com Formulário & Mídia */}
              <form onSubmit={handleSalvar} className="flex-1 overflow-y-auto p-6 space-y-5">
                
                {/* 1. Área de Upload de Mídia / Vídeo / GIF */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Demonstração Visual (Vídeo ou GIF)
                  </label>

                  {/* Pré-visualização ao vivo */}
                  {videoPreviewLocal && (
                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-neutral-200 dark:border-neutral-800 shadow-inner mb-3">
                      <video
                        src={videoPreviewLocal}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white flex items-center gap-1">
                        <Play className="size-2.5 fill-white" />
                        <span>Pré-visualização ativa</span>
                      </div>
                    </div>
                  )}

                  {/* Dropzone de Upload */}
                  <label className="relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-850/50">
                    <UploadCloud className="size-6 text-neutral-400 mb-1.5" />
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Clique para selecionar vídeo/GIF próprio
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-0.5">
                      Suporta mp4, gif, mov, webp, jpeg
                    </span>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Divisor "Ou" */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-neutral-200 dark:border-neutral-800" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Ou
                    </span>
                    <div className="flex-1 h-px bg-neutral-200 dark:border-neutral-800" />
                  </div>

                  {/* Input de Link Externo */}
                  <div className="space-y-1">
                    <div className="relative">
                      <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                      <input
                        type="text"
                        value={formVideoUrl}
                        onChange={(e) => {
                          setFormVideoUrl(e.target.value);
                          setVideoPreviewLocal(e.target.value);
                        }}
                        placeholder="Link externo (youtube, vimeo, drive, etc)"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 px-1">
                      Você pode colar link do YouTube, Google Drive ou arquivo MP4 direto.
                    </span>
                  </div>
                </div>

                {/* 2. Título */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Título do Exercício *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                    placeholder="Ex: 90/90 com Rotação"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* 3. Equipamento */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Equipamento
                  </label>
                  <select
                    value={formEquipamento}
                    onChange={(e) => setFormEquipamento(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {EQUIPAMENTOS_OPCOES.filter((eq) => eq !== 'Todos').map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Tipo de Exercício */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Tipo de Exercício
                  </label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {TIPOS_OPCOES.filter((t) => t !== 'Todos').map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Grupo Muscular / Foco */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Grupo Muscular / Subtipo
                  </label>
                  <select
                    value={formGrupo}
                    onChange={(e) => setFormGrupo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {GRUPOS_MUSCULARES.filter((g) => g !== 'Todos').map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 6. Orientações Técnicas */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Orientações do Exercício
                  </label>
                  <textarea
                    rows={4}
                    value={formOrientacoes}
                    onChange={(e) => setFormOrientacoes(e.target.value)}
                    placeholder="Instruções de postura, respiração, alinhamento e execução do movimento..."
                    className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Rodapé com Botões */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 sticky bottom-0 bg-white dark:bg-neutral-900 pb-2">
                  <button
                    type="button"
                    onClick={() => setDrawerAberto(false)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-450 active:scale-95 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-70"
                  >
                    {salvando ? 'Salvando...' : 'Salvar Exercício'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
