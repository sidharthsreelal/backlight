import { getArtists, addArtist, removeArtist } from '../preferences';

export function renderArtistPrefsScreen(onBack: () => void): HTMLElement {
    const screen = document.createElement('div');
    screen.className = 'screen';

    function render() {
        const artists = getArtists();
        screen.innerHTML = `
      <button class="back-btn">← Back</button>
      <div class="selection-header">
        <h2>Your Artists</h2>
        <p>Music will be searched from these artists</p>
      </div>
      <div class="prefs-list">
        ${artists.map(a => `
          <div class="prefs-item">
            <span class="prefs-item-name">${a}</span>
            <button class="prefs-item-remove" data-artist="${a}" title="Remove">✕</button>
          </div>
        `).join('')}
      </div>
      <div class="prefs-add-row">
        <input type="text" class="prefs-input" placeholder="Add artist name…" />
        <button class="prefs-add-btn">Add</button>
      </div>
    `;

        screen.querySelector('.back-btn')!.addEventListener('click', () => {
            screen.classList.add('screen-exit');
            setTimeout(onBack, 300);
        });

        screen.querySelectorAll('.prefs-item-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = (btn as HTMLElement).dataset.artist!;
                removeArtist(name);
                render();
            });
        });

        const input = screen.querySelector('.prefs-input') as HTMLInputElement;
        const addBtn = screen.querySelector('.prefs-add-btn')!;
        const doAdd = () => {
            const val = input.value.trim();
            if (val) { addArtist(val); render(); }
        };
        addBtn.addEventListener('click', doAdd);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAdd(); });
    }

    render();
    return screen;
}
