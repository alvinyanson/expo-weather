import { create } from 'zustand';

interface NetworkState {
  isConnected: boolean | null;
  setIsConnected: (isConnected: boolean | null) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true, // Default to true to prevent flash of offline, updated quickly by NetInfo
  setIsConnected: (isConnected) => set({ isConnected }),
}));
