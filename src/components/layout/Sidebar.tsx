import React, { useState } from 'react';
import { 
  Users, 
  Dumbbell, 
  Library, 
  ClipboardCheck, 
  DollarSign, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AppRole } from '@/lib/types';

type SidebarProps = {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole?: AppRole;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  onLogout?: () => void;
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  userRole = 'professor',
  userName = 'André Gianotti',
  userEmail = 'contato@giano.com.br',
  userAvatar,
  onLogout,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useLanguage();

  const menuItems = [
    { id: 'clientes', label: t('menu.clientes'), icon: Users },
    { id: 'exercicios', label: t('menu.exercicios'), icon: Dumbbell },
    { id: 'treinos', label: t('menu.treinos'), icon: Library },
    { id: 'avaliacoes', label: t('menu.avaliacoes'), icon: ClipboardCheck },
    { id: 'financeiro', label: t('menu.financeiro'), icon: DollarSign },
    { id: 'chat', label: t('menu.chat'), icon: MessageSquare },
  ];

  if (userRole === 'admin') {
    menuItems.push({ id: 'professores', label: t('menu.professores'), icon: ShieldCheck });
  }

  menuItems.push({ id: 'configuracoes', label: t('menu.configuracoes'), icon: Settings });

  return (
    <aside
      className={`relative flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all duration-300 ease-in-out select-none z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
        {!collapsed ? (
          <Logo size="sm" showTagline />
        ) : (
          <div className="mx-auto">
            <Logo size="sm" showTagline={false} />
          </div>
        )}

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-6 size-7 rounded-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 shadow-md transition-all"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left ${
                isActive
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 hover:text-neutral-900 dark:hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`size-5 shrink-0 ${isActive ? 'text-neutral-950 stroke-[2.5]' : ''}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User profile & Logout */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-850 ${collapsed ? 'justify-center' : ''}`}>
          <div className="size-10 rounded-full bg-amber-500 text-neutral-950 font-black flex items-center justify-center text-sm shrink-0 overflow-hidden shadow-sm">
            {userAvatar ? (
              <img src={userAvatar} alt={userName} className="size-full object-cover" />
            ) : (
              userName.slice(0, 2).toUpperCase()
            )}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                {userName}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {userRole === 'admin' ? 'Administrador' : 'Personal Trainer'}
              </p>
            </div>
          )}

          {!collapsed && onLogout && (
            <button
              onClick={onLogout}
              className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
              title={t('menu.sair')}
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
