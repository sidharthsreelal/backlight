import { getUserProfile } from '../user-profile';

export function renderMoodScreen(onSelect: (mood: string) => void): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen';

  const profile = getUserProfile();
  const greeting = profile.name
    ? `Hey ${profile.name}, how are you feeling?`
    : 'How are you feeling?';

  const moods = [
    { id: 'overwhelmed', label: 'Overwhelmed', desc: 'Everything feels like too much', icon: 'OV' },
    { id: 'anxious', label: 'Anxious', desc: 'Restless, can\'t settle down', icon: 'AX' },
    { id: 'low', label: 'Feeling Low', desc: 'Low energy, not quite yourself', icon: 'LO' },
    { id: 'frustrated', label: 'Frustrated', desc: 'Things aren\'t going your way', icon: 'FR' },
    { id: 'burnt-out', label: 'Burnt Out', desc: 'Running on empty', icon: 'BO' },
  ];

  screen.innerHTML = `
    <div class="mood-header">
      <h2>${greeting}</h2>
      <p>Take a moment to check in with yourself.<br/>There are no wrong answers.</p>
    </div>
    <div class="mood-options">
      ${moods.map(m => `
        <button class="mood-btn" data-mood="${m.id}">
          <div class="mood-icon">${m.icon}</div>
          <div class="mood-label">
            <span>${m.label}</span>
            <span>${m.desc}</span>
          </div>
        </button>
      `).join('')}
    </div>
  `;

  screen.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = (btn as HTMLElement).dataset.mood!;
      screen.classList.add('screen-exit');
      setTimeout(() => onSelect(mood), 300);
    });
  });

  return screen;
}
