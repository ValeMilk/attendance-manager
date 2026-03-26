import { useState, useCallback, useEffect } from 'react';

export interface MonthStatusData {
  month: string;
  isLocked: boolean;
  months?: string[];
  unlockedBy?: string;
  unlockedAt?: string;
  lockedAt?: string;
}

export function useMonthStatus(month: string, accessToken?: string) {
  const [monthStatus, setMonthStatus] = useState<MonthStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch period status (checks both calendar months the period spans)
  const fetchStatus = useCallback(async () => {
    if (!accessToken || !month) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/months/${month}/period-status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setMonthStatus(data);
      } else {
        setError('Failed to fetch period status');
      }
    } catch (e) {
      console.error('Error fetching period status', e);
      setError('Error fetching period status');
    } finally {
      setLoading(false);
    }
  }, [month, accessToken]);

  // Unlock period (admin only) - unlocks both calendar months
  const unlockMonth = useCallback(async () => {
    if (!accessToken || !month) return false;
    
    try {
      const res = await fetch(`/api/months/${month}/unlock-period`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (res.ok) {
        console.log('🔓 Period unlocked');
        setTimeout(() => fetchStatus(), 100);
        return true;
      } else {
        setError('Failed to unlock period');
        return false;
      }
    } catch (e) {
      console.error('Error unlocking period', e);
      setError('Error unlocking period');
      return false;
    }
  }, [month, accessToken, fetchStatus]);

  // Lock period (admin only) - locks both calendar months
  const lockMonth = useCallback(async () => {
    if (!accessToken || !month) return false;
    
    try {
      const res = await fetch(`/api/months/${month}/lock-period`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (res.ok) {
        console.log('🔒 Period locked');
        setTimeout(() => fetchStatus(), 100);
        return true;
      } else {
        setError('Failed to lock period');
        return false;
      }
    } catch (e) {
      console.error('Error locking period', e);
      setError('Error locking period');
      return false;
    }
  }, [month, accessToken, fetchStatus]);

  // Auto-fetch on mount or when month/token changes
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isLocked = monthStatus?.isLocked ?? true; // Default to locked

  return {
    monthStatus,
    isLocked,
    loading,
    error,
    unlockMonth,
    lockMonth,
    monthLockLoading: loading,
    refetch: fetchStatus,
  };
}
