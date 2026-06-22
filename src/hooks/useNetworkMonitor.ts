import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useNetworkStore } from '@/store/useNetworkStore';

export function useNetworkMonitor() {
  const setIsConnected = useNetworkStore((state) => state.setIsConnected);

  useEffect(() => {
    // Listen to network changes for our global state
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isConnected can be true even if isInternetReachable is false (e.g. connected to router without internet)
      // So we check both. If isInternetReachable is null, we assume connected if isConnected is true.
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected);
    });

    // Tell React Query how to monitor online status
    onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state) => {
        setOnline(!!state.isConnected && state.isInternetReachable !== false);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [setIsConnected]);
}
