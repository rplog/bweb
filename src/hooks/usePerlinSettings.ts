import { useSyncExternalStore } from 'react';

type PerlinSettings = {
    noiseScale: number;
    timeFlow: number;
    height: number;
};

const defaultSettings: PerlinSettings = {
    noiseScale: 0.45,
    timeFlow: 0.4,
    height: 30,
};

let currentSettings = { ...defaultSettings };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function getSnapshot() {
    return currentSettings;
}

export function updateSettings(partial: Partial<PerlinSettings>) {
    currentSettings = { ...currentSettings, ...partial };
    listeners.forEach((l) => l());
}

export function resetSettings() {
    currentSettings = { ...defaultSettings };
    listeners.forEach((l) => l());
}

export function usePerlinSettings() {
    const settings = useSyncExternalStore(subscribe, getSnapshot);
    return {
        ...settings,
        updateSettings,
        reset: resetSettings
    };
}
