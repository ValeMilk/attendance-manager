import { useState, useCallback, useEffect } from 'react';

export interface MonthStatusData {
  month: string;
  isLocked: boolean;
  unlockedBy?: string;
  unlockedAt?: string;
  lockedAt?: string;
}

export function useMonthStatus(month: string, accessToken?: string) {
  const [monthStatus, setMonthStatus] = useState<MonthStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch month status
  const fetchStatus = useCallback(async () => {
    if (!accessToken || !month) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/months/${month}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setMonthStatus(data);
      } else {
        setError('Failed to fetch month status');
      }
    } catch (e) {
      console.error('Error fetching month status', e);
      setError('Error fetching month status');
    } finally {
      setLoading(false);
    }
  }, [month, accessToken]);

  // Unlock month (admin only)
  const unlockMonth = useCallback(async () => {
    if (!accessToken || !month) return false;
    
    try {
      const res = await fetch(`/api/months/${month}/unlock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setMonthStatus(data.status);
        return true;
      } else {
        setError('Failed to unlock month');
        return false;
      }
    } catch (e) {
      console.error('Error unlocking month', e);
      setError('Error unlocking month');
      return false;
    }
  }, [month, accessToken]);

  // Lock month (admin only)
  const lockMonth = useCallback(async () => {
    if (!accessToken || !month) return false;
    
    try {
      const res = await fetch(`/api/months/${month}/lock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setMonthStatus(data.status);
        return true;
      } else {
        setError('Failed to lock month');
        return false;
      }
    } catch (e) {
      console.error('Error locking month', e);
      setError('Error locking month');
      return false;
    }
  }, [month, accessToken]);

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
    refetch: fetchStatus,
  };
}
