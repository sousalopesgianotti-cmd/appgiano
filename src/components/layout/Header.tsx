import React, { useState, useEffect } from 'react';
import { Sun, Moon, Globe, Bell, Sparkles, Smartphone } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, type Language } from '@/contexts/LanguageContext';

interface HeaderProps {
  onOpenAppAluno?: () => void;
}

const FRASES_MOTIVACIONAIS = [
  "Liberte Seu Potencial. Transforme Vidas. Bem-vindo a Outro Dia de Excelência!",
  "Cada treino que você prescreve constrói uma história de superação.",
  "Disciplina é o que transforma metas em resultados concretos.",
  "Grandes atletas nascem de grandes orientações.",
  "Consistência vence a intensidade. Todos os dias.",
  "O progresso é silencioso, mas a consistência o torna inevitável.",
  "Você não treina apenas corpos, você constrói autoconfiança.",
  "Foco no processo. A alta performance é uma consequência diária.",
];

export const Header: React.FC<HeaderProps> = ({ onOpenAppAluno }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [fraseIndex, setFraseIndex] = useState(0);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  useEffect(() => {
    // Escolhe uma frase aleatória no carregamento
    setFraseIndex(Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length));
  }, []);

  const idiomas: { code: Language; label: string; flag: string }[] = [
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  return (
    <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Frase motivacional com brilho */}
      <div className="flex items-center gap-2.5 max-w-xl truncate">
        <Sparkles className="size-4 text-amber-500 shrink-0 animate-pulse" />
        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 truncate tracking-wide">
          {FRASES_MOTIVACIONAIS[fraseIndex]}
        </span>
      </div>

      {/* Controles da Direita */}
      <div className="flex items-center gap-2.5">
        {onOpenAppAluno && (
          <button
            onClick={onOpenAppAluno}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 text-xs font-bold transition-all shadow-sm active:scale-95"
            title="Visualizar App Mobile do Aluno"
          >
            <Smartphone className="size-3.5" />
            <span className="hidden sm:inline">Ver App Aluno</span>
          </button>
        )}

        {/* Seletor de Idioma */}
        <div className="relative">
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 transition-colors"
            title="Alterar Idioma"
          >
            <Globe className="size-3.5 text-amber-500" />
            <span className="uppercase">{language}</span>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              {idiomas.map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    setLanguage(item.code);
                    setLangMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    language === item.code
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>{item.flag}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alternador de Tema Claro/Escuro */}
        <button
          onClick={toggleTheme}
          className="size-9 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-all shadow-sm"
          title={theme === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
          {theme === 'dark' ? (
            <Sun className="size-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="size-4 text-neutral-700 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Notificações */}
        <button
          className="relative size-9 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-colors"
          title="Notificações"
        >
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-amber-500" />
        </button>
      </div>
    </header>
  );
};
