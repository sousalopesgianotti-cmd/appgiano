import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  Mail, 
  Send, 
  Sparkles, 
  X, 
  AlertCircle, 
  Loader2, 
  ExternalLink 
} from 'lucide-react';
import type { Aluno, Treino } from '@/lib/types';
import { gerarLinkConvite, gerarMensagemWhatsAppAluno } from '@/lib/convite';
import { enviarTreinosParaNuvem } from '@/lib/syncService';
import { toast } from 'sonner';

export type StatusEnvioEmail = 'idle' | 'enviando' | 'enviado' | 'simulado' | 'erro';

type ModalConviteAlunoProps = {
  isOpen: boolean;
  onClose: () => void;
  aluno: Aluno | null;
  statusEmail?: StatusEnvioEmail;
  mensagemEmail?: string;
  onReenviarEmail?: () => void;
  treinos?: Treino[];
};

export const ModalConviteAluno: React.FC<ModalConviteAlunoProps> = ({
  isOpen,
  onClose,
  aluno,
  statusEmail = 'idle',
  mensagemEmail,
  onReenviarEmail,
  treinos = [],
}) => {
  const [copiado, setCopiado] = useState(false);

  // Garante sincronização em nuvem do aluno e seus treinos ao abrir o modal de convite
  React.useEffect(() => {
    if (isOpen && aluno) {
      const treinosAtivos = treinos.filter((t) => aluno.treinos_ids?.includes(t.id));
      enviarTreinosParaNuvem(aluno, treinosAtivos);
    }
  }, [isOpen, aluno, treinos]);

  if (!isOpen || !aluno) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://appgiano.com.br';
  const { texto: textoWhatsApp, link: linkAcesso, isRecorrente } = gerarMensagemWhatsAppAluno(origin, aluno, treinos);
  const primeiroNome = aluno.nome.split(' ')[0] || aluno.nome;

  const handleCopiarLink = async () => {
    try {
      await navigator.clipboard.writeText(linkAcesso);
      setCopiado(true);
      toast.success(isRecorrente ? `Link oficial do App copiado!` : `Link exclusivo de ${primeiroNome} copiado!`);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      toast.error('Erro ao copiar link para a área de transferência.');
    }
  };

  const handleCompartilharWhatsApp = () => {
    const telefoneLimpo = aluno.telefone.replace(/\D/g, '');
    const linkWa = telefoneLimpo
      ? `https://api.whatsapp.com/send?phone=55${telefoneLimpo}&text=${encodeURIComponent(textoWhatsApp)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(textoWhatsApp)}`;

    window.open(linkWa, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-2xl text-neutral-100 overflow-hidden">
        {/* Faixa decorativa superior em degradê âmbar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Fechar"
        >
          <X className="size-5" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-5 mt-1">
          <div className="size-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {isRecorrente ? 'Link de Acesso ao App' : 'Aluno Cadastrado com Sucesso!'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400">
              {isRecorrente ? (
                <>Link direto para <strong className="text-amber-400">{aluno.nome}</strong> acessar seus treinos.</>
              ) : (
                <>O perfil de <strong className="text-amber-400">{aluno.nome}</strong> está pronto.</>
              )}
            </p>
          </div>
        </div>

        {/* Card do Link */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              {isRecorrente ? 'Link Oficial do App (Área do Atleta)' : 'Link de Convite e Acesso ao Treino'}
            </label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <input
                type="text"
                readOnly
                value={linkAcesso}
                className="w-full bg-transparent text-xs text-neutral-300 font-mono outline-none px-2 select-all"
              />
              <button
                type="button"
                onClick={handleCopiarLink}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  copiado
                    ? 'bg-emerald-500 text-neutral-950'
                    : 'bg-amber-500 hover:bg-amber-450 text-neutral-950 active:scale-95'
                }`}
              >
                {copiado ? (
                  <>
                    <Check className="size-3.5 stroke-[3]" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Atalho WhatsApp */}
          <button
            type="button"
            onClick={handleCompartilharWhatsApp}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <Send className="size-4" />
            <span>{isRecorrente ? 'Enviar Link do App pelo WhatsApp' : 'Enviar Convite pelo WhatsApp'}</span>
          </button>

          {/* Card de Status do Envio por E-mail */}
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-400 flex items-center gap-1.5">
                <Mail className="size-3.5 text-neutral-500" />
                Envio por E-mail:
              </span>
              <span className="text-neutral-300 font-mono text-[11px] truncate max-w-[220px]">
                {aluno.email}
              </span>
            </div>

            {statusEmail === 'enviando' && (
              <div className="flex items-center gap-2 text-amber-400 pt-1">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Disparando e-mail automático via Resend...</span>
              </div>
            )}

            {statusEmail === 'enviado' && (
              <div className="flex items-center gap-2 text-emerald-400 pt-1 font-medium">
                <Check className="size-3.5 stroke-[2.5]" />
                <span>E-mail de convite enviado com sucesso!</span>
              </div>
            )}

            {statusEmail === 'simulado' && (
              <div className="flex items-center gap-2 text-amber-300/90 pt-1">
                <Sparkles className="size-3.5 text-amber-400" />
                <span>E-mail registrado (modo de desenvolvimento local).</span>
              </div>
            )}

            {statusEmail === 'erro' && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{mensagemEmail || 'Falha no disparo do e-mail.'}</span>
                </div>
                {onReenviarEmail && (
                  <button
                    type="button"
                    onClick={onReenviarEmail}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Tentar enviar e-mail novamente
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
