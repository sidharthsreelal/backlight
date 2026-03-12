const ARTISTS_KEY = 'backlight_artists';
const DEFAULT_ARTISTS = ['Frank Ocean', 'Daniel Caesar', 'Sushin Shyam'];

export function getArtists(): string[] {
    try {
        const stored = localStorage.getItem(ARTISTS_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.length > 0 ? parsed : DEFAULT_ARTISTS;
        }
        return DEFAULT_ARTISTS;
    } catch {
        return DEFAULT_ARTISTS;
    }
}

export function addArtist(name: string): void {
    const artists = getArtists();
    const trimmed = name.trim();
    if (!trimmed || artists.some(a => a.toLowerCase() === trimmed.toLowerCase())) return;
    artists.push(trimmed);
    localStorage.setItem(ARTISTS_KEY, JSON.stringify(artists));
}

export function removeArtist(name: string): void {
    const artists = getArtists().filter(a => a !== name);
    localStorage.setItem(ARTISTS_KEY, JSON.stringify(artists));
}
