import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MessageCircle, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  X,
  Phone,
  Mail,
  User,
  Crown
} from 'lucide-react';
import type { Professor, PlanoNome, Aluno } from '@/lib/types';
import { toast } from 'sonner';

interface ProfessoresPageProps {
  professores: Professor[];
  alunos: Aluno[];
  onAddProfessor: (novo: Omit<Professor, 'id' | 'created_at'>) => Promise<void>;
  onUpdateProfessor: (id: string, patch: Partial<Professor>) => Promise<void>;
  onDeleteProfessor: (id: string) => Promise<void>;
}

const PLANOS_INFO: Record<PlanoNome, { limite: number; valor: number; cor: string }> = {
  'Starter 10': { limite: 10, valor: 49, cor: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  'Pro 30': { limite: 30, valor: 89, cor: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  'Elite 60': { limite: 60, valor: 149, cor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  'Studio Ilimitado': { limite: 9999, valor: 249, cor: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
};

export const ProfessoresPage: React.FC<ProfessoresPageProps> = ({
  professores,
  alunos,
  onAddProfessor,
  onUpdateProfessor,
  onDeleteProfessor,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'bloqueados'>('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [professorEmEdicao, setProfessorEmEdicao] = useState<Professor | null>(null);

  // Formulário do Modal
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formPlano, setFormPlano] = useState<PlanoNome>('Pro 30');
  const [formLimite, setFormLimite] = useState(30);
  const [formValor, setFormValor] = useState(89);
  const [formAtivo, setFormAtivo] = useState(true);

  // Métricas calculadas do SaaS
  const totalProfessores = professores.length;
  const professoresAtivos = professores.filter((p) => p.ativo).length;
  const totalAlunosNaPlataforma = alunos.length;
  const faturamentoMensalSaaS = professores
    .filter((p) => p.ativo)
    .reduce((acc, p) => acc + (p.valor_mensalidade || 0), 0);

  // Calcula quantos alunos cada professor possui em tempo real
  const getQtdAlunosProfessor = (professorId: string) => {
    return alunos.filter((a) => a.professor_id === professorId).length;
  };

  const handleAbrirCriacao = () => {
    setProfessorEmEdicao(null);
    setFormNome('');
    setFormEmail('');
    setFormTelefone('');
    setFormPlano('Pro 30');
    setFormLimite(30);
    setFormValor(89);
    setFormAtivo(true);
    setModalAberto(true);
  };

  const handleAbrirEdicao = (prof: Professor) => {
    setProfessorEmEdicao(prof);
    setFormNome(prof.nome);
    setFormEmail(prof.email);
    setFormTelefone(prof.telefone);
    setFormPlano(prof.plano_nome);
    setFormLimite(prof.limite_alunos);
    setFormValor(prof.valor_mensalidade);
    setFormAtivo(prof.ativo);
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formEmail.trim()) {
      toast.error('Preencha pelo menos o nome e o e-mail do professor.');
      return;
    }

    try {
      if (professorEmEdicao) {
        await onUpdateProfessor(professorEmEdicao.id, {
          nome: formNome,
          email: formEmail,
          telefone: formTelefone,
          plano_nome: formPlano,
          limite_alunos: formLimite,
          valor_mensalidade: formValor,
          ativo: formAtivo,
        });
        toast.success(`Professor ${formNome} atualizado com sucesso!`);
      } else {
        await onAddProfessor({
          nome: formNome,
          email: formEmail,
          telefone: formTelefone,
          plano_nome: formPlano,
          limite_alunos: formLimite,
          valor_mensalidade: formValor,
          ativo: formAtivo,
        });
        toast.success(`Professor ${formNome} cadastrado com sucesso!`);
      }
      setModalAberto(false);
    } catch (err) {
      toast.error('Erro ao salvar professor.');
    }
  };

  const handleToggleAtivo = async (prof: Professor) => {
    const novoStatus = !prof.ativo;
    await onUpdateProfessor(prof.id, { ativo: novoStatus });
    if (novoStatus) {
      toast.success(`Acesso do professor ${prof.nome} liberado.`);
    } else {
      toast.warning(`Acesso do professor ${prof.nome} foi bloqueado.`);
    }
  };

  const handleExcluir = async (prof: Professor) => {
    if (confirm(`Tem certeza que deseja remover o professor ${prof.nome}? Os alunos dele também serão impactados.`)) {
      await onDeleteProfessor(prof.id);
      toast.success(`Professor ${prof.nome} removido.`);
    }
  };

  const handlePlanoChange = (plano: PlanoNome) => {
    setFormPlano(plano);
    setFormLimite(PLANOS_INFO[plano].limite);
    setFormValor(PLANOS_INFO[plano].valor);
  };

  // Filtragem da lista
  const professoresFiltrados = professores.filter((p) => {
    const matchBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.email.toLowerCase().includes(busca.toLowerCase()) ||
      p.telefone.includes(busca);

    if (!matchBusca) return false;
    if (filtroStatus === 'ativos') return p.ativo;
    if (filtroStatus === 'bloqueados') return !p.ativo;
    return true;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      
      {/* Cabeçalho com Título & Ação Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="size-6 text-amber-500" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              Gestão de Professores & Cotas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Painel do Dono do Produto: administre personais cadastrados, pacotes contratados e faturamento recorrente.
          </p>
        </div>

        <button
          onClick={handleAbrirCriacao}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="size-4" />
          <span>Novo Professor</span>
        </button>
      </div>

      {/* Cartões de Métricas do SaaS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Professores Ativos</span>
            <Users className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            {professoresAtivos}{' '}
            <span className="text-xs font-semibold text-neutral-400">/ {totalProfessores} total</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Alunos na Plataforma</span>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            {totalAlunosNaPlataforma}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Receita do SaaS (MRR)</span>
            <DollarSign className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-500">
            R$ {faturamentoMensalSaaS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Pacotes Disponíveis</span>
            <Layers className="size-4 text-blue-500" />
          </div>
          <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300 pt-1">
            Starter (10) • Pro (30) • Elite (60)
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, e-mail ou WhatsApp do professor..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl shrink-0">
          {(['todos', 'ativos', 'bloqueados'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFiltroStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                filtroStatus === st
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Professores */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-850/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Professor</th>
                <th className="py-3.5 px-4">WhatsApp</th>
                <th className="py-3.5 px-4">Plano Contratado</th>
                <th className="py-3.5 px-4 min-w-[180px]">Cota de Alunos</th>
                <th className="py-3.5 px-4 text-center">Acesso</th>
                <th className="py-3.5 px-4 text-right pr-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-medium">
              {professoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    Nenhum professor encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                professoresFiltrados.map((prof) => {
                  const qtdAlunos = getQtdAlunosProfessor(prof.id);
                  const limite = prof.limite_alunos;
                  const percentual = limite >= 9999 ? 0 : Math.min(100, Math.round((qtdAlunos / limite) * 100));
                  const isEsgotado = limite < 9999 && qtdAlunos >= limite;
                  const planoInfo = PLANOS_INFO[prof.plano_nome] || PLANOS_INFO['Pro 30'];

                  return (
                    <tr 
                      key={prof.id}
                      className="hover:bg-neutral-50/70 dark:hover:bg-neutral-850/40 transition-colors"
                    >
                      {/* Nome & Avatar */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black flex items-center justify-center shrink-0">
                            {prof.nome.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-neutral-900 dark:text-white truncate">
                              {prof.nome}
                            </div>
                            <div className="text-xs text-neutral-400 truncate">
                              {prof.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* WhatsApp com Link Direto */}
                      <td className="py-4 px-4">
                        {prof.telefone ? (
                          <a
                            href={`https://wa.me/55${prof.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-bold text-xs transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="size-3.5" />
                            <span>{prof.telefone}</span>
                          </a>
                        ) : (
                          <span className="text-neutral-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Plano & Valor */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${planoInfo.cor}`}>
                            {prof.plano_nome}
                          </span>
                          <div className="text-[11px] text-neutral-400 font-semibold">
                            R$ {prof.valor_mensalidade.toFixed(2)}/mês
                          </div>
                        </div>
                      </td>

                      {/* Barra Visual de Cota */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-neutral-700 dark:text-neutral-300">
                              {qtdAlunos} / {limite >= 9999 ? '∞' : limite} alunos
                            </span>
                            {limite < 9999 && (
                              <span className={`text-[11px] font-black ${
                                isEsgotado ? 'text-rose-500' : percentual > 80 ? 'text-amber-500' : 'text-neutral-400'
                              }`}>
                                {percentual}%
                              </span>
                            )}
                          </div>

                          {limite < 9999 ? (
                            <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                              <div
                                style={{ width: `${percentual}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isEsgotado
                                    ? 'bg-rose-500'
                                    : percentual > 80
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-500 font-bold uppercase">
                              Cota Ilimitada
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Switch de Acesso (Ativo / Bloqueado) */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleAtivo(prof)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                            prof.ativo
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                          title={prof.ativo ? 'Clique para bloquear acesso' : 'Clique para liberar acesso'}
                        >
                          <span className={`size-1.5 rounded-full ${prof.ativo ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                          <span>{prof.ativo ? 'Ativo' : 'Bloqueado'}</span>
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAbrirEdicao(prof)}
                            className="size-8 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-colors"
                            title="Editar Cota e Dados"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleExcluir(prof)}
                            className="size-8 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-rose-500/10 hover:border-rose-500/30 flex items-center justify-center text-neutral-400 hover:text-rose-500 transition-colors"
                            title="Remover Professor"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição de Professor */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Topo do Modal */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <Crown className="size-5 text-amber-500" />
                <h2 className="text-lg font-black text-neutral-900 dark:text-white">
                  {professorEmEdicao ? 'Editar Professor & Cota' : 'Novo Professor na Plataforma'}
                </h2>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="size-8 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silva"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Email & Telefone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    E-mail de Acesso
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="carlos@email.com"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                    <input
                      type="text"
                      value={formTelefone}
                      onChange={(e) => setFormTelefone(e.target.value)}
                      placeholder="11999998888"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* Seleção de Pacote / Plano */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Pacote / Plano Contratado
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PLANOS_INFO) as PlanoNome[]).map((planoKey) => {
                    const info = PLANOS_INFO[planoKey];
                    const isSelected = formPlano === planoKey;
                    return (
                      <button
                        type="button"
                        key={planoKey}
                        onClick={() => handlePlanoChange(planoKey)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 text-amber-500 ring-1 ring-amber-500'
                            : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="font-bold text-xs">{planoKey}</div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          {info.limite >= 9999 ? 'Cota Ilimitada' : `Até ${info.limite} alunos`} • R$ {info.valor}/mês
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Limite Customizado e Valor Mensal */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Limite de Alunos (Cota)
                  </label>
                  <input
                    type="number"
                    value={formLimite}
                    onChange={(e) => setFormLimite(parseInt(e.target.value, 10) || 10)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Valor Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    value={formValor}
                    onChange={(e) => setFormValor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs sm:text-sm font-medium text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {professorEmEdicao ? 'Salvar Alterações' : 'Cadastrar Professor'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
