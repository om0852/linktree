/**
 * Embed Detector Utility
 * Parses media URLs (Spotify, Apple Music, YouTube, TikTok) and extracts embed metadata.
 */

export function detectEmbed(url) {
  if (!url || typeof url !== 'string') {
    return { platform: 'none', embedId: '', isMedia: false };
  }

  const clean = url.trim();

  // 1. Spotify Track / Album / Playlist
  // e.g., https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT
  const spotifyMatch = clean.match(/spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/i);
  if (spotifyMatch) {
    return {
      platform: 'spotify',
      type: spotifyMatch[1].toLowerCase(),
      embedId: spotifyMatch[2],
      isMedia: true,
      embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1].toLowerCase()}/${spotifyMatch[2]}?utm_source=generator&theme=0`
    };
  }

  // 2. YouTube Video or Shorts
  // e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ or /shorts/xxx
  const youtubeMatch = clean.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (youtubeMatch) {
    return {
      platform: 'youtube',
      type: 'video',
      embedId: youtubeMatch[1],
      isMedia: true,
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`
    };
  }

  // 3. TikTok Video
  // e.g. https://www.tiktok.com/@creator/video/7123456789012345678
  const tiktokMatch = clean.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i);
  if (tiktokMatch) {
    return {
      platform: 'tiktok',
      type: 'video',
      embedId: tiktokMatch[1],
      isMedia: true,
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`
    };
  }

  // 4. Apple Music Song / Album
  // e.g. https://music.apple.com/us/album/song-name/123456789?i=987654321
  const appleMusicMatch = clean.match(/music\.apple\.com\/([a-z]{2})\/(album|song|playlist)\/[^/]+\/(\d+)(?:\?i=(\d+))?/i);
  if (appleMusicMatch) {
    const region = appleMusicMatch[1];
    const type = appleMusicMatch[2];
    const id = appleMusicMatch[4] || appleMusicMatch[3];
    return {
      platform: 'apple_music',
      type,
      embedId: id,
      isMedia: true,
      embedUrl: `https://embed.music.apple.com/${region}/${type}/${id}`
    };
  }

  return {
    platform: 'none',
    embedId: '',
    isMedia: false,
    embedUrl: ''
  };
}
