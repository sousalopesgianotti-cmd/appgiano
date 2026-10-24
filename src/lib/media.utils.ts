/**
 * Utilitários para detecção, parsing de mídia e geração de embeds e miniaturas
 * para a Biblioteca de Exercícios (YouTube, Google Drive, Vimeo, MP4, Imagens, GIFs e Documentos).
 */

export interface MediaParsedInfo {
  type: 'youtube' | 'drive' | 'vimeo' | 'direct_video' | 'image' | 'gif' | 'document' | 'none';
  embedUrl: string | null;
  thumbnailUrl: string | null;
  rawUrl: string;
  isVideo: boolean;
  isImage: boolean;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // youtube.com/watch?v=ID ou shorts/ ou youtu.be/
  const watchMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/i);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }

  return null;
}

export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // drive.google.com/file/d/ID/view ou drive.google.com/open?id=ID
  const driveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/([\w-]+)|open\?id=([\w-]+))/i);
  if (driveMatch) {
    return driveMatch[1] || driveMatch[2] || null;
  }

  return null;
}

export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return vimeoMatch[1];
  }
  return null;
}

export function parseMedia(
  videoUrl?: string | null,
  midiaUrl?: string | null,
  hintTipo?: 'video' | 'imagem' | 'documento' | string,
  arquivoNome?: string
): MediaParsedInfo {
  const primaryUrl = (videoUrl || '').trim();
  const fallbackMidia = (midiaUrl || '').trim();
  const fileName = (arquivoNome || '').toLowerCase();

  // Se o tipo foi explicitamente marcado como documento
  if (hintTipo === 'documento' || /\.(pdf|xls|xlsx|doc|docx)$/i.test(fileName || primaryUrl || fallbackMidia)) {
    const targetUrl = fallbackMidia || primaryUrl;
    return {
      type: 'document',
      embedUrl: targetUrl,
      thumbnailUrl: null,
      rawUrl: targetUrl,
      isVideo: false,
      isImage: false,
    };
  }

  // 1. YouTube
  const ytId = extractYouTubeId(primaryUrl);
  if (ytId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      rawUrl: primaryUrl,
      isVideo: true,
      isImage: false,
    };
  }

  // 2. Google Drive
  const driveId = extractGoogleDriveId(primaryUrl);
  if (driveId) {
    return {
      type: 'drive',
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      thumbnailUrl: fallbackMidia || null,
      rawUrl: primaryUrl,
      isVideo: true,
      isImage: false,
    };
  }

  // 3. Vimeo
  const vimeoId = extractVimeoId(primaryUrl);
  if (vimeoId) {
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=0`,
      thumbnailUrl: fallbackMidia || null,
      rawUrl: primaryUrl,
      isVideo: true,
      isImage: false,
    };
  }

  // 4. Verificação de Imagem Estática (Foto)
  const isImageFile = 
    hintTipo === 'imagem' ||
    /\.(jpe?g|png|webp|bmp|svg)(\?.*)?$/i.test(fileName) ||
    /\.(jpe?g|png|webp|bmp|svg)(\?.*)?$/i.test(primaryUrl) ||
    /\.(jpe?g|png|webp|bmp|svg)(\?.*)?$/i.test(fallbackMidia);

  // 5. Verificação de GIF Animado
  const isGifFile = 
    /\.gif(\?.*)?$/i.test(fileName) ||
    /\.gif(\?.*)?$/i.test(primaryUrl) ||
    /\.gif(\?.*)?$/i.test(fallbackMidia);

  if (isGifFile) {
    const targetUrl = primaryUrl || fallbackMidia;
    return {
      type: 'gif',
      embedUrl: targetUrl,
      thumbnailUrl: targetUrl,
      rawUrl: targetUrl,
      isVideo: false,
      isImage: true,
    };
  }

  if (isImageFile) {
    const targetUrl = fallbackMidia || primaryUrl;
    return {
      type: 'image',
      embedUrl: targetUrl,
      thumbnailUrl: targetUrl,
      rawUrl: targetUrl,
      isVideo: false,
      isImage: true,
    };
  }

  // 6. Arquivo de Vídeo Direto (MP4, WebM, OGG, MOV ou blob de vídeo)
  const isVideoFile =
    hintTipo === 'video' ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(fileName) ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(primaryUrl) ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(fallbackMidia);

  if (isVideoFile || (primaryUrl.startsWith('blob:') && hintTipo !== 'imagem')) {
    const targetUrl = primaryUrl || fallbackMidia;
    return {
      type: 'direct_video',
      embedUrl: targetUrl,
      thumbnailUrl: fallbackMidia || null,
      rawUrl: targetUrl,
      isVideo: true,
      isImage: false,
    };
  }

  // 7. Se tiver apenas foto/mídia de apoio
  if (fallbackMidia) {
    return {
      type: 'image',
      embedUrl: fallbackMidia,
      thumbnailUrl: fallbackMidia,
      rawUrl: fallbackMidia,
      isVideo: false,
      isImage: true,
    };
  }

  // 8. Nenhum
  return {
    type: 'none',
    embedUrl: null,
    thumbnailUrl: null,
    rawUrl: primaryUrl || fallbackMidia || '',
    isVideo: false,
    isImage: false,
  };
}
