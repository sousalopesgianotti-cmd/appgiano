import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  RotateCw, 
  SlidersHorizontal, 
  ArrowUpDown, 
  MoreVertical, 
  UserCheck, 
  Dumbbell, 
  Trash2, 
  Edit3, 
  Share2, 
  Phone, 
  Mail, 
  Calendar,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import type { Aluno, Treino, Exercicio, PastaExercicio } from '@/lib/types';
import { TreinosAlunoNexurView } from './TreinosAlunoNexurView';
import { ViewModeToggle } from '@/components/common/ViewModeToggle';
import { ModalConviteAluno, type StatusEnvioEmail } from '@/components/common/ModalConviteAluno';
import { ModalCompartilharAcessoAluno } from '@/components/common/ModalCompartilharAcessoAluno';
import { enviarEmailConviteAluno } from '@/lib/emailService';
import { gerarLinkConvite, gerarLinkAcessoAluno, gerarMensagemWhatsAppAluno } from '@/lib/convite';
import { toast } from 'sonner';

type ClientesPageProps = {
  alunos: Aluno[];
  treinos?: Treino[];
  exercicios?: Exercicio[];
  pastas?: PastaExercicio[];
  limiteAlunos?: number;
  onAddAluno: (aluno: Omit<Aluno, 'id' | 'professor_id'>) => Promise<Aluno | void>;
  onUpdateAluno: (id: string, patch: Partial<Aluno>) => Promise<void>;
  onDeleteAluno: (id: string) => Promise<void>;
  onSelectAlunoTreinos?: (aluno: Aluno) => void;
  onAddTreino?: (novo: Omit<Treino, 'id'>) => Promise<Treino | void>;
  onUpdateTreino?: (id: string, patch: Partial<Treino>) => Promise<void>;
  onDeleteTreino?: (id: string) => Promise<void>;
};

export const ClientesPage: React.FC<ClientesPageProps> = ({
  alunos,
  treinos = [],
  exercicios = [],
  pastas = [],
  limiteAlunos = 25,
  onAddAluno,
  onUpdateAluno,
  onDeleteAluno,
  onSelectAlunoTreinos,
  onAddTreino,
  onUpdateTreino,
  onDeleteTreino,
}) => {
  const [modoVisualizacao, setModoVisualizacao] = useState<'grade' | 'lista'>('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null);

  // Visualização e montagem de treinos do aluno estilo Nexur
  const [alunoTreinosNexur, setAlunoTreinosNexur] = useState<Aluno | null>(null);

  // Estados do Modal de Convite Pós-Cadastro
  const [modalConviteAberto, setModalConviteAberto] = useState(false);
  const [alunoConvite, setAlunoConvite] = useState<Aluno | null>(null);
  const [statusEmail, setStatusEmail] = useState<StatusEnvioEmail>('idle');
  const [mensagemEmail, setMensagemEmail] = useState('');

  // Estados do Modal Inteligente de Compartilhamento de Acesso
  const [modalCompartilharAberto, setModalCompartilharAberto] = useState(false);
  const [alunoCompartilhar, setAlunoCompartilhar] = useState<Aluno | null>(null);

  const abrirCompartilhar = (aluno: Aluno) => {
    setAlunoCompartilhar(aluno);
    setModalCompartilharAberto(true);
  };

  // Estados de Prescrição de Treinos
  const [alunoPrescrevendo, setAlunoPrescrevendo] = useState<Aluno | null>(null);
  const [treinosSelecionados, setTreinosSelecionados] = useState<string[]>([]);
  const [modalPrescreverAberto, setModalPrescreverAberto] = useState(false);

  const abrirPrescricao = (aluno: Aluno) => {
    setAlunoTreinosNexur(aluno);
  };

  // Estados para inclusão e exclusão de fichas dentro do modal de prescrição
  const [criandoNovaFicha, setCriandoNovaFicha] = useState(false);
  const [novoTreinoNome, setNovoTreinoNome] = useState('');
  const [novoTreinoDescricao, setNovoTreinoDescricao] = useState('');
  const [salvandoNovaFicha, setSalvandoNovaFicha] = useState(false);

  const handleCriarNovaFichaModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTreinoNome.trim()) {
      toast.error('Informe o nome da ficha (ex: Treino D — Ombros).');
      return;
    }

    setSalvandoNovaFicha(true);
    try {
      if (onAddTreino) {
        const treinoCriado = await onAddTreino({
          nome: novoTreinoNome.trim(),
          descricao: novoTreinoDescricao.trim() || 'Ficha personalizada',
          professor_id: '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
          exercicios: [],
          created_at: new Date().toISOString(),
        });
        if (treinoCriado && 'id' in treinoCriado) {
          setTreinosSelecionados((prev) => [...prev, (treinoCriado as Treino).id]);
        }
      }
      toast.success(`Ficha "${novoTreinoNome.trim()}" criada com sucesso!`);
      setNovoTreinoNome('');
      setNovoTreinoDescricao('');
      setCriandoNovaFicha(false);
    } catch {
      toast.error('Erro ao criar nova ficha.');
    } finally {
      setSalvandoNovaFicha(false);
    }
  };

  const handleExcluirFichaModal = async (e: React.MouseEvent, treinoId: string, treinoNome: string) => {
    e.stopPropagation();
    if (!window.confirm(`Tem certeza que deseja excluir a ficha "${treinoNome}" permanentemente da biblioteca de treinos?`)) {
      return;
    }

    try {
      if (onDeleteTreino) {
        await onDeleteTreino(treinoId);
      }
      setTreinosSelecionados((prev) => prev.filter((id) => id !== treinoId));
      toast.success(`Ficha "${treinoNome}" excluída da biblioteca.`);
    } catch {
      toast.error('Erro ao excluir ficha.');
    }
  };

  const toggleTreinoSelecionado = (treinoId: string) => {
    setTreinosSelecionados((prev) =>
      prev.includes(treinoId) ? prev.filter((id) => id !== treinoId) : [...prev, treinoId]
    );
  };

  const handleSalvarPrescricao = async () => {
    if (!alunoPrescrevendo) return;
    try {
      await onUpdateAluno(alunoPrescrevendo.id, { treinos_ids: treinosSelecionados });
      toast.success(`Fichas de treino de ${alunoPrescrevendo.nome.split(' ')[0]} atualizadas com sucesso!`);
      setModalPrescreverAberto(false);
    } catch {
      toast.error('Erro ao salvar prescrição de treinos.');
    }
  };

  // Estados do formulário
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formNascimento, setFormNascimento] = useState('');
  const [formGrupo, setFormGrupo] = useState('Geral');
  const [formMensalidade, setFormMensalidade] = useState('150');
  const [formDiaVencimento, setFormDiaVencimento] = useState('10');
  const [formSenha, setFormSenha] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Alunos ativos
  const totalAtivos = alunos.filter((a) => a.ativo !== false).length;

  // Filtragem por busca
  const alunosFiltrados = alunos.filter((a) => {
    const q = searchTerm.toLowerCase();
    return (
      a.nome.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.telefone.includes(q) ||
      a.grupo.toLowerCase().includes(q)
    );
  });

  const abrirModalNovo = () => {
    setAlunoEditando(null);
    setFormNome('');
    setFormEmail('');
    setFormTelefone('');
    setFormNascimento('');
    setFormGrupo('Geral');
    setFormMensalidade('');
    setFormDiaVencimento('');
    setFormSenha('');
    setModalNovoAberto(true);
  };

  const abrirModalEditar = (aluno: Aluno) => {
    setAlunoEditando(aluno);
    setFormNome(aluno.nome);
    setFormEmail(aluno.email);
    setFormTelefone(aluno.telefone);
    setFormNascimento(aluno.nascimento);
    setFormGrupo(aluno.grupo || 'Geral');
    setFormMensalidade(aluno.valor_mensalidade ? String(aluno.valor_mensalidade) : '');
    setFormDiaVencimento(aluno.dia_vencimento ? String(aluno.dia_vencimento) : '');
    setFormSenha(aluno.senha || '');
    setModalNovoAberto(true);
  };

  const dispararEmailConvite = async (aluno: Aluno) => {
    setStatusEmail('enviando');
    setMensagemEmail('');
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://appgiano.com.br';
    const linkAcesso = gerarLinkConvite(origin, aluno, treinos);

    try {
      const res = await enviarEmailConviteAluno({
        nome: aluno.nome,
        email: aluno.email,
        telefone: aluno.telefone,
        linkAcesso,
        senhaPadrao: aluno.senha || (aluno.telefone.replace(/\D/g, '').slice(-4) || '1234'),
        professorNome: 'Giano Personal',
      });

      if (res.sucesso) {
        setStatusEmail(res.modoSimulacao ? 'simulado' : 'enviado');
        setMensagemEmail(res.mensagem);
      } else {
        setStatusEmail('erro');
        setMensagemEmail(res.mensagem);
      }
    } catch {
      setStatusEmail('erro');
      setMensagemEmail('Erro inesperado ao disparar e-mail de convite.');
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      toast.error('Informe o nome do aluno.');
      return;
    }

    const emailLimpo = formEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailLimpo || !emailRegex.test(emailLimpo)) {
      toast.error('Informe um e-mail válido para o aluno (ex: aluno@email.com).');
      return;
    }

    setSalvando(true);
    try {
      const mensalidadeNum = formMensalidade.trim() ? parseFloat(formMensalidade) : 0;
      const diaVencimentoNum = formDiaVencimento.trim() ? parseInt(formDiaVencimento, 10) : 0;

      if (alunoEditando) {
        await onUpdateAluno(alunoEditando.id, {
          nome: formNome.trim(),
          email: emailLimpo,
          telefone: formTelefone.trim(),
          nascimento: formNascimento.trim(),
          grupo: formGrupo.trim(),
          valor_mensalidade: mensalidadeNum,
          dia_vencimento: diaVencimentoNum,
          senha: formSenha.trim() || undefined,
        });
        toast.success('Aluno atualizado com sucesso!');
        setModalNovoAberto(false);
      } else {
        const senhaDefinida = formSenha.trim() || (formTelefone.replace(/\D/g, '').slice(-4) || '1234');
        const alunoCriadoRetorno = await onAddAluno({
          nome: formNome.trim(),
          email: emailLimpo,
          telefone: formTelefone.trim(),
          nascimento: formNascimento.trim(),
          grupo: formGrupo.trim(),
          valor_mensalidade: mensalidadeNum,
          dia_vencimento: diaVencimentoNum,
          ativo: true,
          app_liberado: true,
          senha: senhaDefinida,
        });
        toast.success('Novo aluno cadastrado com sucesso!');
        setModalNovoAberto(false);

        const alunoParaConvite: Aluno = (alunoCriadoRetorno && 'id' in alunoCriadoRetorno)
          ? alunoCriadoRetorno
          : {
              id: crypto.randomUUID(),
              professor_id: '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
              nome: formNome.trim(),
              email: emailLimpo,
              telefone: formTelefone.trim(),
              nascimento: formNascimento.trim(),
              grupo: formGrupo.trim(),
              valor_mensalidade: mensalidadeNum,
              dia_vencimento: diaVencimentoNum,
              ativo: true,
              app_liberado: true,
              senha: senhaDefinida,
            };

        setAlunoConvite(alunoParaConvite);
        setModalConviteAberto(true);
        dispararEmailConvite(alunoParaConvite);
        return;
      }
    } catch {
      toast.error('Erro ao salvar aluno.');
    } finally {
      setSalvando(false);
    }
  };

  const handleToggleAtivo = async (aluno: Aluno) => {
    const novoStatus = !aluno.ativo;
    try {
      await onUpdateAluno(aluno.id, { ativo: novoStatus, app_liberado: novoStatus });
      toast.success(novoStatus ? `Acesso de ${aluno.nome.split(' ')[0]} ativado!` : `Acesso de ${aluno.nome.split(' ')[0]} pausado.`);
    } catch {
      toast.error('Erro ao alterar status do aluno.');
    }
  };

  const handleExcluir = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o cadastro de ${nome}? Esta ação é permanente.`)) {
      try {
        await onDeleteAluno(id);
        toast.success('Aluno excluído com sucesso.');
      } catch {
        toast.error('Erro ao excluir aluno.');
      }
    }
  };

  const copiarLinkApp = (alunoId: string, nome: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://appgiano.com.br';
    const aluno = alunos.find((a) => a.id === alunoId);
    if (!aluno) return;

    const { link, isRecorrente } = gerarMensagemWhatsAppAluno(origin, aluno, treinos);
    navigator.clipboard.writeText(link);

    if (isRecorrente) {
      toast.success(`Link oficial do App copiado para ${nome.split(' ')[0]}! (${link})`);
    } else {
      toast.success(`Link de primeiro acesso copiado para ${nome.split(' ')[0]}!`);
    }
  };

  const compartilharWhatsAppAluno = (aluno: Aluno) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://appgiano.com.br';
    const { texto } = gerarMensagemWhatsAppAluno(origin, aluno, treinos);
    const telLimpo = (aluno.telefone || '').replace(/\D/g, '');
    const urlWa = telLimpo
      ? `https://api.whatsapp.com/send?phone=55${telLimpo}&text=${encodeURIComponent(texto)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(urlWa, '_blank');
  };

  // Se o professor abriu a visão de treinos estilo Nexur do aluno
  if (alunoTreinosNexur) {
    const alunoAtual = alunos.find((a) => a.id === alunoTreinosNexur.id) || alunoTreinosNexur;

    return (
      <TreinosAlunoNexurView
        aluno={alunoAtual}
        treinos={treinos}
        exercicios={exercicios}
        pastas={pastas}
        onVoltar={() => setAlunoTreinosNexur(null)}
        onUpdateAluno={onUpdateAluno}
        onAddTreino={onAddTreino || (async () => {})}
        onUpdateTreino={onUpdateTreino || (async () => {})}
        onDeleteTreino={onDeleteTreino}
      />
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* ======================================================== */}
      {/* CABEÇALHO PRINCIPAL DA PÁGINA COM AÇÕES                  */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            Clientes
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Gestão de alunos, acompanhamento de treinos e permissões do aplicativo.
          </p>
        </div>

        {/* Botão + Novo Cliente em Destaque Âmbar */}
        <button
          onClick={abrirModalNovo}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-450 text-neutral-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="size-4 stroke-[3]" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* BARRA DE PESQUISA, RESUMO E SELETOR LISTA / GRADE        */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 sm:p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nome, WhatsApp ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              <UserCheck className="size-3.5 text-amber-500" />
              <span>{totalAtivos}/{limiteAlunos} clientes ativos</span>
            </span>
            {searchTerm && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {alunosFiltrados.length} {alunosFiltrados.length === 1 ? 'aluno' : 'alunos'}
              </span>
            )}
          </div>

          {/* Seletor Modo Card / Lista estilo Nexur unificado na barra de pesquisas */}
          <ViewModeToggle mode={modoVisualizacao} onChange={setModoVisualizacao} />
        </div>
      </div>

      {/* CONTEÚDO: MODO LISTA (ESTILO NEXUR - FIGURA 1) */}
      {modoVisualizacao === 'lista' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm divide-y divide-neutral-100 dark:divide-neutral-800/80 overflow-hidden">
          {alunosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 space-y-3">
              <UserCheck className="size-10 mx-auto text-neutral-300 dark:text-neutral-700" />
              <p className="text-sm font-semibold">Nenhum cliente encontrado.</p>
              <button
                onClick={abrirModalNovo}
                className="text-xs font-bold text-amber-500 hover:underline"
              >
                Clique aqui para cadastrar seu primeiro aluno
              </button>
            </div>
          ) : (
            alunosFiltrados.map((aluno) => {
              const iniciais = aluno.nome
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div
                  key={aluno.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/50 transition-colors"
                >
                  {/* Dados do Aluno */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Avatar Circular */}
                    <div className="size-11 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-sm flex items-center justify-center shrink-0 overflow-hidden">
                      {aluno.foto_url ? (
                        <img src={aluno.foto_url} alt={aluno.nome} className="size-full object-cover" />
                      ) : (
                        iniciais
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {aluno.nome}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {aluno.nascimento && (
                          <span>Aniversário: {aluno.nascimento}</span>
                        )}
                        {aluno.grupo && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold">
                            {aluno.grupo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Toggle Amarelo + Menu de Ações (Estilo Figura 1) */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Toggle Switch Amarelo */}
                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(aluno)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        aluno.ativo !== false ? 'bg-amber-500' : 'bg-neutral-200 dark:bg-neutral-700'
                      }`}
                      title={aluno.ativo !== false ? 'Acesso Ativo (Clique para pausar)' : 'Acesso Pausado (Clique para ativar)'}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          aluno.ativo !== false ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Botão de Prescrição Rápida */}
                    <button
                      onClick={() => abrirPrescricao(aluno)}
                      className="p-2 rounded-xl text-neutral-500 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Prescrever / Ver Fichas de Treino"
                    >
                      <Dumbbell className="size-4" />
                    </button>

                    {/* Compartilhar Acesso / Link do App / Convite */}
                    <button
                      onClick={() => abrirCompartilhar(aluno)}
                      className="p-2 rounded-xl text-neutral-500 hover:text-emerald-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Compartilhar Acesso (Link do App Oficial ou 1º Acesso)"
                    >
                      <Share2 className="size-4" />
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => abrirModalEditar(aluno)}
                      className="p-2 rounded-xl text-neutral-500 hover:text-blue-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Editar Aluno"
                    >
                      <Edit3 className="size-4" />
                    </button>

                    {/* Excluir */}
                    <button
                      onClick={() => handleExcluir(aluno.id, aluno.nome)}
                      className="p-2 rounded-xl text-neutral-500 hover:text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Excluir Aluno Definitivamente"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CONTEÚDO: MODO GRADE / CARDS (ESTILO KEEPFY - FIGURA 2) */}
      {modoVisualizacao === 'grade' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {alunosFiltrados.map((aluno) => {
            const iniciais = aluno.nome.slice(0, 2).toUpperCase();

            return (
              <div
                key={aluno.id}
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
              >
                {/* Badge de Status no Canto Superior Direito (Estilo Keepfy) */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold text-neutral-400">
                    {aluno.grupo || 'Consultoria'}
                  </span>
                  <span
                    className={`size-6 rounded-lg flex items-center justify-center font-black text-xs text-white ${
                      aluno.ativo !== false ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  >
                    {aluno.ativo !== false ? 'C' : 'A'}
                  </span>
                </div>

                {/* Informações Centrais com Avatar Circular */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-11 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-sm flex items-center justify-center shrink-0 overflow-hidden">
                    {aluno.foto_url ? (
                      <img src={aluno.foto_url} alt={aluno.nome} className="size-full object-cover" />
                    ) : (
                      iniciais
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-neutral-900 dark:text-white truncate">
                      {aluno.nome}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {aluno.telefone || aluno.email}
                    </p>
                  </div>
                </div>

                <div className="pt-1 pb-3 flex items-center justify-between text-xs text-neutral-500">
                  <span>Mensalidade: {aluno.valor_mensalidade ? `R$ ${aluno.valor_mensalidade}` : 'A definir'}</span>
                  <span className="font-bold text-emerald-500">100,00%</span>
                </div>

              {/* Ações do Card */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleAtivo(aluno)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    aluno.ativo !== false ? 'bg-amber-500' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white shadow transition duration-200 ${
                      aluno.ativo !== false ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => abrirPrescricao(aluno)}
                    className="p-1.5 text-neutral-400 hover:text-amber-500 rounded-lg transition-colors"
                    title="Prescrever Treinos"
                  >
                    <Dumbbell className="size-4" />
                  </button>
                  <button
                    onClick={() => abrirCompartilhar(aluno)}
                    className="p-1.5 text-neutral-400 hover:text-emerald-500 rounded-lg transition-colors cursor-pointer"
                    title="Compartilhar Acesso (Link do App Oficial ou 1º Acesso)"
                  >
                    <Share2 className="size-4" />
                  </button>
                  <button
                    onClick={() => abrirModalEditar(aluno)}
                    className="p-1.5 text-neutral-400 hover:text-blue-500 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="size-4" />
                  </button>
                  <button
                    onClick={() => handleExcluir(aluno.id, aluno.nome)}
                    className="p-1.5 text-neutral-400 hover:text-rose-500 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE ALUNO */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-neutral-900 dark:text-white">
                {alunoEditando ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button
                onClick={() => setModalNovoAberto(false)}
                className="size-8 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Murillo Moreira"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    placeholder="ex: 11999999999"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    Nascimento
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={formNascimento}
                    onChange={(e) => setFormNascimento(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                  E-mail *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ex: aluno@email.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    Grupo / Turma
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Hipertrofia A"
                    value={formGrupo}
                    onChange={(e) => setFormGrupo(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    placeholder="Opcional"
                    value={formMensalidade}
                    onChange={(e) => setFormMensalidade(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    Dia Vencimento
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 10"
                    min="1"
                    max="31"
                    value={formDiaVencimento}
                    onChange={(e) => setFormDiaVencimento(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Senha personalizada do app (mínimo 4 caracteres) */}
              <div>
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center justify-between mb-1.5">
                  <span>Senha do App do Aluno</span>
                  <span className="text-[10px] text-amber-500 font-normal">Padrão: 4 últimos dígitos do WhatsApp</span>
                </label>
                <input
                  type="text"
                  placeholder="Deixe em branco para usar o padrão"
                  value={formSenha}
                  onChange={(e) => setFormSenha(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalNovoAberto(false)}
                  className="flex-1 h-11 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-sm font-black transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {salvando ? 'Salvando...' : alunoEditando ? 'Salvar Alterações' : 'Cadastrar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONVITE PÓS-CADASTRO */}
      <ModalConviteAluno
        isOpen={modalConviteAberto}
        onClose={() => setModalConviteAberto(false)}
        aluno={alunoConvite}
        statusEmail={statusEmail}
        mensagemEmail={mensagemEmail}
        onReenviarEmail={alunoConvite ? () => dispararEmailConvite(alunoConvite) : undefined}
        treinos={treinos}
      />

      {/* MODAL INTELIGENTE DE COMPARTILHAMENTO DE ACESSO E RESET */}
      <ModalCompartilharAcessoAluno
        isOpen={modalCompartilharAberto}
        onClose={() => setModalCompartilharAberto(false)}
        aluno={alunoCompartilhar}
        treinos={treinos}
        onUpdateAluno={onUpdateAluno}
      />

      {/* MODAL DE PRESCRIÇÃO DE TREINOS DO ALUNO */}
      {modalPrescreverAberto && alunoPrescrevendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
                  <Dumbbell className="size-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                    Prescrever Fichas de Treino
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Aluno: <strong className="text-neutral-900 dark:text-white">{alunoPrescrevendo.nome}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalPrescreverAberto(false)}
                className="size-8 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Explicação, Contador e Botão Nova Ficha */}
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400 gap-2">
              <span className="truncate">Selecione as fichas liberadas no app:</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
                  {treinosSelecionados.length} selecionada(s)
                </span>
                <button
                  type="button"
                  onClick={() => setCriandoNovaFicha(!criandoNovaFicha)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Criar nova ficha de treino"
                >
                  <Plus className="size-3.5 stroke-[3]" />
                  <span>Nova Ficha</span>
                </button>
              </div>
            </div>

            {/* Formulário Rápido para Criar Nova Ficha */}
            {criandoNovaFicha && (
              <form onSubmit={handleCriarNovaFichaModal} className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                    <Sparkles className="size-3.5" />
                    <span>Nova Ficha na Biblioteca</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCriandoNovaFicha(false)}
                    className="size-6 rounded-lg text-neutral-400 hover:text-white flex items-center justify-center hover:bg-neutral-800"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Nome da ficha (ex: Treino D — Ombros & Trapézio)"
                  value={novoTreinoNome}
                  onChange={(e) => setNovoTreinoNome(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <input
                  type="text"
                  placeholder="Descrição / Foco (opcional)"
                  value={novoTreinoDescricao}
                  onChange={(e) => setNovoTreinoDescricao(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex items-center justify-end gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setCriandoNovaFicha(false)}
                    className="px-2.5 h-7 rounded-lg border border-neutral-300 dark:border-neutral-700 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvandoNovaFicha}
                    className="px-3 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px] flex items-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Plus className="size-3 stroke-[3]" />
                    <span>Adicionar Ficha</span>
                  </button>
                </div>
              </form>
            )}

            {/* Lista de Treinos da Biblioteca com Checkboxes */}
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {treinos.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 space-y-2">
                  <Dumbbell className="size-8 mx-auto text-neutral-300 dark:text-neutral-700" />
                  <p className="text-xs font-semibold">Nenhuma ficha cadastrada na biblioteca.</p>
                  <p className="text-[11px] text-neutral-500">Crie treinos na aba "Treinos" ou use o botão "+ Nova Ficha" acima.</p>
                </div>
              ) : (
                treinos.map((treino) => {
                  const isChecked = treinosSelecionados.includes(treino.id);
                  const letraTreino = treino.nome.includes('Treino ')
                    ? treino.nome.split('Treino ')[1]?.split(' ')[0]
                    : 'T';

                  return (
                    <div
                      key={treino.id}
                      onClick={() => toggleTreinoSelecionado(treino.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 shadow-xs'
                          : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`size-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                          }`}
                        >
                          {letraTreino}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                            {treino.nome}
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                            {treino.descricao || `${treino.exercicios?.length || 0} exercícios cadastrados`}
                          </p>
                        </div>
                      </div>

                      {/* Ações da Ficha: Excluir e Checkbox */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleExcluirFichaModal(e, treino.id, treino.nome)}
                          className="size-8 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
                          title={`Excluir "${treino.nome}" da biblioteca`}
                        >
                          <Trash2 className="size-4" />
                        </button>

                        <div
                          className={`size-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                            isChecked
                              ? 'bg-amber-500 border-amber-500 text-neutral-950'
                              : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                          }`}
                        >
                          {isChecked && <CheckCircle2 className="size-4 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Ações do Rodapé */}
            <div className="pt-2 flex items-center gap-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setModalPrescreverAberto(false)}
                className="flex-1 h-11 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarPrescricao}
                className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-sm font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="size-4 stroke-[2.5]" />
                <span>Salvar Prescrição</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
