import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Copy,
  Send,
  Share2,
  AlertTriangle,
  RotateCcw,
  KeyRound,
  Smartphone,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import type { Aluno, Treino } from '@/lib/types';
import { gerarLinkConvite, gerarMensagemWhatsAppAluno } from '@/lib/convite';
import { salvarAlunoNaNuvem, buscarAlunoPorIdentificadorNaNuvem } from '@/lib/syncService';
import { toast } from 'sonner';

type ModalCompartilharAcessoAlunoProps = {
  isOpen: boolean;
  onClose: () => void;
  aluno: Aluno | null;
  treinos?: Treino[];
  onUpdateAluno?: (id: string, patch: Partial<Aluno>) => Promise<void>;
};

export const ModalCompartilharAcessoAluno: React.FC<ModalCompartilharAcessoAlunoProps> = ({
  isOpen,
  onClose,
  aluno,
  treinos = [],
  onUpdateAluno,
}) => {
  const [confirmandoReset, setConfirmandoReset] = useState(false);
  const [resetando, setResetando] = useState(false);
  const [copiadoApp, setCopiadoApp] = useState(false);
  const [copiadoConvite, setCopiadoConvite] = useState(false);
  const [statusNuvemAlterada, setStatusNuvemAlterada] = useState<boolean | null>(null);

  // Consulta o status real da nuvem ao abrir o modal para garantir sincronia
  useEffect(() => {
    if (isOpen && aluno) {
      setConfirmandoReset(false);
      const iden = aluno.email || aluno.telefone;
      if (iden) {
        buscarAlunoPorIdentificadorNaNuvem(iden).then((cloud) => {
          if (cloud) {
            setStatusNuvemAlterada(Boolean(cloud.senha_alterada));
          }
        }).catch(() => {});
      }
    }
  }, [isOpen, aluno]);

  if (!isOpen || !aluno) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://appgiano.com.br';
  const primeiroNome = aluno.nome.trim().split(' ')[0] || aluno.nome.trim();
  const telDigits = (aluno.telefone || '').replace(/\D/g, '');
  const senhaProvisoriaWhats = telDigits.slice(-4) || '1234';

  // O aluno é considerado com senha pessoal se o cadastro local ou a nuvem registrarem senha_alterada
  const alunoPossuiSenhaPessoal = Boolean(aluno.senha_alterada || statusNuvemAlterada);

  // 1. DADOS DO LINK OFICIAL DO APP (Para alunos cadastrados)
  const linkOficialApp = `${origin}/app`;
  const mensagemWhatsAppApp = `Olá, ${primeiroNome}! 💪\n\nAqui está o link oficial de acesso aos seus treinos no App Giano:\n👉 ${linkOficialApp}\n\n📱 Acesse com seu e-mail ou WhatsApp e sua senha cadastrada.\n\n💡 *Dica:* Para abrir o app com 1 toque como um aplicativo, abra o link no seu navegador (Safari ou Chrome), toque em *Compartilhar* e selecione *"Adicionar à Tela de Início"*! 🔥`;

  const handleCopiarLinkOficial = async () => {
    try {
      await navigator.clipboard.writeText(linkOficialApp);
      setCopiadoApp(true);
      toast.success(`Link oficial do App copiado para ${primeiroNome}!`);
      setTimeout(() => setCopiadoApp(false), 2500);
    } catch {
      toast.error('Erro ao copiar link.');
    }
  };

  const handleEnviarWhatsAppOficial = () => {
    const linkWa = telDigits
      ? `https://api.whatsapp.com/send?phone=55${telDigits}&text=${encodeURIComponent(mensagemWhatsAppApp)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemWhatsAppApp)}`;
    window.open(linkWa, '_blank');
  };

  // 2. DADOS DO CONVITE / PRIMEIRO ACESSO (Reset de Senha)
  const linkConviteInicial = gerarLinkConvite(origin, aluno, treinos);
  const mensagemWhatsAppConvite = `Olá, ${primeiroNome}! Seu acesso ao aplicativo do *Personal Academy* está liberado. 💪🏋️‍♂️\n\nAbra o link abaixo para visualizar sua rotina de treinos:\nSua senha inicial provisória é: *${senhaProvisoriaWhats}*\n\n👉 ${linkConviteInicial}\n\n💡 Ao entrar, você poderá cadastrar sua senha pessoal definitiva!`;

  const handleCopiarConvite = async () => {
    try {
      await navigator.clipboard.writeText(linkConviteInicial);
      setCopiadoConvite(true);
      toast.success(`Link de primeiro acesso copiado para ${primeiroNome}!`);
      setTimeout(() => setCopiadoConvite(false), 2500);
    } catch {
      toast.error('Erro ao copiar link.');
    }
  };

  const handleEnviarWhatsAppConvite = () => {
    const linkWa = telDigits
      ? `https://api.whatsapp.com/send?phone=55${telDigits}&text=${encodeURIComponent(mensagemWhatsAppConvite)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemWhatsAppConvite)}`;
    window.open(linkWa, '_blank');
  };

  // 3. EXECUÇÃO DO RESET DE SENHA
  const handleExecutarReset = async () => {
    setResetando(true);
    try {
      if (onUpdateAluno) {
        await onUpdateAluno(aluno.id, {
          senha: senhaProvisoriaWhats,
          senha_alterada: false,
        });
      }

      const alunoResetado: Aluno = {
        ...aluno,
        senha: senhaProvisoriaWhats,
        senha_alterada: false,
      };

      await salvarAlunoNaNuvem(alunoResetado);
      setStatusNuvemAlterada(false);
      setConfirmandoReset(false);
      toast.success(`Senha de ${primeiroNome} resetada para '${senhaProvisoriaWhats}' com sucesso!`);
    } catch {
      toast.error('Erro ao resetar senha do aluno.');
    } finally {
      setResetando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-neutral-100 overflow-hidden space-y-6">
        {/* Faixa decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-600" />

        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="size-5" />
        </button>

        {/* Cabeçalho do Aluno com Badge de Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 font-black text-lg shrink-0">
              {aluno.nome.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Compartilhar Acesso
              </h2>
              <p className="text-xs text-neutral-400">
                Atleta: <span className="text-white font-semibold">{aluno.nome}</span> ({aluno.email || aluno.telefone})
              </p>
            </div>
          </div>

          <div>
            {alunoPossuiSenhaPessoal ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Senha Pessoal Ativa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <span className="size-1.5 rounded-full bg-amber-400" />
                Aguardando 1º Acesso
              </span>
            )}
          </div>
        </div>

        {/* CORPO: OS DOIS CARDS DE OPÇÃO */}
        <div className="space-y-4">
          {/* CARD 1: LINK OFICIAL DO APP (RECOMENDADO PARA QUEM JÁ TEM SENHA) */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
            alunoPossuiSenhaPessoal 
              ? 'bg-neutral-950/80 border-emerald-500/40 shadow-lg shadow-emerald-950/20' 
              : 'bg-neutral-950/40 border-neutral-800'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Smartphone className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>1. Link Oficial do App</span>
                    {alunoPossuiSenhaPessoal && (
                      <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md">
                        Recomendado
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Para o aluno entrar no dia a dia com sua senha já cadastrada (sem resetar nada).
                  </p>
                </div>
              </div>
            </div>

            {/* Input e Ações do Link Oficial */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
              <div className="flex-1 flex items-center px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-300 truncate">
                <span className="truncate select-all">{linkOficialApp}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopiarLinkOficial}
                  className={`flex-1 sm:flex-initial h-10 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    copiadoApp
                      ? 'bg-emerald-500 text-neutral-950'
                      : 'bg-neutral-800 hover:bg-neutral-750 text-white active:scale-95'
                  }`}
                  title="Copiar Link do App"
                >
                  {copiadoApp ? <Check className="size-3.5 stroke-[3]" /> : <Copy className="size-3.5" />}
                  <span>{copiadoApp ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleEnviarWhatsAppOficial}
                  className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
                  title="Enviar Link do App pelo WhatsApp"
                >
                  <Send className="size-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: CONVITE DE PRIMEIRO ACESSO / RESET DE SENHA */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
            !alunoPossuiSenhaPessoal
              ? 'bg-neutral-950/80 border-amber-500/40 shadow-lg shadow-amber-950/20'
              : 'bg-neutral-950/40 border-neutral-800'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <KeyRound className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>2. Link de 1º Acesso {alunoPossuiSenhaPessoal ? '(Resetar Senha)' : ''}</span>
                    {!alunoPossuiSenhaPessoal && (
                      <span className="text-[10px] uppercase tracking-wider font-extrabold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md">
                        Recomendado
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {alunoPossuiSenhaPessoal
                      ? 'Gera novo link com senha provisória padrão caso o aluno precise refazer o 1º acesso.'
                      : `Acesso inicial com senha provisória padrão (${senhaProvisoriaWhats}).`}
                  </p>
                </div>
              </div>
            </div>

            {/* Se o aluno já tem senha, exige confirmação explícita antes de resetar */}
            {alunoPossuiSenhaPessoal ? (
              <div className="pt-1">
                {!confirmandoReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmandoReset(true)}
                    className="w-full h-11 rounded-xl bg-neutral-850 hover:bg-amber-500/10 border border-neutral-750 hover:border-amber-500/30 text-amber-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Criar Novo Link de 1º Acesso (Irá Resetar Senha)</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-start gap-2.5 text-xs text-amber-200">
                      <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <strong className="text-amber-400">Atenção:</strong> {primeiroNome} já possui uma senha pessoal cadastrada. Tem certeza que deseja criar um novo link de primeiro acesso? A senha atual será resetada para o padrão (<strong>{senhaProvisoriaWhats}</strong>).
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmandoReset(false)}
                        className="flex-1 h-9 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold text-xs cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleExecutarReset}
                        disabled={resetando}
                        className="flex-1 h-9 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
                      >
                        {resetando ? 'Resetando...' : 'Confirmar e Resetar Senha'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Aluno ainda sem senha pessoal: exibe os botões diretos de primeiro acesso */
              <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
                <div className="flex-1 flex items-center px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono text-neutral-400 truncate">
                  <span className="truncate select-all">{linkConviteInicial}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopiarConvite}
                    className={`flex-1 sm:flex-initial h-10 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      copiadoConvite
                        ? 'bg-emerald-500 text-neutral-950'
                        : 'bg-neutral-800 hover:bg-neutral-750 text-white active:scale-95'
                    }`}
                    title="Copiar Convite"
                  >
                    {copiadoConvite ? <Check className="size-3.5 stroke-[3]" /> : <Copy className="size-3.5" />}
                    <span>{copiadoConvite ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEnviarWhatsAppConvite}
                    className="flex-1 sm:flex-initial h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-neutral-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                    title="Enviar Convite pelo WhatsApp"
                  >
                    <Send className="size-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé informativo */}
        <div className="pt-2 text-center text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-neutral-400" />
          <span>O aluno pode salvar o aplicativo diretamente na tela inicial do celular pelo Safari ou Chrome.</span>
        </div>
      </div>
    </div>
  );
};
