import React from 'react';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false, className = '' }) => {
  const sizeMap = {
    sm: { icon: 28, text: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 36, text: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 48, text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 64, text: 'text-4xl', sub: 'text-sm' },
  };

  const current = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Icon Mark */}
      <div 
        style={{ width: current.icon, height: current.icon }}
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-lg shadow-amber-500/20 text-neutral-950 font-black"
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="size-3/5 text-neutral-950"
        >
          <path d="M6 5v14" />
          <path d="M18 5v14" />
          <path d="M6 12h12" />
          <path d="M3 8v8" />
          <path d="M21 8v8" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <span className={`font-black tracking-wider uppercase text-neutral-900 dark:text-white ${current.text} leading-none`}>
          GIANO
        </span>
        {showTagline && (
          <span className={`font-bold tracking-widest uppercase text-amber-500 ${current.sub} mt-0.5`}>
            PERFORMANCE SYSTEM
          </span>
        )}
      </div>
    </div>
  );
};
