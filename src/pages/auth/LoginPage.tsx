import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Sparkles, User, Dumbbell, Smartphone, Sun, Moon, Globe, Clock, Check } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: (credentials: { email: string; role: 'professor' | 'aluno'; nome: string; id: string }) => void;
}

interface SlideInspirador {
  id: string;
  frase: string;
  foto: string;
  alt: string;
}

// Slides inspiradores sincronizados: cada frase tem uma imagem realista correspondente
// URLs compactas e ultra leves com WebP/AVIF (w=1000, q=75) para performance máxima
const SLIDES_INSPIRADORES: SlideInspirador[] = [
  {
    id: 'slide-1',
    frase: 'Progresso também é aprender a respeitar seus limites.',
    foto: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1000&auto=format&fit=crop&q=75',
    alt: 'Estúdio de Musculação Boutique com Máquina Smith e Banco',
  },
  {
    id: 'slide-2',
    frase: 'Cada treino que você prescreve constrói uma história de superação.',
    foto: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1000&auto=format&fit=crop&q=75',
    alt: 'Halteres e Equipamentos em Aço Escovado com Iluminação Aconchegante',
  },
  {
    id: 'slide-3',
    frase: 'Liberte Seu Potencial. Transforme Vidas. Bem-vindo à excelência.',
    foto: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1000&auto=format&fit=crop&q=75',
    alt: 'Área de Treinamento Funcional e Polias de Alta Performance',
  },
  {
    id: 'slide-4',
    frase: 'Disciplina é o que transforma metas em resultados concretos.',
    foto: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1000&auto=format&fit=crop&q=75',
    alt: 'Espaço Premium com Anilhas e Barras Olímpicas',
  },
  {
    id: 'slide-5',
    frase: 'Consistência vence a intensidade. Todos os dias.',
    foto: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1000&auto=format&fit=crop&q=75',
    alt: 'Estúdio Moderno de Alta Intensidade e Condicionamento',
  },
  {
    id: 'slide-6',
    frase: 'A alta performance é consequência de um foco diário inegociável.',
    foto: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1000&auto=format&fit=crop&q=75',
    alt: 'Centro de Treinamento de Elite com Vista Panorâmica',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [slideAtivo, setSlideAtivo] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [tempoMenuOpen, setTempoMenuOpen] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Tempo de descanso / permanência de cada foto e frase (salvo nas configurações)
  const [tempoDescanso, setTempoDescanso] = useState<number>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('giano_login_slide_seconds');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val)) return val;
      }
    }
    return 7; // Padrão: 7s
  });

  // Pré-carregamento assíncrono leve no cache do navegador
  useEffect(() => {
    SLIDES_INSPIRADORES.forEach((slide) => {
      const img = new Image();
      img.src = slide.foto;
    });
  }, []);

  // Transição com tempo dinâmico (pausa em hover ou se configurado como 0)
  useEffect(() => {
    if (isHovered || tempoDescanso <= 0) return;
    const timer = setInterval(() => {
      setSlideAtivo((prev) => (prev + 1) % SLIDES_INSPIRADORES.length);
    }, tempoDescanso * 1000);
    return () => clearInterval(timer);
  }, [isHovered, tempoDescanso]);

  const handleSalvarTempo = (segundos: number) => {
    setTempoDescanso(segundos);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('giano_login_slide_seconds', segundos.toString());
    }
    setTempoMenuOpen(false);
    toast.success(`Tempo de transição da tela definido para ${segundos === 0 ? 'Manual' : segundos + 's'}!`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim()) {
      toast.error('Informe seu usuário ou e-mail de acesso.');
      return;
    }
    if (!senha.trim()) {
      toast.error('Informe sua senha.');
      return;
    }

    setCarregando(true);

    setTimeout(() => {
      setCarregando(false);
      const emailLimpo = usuario.trim().toLowerCase();

      // Identificação inteligente de perfil
      if (emailLimpo.includes('murillo') || emailLimpo.includes('aluno')) {
        toast.success('Bem-vindo, Murillo! Acessando app do aluno...');
        onLogin({
          id: '7132f4da-920a-4bb0-9db2-ab6af05c5d7a',
          nome: 'Murillo Moreira',
          email: 'murillofaixapreta@gmail.com',
          role: 'aluno',
        });
      } else {
        toast.success('Bem-vindo, André! Acessando painel do Personal...');
        onLogin({
          id: '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
          nome: 'André Gianotti',
          email: emailLimpo.includes('@') ? emailLimpo : 'andre@giano.com.br',
          role: 'professor',
        });
      }
    }, 600);
  };

  const loginComoPersonalDemo = () => {
    setUsuario('sousalopesgianotti@gmail.com');
    setSenha('••••••••••••');
    toast.success('Entrando como Personal Trainer (André Gianotti)...');
    setTimeout(() => {
      onLogin({
        id: '8e90e5b0-ac3a-4812-ad25-6a4ff6c40b8d',
        nome: 'André Gianotti',
        email: 'sousalopesgianotti@gmail.com',
        role: 'professor',
      });
    }, 400);
  };

  const loginComoAlunoDemo = () => {
    setUsuario('murillofaixapreta@gmail.com');
    setSenha('6692');
    toast.success('Entrando como Aluno (Murillo Moreira)...');
    setTimeout(() => {
      onLogin({
        id: '7132f4da-920a-4bb0-9db2-ab6af05c5d7a',
        nome: 'Murillo Moreira',
        email: 'murillofaixapreta@gmail.com',
        role: 'aluno',
      });
    }, 400);
  };

  const idiomas: { code: Language; label: string; flag: string }[] = [
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  const opcoesTempo = [
    { seg: 4, label: '4s (Rápido)' },
    { seg: 7, label: '7s (Padrão)' },
    { seg: 10, label: '10s (Confortável)' },
    { seg: 15, label: '15s (Calmo)' },
    { seg: 0, label: 'Pausado (Manual)' },
  ];

  return (
    // Altura travada em 100vh com overflow-hidden para eliminar barra de rolagem
    <div className="h-screen max-h-screen w-full bg-neutral-100 dark:bg-neutral-950 flex flex-col justify-center items-center p-2 sm:p-4 md:p-6 font-sans transition-colors duration-200 overflow-hidden select-none">
      
      {/* Controles Flutuantes no Canto Superior Direito */}
      <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 sm:gap-2">
        {/* Controle Rápido do Tempo de Descanso / Transição */}
        <div className="relative">
          <button
            onClick={() => {
              setTempoMenuOpen(!tempoMenuOpen);
              setLangMenuOpen(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 shadow-sm backdrop-blur transition-all ${
              tempoMenuOpen ? 'ring-2 ring-amber-500/40 border-amber-500' : ''
            }`}
            title="Ajustar tempo de exibição das frases"
          >
            <Clock className="size-3.5 text-amber-500" />
            <span className="hidden sm:inline text-[11px]">Descanso:</span>
            <span className="text-[11px] font-black">{tempoDescanso === 0 ? 'Manual' : `${tempoDescanso}s`}</span>
          </button>

          {tempoMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-400 border-b border-neutral-100 dark:border-neutral-800">
                Tempo por frase:
              </div>
              {opcoesTempo.map((item) => (
                <button
                  key={item.seg}
                  onClick={() => handleSalvarTempo(item.seg)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    tempoDescanso === item.seg
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>{item.label}</span>
                  {tempoDescanso === item.seg && <Check className="size-3.5 text-amber-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Seletor de Idioma */}
        <div className="relative">
          <button
            onClick={() => {
              setLangMenuOpen(!langMenuOpen);
              setTempoMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 shadow-sm backdrop-blur transition-all"
            title="Alterar Idioma"
          >
            <Globe className="size-3.5 text-amber-500" />
            <span className="uppercase text-[11px]">{language}</span>
          </button>

          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
              {idiomas.map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    setLanguage(item.code);
                    setLangMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
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
          className="size-8 sm:size-9 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shadow-sm backdrop-blur transition-all"
          title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        >
          {theme === 'dark' ? (
            <Sun className="size-4 text-amber-400" />
          ) : (
            <Moon className="size-4 text-neutral-700" />
          )}
        </button>
      </div>

      {/* Card Principal: Proporção e Altura Ajustadas para 100vh Sem Rolagem */}
      <div className="w-full max-w-5xl h-full max-h-[min(590px,92vh)] bg-white dark:bg-neutral-900/95 border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* ======================================================== */}
        {/* COLUNA ESQUERDA: FOTOGRAFIA REALISTA & FRASE SINCRONIZADA */}
        {/* ======================================================== */}
        <div 
          className="hidden lg:flex lg:col-span-6 relative p-2.5 sm:p-3 flex-col h-full min-h-0"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-neutral-950 flex flex-col justify-end shadow-inner">
            {/* Camadas de Imagens Realistas com Crossfade Suave via GPU (Zero Flicker) */}
            {SLIDES_INSPIRADORES.map((slide, idx) => {
              const isCurrent = idx === slideAtivo;
              return (
                <img
                  key={slide.id}
                  src={slide.foto}
                  alt={slide.alt}
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className={`absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.05] transition-all duration-1000 ease-in-out ${
                    isCurrent
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-105 pointer-events-none'
                  }`}
                />
              );
            })}

            {/* Gradiente Escuro Suave para Contraste e Legibilidade do Texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Conteúdo da Foto: Marca GIANO + Frase Inspiradora Sincronizada */}
            <div className="relative z-10 p-5 sm:p-7 space-y-2 text-center">
              {/* Marca GIANO na base da imagem */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-wider uppercase text-white drop-shadow-md">
                  GIANO
                </span>
              </div>

              {/* Frase Inspiradora em Tipografia Serifada / Itálica Elegante */}
              <div className="min-h-[52px] sm:min-h-[60px] flex items-center justify-center px-2">
                <p 
                  key={slideAtivo}
                  className="font-serif italic text-white/95 text-base sm:text-lg font-medium tracking-wide leading-snug drop-shadow-lg transition-all duration-700 animate-in fade-in slide-in-from-bottom-2"
                >
                  "{SLIDES_INSPIRADORES[slideAtivo].frase}"
                </p>
              </div>

              {/* Indicadores sutis de rotação de slides interativos */}
              <div className="flex justify-center items-center gap-1.5 pt-1">
                {SLIDES_INSPIRADORES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSlideAtivo(idx)}
                    className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                      idx === slideAtivo
                        ? 'w-6 bg-amber-400 shadow-sm shadow-amber-400/50'
                        : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    title={`Ver imagem e frase ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* COLUNA DIREITA: FORMULÁRIO DE LOGIN LIMPO & CONVERSÃO    */}
        {/* ======================================================== */}
        <div className="col-span-1 lg:col-span-6 p-4 sm:p-6 lg:p-8 flex flex-col justify-between h-full min-h-0 overflow-hidden">
          <div className="w-full max-w-sm mx-auto space-y-4 my-auto">
            
            {/* Logo da Marca */}
            <div>
              <Logo size="sm" showTagline />
            </div>

            {/* Título de Entrada */}
            <div className="space-y-0.5">
              <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight">
                Entrar
              </h1>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Informe suas credenciais para gerenciar treinos ou acessar seu app
              </p>
            </div>

            {/* Formulário de Autenticação */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Campo: Usuário */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  Usuário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <User className="size-3.5" />
                  </div>
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="sousalopesgianotti@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Campo: Senha */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Lock className="size-3.5" />
                  </div>
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900 text-xs font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all shadow-sm tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                    title={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {mostrarSenha ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão Entrar Dourado/Âmbar */}
              <button
                type="submit"
                disabled={carregando}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-450 active:scale-[0.99] text-neutral-950 font-black text-xs sm:text-sm tracking-wide shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-1"
              >
                {carregando ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    Validando acesso...
                  </span>
                ) : (
                  <span>Entrar</span>
                )}
              </button>

              {/* Esqueci minha senha */}
              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => toast.info('Link de recuperação enviado para o seu e-mail cadastrado.')}
                  className="text-[11px] text-neutral-500 dark:text-neutral-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>

            {/* Atalhos Rápidos de Teste (1-Clique) */}
            <div className="pt-2.5 border-t border-neutral-200 dark:border-neutral-800 space-y-1.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="size-3 text-amber-500" />
                Acesso rápido para avaliação:
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={loginComoPersonalDemo}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 bg-neutral-50 dark:bg-neutral-850 hover:bg-amber-500/5 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 transition-all text-left group"
                >
                  <Dumbbell className="size-3 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span>Personal (André)</span>
                </button>

                <button
                  type="button"
                  onClick={loginComoAlunoDemo}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-amber-500/50 bg-neutral-50 dark:bg-neutral-850 hover:bg-amber-500/5 text-[11px] font-bold text-neutral-700 dark:text-neutral-300 transition-all text-left group"
                >
                  <Smartphone className="size-3 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span>Aluno (Murillo)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Rodapé Legal */}
          <div className="text-center pt-2 text-[9px] sm:text-[10px] text-neutral-400 dark:text-neutral-500 leading-tight">
            Ao clicar em continuar, você concorda com nossos{' '}
            <span className="underline hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer">
              Termos de Serviço
            </span>{' '}
            e{' '}
            <span className="underline hover:text-neutral-600 dark:hover:text-neutral-300 cursor-pointer">
              Política de Privacidade
            </span>
            .
          </div>
        </div>

      </div>
    </div>
  );
};
