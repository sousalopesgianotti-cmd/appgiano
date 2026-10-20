import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  RotateCw, 
  LayoutList, 
  LayoutGrid, 
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
  X
} from 'lucide-react';
import type { Aluno } from '@/lib/types';
import { toast } from 'sonner';

type ClientesPageProps = {
  alunos: Aluno[];
  limiteAlunos?: number;
  onAddAluno: (aluno: Omit<Aluno, 'id' | 'professor_id'>) => Promise<void>;
  onUpdateAluno: (id: string, patch: Partial<Aluno>) => Promise<void>;
  onDeleteAluno: (id: string) => Promise<void>;
  onSelectAlunoTreinos?: (aluno: Aluno) => void;
};

export const ClientesPage: React.FC<ClientesPageProps> = ({
  alunos,
  limiteAlunos = 25,
  onAddAluno,
  onUpdateAluno,
  onDeleteAluno,
  onSelectAlunoTreinos,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null);

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
    setFormMensalidade('150');
    setFormDiaVencimento('10');
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
    setFormMensalidade(String(aluno.valor_mensalidade || 150));
    setFormDiaVencimento(String(aluno.dia_vencimento || 10));
    setFormSenha(aluno.senha || '');
    setModalNovoAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim()) {
      toast.error('Informe o nome do aluno.');
      return;
    }
    if (!formTelefone.trim() && !formEmail.trim()) {
      toast.error('Informe ao menos o WhatsApp ou o e-mail do aluno.');
      return;
    }

    setSalvando(true);
    try {
      if (alunoEditando) {
        await onUpdateAluno(alunoEditando.id, {
          nome: formNome.trim(),
          email: formEmail.trim(),
          telefone: formTelefone.trim(),
          nascimento: formNascimento.trim(),
          grupo: formGrupo.trim(),
          valor_mensalidade: parseFloat(formMensalidade) || 150,
          dia_vencimento: parseInt(formDiaVencimento, 10) || 10,
          senha: formSenha.trim() || undefined,
        });
        toast.success('Aluno atualizado com sucesso!');
      } else {
        await onAddAluno({
          nome: formNome.trim(),
          email: formEmail.trim(),
          telefone: formTelefone.trim(),
          nascimento: formNascimento.trim(),
          grupo: formGrupo.trim(),
          valor_mensalidade: parseFloat(formMensalidade) || 150,
          dia_vencimento: parseInt(formDiaVencimento, 10) || 10,
          ativo: true,
          app_liberado: true,
          senha: formSenha.trim() || undefined,
        });
        toast.success('Novo aluno cadastrado com sucesso!');
      }
      setModalNovoAberto(false);
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
    const link = `${origin}/app?alunoId=${alunoId}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link exclusivo de ${nome.split(' ')[0]} copiado! Envie no WhatsApp dele.`);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* TOPO COM TÍTULO, CONTADOR E AÇÕES (ESTILO FIGURA 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            Clientes
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              <UserCheck className="size-3.5 text-amber-500" />
              <span>{totalAtivos}/{limiteAlunos} clientes ativos</span>
            </span>
          </div>
        </div>

        {/* Botões do Topo */}
        <div className="flex items-center gap-2.5">
          {/* Alternador de Visualização Lista x Grade */}
          <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-neutral-900 text-amber-500 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Modo Lista (Estilo Nexur)"
            >
              <LayoutList className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-neutral-900 text-amber-500 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title="Modo Grade (Estilo Keepfy)"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>

          {/* Botão + Novo Cliente em Destaque Amarelo */}
          <button
            onClick={abrirModalNovo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus className="size-4 stroke-[3]" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nome, WhatsApp ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 h-11 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
          />
        </div>
      </div>

      {/* CONTEÚDO: MODO LISTA (ESTILO NEXUR - FIGURA 1) */}
      {viewMode === 'list' && (
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
                    {onSelectAlunoTreinos && (
                      <button
                        onClick={() => onSelectAlunoTreinos(aluno)}
                        className="p-2 rounded-xl text-neutral-500 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        title="Prescrever / Ver Fichas de Treino"
                      >
                        <Dumbbell className="size-4" />
                      </button>
                    )}

                    {/* Copiar Link WhatsApp */}
                    <button
                      onClick={() => copiarLinkApp(aluno.id, aluno.nome)}
                      className="p-2 rounded-xl text-neutral-500 hover:text-emerald-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                      title="Copiar Link de Acesso do Aluno para WhatsApp"
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
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {alunosFiltrados.map((aluno) => (
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

              {/* Informações Centrais */}
              <div className="space-y-1 mb-4">
                <h3 className="font-bold text-base text-neutral-900 dark:text-white truncate">
                  {aluno.nome}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {aluno.telefone || aluno.email}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs text-neutral-500">
                  <span>Mensalidade: R$ {aluno.valor_mensalidade || 150}</span>
                  <span className="font-bold text-emerald-500">100,00%</span>
                </div>
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
                    onClick={() => copiarLinkApp(aluno.id, aluno.nome)}
                    className="p-1.5 text-neutral-400 hover:text-emerald-500 rounded-lg transition-colors"
                    title="Copiar Link"
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
          ))}
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
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="ex: aluno@email.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    placeholder="150"
                    value={formMensalidade}
                    onChange={(e) => setFormMensalidade(e.target.value)}
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
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-sm font-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : alunoEditando ? 'Salvar Alterações' : 'Cadastrar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
