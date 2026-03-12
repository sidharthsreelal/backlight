// Session logging module
export interface SessionLog {
    id: string;
    timestamp: string;
    mood: string;
    activity: string;
    detail: string;
}

const STORAGE_KEY = 'backlight_sessions';

export function getSessions(): SessionLog[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

export function addSession(mood: string, activity: string, detail: string): void {
    const sessions = getSessions();
    sessions.unshift({
        id: Date.now().toString(36),
        timestamp: new Date().toISOString(),
        mood,
        activity,
        detail,
    });
    // Keep last 50 sessions
    if (sessions.length > 50) sessions.length = 50;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function clearSessions(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export function formatSessionTime(isoString: string): string {
    const d = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const moodLabels: Record<string, string> = {
    'overwhelmed': 'Overwhelmed',
    'anxious': 'Anxious',
    'low': 'Feeling Low',
    'frustrated': 'Frustrated',
    'burnt-out': 'Burnt Out',
};

export function renderSessionLog(onClose: () => void): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'session-log-overlay';

    const sessions = getSessions();

    overlay.innerHTML = `
    <div class="session-log-panel">
      <div class="session-log-header">
        <h3>Session History</h3>
        <button class="session-log-close">✕</button>
      </div>
      <div class="session-log-list">
        ${sessions.length === 0
            ? '<div class="session-log-empty">No sessions yet. Take a break to get started.</div>'
            : sessions.map(s => `
            <div class="session-log-item">
              <div class="session-log-time">${formatSessionTime(s.timestamp)}</div>
              <div class="session-log-mood">${moodLabels[s.mood] || s.mood}</div>
              <div class="session-log-activity">${s.activity}: ${s.detail}</div>
            </div>
          `).join('')
        }
      </div>
      ${sessions.length > 0 ? '<button class="session-log-clear">Clear History</button>' : ''}
    </div>
  `;

    overlay.querySelector('.session-log-close')!.addEventListener('click', onClose);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) onClose();
    });

    overlay.querySelector('.session-log-clear')?.addEventListener('click', () => {
        clearSessions();
        onClose();
    });

    return overlay;
}
