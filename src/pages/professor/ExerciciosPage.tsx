import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderPlus, 
  Dumbbell, 
  Search, 
  Plus, 
  List, 
  LayoutGrid, 
  X, 
  UploadCloud, 
  Link as LinkIcon, 
  Check, 
  Play, 
  Video as VideoIcon, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  ArrowLeft, 
  FileText, 
  Sparkles,
  Layers,
  Target,
  Zap,
  Activity,
  Compass,
  Shield,
  Flame,
  ChevronRight,
  Paperclip
} from 'lucide-react';
import type { Exercicio, PastaExercicio, ItemMidiaExercicio } from '@/lib/types';
import { parseMedia } from '@/lib/media.utils';
import { toast } from 'sonner';

interface ExerciciosPageProps {
  exercicios: Exercicio[];
  pastas: PastaExercicio[];
  onAddExercicio: (novo: Omit<Exercicio, 'id'>) => Promise<void>;
  onUpdateExercicio: (id: string, patch: Partial<Exercicio>) => Promise<void>;
  onDeleteExercicio: (id: string) => Promise<void>;
  onAddPasta: (nova: Omit<PastaExercicio, 'id'>) => Promise<void>;
  onUpdatePasta?: (id: string, patch: Partial<PastaExercicio>) => Promise<void>;
  onDeletePasta: (id: string) => Promise<void>;
}

const EQUIPAMENTOS_OPCOES = [
  'Chão / Solo',
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
  'Barra Fixa / Paralela',
  'Outro',
];

const TIPOS_OPCOES = [
  'Musculação',
  'Funcional',
  'Força',
  'Mobilidade',
  'Alongamento',
  'Aeróbico',
  'Potência',
  'Resistência',
];

// Helper para ícones visuais das pastas
const renderFolderIcon = (icone?: string, className: string = "size-5") => {
  switch (icone) {
    case 'dumbbell': return <Dumbbell className={className} />;
    case 'layers': return <Layers className={className} />;
    case 'target': return <Target className={className} />;
    case 'zap': return <Zap className={className} />;
    case 'activity': return <Activity className={className} />;
    case 'compass': return <Compass className={className} />;
    case 'shield': return <Shield className={className} />;
    case 'flame': return <Flame className={className} />;
    case 'sparkles': return <Sparkles className={className} />;
    default: return <Folder className={className} />;
  }
};

export const ExerciciosPage: React.FC<ExerciciosPageProps> = ({
  exercicios = [],
  pastas = [],
  onAddExercicio,
  onUpdateExercicio,
  onDeleteExercicio,
  onAddPasta,
  onDeletePasta,
}) => {
  // Navegação: pasta selecionada (null = visão geral de todas as pastas)
  const [pastaAtivaId, setPastaAtivaId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [modoVisualizacao, setModoVisualizacao] = useState<'grade' | 'lista'>('grade');

  // Modal de Criação de Nova Pasta
  const [modalNovaPastaAberto, setModalNovaPastaAberto] = useState(false);
  const [nomeNovaPasta, setNomeNovaPasta] = useState('');
  const [descricaoNovaPasta, setDescricaoNovaPasta] = useState('');

  // Drawer Lateral de Exercício (Slide-over estilo Nexur)
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [exercicioEmEdicao, setExercicioEmEdicao] = useState<Exercicio | null>(null);

  // Campos do Exercício
  const [formTitulo, setFormTitulo] = useState('');
  const [formPastaId, setFormPastaId] = useState<string>('');
  const [formEquipamento, setFormEquipamento] = useState('Halteres');
  const [formTipo, setFormTipo] = useState('Musculação');
  const [formOrientacoes, setFormOrientacoes] = useState('');

  // Mídias dinâmicas (Mídia 1, Mídia 2...) estilo Nexur
  const [formMidias, setFormMidias] = useState<ItemMidiaExercicio[]>([
    { id: 'midia_1', link_externo: '', arquivo_nome: '', arquivo_url: '', arquivo_tipo: 'video' }
  ]);
  const [salvando, setSalvando] = useState(false);

  // Modal de Visualização / Execução
  const [exercicioAssistindo, setExercicioAssistindo] = useState<Exercicio | null>(null);
  const [abaMidiaAssistindo, setAbaMidiaAssistindo] = useState(0);

  // Pasta ativa atual (se houver)
  const pastaAtiva = useMemo(() => {
    return pastas.find((p) => p.id === pastaAtivaId) || null;
  }, [pastas, pastaAtivaId]);

  // Contagem de exercícios por pasta
  const contagemPorPasta = useMemo(() => {
    const map: Record<string, number> = {};
    pastas.forEach((p) => {
      map[p.id] = 0;
    });
    exercicios.forEach((ex) => {
      const pid = ex.pasta_id || 'sem_pasta';
      map[pid] = (map[pid] || 0) + 1;
    });
    return map;
  }, [pastas, exercicios]);

  // Pastas filtradas pela busca
  const pastasFiltradas = useMemo(() => {
    if (!busca.trim()) return pastas;
    const termo = busca.toLowerCase();
    return pastas.filter((p) => 
      p.nome.toLowerCase().includes(termo) || 
      p.descricao?.toLowerCase().includes(termo)
    );
  }, [pastas, busca]);

  // Exercícios da pasta ativa filtrados pela busca
  const exerciciosDaPasta = useMemo(() => {
    if (!pastaAtivaId) return [];
    const lista = exercicios.filter((ex) => ex.pasta_id === pastaAtivaId);
    if (!busca.trim()) return lista;
    const termo = busca.toLowerCase();
    return lista.filter((ex) =>
      ex.titulo.toLowerCase().includes(termo) ||
      ex.equipamento.toLowerCase().includes(termo) ||
      ex.orientacoes?.toLowerCase().includes(termo)
    );
  }, [exercicios, pastaAtivaId, busca]);

  // Abertura do Drawer para Criar Exercício
  const handleAbrirCriacao = (pastaIdPadrao?: string) => {
    const targetPastaId = pastaIdPadrao || pastaAtivaId || (pastas[0]?.id ?? '');
    setExercicioEmEdicao(null);
    setFormTitulo('');
    setFormPastaId(targetPastaId);
    setFormEquipamento('Halteres');
    setFormTipo('Musculação');
    setFormOrientacoes('');
    setFormMidias([
      { id: crypto.randomUUID(), link_externo: '', arquivo_nome: '', arquivo_url: '', arquivo_tipo: 'video' }
    ]);
    setDrawerAberto(true);
  };

  // Abertura do Drawer para Editar Exercício
  const handleAbrirEdicao = (ex: Exercicio) => {
    setExercicioEmEdicao(ex);
    setFormTitulo(ex.titulo);
    setFormPastaId(ex.pasta_id || pastas[0]?.id || '');
    setFormEquipamento(ex.equipamento || 'Halteres');
    setFormTipo(ex.tipo || 'Musculação');
    setFormOrientacoes(ex.orientacoes || '');

    // Carrega mídias existentes ou inicializa com a primeira
    if (ex.midias && ex.midias.length > 0) {
      setFormMidias(ex.midias);
    } else if (ex.video || ex.midia) {
      setFormMidias([
        {
          id: crypto.randomUUID(),
          link_externo: ex.video || '',
          arquivo_url: ex.midia || '',
          arquivo_tipo: ex.video ? 'video' : 'imagem',
        }
      ]);
    } else {
      setFormMidias([
        { id: crypto.randomUUID(), link_externo: '', arquivo_nome: '', arquivo_url: '', arquivo_tipo: 'video' }
      ]);
    }

    setDrawerAberto(true);
  };

  // Adicionar novo bloco de mídia (Mídia 2, Mídia 3...)
  const handleAdicionarBlocoMidia = () => {
    setFormMidias((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        link_externo: '',
        arquivo_nome: '',
        arquivo_url: '',
        arquivo_tipo: 'video',
      }
    ]);
  };

  // Remover bloco de mídia
  const handleRemoverBlocoMidia = (indexParaRemover: number) => {
    if (formMidias.length === 1) {
      // Limpa os campos do primeiro bloco em vez de deletar
      setFormMidias([
        { id: crypto.randomUUID(), link_externo: '', arquivo_nome: '', arquivo_url: '', arquivo_tipo: 'video' }
      ]);
      return;
    }
    setFormMidias((prev) => prev.filter((_, idx) => idx !== indexParaRemover));
  };

  // Upload de arquivo para um bloco de mídia específico
  const handleUploadArquivoBloco = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    let tipo: 'video' | 'imagem' | 'documento' = 'outro' as any;
    if (file.type.startsWith('video/')) tipo = 'video';
    else if (file.type.startsWith('image/')) tipo = 'imagem';
    else tipo = 'documento';

    setFormMidias((prev) =>
      prev.map((m, idx) =>
        idx === index
          ? {
              ...m,
              arquivo_nome: file.name,
              arquivo_url: url,
              arquivo_tipo: tipo,
            }
          : m
      )
    );

    toast.success(`Arquivo "${file.name}" anexado à Mídia ${index + 1}.`);
  };

  // Atualizar link externo de um bloco de mídia
  const handleAtualizarLinkBloco = (index: number, link: string) => {
    setFormMidias((prev) =>
      prev.map((m, idx) => (idx === index ? { ...m, link_externo: link } : m))
    );
  };

  // Salvar Exercício
  const handleSalvarExercicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim()) {
      toast.error('Informe o nome do exercício.');
      return;
    }

    setSalvando(true);
    try {
      const pastaSelecionada = pastas.find((p) => p.id === formPastaId);
      const grupoNome = pastaSelecionada ? pastaSelecionada.nome : 'Geral';

      // Pega a primeira mídia como referência de thumbnail/vídeo primário
      const primeiraMidia = formMidias[0];
      const videoPrimario = primeiraMidia?.link_externo || (primeiraMidia?.arquivo_tipo === 'video' ? primeiraMidia.arquivo_url : '');
      const midiaPrimaria = primeiraMidia?.arquivo_url || '';

      const dados: Omit<Exercicio, 'id'> = {
        titulo: formTitulo.trim(),
        pasta_id: formPastaId,
        grupo: grupoNome,
        grupo_muscular: grupoNome,
        equipamento: formEquipamento,
        tipo: formTipo,
        orientacoes: formOrientacoes.trim(),
        video: videoPrimario,
        midia: midiaPrimaria,
        midias: formMidias,
        professor_id: '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
        is_system: false,
        ativo: true,
      };

      if (exercicioEmEdicao) {
        await onUpdateExercicio(exercicioEmEdicao.id, dados);
        toast.success(`Exercício "${formTitulo}" atualizado com sucesso!`);
      } else {
        await onAddExercicio(dados);
        toast.success(`Exercício "${formTitulo}" adicionado à pasta ${grupoNome}!`);
      }

      setDrawerAberto(false);
    } catch {
      toast.error('Erro ao salvar o exercício.');
    } finally {
      setSalvando(false);
    }
  };

  // Criar nova pasta de músculo
  const handleCriarPasta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeNovaPasta.trim()) {
      toast.error('Informe o nome da pasta.');
      return;
    }

    try {
      await onAddPasta({
        nome: nomeNovaPasta.trim(),
        descricao: descricaoNovaPasta.trim(),
        icone: 'dumbbell',
        cor: 'amber',
        is_default: false,
      });
      toast.success(`Pasta "${nomeNovaPasta}" criada com sucesso!`);
      setNomeNovaPasta('');
      setDescricaoNovaPasta('');
      setModalNovaPastaAberto(false);
    } catch {
      toast.error('Erro ao criar nova pasta.');
    }
  };

  // Deletar pasta
  const handleConfirmarDeletarPasta = async (pasta: PastaExercicio, e: React.MouseEvent) => {
    e.stopPropagation();
    const qtd = contagemPorPasta[pasta.id] || 0;
    if (confirm(`Tem certeza que deseja excluir a pasta "${pasta.nome}"? ${qtd > 0 ? `Isso removerá também os ${qtd} exercícios cadastrados nela.` : ''}`)) {
      await onDeletePasta(pasta.id);
      if (pastaAtivaId === pasta.id) {
        setPastaAtivaId(null);
      }
      toast.success(`Pasta "${pasta.nome}" excluída.`);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* ======================================================== */}
      {/* CABEÇALHO PRINCIPAL DA PÁGINA COM NAVEGAÇÃO              */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {pastaAtiva ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPastaAtivaId(null)}
                className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                title="Voltar para todas as pastas"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                    Pasta Muscular
                  </span>
                  <span className="text-xs text-neutral-400">•</span>
                  <span className="text-xs font-semibold text-neutral-400">
                    {exerciciosDaPasta.length} {exerciciosDaPasta.length === 1 ? 'exercício' : 'exercícios'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>{pastaAtiva.nome}</span>
                </h1>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
                Exercícios
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Pastas de grupos musculares para organização de treinos e mídias próprias.
              </p>
            </div>
          )}
        </div>

        {/* Ações do Topo */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {!pastaAtiva && (
            <button
              onClick={() => setModalNovaPastaAberto(true)}
              className="px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 hover:border-amber-500/40 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-bold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FolderPlus className="size-4 text-amber-500" />
              <span>Nova Pasta</span>
            </button>
          )}

          <button
            onClick={() => handleAbrirCriacao()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-450 active:scale-95 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>{pastaAtiva ? `Novo Exercício em ${pastaAtiva.nome}` : 'Novo Exercício'}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BARRA DE PESQUISA E RESUMO                               */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={pastaAtiva ? `Buscar em ${pastaAtiva.nome}...` : "Buscar por pasta ou grupo muscular..."}
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

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">
            {pastaAtiva ? (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {exerciciosDaPasta.length} cadastrados
              </span>
            ) : (
              <>
                <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  📁 {pastas.length} pastas
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  🏋️ {exercicios.length} exercícios no total
                </span>
              </>
            )}
          </div>

          {pastaAtiva && (
            <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60">
              <button
                onClick={() => setModoVisualizacao('grade')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  modoVisualizacao === 'grade'
                    ? 'bg-white dark:bg-neutral-900 text-amber-500 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                onClick={() => setModoVisualizacao('lista')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  modoVisualizacao === 'lista'
                    ? 'bg-white dark:bg-neutral-900 text-amber-500 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                }`}
                title="Visualização em Lista"
              >
                <List className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* CONTEÚDO PRINCIPAL: PASTAS OU LISTA DA PASTA ATIVA       */}
      {/* ======================================================== */}
      {!pastaAtiva ? (
        /* VISÃO DE TODAS AS PASTAS (DIRETÓRIO RAIZ) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pastasFiltradas.map((pasta) => {
            const count = contagemPorPasta[pasta.id] || 0;

            return (
              <div
                key={pasta.id}
                onClick={() => setPastaAtivaId(pasta.id)}
                className="group p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 bg-white dark:bg-neutral-900 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="size-11 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {renderFolderIcon(pasta.icone, "size-5")}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-600 dark:text-neutral-300 group-hover:bg-amber-500 group-hover:text-neutral-950 transition-colors">
                      {count} {count === 1 ? 'exercício' : 'exercícios'}
                    </span>
                    {!pasta.is_default && (
                      <button
                        onClick={(e) => handleConfirmarDeletarPasta(pasta, e)}
                        className="p-1 rounded-md text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Excluir pasta"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-base text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors">
                    {pasta.nome}
                  </h3>
                  {pasta.descricao && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {pasta.descricao}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-xs font-bold text-neutral-400 group-hover:text-amber-500 transition-colors">
                  <span>Abrir pasta</span>
                  <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISÃO INTERNA DA PASTA SELECIONADA */
        <div>
          {exerciciosDaPasta.length === 0 ? (
            /* Estado Vazio Amigável */
            <div className="p-12 sm:p-16 text-center rounded-3xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 space-y-4">
              <div className="size-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
                <Dumbbell className="size-8" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-lg font-black text-neutral-900 dark:text-white">
                  Pasta vazia
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Nenhum exercício cadastrado em <strong>{pastaAtiva.nome}</strong>. Adicione seus vídeos, GIFs, imagens ou links para abastecer esta pasta.
                </p>
              </div>
              <button
                onClick={() => handleAbrirCriacao(pastaAtiva.id)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-450 active:scale-95 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 inline-flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="size-4 stroke-[2.5]" />
                <span>Adicionar Exercício em {pastaAtiva.nome}</span>
              </button>
            </div>
          ) : modoVisualizacao === 'grade' ? (
            /* Modo Grade de Exercícios */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {exerciciosDaPasta.map((ex) => {
                const mediaInfo = parseMedia(ex.video, ex.midia);
                const qtdMidias = ex.midias?.length || (ex.video || ex.midia ? 1 : 0);

                return (
                  <div
                    key={ex.id}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:border-amber-500/40 transition-all flex flex-col justify-between group"
                  >
                    {/* Miniatura com clique para assistir */}
                    <div
                      onClick={() => {
                        setExercicioAssistindo(ex);
                        setAbaMidiaAssistindo(0);
                      }}
                      className="relative aspect-video bg-neutral-950 overflow-hidden cursor-pointer flex items-center justify-center"
                      title="Clique para assistir à demonstração"
                    >
                      {mediaInfo.thumbnailUrl ? (
                        <img
                          src={mediaInfo.thumbnailUrl}
                          alt={ex.titulo}
                          className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : mediaInfo.type === 'direct_video' ? (
                        <video
                          src={mediaInfo.embedUrl!}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Dumbbell className="size-10 text-neutral-600" />
                      )}

                      {/* Selo Play */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 flex items-center justify-center transition-colors">
                        <div className="size-10 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="size-4 fill-neutral-950 ml-0.5" />
                        </div>
                      </div>

                      {/* Badge Equipamento */}
                      <div className="absolute top-2 left-2 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur text-[10px] font-black uppercase text-amber-400 border border-amber-400/30">
                          {ex.equipamento}
                        </span>
                      </div>

                      {/* Badge Quantidade de Mídias */}
                      {qtdMidias > 1 && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur text-[10px] font-bold text-neutral-300 flex items-center gap-1">
                          <Paperclip className="size-2.5" />
                          <span>{qtdMidias} mídias</span>
                        </div>
                      )}
                    </div>

                    {/* Dados do Exercício */}
                    <div className="p-4 space-y-3">
                      <div
                        onClick={() => {
                          setExercicioAssistindo(ex);
                          setAbaMidiaAssistindo(0);
                        }}
                        className="cursor-pointer space-y-1"
                      >
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                          {ex.titulo}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {ex.tipo || 'Musculação'} • {ex.equipamento}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                        <button
                          onClick={() => handleAbrirEdicao(ex)}
                          className="font-bold text-neutral-400 hover:text-amber-500 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit3 className="size-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Excluir o exercício "${ex.titulo}"?`)) {
                              onDeleteExercicio(ex.id);
                              toast.success('Exercício excluído.');
                            }
                          }}
                          className="text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Excluir exercício"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Modo Lista de Exercícios */
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden shadow-xs">
              {exerciciosDaPasta.map((ex) => {
                const mediaInfo = parseMedia(ex.video, ex.midia);

                return (
                  <div
                    key={ex.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:bg-neutral-50/70 dark:hover:bg-neutral-850/40 transition-colors group"
                  >
                    <div
                      onClick={() => {
                        setExercicioAssistindo(ex);
                        setAbaMidiaAssistindo(0);
                      }}
                      className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                    >
                      {/* Miniatura */}
                      <div className="relative size-16 sm:size-18 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center group-hover:border-amber-500/50 transition-colors">
                        {mediaInfo.thumbnailUrl ? (
                          <img
                            src={mediaInfo.thumbnailUrl}
                            alt={ex.titulo}
                            className="w-full h-full object-cover filter brightness-95 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : mediaInfo.type === 'direct_video' ? (
                          <video
                            src={mediaInfo.embedUrl!}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Dumbbell className="size-6 text-neutral-500" />
                        )}

                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 flex items-center justify-center transition-colors">
                          <div className="size-7 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="size-3.5 fill-neutral-950 ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Informações */}
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                          {ex.titulo}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
                          <span>{ex.tipo || 'Musculação'}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                            <span className="size-1.5 rounded-full bg-amber-500" />
                            <span>{ex.equipamento}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAbrirEdicao(ex)}
                        className="size-8 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                        title="Editar Exercício"
                      >
                        <Edit3 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir o exercício "${ex.titulo}"?`)) {
                            onDeleteExercicio(ex.id);
                            toast.success('Exercício excluído.');
                          }
                        }}
                        className="size-8 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-rose-500/10 hover:border-rose-500/30 flex items-center justify-center text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Excluir Exercício"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL PARA CRIAR NOVA PASTA DE MÚSCULO                   */}
      {/* ======================================================== */}
      {modalNovaPastaAberto && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            onClick={() => setModalNovaPastaAberto(false)}
            className="fixed inset-0"
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="size-5 text-amber-500" />
                <h3 className="font-black text-lg text-neutral-900 dark:text-white">
                  Nova Pasta Muscular
                </h3>
              </div>
              <button
                onClick={() => setModalNovaPastaAberto(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCriarPasta} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Nome da Pasta *
                </label>
                <input
                  type="text"
                  required
                  value={nomeNovaPasta}
                  onChange={(e) => setNomeNovaPasta(e.target.value)}
                  placeholder="Ex: Panturrilha, Trapézio, Funcional..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={descricaoNovaPasta}
                  onChange={(e) => setDescricaoNovaPasta(e.target.value)}
                  placeholder="Ex: Exercícios isolados e conjugados..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovaPastaAberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-black hover:bg-amber-450 transition-colors cursor-pointer"
                >
                  Criar Pasta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER LATERAL (SLIDE-OVER) CADASTRO / EDIÇÃO DE EXERCÍCIO */}
      {/* COM BLOCOS DE MÍDIA FIÉIS AO NEXUR (Mídia 1, Mídia 2...)   */}
      {/* ======================================================== */}
      {drawerAberto && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          <div
            onClick={() => setDrawerAberto(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
              
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
                  className="size-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Formulário & Mídias Estilo Nexur */}
              <form onSubmit={handleSalvarExercicio} className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. Nome do Exercício */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Título do Exercício *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                    placeholder="Ex: Supino Reto com Barra"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* 2. Seleção de Pasta Muscular */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Pasta Muscular *
                  </label>
                  <select
                    value={formPastaId}
                    onChange={(e) => setFormPastaId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {pastas.map((pasta) => (
                      <option key={pasta.id} value={pasta.id}>
                        {pasta.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Equipamento & Tipo de Exercício */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Equipamento
                    </label>
                    <select
                      value={formEquipamento}
                      onChange={(e) => setFormEquipamento(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      {EQUIPAMENTOS_OPCOES.map((eq) => (
                        <option key={eq} value={eq}>
                          {eq}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Tipo de Exercício
                    </label>
                    <select
                      value={formTipo}
                      onChange={(e) => setFormTipo(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs font-bold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    >
                      {TIPOS_OPCOES.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. BLOCOS DE MÍDIA DINÂMICOS (Fiel à referência do Nexur) */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">
                        Demonstrações Visuais (Mídias)
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Adicione vídeos, GIFs, imagens ou documentos conforme a necessidade.
                      </p>
                    </div>
                  </div>

                  {formMidias.map((midia, index) => {
                    const parsed = parseMedia(midia.link_externo, midia.arquivo_url);

                    return (
                      <div
                        key={midia.id || index}
                        className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/60 p-4 space-y-3 relative shadow-xs"
                      >
                        {/* Topo do Bloco: "Mídia X" + Ícone de Lixeira */}
                        <div className="flex items-center justify-between pb-1 border-b border-neutral-200/60 dark:border-neutral-800">
                          <span className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                            Mídia {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoverBlocoMidia(index)}
                            className="size-7 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Remover esta mídia"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        {/* Pré-visualização ao vivo se houver link ou arquivo */}
                        {parsed.embedUrl && (
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-neutral-200 dark:border-neutral-800 shadow-inner">
                            {parsed.type === 'youtube' && (
                              <iframe
                                src={parsed.embedUrl}
                                title={`Mídia ${index + 1}`}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            )}
                            {parsed.type === 'drive' && (
                              <iframe
                                src={parsed.embedUrl}
                                title={`Mídia ${index + 1}`}
                                className="w-full h-full border-0"
                                allow="autoplay"
                              />
                            )}
                            {parsed.type === 'vimeo' && (
                              <iframe
                                src={parsed.embedUrl}
                                title={`Mídia ${index + 1}`}
                                className="w-full h-full border-0"
                                allow="autoplay; fullscreen"
                                allowFullScreen
                              />
                            )}
                            {parsed.type === 'direct_video' && (
                              <video
                                src={parsed.embedUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                controls
                                className="w-full h-full object-cover"
                              />
                            )}
                            {parsed.type === 'gif_image' && (
                              <img
                                src={parsed.embedUrl}
                                alt={`Mídia ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        )}

                        {/* Dropzone de Upload Tracejado (Fiel à foto do Nexur) */}
                        <label className="relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500/60 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white dark:bg-neutral-900 group">
                          <UploadCloud className="size-6 text-neutral-400 group-hover:text-amber-500 mb-1 transition-colors" />
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                            {midia.arquivo_nome ? midia.arquivo_nome : 'Adicionar Midia'}
                          </span>
                          <span className="text-[10px] text-neutral-400 mt-0.5 font-medium">
                            jpg, png, gif, mp4, mov, pdf, xls, doc, webp, jpeg
                          </span>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.gif,.mp4,.mov,.webm,.pdf,.xls,.xlsx,.doc,.docx,.webp"
                            onChange={(e) => handleUploadArquivoBloco(index, e)}
                            className="hidden"
                          />
                        </label>

                        {/* Divisor "Ou" */}
                        <div className="flex items-center gap-3 py-0.5">
                          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Ou
                          </span>
                          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                        </div>

                        {/* Campo de Link Externo com ícone de prancheta/link */}
                        <div className="space-y-1">
                          <div className="relative">
                            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                            <input
                              type="text"
                              value={midia.link_externo || ''}
                              onChange={(e) => handleAtualizarLinkBloco(index, e.target.value)}
                              placeholder="Link externo"
                              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                            />
                          </div>
                          <span className="text-[10px] text-neutral-400 px-1">
                            youtube, vimeo, etc
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Botão para Adicionar Outra Mídia (Mídia 2, Mídia 3...) */}
                  <button
                    type="button"
                    onClick={handleAdicionarBlocoMidia}
                    className="w-full py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-amber-500/60 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-xs font-bold text-neutral-600 dark:text-neutral-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="size-3.5 text-amber-500" />
                    <span>Adicionar outra mídia</span>
                  </button>
                </div>

                {/* 5. Orientações Técnicas */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Orientações do Exercício
                  </label>
                  <textarea
                    rows={4}
                    value={formOrientacoes}
                    onChange={(e) => setFormOrientacoes(e.target.value)}
                    placeholder="Orientações posturais, execução correta, respiração e dicas biomecânicas..."
                    className="w-full p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                {/* Rodapé do Formulário */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800 sticky bottom-0 bg-white dark:bg-neutral-900 pb-2">
                  <button
                    type="button"
                    onClick={() => setDrawerAberto(false)}
                    className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
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

      {/* ======================================================== */}
      {/* MODAL DE EXECUÇÃO FOCADO (CINEMA / VÍDEO COMPLETO)       */}
      {/* COM ABAS PARA MÚLTIPLAS MÍDIAS (MÍDIA 1, MÍDIA 2...)     */}
      {/* ======================================================== */}
      {exercicioAssistindo && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            onClick={() => setExercicioAssistindo(null)}
            className="fixed inset-0"
          />

          <div className="relative w-full max-w-3xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200">
            {/* Topo do Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                  <Play className="size-4 fill-amber-500" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-black text-white truncate">
                    {exercicioAssistindo.titulo}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Pasta: <span className="text-amber-400 font-bold">{exercicioAssistindo.grupo}</span> • {exercicioAssistindo.tipo || 'Exercício'} • Equipamento: <span className="text-neutral-300 font-semibold">{exercicioAssistindo.equipamento}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const ex = exercicioAssistindo;
                    setExercicioAssistindo(null);
                    handleAbrirEdicao(ex);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-neutral-700 hover:border-amber-500/40 hover:bg-neutral-800 text-xs font-bold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="size-3.5 text-amber-500" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => setExercicioAssistindo(null)}
                  className="size-9 rounded-xl hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Fechar"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Abas de Mídia se houver mais de uma */}
            {exercicioAssistindo.midias && exercicioAssistindo.midias.length > 1 && (
              <div className="flex items-center gap-2 px-6 py-2 bg-neutral-950 border-b border-neutral-800 overflow-x-auto">
                {exercicioAssistindo.midias.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAbaMidiaAssistindo(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      abaMidiaAssistindo === idx
                        ? 'bg-amber-500 text-neutral-950 shadow-xs'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Mídia {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Player de Mídia Ativa */}
            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              {(() => {
                const midiaAtiva = exercicioAssistindo.midias?.[abaMidiaAssistindo];
                const info = parseMedia(
                  midiaAtiva?.link_externo || exercicioAssistindo.video,
                  midiaAtiva?.arquivo_url || exercicioAssistindo.midia
                );

                if (info.type === 'youtube') {
                  return (
                    <iframe
                      src={info.embedUrl!}
                      title={exercicioAssistindo.titulo}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }

                if (info.type === 'drive') {
                  return (
                    <iframe
                      src={info.embedUrl!}
                      title={exercicioAssistindo.titulo}
                      className="w-full h-full border-0"
                      allow="autoplay"
                    />
                  );
                }

                if (info.type === 'vimeo') {
                  return (
                    <iframe
                      src={info.embedUrl!}
                      title={exercicioAssistindo.titulo}
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen"
                      allowFullScreen
                    />
                  );
                }

                if (info.type === 'direct_video') {
                  return (
                    <video
                      src={info.embedUrl!}
                      autoPlay
                      loop
                      muted={false}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  );
                }

                if (info.type === 'gif_image') {
                  return (
                    <img
                      src={info.embedUrl!}
                      alt={exercicioAssistindo.titulo}
                      className="w-full h-full object-contain"
                    />
                  );
                }

                return (
                  <div className="text-center p-8 space-y-3">
                    <VideoIcon className="size-12 text-neutral-600 mx-auto" />
                    <p className="text-sm font-bold text-neutral-400">Nenhum vídeo cadastrado nesta mídia.</p>
                    <button
                      onClick={() => {
                        const ex = exercicioAssistindo;
                        setExercicioAssistindo(null);
                        handleAbrirEdicao(ex);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
                    >
                      Adicionar link ou arquivo agora
                    </button>
                  </div>
                );
              })()}
            </div>

            {/* Orientações Posturais */}
            <div className="p-6 space-y-4 bg-neutral-900 border-t border-neutral-800">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                  Orientações Técnicas & Posturais
                </span>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                  {exercicioAssistindo.orientacoes || 'Nenhuma orientação cadastrada para este exercício.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
