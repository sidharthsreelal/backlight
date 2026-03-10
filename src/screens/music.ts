import { invoke } from '@tauri-apps/api/core';
import { getArtists } from '../preferences';
import { getLikedSongs, addLikedSong, removeLikedSong, isLiked } from '../liked-songs';
import { showSessionComplete } from '../components/session-complete';

interface Song {
  title: string;
  artist: string;
  videoId: string;
  duration?: string;
  thumbnail?: string;
}

type MusicStep = 'pick-source' | 'pick-artist' | 'pick-count' | 'loading' | 'playing';

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Load the YouTube IFrame API script once
let ytApiLoaded = false;
let ytApiReady = false;
const ytApiCallbacks: (() => void)[] = [];

function loadYTApi(): Promise<void> {
  return new Promise((resolve) => {
    if (ytApiReady) { resolve(); return; }

    ytApiCallbacks.push(resolve);

    if (!ytApiLoaded) {
      ytApiLoaded = true;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        ytApiReady = true;
        ytApiCallbacks.forEach(cb => cb());
        ytApiCallbacks.length = 0;
      };
    }
  });
}

export function renderMusicScreen(
  onBack: () => void,
  logSession: (type: string, detail: string) => void,
  onSessionEnd: () => void,
): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen';

  let step: MusicStep = 'pick-source';
  let sourceChoice: 'artist' | 'liked-songs' = 'artist';
  let selectedArtist = '';
  let songs: Song[] = [];
  let currentIndex = 0;
  let ytPlayer: any = null;

  function destroyPlayer() {
    if (ytPlayer) {
      try { ytPlayer.destroy(); } catch (_) { }
      ytPlayer = null;
    }
  }

  function render() {
    destroyPlayer();
    screen.innerHTML = '<button class="back-btn">← Back</button>';
    const container = document.createElement('div');
    container.style.cssText = 'display:flex;flex-direction:column;flex:1;';

    if (step === 'pick-source') {
      const liked = getLikedSongs();
      container.innerHTML = `
        <div class="selection-header">
          <h2>Music</h2>
          <p>Choose what to listen to</p>
        </div>
        <div class="selection-list">
          <button class="selection-option" data-src="artists">
            <span class="selection-option-icon">♪</span>
            <span>Your Artists</span>
          </button>
          <button class="selection-option ${liked.length === 0 ? 'disabled' : ''}" data-src="liked-songs">
            <span class="selection-option-icon">♥</span>
            <span>Liked Songs</span>
          </button>
        </div>
      `;
      screen.appendChild(container);

      container.querySelectorAll('.selection-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const src = (btn as HTMLElement).dataset.src;
          if (src === 'liked-songs') {
            const liked = getLikedSongs();
            if (liked.length === 0) return;
            sourceChoice = 'liked-songs';
            selectedArtist = 'Liked Songs';
            step = 'pick-count';
            render();
          } else {
            sourceChoice = 'artist';
            step = 'pick-artist';
            render();
          }
        });
      });

    } else if (step === 'pick-artist') {
      const artists = getArtists();
      container.innerHTML = `
        <div class="selection-header">
          <h2>Pick an Artist</h2>
          <p>Songs will be shuffled</p>
        </div>
        <div class="selection-list">
          ${artists.map(a => `
            <button class="selection-option" data-artist="${a}">
              <span class="selection-option-icon">♪</span>
              <span>${a}</span>
            </button>
          `).join('')}
        </div>
      `;
      screen.appendChild(container);

      container.querySelectorAll('.selection-option').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedArtist = (btn as HTMLElement).dataset.artist!;
          step = 'pick-count';
          render();
        });
      });

    } else if (step === 'pick-count') {
      container.innerHTML = `
        <div class="selection-header">
          <h2>${selectedArtist}</h2>
          <p>How many songs?</p>
        </div>
        <div class="selection-list">
          ${[3, 5, 10].map(n => `
            <button class="selection-option" data-count="${n}">
              <span class="selection-option-icon">${n}</span>
              <span>${n} songs</span>
            </button>
          `).join('')}
        </div>
      `;
      screen.appendChild(container);

      container.querySelectorAll('.selection-option').forEach(btn => {
        btn.addEventListener('click', async () => {
          const count = parseInt((btn as HTMLElement).dataset.count!);
          if (sourceChoice === 'liked-songs') {
            const liked = getLikedSongs();
            const shuffled = shuffle(liked);
            const limit = Math.min(count, shuffled.length);
            songs = shuffled.slice(0, limit).map(s => ({
              title: s.title,
              artist: s.artist,
              videoId: s.videoId,
              thumbnail: s.thumbnail,
            }));
            currentIndex = 0;
            logSession('Music', `Liked Songs — ${songs.length} songs`);
            step = 'playing';
            render();
          } else {
            step = 'loading';
            render();
            try {
              const result = await invoke<string>('search_music', { artist: selectedArtist, count });
              const parsed = JSON.parse(result);
              songs = shuffle(parsed);
              currentIndex = 0;
              logSession('Music', `${selectedArtist} — ${songs.length} songs`);
              step = 'playing';
              render();
            } catch (e: any) {
              screen.innerHTML = `
                <button class="back-btn">← Back</button>
                <div class="selection-header">
                  <h2>${selectedArtist}</h2>
                  <p class="error-text">Failed to search: ${e?.message || e}. Make sure Python and ytmusicapi are installed.</p>
                </div>
              `;
              screen.querySelector('.back-btn')!.addEventListener('click', () => {
                step = 'pick-source';
                render();
              });
            }
          }
        });
      });

    } else if (step === 'loading') {
      container.innerHTML = `
        <div class="selection-header">
          <h2>${selectedArtist}</h2>
          <p>Searching songs…</p>
        </div>
        <div class="loading-indicator">
          <div class="loading-spinner"></div>
        </div>
      `;
      screen.appendChild(container);

    } else if (step === 'playing') {
      if (songs.length === 0) {
        step = 'pick-source';
        render();
        return;
      }

      const song = songs[currentIndex];
      const liked = isLiked(song.videoId);

      container.innerHTML = `
        <div class="music-player">
          <div class="music-embed">
            <div id="yt-player-container"></div>
          </div>
          <div class="music-info">
            <div class="music-title">${song.title}</div>
            <div class="music-artist">${song.artist}</div>
          </div>
          <div class="music-controls">
            <button class="music-ctrl-btn like-btn ${liked ? 'liked' : ''}" title="${liked ? 'Unlike' : 'Like'}">
              ${liked ? '♥' : '♡'}
            </button>
            <button class="music-ctrl-btn prev-btn" ${currentIndex === 0 ? 'disabled' : ''}>⏮</button>
            <span class="music-track-num">${currentIndex + 1} / ${songs.length}</span>
            <button class="music-ctrl-btn next-btn">⏭</button>
          </div>
          ${songs.length > 1 && currentIndex < songs.length - 1 ? `
            <div class="music-up-next">
              <div class="music-up-next-label">Up Next</div>
              <div class="music-up-next-title">${songs[currentIndex + 1].title}</div>
            </div>
          ` : ''}
        </div>
      `;
      screen.appendChild(container);

      // Initialize YouTube IFrame Player
      initYTPlayer(song.videoId);

      // Like button
      container.querySelector('.like-btn')!.addEventListener('click', () => {
        if (isLiked(song.videoId)) {
          removeLikedSong(song.videoId);
        } else {
          addLikedSong({
            videoId: song.videoId,
            title: song.title,
            artist: song.artist,
            thumbnail: song.thumbnail,
          });
        }
        // Re-render just the like button state
        const likeBtn = container.querySelector('.like-btn')!;
        const nowLiked = isLiked(song.videoId);
        likeBtn.className = `music-ctrl-btn like-btn ${nowLiked ? 'liked' : ''}`;
        likeBtn.textContent = nowLiked ? '♥' : '♡';
        likeBtn.setAttribute('title', nowLiked ? 'Unlike' : 'Like');
      });

      // Navigation
      container.querySelector('.prev-btn')?.addEventListener('click', () => {
        if (currentIndex > 0) { currentIndex--; render(); }
      });
      container.querySelector('.next-btn')?.addEventListener('click', () => {
        goToNextOrFinish();
      });
    }

    // Only append container if not already appended
    if (!container.parentElement) {
      screen.appendChild(container);
    }

    screen.querySelector('.back-btn')!.addEventListener('click', () => {
      destroyPlayer();
      if (step === 'pick-artist') { step = 'pick-source'; render(); return; }
      if (step === 'pick-count') {
        if (sourceChoice === 'liked-songs') { step = 'pick-source'; render(); return; }
        step = 'pick-artist'; render(); return;
      }
      if (step === 'playing') { step = 'pick-source'; render(); return; }
      screen.classList.add('screen-exit');
      setTimeout(onBack, 300);
    });
  }

  function goToNextOrFinish() {
    if (currentIndex < songs.length - 1) {
      currentIndex++;
      render();
    } else {
      // All songs finished — show session complete
      destroyPlayer();
      showSessionComplete(screen, onSessionEnd);
    }
  }

  async function initYTPlayer(videoId: string) {
    await loadYTApi();

    const playerContainer = document.getElementById('yt-player-container');
    if (!playerContainer) return;

    ytPlayer = new window.YT.Player('yt-player-container', {
      width: '100%',
      height: 200,
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onStateChange: (event: any) => {
          // State 0 = YT.PlayerState.ENDED
          if (event.data === 0) {
            goToNextOrFinish();
          }
        },
      },
    });
  }

  render();
  return screen;
}
