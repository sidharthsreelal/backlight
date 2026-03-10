import { showSessionComplete } from '../components/session-complete';

type NoiseType = 'rain' | 'ocean' | 'forest';
type NoiseStep = 'pick-sound' | 'pick-duration' | 'playing';

export function renderSoundscapeScreen(onBack: () => void, logSession: (type: string, detail: string) => void, onSessionEnd: () => void): HTMLElement {
  const screen = document.createElement('div');
  screen.className = 'screen';

  let step: NoiseStep = 'pick-sound';
  let selectedSound: NoiseType = 'rain';
  let durationMinutes = 5;
  let timerRemaining = 0;
  let timerTotal = 0;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let audioEl: HTMLAudioElement | null = null;

  const soundLabels: Record<NoiseType, string> = {
    rain: 'Rain',
    ocean: 'Ocean Waves',
    forest: 'Forest Ambience',
  };

  function cleanup() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    if (audioEl) { audioEl.pause(); audioEl.src = ''; audioEl = null; }
  }

  function render() {
    screen.innerHTML = `<button class="back-btn">← Back</button>`;
    const container = document.createElement('div');
    container.style.cssText = 'display:flex;flex-direction:column;flex:1;';

    if (step === 'pick-sound') {
      container.innerHTML = `
        <div class="selection-header">
          <h2>Choose a Sound</h2>
          <p>What environment helps you relax?</p>
        </div>
        <div class="selection-list">
          <button class="selection-option" data-sound="rain">
            <span class="selection-option-icon">🌧</span>
            <span>Rain</span>
          </button>
          <button class="selection-option" data-sound="ocean">
            <span class="selection-option-icon">🌊</span>
            <span>Ocean Waves</span>
          </button>
          <button class="selection-option" data-sound="forest">
            <span class="selection-option-icon">🌲</span>
            <span>Forest Ambience</span>
          </button>
        </div>
      `;

      screen.appendChild(container);
      container.querySelectorAll('.selection-option').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedSound = (btn as HTMLElement).dataset.sound as NoiseType;
          step = 'pick-duration';
          render();
        });
      });

    } else if (step === 'pick-duration') {
      container.innerHTML = `
        <div class="selection-header">
          <h2>${soundLabels[selectedSound]}</h2>
          <p>How long do you need?</p>
        </div>
        <div class="selection-list">
          ${[2, 5, 10, 15, 20].map(d => `
            <button class="selection-option" data-dur="${d}">
              <span class="selection-option-icon">${d}</span>
              <span>${d} minutes</span>
            </button>
          `).join('')}
        </div>
      `;

      screen.appendChild(container);
      container.querySelectorAll('.selection-option').forEach(btn => {
        btn.addEventListener('click', () => {
          durationMinutes = parseInt((btn as HTMLElement).dataset.dur!);
          timerTotal = durationMinutes * 60;
          timerRemaining = timerTotal;
          step = 'playing';
          logSession('Ambient', `${soundLabels[selectedSound]} — ${durationMinutes} min`);
          render();
          startPlayback();
        });
      });

    } else if (step === 'playing') {
      const mins = Math.floor(timerRemaining / 60);
      const secs = timerRemaining % 60;
      const progress = timerTotal > 0 ? timerRemaining / timerTotal : 1;
      const circumference = 2 * Math.PI * 90;
      const dashoffset = circumference * (1 - progress);

      container.innerHTML = `
        <div class="playing-container">
          <div class="sound-label">${soundLabels[selectedSound]}</div>
          <div class="circular-timer">
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
              <circle cx="110" cy="110" r="90" fill="none"
                stroke="url(#timerGrad)" stroke-width="6"
                stroke-linecap="round"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${dashoffset}"
                transform="rotate(-90 110 110)"
                class="timer-progress"/>
              <defs>
                <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:var(--accent-blue)"/>
                  <stop offset="100%" style="stop-color:var(--accent-teal)"/>
                </linearGradient>
              </defs>
            </svg>
            <div class="timer-center-text">
              <div class="timer-time">${mins}:${secs.toString().padStart(2, '0')}</div>
              <div class="timer-sublabel">remaining</div>
            </div>
          </div>
          <button class="stop-btn">End Session</button>
        </div>
      `;

      screen.appendChild(container);

      container.querySelector('.stop-btn')!.addEventListener('click', () => {
        cleanup();
        step = 'pick-sound';
        render();
      });
    }

    screen.querySelector('.back-btn')!.addEventListener('click', () => {
      if (step === 'pick-duration') { step = 'pick-sound'; render(); return; }
      if (step === 'playing') { cleanup(); step = 'pick-sound'; render(); return; }
      cleanup();
      screen.classList.add('screen-exit');
      setTimeout(onBack, 300);
    });
  }

  function startPlayback() {
    audioEl = new Audio(`/audio/${selectedSound}.mp3`);
    audioEl.loop = true;
    audioEl.play().catch(e => console.warn('Audio play failed:', e));

    timerInterval = setInterval(() => {
      timerRemaining--;
      if (timerRemaining <= 0) {
        cleanup();
        showSessionComplete(screen, onSessionEnd);
        return;
      }
      updateTimerDisplay();
    }, 1000);
  }

  function updateTimerDisplay() {
    const mins = Math.floor(timerRemaining / 60);
    const secs = timerRemaining % 60;
    const progress = timerTotal > 0 ? timerRemaining / timerTotal : 1;
    const circumference = 2 * Math.PI * 90;
    const dashoffset = circumference * (1 - progress);

    const timeEl = screen.querySelector('.timer-time');
    const progressEl = screen.querySelector('.timer-progress');
    if (timeEl) timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    if (progressEl) progressEl.setAttribute('stroke-dashoffset', String(dashoffset));
  }

  render();
  return screen;
}
