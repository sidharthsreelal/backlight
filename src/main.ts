import './style.css';
import { createTitlebar, type MenuAction } from './components/titlebar';
import { renderMoodScreen } from './screens/mood';
import { renderActivitiesScreen, Activity } from './screens/activities';
import { renderBreathingScreen } from './screens/breathing';
import { renderSoundscapeScreen } from './screens/soundscape';
import { renderMusicScreen } from './screens/music';
import { renderChatScreen } from './screens/chat';
import { renderArtistPrefsScreen } from './screens/artist-prefs';
import { renderLikedSongsScreen } from './screens/liked-songs-screen';
import { renderProfileScreen } from './screens/profile-screen';
import { renderChatHistoryOverlay } from './screens/chat-history-screen';
import { renderSessionLog, addSession } from './sessions';


type Screen = 'mood' | 'activities' | 'breathing' | 'soundscape' | 'music' | 'chat' | 'artist-prefs' | 'liked-songs' | 'profile';

interface AppState {
    currentScreen: Screen;
    selectedMood: string;
}

const state: AppState = {
    currentScreen: 'mood',
    selectedMood: '',
};

const app = document.getElementById('app')!;

const titlebar = createTitlebar((action: MenuAction) => {
    if (action === 'history') {
        const logOverlay = renderSessionLog(() => logOverlay.remove());
        app.appendChild(logOverlay);
    } else if (action === 'chat-history') {
        const chatOverlay = renderChatHistoryOverlay(() => chatOverlay.remove());
        app.appendChild(chatOverlay);
    } else if (action === 'artist-prefs') {
        navigateTo('artist-prefs');
    } else if (action === 'liked-songs') {
        navigateTo('liked-songs');
    } else if (action === 'profile') {
        navigateTo('profile');
    }
});
app.appendChild(titlebar);

const content = document.createElement('div');
content.className = 'content';
app.appendChild(content);

function logSession(type: string, detail: string) {
    addSession(state.selectedMood, type, detail);
}

function navigateTo(screen: Screen) {
    state.currentScreen = screen;
    content.innerHTML = '';

    let screenEl: HTMLElement;

    switch (screen) {
        case 'mood':
            screenEl = renderMoodScreen((mood) => {
                state.selectedMood = mood;
                navigateTo('activities');
            });
            break;

        case 'activities':
            screenEl = renderActivitiesScreen(
                state.selectedMood,
                (activity: Activity) => {
                    switch (activity) {
                        case 'breathe':
                            logSession('Breathing', '4-7-8 exercise');
                            navigateTo('breathing');
                            break;
                        case 'music':
                            navigateTo('music');
                            break;
                        case 'noise':
                            navigateTo('soundscape');
                            break;
                        case 'chat':
                            logSession('Chat', 'AI therapist session');
                            navigateTo('chat');
                            break;
                    }
                },
                () => navigateTo('mood')
            );
            break;

        case 'breathing':
            screenEl = renderBreathingScreen(() => navigateTo('activities'), () => navigateTo('mood'));
            break;

        case 'soundscape':
            screenEl = renderSoundscapeScreen(() => navigateTo('activities'), logSession, () => navigateTo('mood'));
            break;

        case 'music':
            screenEl = renderMusicScreen(
                () => navigateTo('activities'),
                logSession,
                () => navigateTo('mood'),
            );
            break;

        case 'chat':
            screenEl = renderChatScreen(state.selectedMood, () => navigateTo('activities'));
            break;

        case 'artist-prefs':
            screenEl = renderArtistPrefsScreen(() => navigateTo(state.selectedMood ? 'activities' : 'mood'));
            break;

        case 'liked-songs':
            screenEl = renderLikedSongsScreen(() => navigateTo(state.selectedMood ? 'activities' : 'mood'));
            break;

        case 'profile':
            screenEl = renderProfileScreen(() => navigateTo(state.selectedMood ? 'activities' : 'mood'));
            break;
    }

    content.appendChild(screenEl!);
}

navigateTo('mood');
