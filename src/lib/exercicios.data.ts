import type { Exercicio, PastaExercicio } from "./types";

/**
 * Pastas de Grupos Musculares Padrão
 * O próprio treinador / administrador abastece com seus exercícios e mídias.
 */
export const PASTAS_PADRAO: PastaExercicio[] = [
  {
    id: "pasta_abdomen",
    nome: "Abdômen & Core",
    descricao: "Pranchas, crunches, infra suspenso e rotações",
    icone: "shield-check",
    cor: "yellow",
    is_default: true,
  },
  {
    id: "pasta_biceps",
    nome: "Bíceps",
    descricao: "Roscas diretas, alternadas, martelo e concentradas",
    icone: "zap",
    cor: "orange",
    is_default: true,
  },
  {
    id: "pasta_dorsal",
    nome: "Dorsal (Costas)",
    descricao: "Puxadas, remadas, barras fixas e levantamentos",
    icone: "layers",
    cor: "blue",
    is_default: true,
  },
  {
    id: "pasta_gluteos",
    nome: "Glúteos",
    descricao: "Elevação pélvica, abdução, glúteo no cabo e passadas",
    icone: "flame",
    cor: "pink",
    is_default: true,
  },
  {
    id: "pasta_mobilidade",
    nome: "Mobilidade & Alongamento",
    descricao: "Exercícios articulares, solturas e flexibilidade",
    icone: "sparkles",
    cor: "indigo",
    is_default: true,
  },
  {
    id: "pasta_ombros",
    nome: "Ombros (Deltoides)",
    descricao: "Desenvolvimentos, elevações laterais e frontais",
    icone: "target",
    cor: "purple",
    is_default: true,
  },
  {
    id: "pasta_panturrilha",
    nome: "Panturrilha",
    descricao: "Gêmeos em pé, sentado e no leg press",
    icone: "move-up",
    cor: "cyan",
    is_default: true,
  },
  {
    id: "pasta_peitoral",
    nome: "Peitoral",
    descricao: "Supinos, crucifixos, flexões e paralelas",
    icone: "dumbbell",
    cor: "amber",
    is_default: true,
  },
  {
    id: "pasta_quadriceps",
    nome: "Pernas & Quadríceps",
    descricao: "Agachamentos, leg press, cadeira extensora e afundos",
    icone: "compass",
    cor: "emerald",
    is_default: true,
  },
  {
    id: "pasta_posterior",
    nome: "Posterior de Coxa",
    descricao: "Mesa flexora, cadeira flexora, stiff e RDL",
    icone: "shield",
    cor: "teal",
    is_default: true,
  },
  {
    id: "pasta_triceps",
    nome: "Tríceps",
    descricao: "Polia, corda, testa, francês e coice",
    icone: "activity",
    cor: "rose",
    is_default: true,
  },
];

/**
 * Biblioteca inicial limpa: sem banco de dados pré-carregado.
 * O professor abastece conforme sua metodologia e mídias próprias.
 */
export const DEFAULT_EXERCICIOS: Exercicio[] = [];
