export type Activity = 'music' | 'noise' | 'breathe' | 'chat';

export function renderActivitiesScreen(
  mood: string,
  onSelect: (activity: Activity) => void,
  onBack: () => void
): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen';

  const moodMessages: Record<string, string> = {
    'overwhelmed': 'Let\'s ease the pressure',
    'anxious': 'Let\'s find some calm',
    'low': 'Let\'s lift you up gently',
    'frustrated': 'Let\'s release the tension',
    'burnt-out': 'Let\'s recharge your energy',
  };

  const activities = [
    { id: 'music', icon: '♪', title: 'Music', desc: 'Songs from your artists' },
    { id: 'noise', icon: '◎', title: 'Ambient Noise', desc: 'Rain, ocean, forest' },
    { id: 'breathe', icon: '◉', title: 'Breathing', desc: '4-7-8 guided technique' },
    { id: 'chat', icon: '◈', title: 'Talk it Out', desc: 'AI therapist check-in' },
  ];

  screen.innerHTML = `
    <button class="back-btn">← Back</button>
    <div class="activity-header">
      <h2>${moodMessages[mood] || 'What would help right now?'}</h2>
      <p>Choose an activity to help you wind down</p>
    </div>
    <div class="activity-grid">
      ${activities.map(a => `
        <button class="activity-card" data-activity="${a.id}">
          <div class="activity-icon">${a.icon}</div>
          <div class="activity-title">${a.title}</div>
          <div class="activity-desc">${a.desc}</div>
        </button>
      `).join('')}
    </div>
  `;

  screen.querySelector('.back-btn')!.addEventListener('click', () => {
    screen.classList.add('screen-exit');
    setTimeout(onBack, 300);
  });

  screen.querySelectorAll('.activity-card').forEach(card => {
    card.addEventListener('click', () => {
      const activity = (card as HTMLElement).dataset.activity as Activity;
      screen.classList.add('screen-exit');
      setTimeout(() => onSelect(activity), 300);
    });
  });

  return screen;
}
