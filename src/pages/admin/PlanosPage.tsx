import React from 'react';
import { Layers, CheckCircle2, Crown, Sparkles, Users, ArrowRight } from 'lucide-react';
import type { PlanoNome } from '@/lib/types';

interface PlanoCardProps {
  titulo: PlanoNome;
  limite: string;
  preco: number;
  descricao: string;
  destaque?: boolean;
  beneficios: string[];
}

const PLANOS_DETALHADOS: PlanoCardProps[] = [
  {
    titulo: 'Starter 10',
    limite: 'Até 10 alunos',
    preco: 49,
    descricao: 'Ideal para personais que estão iniciando a consultoria ou atuam em nicho específico.',
    beneficios: [
      'Até 10 alunos ativos no App Mobile',
      'Biblioteca completa com 46 exercícios e vídeos',
      'Cronômetro de descanso integrado',
      'Fichas de treino e séries ilimitadas',
      'Suporte direto por WhatsApp',
    ],
  },
  {
    titulo: 'Pro 30',
    limite: 'Até 30 alunos',
    preco: 89,
    destaque: true,
    descricao: 'O pacote mais popular entre personal trainers autônomos e consultorias online consolidadas.',
    beneficios: [
      'Até 30 alunos ativos no App Mobile',
      'Biblioteca completa com 46 exercícios e vídeos',
      'Cronômetro de descanso integrado',
      'Gestão de mensalidades dos alunos',
      'Histórico completo de execuções de treino',
      'Suporte prioritário',
    ],
  },
  {
    titulo: 'Elite 60',
    limite: 'Até 60 alunos',
    preco: 149,
    descricao: 'Perfeito para treinadores com alta demanda de alunos e assessorias esportivas em expansão.',
    beneficios: [
      'Até 60 alunos ativos no App Mobile',
      'Todos os recursos do plano Pro',
      'Suporte a múltiplos grupos de treino',
      'Relatórios avançados de adesão dos alunos',
      'Canal VIP de suporte',
    ],
  },
  {
    titulo: 'Studio Ilimitado',
    limite: 'Alunos Ilimitados',
    preco: 249,
    descricao: 'Projetado para estúdios boutique, boxes e equipes de treinamento de alta performance.',
    beneficios: [
      'Alunos 100% ilimitados',
      'Todos os recursos de alta performance',
      'Acesso a novos módulos em primeira mão',
      'Gerente de conta dedicado',
    ],
  },
];

export const PlanosPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Layers className="size-6 text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
            Planos & Pacotes de Cotas
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          Tabela oficial de pacotes para venda de acessos aos professores e consultorias esportivas.
        </p>
      </div>

      {/* Grade de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANOS_DETALHADOS.map((plano) => (
          <div
            key={plano.titulo}
            className={`relative rounded-3xl p-6 flex flex-col justify-between border transition-all ${
              plano.destaque
                ? 'border-amber-500 bg-amber-500/[0.04] dark:bg-amber-500/[0.08] shadow-xl shadow-amber-500/10 ring-2 ring-amber-500'
                : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700'
            }`}
          >
            {plano.destaque && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                Mais Vendido
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-black text-neutral-900 dark:text-white">
                  {plano.titulo}
                </h3>
                <div className="text-xs font-bold text-amber-500 mt-0.5">
                  {plano.limite}
                </div>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-neutral-400">R$</span>
                <span className="text-3xl font-black text-neutral-900 dark:text-white">
                  {plano.preco}
                </span>
                <span className="text-xs text-neutral-400 font-semibold">/mês</span>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {plano.descricao}
              </p>

              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  O que está incluso:
                </div>
                {plano.beneficios.map((beneficio, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300">
                    <CheckCircle2 className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{beneficio}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
