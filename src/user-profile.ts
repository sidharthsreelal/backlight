export interface UserProfile {
    name: string;
    aboutMe: string;
    therapistType: string;
    therapist: string;
}

const PROFILE_KEY = 'backlight_user_profile';

const DEFAULT_PROFILE: UserProfile = { name: '', aboutMe: '', therapistType: 'curious', therapist: '' };

export function getUserProfile(): UserProfile {
    try {
        const stored = localStorage.getItem(PROFILE_KEY);
        if (stored) return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
        return { ...DEFAULT_PROFILE };
    } catch {
        return { ...DEFAULT_PROFILE };
    }
}

export function saveUserProfile(profile: UserProfile): void {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
