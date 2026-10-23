import React, { useState, useEffect } from 'react';
import { Settings, Clock, Sparkles, Image as ImageIcon, Shield, Bell, Moon, Sun, Globe, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export const ConfiguracoesPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Tempo de transição da tela de login (salvo no localStorage)
  const [tempoSlide, setTempoSlide] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('giano_login_slide_seconds');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val > 0) return val;
      }
    }
    return 7; // Padrão: 7 segundos
  });

  const [salvando, setSalvando] = useState(false);

  const opcoesTempo = [
    { segundos: 4, label: '4 segundos (Mais rápido)' },
    { segundos: 7, label: '7 segundos (Padrão balanceado)' },
    { segundos: 10, label: '10 segundos (Leitura confortável)' },
    { segundos: 15, label: '15 segundos (Calmo e contemplativo)' },
    { segundos: 20, label: '20 segundos (Prolongado)' },
    { segundos: 0, label: 'Pausar (Transição apenas manual nos pontos)' },
  ];

  const handleSalvarTempo = (segundos: number) => {
    setTempoSlide(segundos);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_login_slide_seconds', segundos.toString());
    }
    toast.success(`Tempo de exibição da tela de login ajustado para ${segundos === 0 ? 'Manual' : segundos + 's'}!`);
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Título da Página */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Settings className="size-6 text-amber-500" />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
            Configurações da Plataforma
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          Gerencie o comportamento visual, tempos de transição da tela de login e preferências do sistema.
        </p>
      </div>

      {/* Seção 1: Configuração do Tempo de Descanso / Transição da Tela de Login */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800/60 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-amber-500" />
              <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
                Tempo de Descanso / Transição da Tela de Login
              </h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
              Defina o tempo de permanência de cada foto e frase inspiradora antes de transicionar suavemente para o próximo slide.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 font-bold text-xs shrink-0">
            {tempoSlide === 0 ? 'Manual' : `${tempoSlide}s ativo`}
          </span>
        </div>

        {/* Grade de Seleção de Tempo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {opcoesTempo.map((opcao) => {
            const isSelected = tempoSlide === opcao.segundos;
            return (
              <button
                key={opcao.segundos}
                onClick={() => handleSalvarTempo(opcao.segundos)}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-sm ring-1 ring-amber-500'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold">
                    {opcao.segundos === 0 ? 'Sem Rotação Automática' : `${opcao.segundos} Segundos`}
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {opcao.label.split('(')[1]?.replace(')', '') || 'Configuração'}
                  </div>
                </div>
                {isSelected && <Check className="size-4 text-amber-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          <Sparkles className="size-4 text-amber-500 shrink-0" />
          <p className="text-xs text-neutral-600 dark:text-neutral-300">
            As imagens continuarão sendo pré-carregadas pelo navegador para garantir transições suaves e sem consumo excessivo de dados.
          </p>
        </div>
      </div>

      {/* Seção 2: Preferências Visuais e Idioma */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm space-y-6">
        <div className="space-y-1 border-b border-neutral-100 dark:border-neutral-800/60 pb-5">
          <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
            Aparência e Idioma
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Ajuste o tema visual padrão e o idioma principal da interface.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Seletor de Tema */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Tema da Interface
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  theme === 'light'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                <Sun className="size-4" />
                <span>Modo Claro</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                  theme === 'dark'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300'
                }`}
              >
                <Moon className="size-4" />
                <span>Modo Escuro</span>
              </button>
            </div>
          </div>

          {/* Seletor de Idioma */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Idioma do Sistema
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'pt', label: 'Português', flag: '🇧🇷' },
                { code: 'en', label: 'English', flag: '🇺🇸' },
                { code: 'es', label: 'Español', flag: '🇪🇸' },
              ].map((item) => (
                <button
                  key={item.code}
                  onClick={() => setLanguage(item.code as Language)}
                  className={`flex items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${
                    language === item.code
                      ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  <span>{item.flag}</span>
                  <span>{item.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
