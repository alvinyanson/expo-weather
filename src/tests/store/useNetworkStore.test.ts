import { describe, it, expect, beforeEach } from 'vitest';
import { useNetworkStore } from '@/store/useNetworkStore';

describe('useNetworkStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useNetworkStore.setState({ isConnected: true });
  });

  it('should have default state isConnected as true', () => {
    const state = useNetworkStore.getState();
    expect(state.isConnected).toBe(true);
  });

  it('should correctly set isConnected to false', () => {
    const store = useNetworkStore.getState();
    store.setIsConnected(false);

    expect(useNetworkStore.getState().isConnected).toBe(false);
  });

  it('should correctly set isConnected to true', () => {
    // first set it to false
    useNetworkStore.setState({ isConnected: false });

    const store = useNetworkStore.getState();
    store.setIsConnected(true);

    expect(useNetworkStore.getState().isConnected).toBe(true);
  });
});
