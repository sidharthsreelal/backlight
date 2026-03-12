export interface LikedSong {
    videoId: string;
    title: string;
    artist: string;
    thumbnail?: string;
}

const LIKED_KEY = 'backlight_liked_songs';

export function getLikedSongs(): LikedSong[] {
    try {
        return JSON.parse(localStorage.getItem(LIKED_KEY) || '[]');
    } catch {
        return [];
    }
}

function saveLikedSongs(songs: LikedSong[]): void {
    localStorage.setItem(LIKED_KEY, JSON.stringify(songs));
}

export function addLikedSong(song: LikedSong): void {
    const songs = getLikedSongs();
    if (songs.some(s => s.videoId === song.videoId)) return;
    songs.unshift(song);
    saveLikedSongs(songs);
}

export function removeLikedSong(videoId: string): void {
    const songs = getLikedSongs().filter(s => s.videoId !== videoId);
    saveLikedSongs(songs);
}

export function isLiked(videoId: string): boolean {
    return getLikedSongs().some(s => s.videoId === videoId);
}

export function extractVideoId(url: string): string | null {
    // Handle various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}
