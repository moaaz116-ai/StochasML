import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';

interface SettingsState {
  apiUrl: string;
  baudRate: number;
  autoConnect: boolean;
  notifications: boolean;
  simulatorDuration: number;
  profileName: string;
  profileEmail: string;
  setApiUrl: (url: string) => void;
  setBaudRate: (rate: number) => void;
  setAutoConnect: (val: boolean) => void;
  setNotifications: (val: boolean) => void;
  setSimulatorDuration: (val: number) => void;
  setProfile: (name: string, email: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiUrl: 'http://localhost:8000',
      baudRate: 115200,
      autoConnect: false,
      notifications: true,
      simulatorDuration: 10,
      profileName: 'Local Developer',
      profileEmail: 'dev@stochas.local',
      setApiUrl: (url) => {
        set({ apiUrl: url });
        api.setBaseUrl(url);
      },
      setBaudRate: (rate) => set({ baudRate: rate }),
      setAutoConnect: (val) => set({ autoConnect: val }),
      setNotifications: (val) => set({ notifications: val }),
      setSimulatorDuration: (val) => set({ simulatorDuration: val }),
      setProfile: (name, email) => set({ profileName: name, profileEmail: email }),
    }),
    {
      name: 'stochas-settings',
      onRehydrateStorage: () => (state) => {
        // When storage is rehydrated, configure API base URL
        if (state?.apiUrl) {
          api.setBaseUrl(state.apiUrl);
        }
      },
    }
  )
);
