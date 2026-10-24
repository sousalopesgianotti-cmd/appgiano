/**
 * Utilitários para detecção, parsing de mídia e geração de embeds e miniaturas
 * para a Biblioteca de Exercícios (YouTube, Google Drive, Vimeo, MP4 e GIFs).
 */

export interface MediaParsedInfo {
  type: 'youtube' | 'drive' | 'vimeo' | 'direct_video' | 'gif_image' | 'none';
  embedUrl: string | null;
  thumbnailUrl: string | null;
  rawUrl: string;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // youtube.com/watch?v=ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/i);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }

  return null;
}

export function extractGoogleDriveId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // drive.google.com/file/d/ID/view or drive.google.com/open?id=ID
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

export function parseMedia(videoUrl?: string | null, midiaUrl?: string | null): MediaParsedInfo {
  const primaryUrl = (videoUrl || '').trim();
  const fallbackMidia = (midiaUrl || '').trim();

  // 1. YouTube
  const ytId = extractYouTubeId(primaryUrl);
  if (ytId) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      rawUrl: primaryUrl,
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
    };
  }

  // 4. Arquivo de Vídeo Direto (MP4, WebM, OGG ou blob local)
  if (
    primaryUrl.startsWith('blob:') ||
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(primaryUrl)
  ) {
    return {
      type: 'direct_video',
      embedUrl: primaryUrl,
      thumbnailUrl: fallbackMidia || null,
      rawUrl: primaryUrl,
    };
  }

  // 5. GIF animado ou imagem direta no campo de vídeo
  if (/\.(gif|webp|png|jpe?g)(\?.*)?$/i.test(primaryUrl)) {
    return {
      type: 'gif_image',
      embedUrl: primaryUrl,
      thumbnailUrl: primaryUrl,
      rawUrl: primaryUrl,
    };
  }

  // 6. Se tiver foto/GIF de apoio em midiaUrl
  if (fallbackMidia) {
    return {
      type: 'gif_image',
      embedUrl: fallbackMidia,
      thumbnailUrl: fallbackMidia,
      rawUrl: fallbackMidia,
    };
  }

  // 7. Nenhum
  return {
    type: 'none',
    embedUrl: null,
    thumbnailUrl: null,
    rawUrl: primaryUrl || fallbackMidia || '',
  };
}
