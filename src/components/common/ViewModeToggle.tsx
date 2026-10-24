import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

interface ViewModeToggleProps {
  mode: 'grade' | 'lista';
  onChange: (mode: 'grade' | 'lista') => void;
  className?: string;
}

/**
 * Seletor de Modo Card / Modo Lista fiel à referência visual da Nexur:
 * Pílula arredondada com botões táteis e destaque em âmbar/dourado no ativo.
 */
export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({ mode, onChange, className = '' }) => {
  return (
    <div
      className={`inline-flex items-center p-1 rounded-2xl bg-neutral-900/90 dark:bg-neutral-900 border border-neutral-800 shadow-inner ${className}`}
      role="group"
      aria-label="Alternar modo de visualização"
    >
      {/* Botão Modo Lista */}
      <button
        type="button"
        onClick={() => onChange('lista')}
        className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
          mode === 'lista'
            ? 'bg-neutral-800 text-amber-500 shadow-sm'
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
        title="Visualização em Lista"
      >
        <List className="size-4 stroke-[2.5]" />
      </button>

      {/* Botão Modo Card / Grade */}
      <button
        type="button"
        onClick={() => onChange('grade')}
        className={`p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
          mode === 'grade'
            ? 'bg-neutral-800 text-amber-500 shadow-sm'
            : 'text-neutral-500 hover:text-neutral-300'
        }`}
        title="Visualização em Cards"
      >
        <LayoutGrid className="size-4 stroke-[2.5]" />
      </button>
    </div>
  );
};
