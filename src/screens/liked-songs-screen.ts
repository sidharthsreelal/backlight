import { getLikedSongs, removeLikedSong, extractVideoId, addLikedSong, type LikedSong } from '../liked-songs';

export function renderLikedSongsScreen(onBack: () => void): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen';

  function render() {
    const songs = getLikedSongs();
    screen.innerHTML = `
      <button class="back-btn">← Back</button>
      <div class="selection-header">
        <h2>Liked Songs</h2>
        <p>${songs.length} song${songs.length !== 1 ? 's' : ''} saved</p>
      </div>
      <div class="prefs-list">
        ${songs.length === 0
        ? '<div class="prefs-empty">No liked songs yet. Like songs during playback or paste a YouTube link below.</div>'
        : songs.map(s => `
            <div class="prefs-item">
              <div class="liked-song-info">
                <span class="prefs-item-name">${s.title}</span>
                <span class="liked-song-artist">${s.artist}</span>
              </div>
              <button class="prefs-item-remove" data-id="${s.videoId}" title="Remove">✕</button>
            </div>
          `).join('')
      }
      </div>
      <div class="prefs-add-row">
        <input type="text" class="prefs-input" placeholder="Paste YouTube link…" />
        <button class="prefs-add-btn">Add</button>
      </div>
    `;

    screen.querySelector('.back-btn')!.addEventListener('click', () => {
      screen.classList.add('screen-exit');
      setTimeout(onBack, 300);
    });

    screen.querySelectorAll('.prefs-item-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id!;
        removeLikedSong(id);
        render();
      });
    });

    const input = screen.querySelector('.prefs-input') as HTMLInputElement;
    const addBtn = screen.querySelector('.prefs-add-btn')!;
    const doAdd = async () => {
      const url = input.value.trim();
      const videoId = extractVideoId(url);
      if (!videoId) {
        input.style.borderColor = '#ff4466';
        setTimeout(() => input.style.borderColor = '', 1500);
        return;
      }

      const btnEl = addBtn as HTMLButtonElement;
      btnEl.disabled = true;
      btnEl.textContent = '...';

      let title = `YouTube Video (${videoId})`;
      let artist = 'Added manually';

      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (res.ok) {
          const data = await res.json();
          title = data.title || title;
          artist = data.author_name || artist;
        }
      } catch {
        // oEmbed unavailable — fallback title/artist used
      }

      const song: LikedSong = {
        videoId,
        title,
        artist,
      };
      addLikedSong(song);
      render(); // render() will reset the UI, including the button state
    };
    addBtn.addEventListener('click', doAdd);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAdd(); });
  }

  render();
  return screen;
}
