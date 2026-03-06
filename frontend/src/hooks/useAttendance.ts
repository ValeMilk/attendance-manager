import { useState, useCallback, useMemo, useEffect } from 'react';
import { AttendanceRecord, AttendanceCode, DayInfo, Justification } from '@/types/attendance';
import { employees, supervisors as mockSupervisors, holidays } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { format, isSunday, addDays } from 'date-fns';

export function useAttendance() {
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    try {
      const raw = localStorage.getItem('attendance_currentDate');
      return raw ? new Date(raw) : new Date(2026, 0, 1);
    } catch (e) {
      return new Date(2026, 0, 1);
    }
  }); // Janeiro 2026
  const [selectedSupervisor, setSelectedSupervisor] = useState<string | 'all'>('all');
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'supervisor' | 'expectador'>('admin');
  const [supervisorsState, setSupervisorsState] = useState(() => mockSupervisors);
  const [employeesState, setEmployeesState] = useState(() => employees);

  // helper to slugify names for stable ids
  const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [justifications, setJustifications] = useState<Justification[]>([]);

  // auth context (for saving/fetching persisted data)
  const { accessToken, user } = useAuth();

  // Gera o período do dia 26 do mês corrente até 25 do mês seguinte.
  const daysInMonth = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 26);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 25);
    const days: DayInfo[] = [];

    for (let d = start; d <= end; d = addDays(d, 1)) {
      const date = new Date(d);
      const dateStr = format(date, 'yyyy-MM-dd');
      days.push({
        day: dateStr,
        date,
        isSunday: isSunday(date),
        isHoliday: !!holidays[dateStr],
        holidayName: holidays[dateStr],
      });
    }

    return days;
  }, [currentDate]);

  const filteredEmployees = useMemo(() => {
    if (selectedSupervisor === 'all') {
      return employeesState;
    }

    // Prefer employees that have attendance records when a supervisor is selected.
    const supLower = String(selectedSupervisor).toLowerCase();

    // collect employee ids present in records relevant to this supervisor
    const idsFromRecords = new Set<string>();
    records.forEach(r => {
      const empId = String(r.employeeId || '').toLowerCase();
      const recSup = String(r.supervisorId || '').toLowerCase();
      if (!empId) return;
      if (recSup === supLower || recSup === 'global' || empId.startsWith(supLower + '-') || empId.includes('-' + supLower)) {
        idsFromRecords.add(empId);
      }
    });

    const result: any[] = [];
    // include employees derived from records first (ensure same identity)
    idsFromRecords.forEach(eid => {
      let found = employeesState.find(e => (e.id || '').toString().toLowerCase() === eid || slug(String(e.name || e.id || '')).toLowerCase() === eid);
      if (!found) {
        const parts = eid.split('-');
        const namePart = parts.slice(1).join('-') || parts[0];
        found = { id: eid, name: namePart, role: 'FUNCIONÁRIO', supervisorId: parts[0] || selectedSupervisor };
      }
      const empNameSlug = slug(String(found.name || found.id || '')).toLowerCase();
      if (found.id === selectedSupervisor || empNameSlug === supLower) return;
      result.push(found);
    });

    if (result.length > 0) {
      const seen = new Set<string>();
      return result.filter(r => {
        const key = slug(String(r.name || r.id || '')).toLowerCase();
        if (seen.has(key)) return false; seen.add(key); return true;
      });
    }

    // fallback: original tolerant filter
    return employeesState.filter(emp => {
      const empSup = (emp.supervisorId || '').toString();
      if (!supLower) return false;
      const empNameSlug = slug(String(emp.name || emp.id || '')).toLowerCase();
      if (emp.id === selectedSupervisor || empNameSlug === supLower) return false;
      if (empSup === selectedSupervisor) return true;
      if (empSup.toLowerCase() === supLower) return true;
      if (empSup.toLowerCase() === 'global') return true;
      if ((emp.id || '').toString().toLowerCase().startsWith(supLower + '-')) return true;
      if ((emp.id || '').toString().toLowerCase().includes('-' + supLower)) return true;
      if (empSup.toLowerCase().includes(supLower)) return true;
      try {
        const mockMatch = mockSupervisors.find(s => s.name?.toLowerCase() === supLower || (s.id || '').toString().toLowerCase() === supLower);
        if (mockMatch && emp.supervisorId && emp.supervisorId === mockMatch.id) return true;
      } catch (e) {}
      return false;
    });
  }, [selectedSupervisor, employeesState, records]);

  const currentSupervisor = useMemo(() => {
    if (selectedSupervisor === 'all') return null;
    return supervisorsState.find(s => s.id === selectedSupervisor) || null;
  }, [selectedSupervisor, supervisorsState]);

  // fetch supervisors from backend (fallback to mock data)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/supervisors', {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
        if (!res.ok) throw new Error('Failed to fetch supervisors');
        const data = await res.json();
        if (!mounted) return;
        // map backend users -> Supervisor[] shape expected by UI
        const mapped = data.map((u: any) => ({
          // Prefer `supervisorId` (stable slug) when present, fallback to _id
          id: (u.supervisorId || u._id || u.id).toString(),
          name: u.name,
          store: `REGIÃO - ${u.name}`,
        }));
        // remove duplicates by first name (case-insensitive), prefer the longest full name
        const byFirstName: Record<string, any> = {};
        mapped.forEach(m => {
          const first = (m.name || '').split(/\s+/)[0]?.toLowerCase() || m.name.toLowerCase();
          const existing = byFirstName[first];
          if (!existing) {
            byFirstName[first] = m;
          } else {
            // prefer the longer, more descriptive name (e.g., 'RODNEY DE MACEDO' over 'RODNEY')
            if ((m.name || '').length > (existing.name || '').length) {
              byFirstName[first] = m;
            }
          }
        });
        const deduped = Object.values(byFirstName);
        setSupervisorsState(deduped);
        // Try to load canonical employees list from backend (preferred)
        try {
          const empRes = await fetch('/api/employees', {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
          });
          if (empRes.ok) {
            const emps = await empRes.json();
            if (mounted && Array.isArray(emps) && emps.length > 0) {
              // Map backend employees to UI shape and replace current list
              const mapped = emps.map((e: any) => ({ id: e.id || `${e.supervisorId}-${e.slug}`, name: e.name || e.displayName || e.slug, role: e.role || 'FUNCIONÁRIO', supervisorId: e.supervisorId }));
              // dedupe by slug
              const map: Record<string, any> = {};
              mapped.forEach((m: any) => { const key = slug(String(m.name || m.id || '')); if (key) map[key] = m; });
              setEmployeesState(Object.values(map));
            }
          }
        } catch (e) {
          // ignore and fall back to deriving employees below
        }

        // derive employees list from supervisors payload when available
        const derivedEmployees: any[] = [];
        data.forEach((u: any) => {
          const supId = (u.supervisorId || u._id || u.id).toString();
          const emps = Array.isArray(u.employees) ? u.employees : [];
          emps.forEach((e: any, idx: number) => {
            const name = e.name || e.employeeName || (`employee-${idx}`);
            const id = `${supId}-${slug(name)}`;
            derivedEmployees.push({ id, name, role: e.role || 'FUNCIONÁRIO', supervisorId: supId });
          });
        });
        if (derivedEmployees.length > 0) {
          // Prefer backend-derived employees as canonical. Replace the current
          // employees list with derived ones, but keep any non-colliding mock
          // employees to avoid losing unrelated data.
          const map: Record<string, any> = {};
          derivedEmployees.forEach((d: any) => { if (d) { const key = slug(String(d.name || d.id || '')); if (key) map[key] = d; } });
          (employees || []).forEach((p: any) => { if (p) { const key = slug(String(p.name || p.id || '')); if (key && !map[key]) map[key] = p; } });
          setEmployeesState(Object.values(map));
        }
      } catch (e) {
        // keep mock supervisors if fetch fails
        console.warn('Could not load supervisors from API, using mock data', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load persisted attendance + justifications when authenticated
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!accessToken) return;
      try {
        const attRes = await fetch('/api/attendance', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (attRes.ok) {
          const att = await attRes.json();
          if (!mounted) return;
          setRecords(att.map((r: any) => ({ employeeId: r.employeeId, day: r.day, apontador: r.apontador, supervisor: r.supervisor })));

          // If supervisors endpoint didn't provide employees, derive employees from attendance records
          try {
            const existingEmployees = (att || []).map((r: any) => ({ id: r.employeeId, name: r.employeeName || r.employeeId, supervisorId: r.supervisorId || (r.employeeId && r.employeeId.includes('-') ? r.employeeId.split('-')[0] : '') }));
            // dedupe by id
            const byId: Record<string, any> = {};
            for (const e of existingEmployees) {
              if (!e.id) continue;
              if (!byId[e.id]) byId[e.id] = e;
            }
            const derived = Object.values(byId);
            if (derived.length > 0) {
              // merge derived attendance-based employees with existing mocks
              // dedupe by slug(name) so we don't show the same person twice
              setEmployeesState(prev => {
                const map: Record<string, any> = {};
                prev.forEach((p: any) => { if (p) { const key = slug(String(p.name || p.id || '')); if (key) map[key] = p; } });
                derived.forEach((d: any) => { if (d) { const key = slug(String(d.name || d.id || '')); if (key) map[key] = d; } });
                return Object.values(map);
              });
            }
          } catch (e) {
            // ignore
          }
        }

        const justRes = await fetch('/api/attendance/justifications', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (justRes.ok) {
          const js = await justRes.json();
          if (!mounted) return;
          setJustifications(js.map((j: any) => ({ id: j._id || `just-${Date.now()}`, employeeId: j.employeeId, day: j.day, text: j.text })));
        }
      } catch (e) {
        // ignore errors (backend may not be available)
      }
    })();
    return () => { mounted = false; };
  }, [accessToken]);

  const getRecord = useCallback((employeeId: string, day: string): AttendanceRecord => {
    const existing = records.find(r => r.employeeId === employeeId && r.day === day);
    if (existing) return existing;
    return { employeeId, day, apontador: '', supervisor: '' };
  }, [records]);

  const updateRecord = useCallback((
    employeeId: string,
    day: string,
    field: 'apontador' | 'supervisor',
    value: AttendanceCode
  ) => {
    setRecords(prev => {
      const JUST_CODES_TO_PREFILL: AttendanceCode[] = ['AT', 'ABF', 'ABT'];
      const index = prev.findIndex(r => r.employeeId === employeeId && r.day === day);
      if (index >= 0) {
        const updated = [...prev];
        const existing = updated[index];
        // se o apontador mudou, sincroniza no supervisor salvo, exceto quando o supervisor
        // já tem uma justificativa de abono (AT/ABF/ABT) — nesses casos não sobrescreve.
        if (field === 'apontador') {
          const supervisorVal = JUST_CODES_TO_PREFILL.includes(existing.supervisor as AttendanceCode)
            ? existing.supervisor
            : value;
          updated[index] = { ...existing, apontador: value, supervisor: supervisorVal };
        } else {
          updated[index] = { ...existing, [field]: value };
        }
        return updated;
      }

      // não existe ainda — criamos record e, por padrão, sincronizamos supervisor com apontador
      if (field === 'apontador') {
        return [...prev, { employeeId, day, apontador: value, supervisor: value }];
      }
      return [...prev, { employeeId, day, apontador: '', supervisor: '', [field]: value }];
    });

    // Se o campo alterado for do supervisor e for uma justificativa de abono,
    // criar/atualizar uma justificativa pré-preenchida com "Nome — DD/MM/YYYY".
    const JUST_CODES_TO_PREFILL: AttendanceCode[] = ['AT', 'ABF', 'ABT'];
    if (field === 'supervisor' && JUST_CODES_TO_PREFILL.includes(value as AttendanceCode)) {
      const emp = employees.find((e) => e.id === employeeId);
      const dayInfo = daysInMonth.find((d) => d.day === day);
      const empName = emp?.name ?? employeeId;
      const dateBr = dayInfo ? format(dayInfo.date, 'dd/MM/yyyy') : day;
      const placeholder = `${empName} — ${dateBr}`;

      setJustifications((prev) => {
        const exists = prev.some((j) => j.employeeId === employeeId && j.day === day);
        if (exists) return prev;
        return [{ id: `just-${Date.now()}`, employeeId, day, text: placeholder }, ...prev];
      });
    }
  }, [employees, daysInMonth]);

  const clearAll = useCallback(() => {
    setRecords([]);
    setJustifications([]);
  }, []);

  const addJustification = useCallback((
    employeeId: string,
    day: string,
    text: string,
    applyToSupervisor?: boolean,
    supervisorCode?: AttendanceCode
  ) => {
    setJustifications(prev => [
      { id: `just-${Date.now()}`, employeeId, day, text },
      ...prev,
    ]);

    // Se solicitado, aplicar também à legenda do supervisor (AT/ABF/ABT)
    const JUST_CODES_TO_PREFILL: AttendanceCode[] = ['AT', 'ABF', 'ABT'];
    if (applyToSupervisor && supervisorCode && JUST_CODES_TO_PREFILL.includes(supervisorCode)) {
      // atualiza o registro do supervisor para este dia
      updateRecord(employeeId, day, 'supervisor', supervisorCode);
    }
  }, [updateRecord]);

  const removeJustification = useCallback((id: string) => {
    setJustifications(prev => prev.filter(j => j.id !== id));
  }, []);

  const getTotals = useCallback((day: string) => {
    let totalFaltas = 0;
    filteredEmployees.forEach(emp => {
      const record = getRecord(emp.id, day);
      const code = record.supervisor || record.apontador;
      if (code === 'F' || code === 'FT' || code === 'FM') {
        totalFaltas++;
      }
    });
    return totalFaltas;
  }, [filteredEmployees, getRecord]);

  const generateExportData = useCallback(() => {
    const data: any[] = [];
    
    filteredEmployees.forEach(emp => {
      const row: any = {
        funcionario: emp.name,
        funcao: emp.role,
      };
      
      daysInMonth.forEach(dayInfo => {
        const record = getRecord(emp.id, dayInfo.day);
        let finalValue = '';
        
        if (dayInfo.isSunday) {
          finalValue = 'DOM';
        } else {
          finalValue = record.supervisor || record.apontador || 'FOLGA';
        }
        
        row[`dia_${dayInfo.day}`] = finalValue;
      });
      
      data.push(row);
    });
    
    return data;
  }, [filteredEmployees, daysInMonth, getRecord]);

  // Save records + justifications to backend
  const saveAll = useCallback(async () => {
    try {
      // DEBUG: log payload to help diagnose save failures in browser
      try { console.debug('[saveAll] sending records', records); } catch (e) {}
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: accessToken ? `Bearer ${accessToken}` : '' },
        body: JSON.stringify({ records }),
      });
      if (!res.ok) {
        // attempt to read body for debugging
        let bodyText = '';
        try { bodyText = await res.text(); } catch (e) { bodyText = '<no body>'; }
        console.error('[saveAll] POST /api/attendance failed', res.status, bodyText);
        throw new Error('Failed to save attendance');
      }

      if (justifications.length > 0) {
        const jres = await fetch('/api/attendance/justifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: accessToken ? `Bearer ${accessToken}` : '' },
          body: JSON.stringify({ justifications }),
        });
        if (!jres.ok) throw new Error('Failed to save justifications');
      }

      // Refresh local state from backend so UI reflects canonical saved data
      try {
        const attRes = await fetch('/api/attendance', {
          headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' },
        });
        if (attRes.ok) {
          const att = await attRes.json();
          setRecords(att.map((r: any) => ({ employeeId: r.employeeId, day: r.day, apontador: r.apontador, supervisor: r.supervisor })));
        }

        const justRes = await fetch('/api/attendance/justifications', {
          headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' },
        });
        if (justRes.ok) {
          const js = await justRes.json();
          setJustifications(js.map((j: any) => ({ id: j._id || `just-${Date.now()}`, employeeId: j.employeeId, day: j.day, text: j.text })));
        }
        // Re-fetch canonical employees so UI uses current server-side list
        try {
          const empRes = await fetch('/api/employees', { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined });
          if (empRes.ok) {
            const emps = await empRes.json();
            const mapped = (Array.isArray(emps) ? emps : []).map((e: any) => ({ id: e.id || `${e.supervisorId}-${e.slug}`, name: e.name || e.displayName || e.slug, role: e.role || 'FUNCIONÁRIO', supervisorId: e.supervisorId }));
            // Merge returned employees with existing local list instead of replacing it
            setEmployeesState(prev => {
              const merged: Record<string, any> = {};
              // start with previous employees
              prev.forEach((p: any) => { const key = slug(String(p.name || p.id || '')); if (key) merged[key] = p; });
              // overwrite/add with server-provided employees
              mapped.forEach((m: any) => { const key = slug(String(m.name || m.id || '')); if (key) merged[key] = m; });
              return Object.values(merged);
            });
          }
        } catch (e) {
          // ignore employee refresh errors
        }
      } catch (e) {
        // ignore refresh errors but keep save success
        console.warn('Saved but failed to refresh local state', e);
      }

      return true;
    } catch (e) {
      console.error('Failed to save attendance', e);
      return false;
    }
  }, [records, justifications, accessToken]);

  return {
    currentDate,
    setCurrentDate,
    selectedSupervisor,
    setSelectedSupervisor,
    currentUserRole,
    setCurrentUserRole,
    records,
    justifications,
    daysInMonth,
    filteredEmployees,
    currentSupervisor,
    supervisors: supervisorsState,
    getRecord,
    updateRecord,
    clearAll,
    addJustification,
    removeJustification,
    getTotals,
    generateExportData,
    saveAll,
  };
}

// Persist currentDate when it changes
// Use an exported effect hook to avoid unexpected side effects at module import time.
export function usePersistCurrentDate(currentDate: Date) {
  useEffect(() => {
    try {
      localStorage.setItem('attendance_currentDate', currentDate.toISOString());
    } catch (e) {
      // ignore
    }
  }, [currentDate]);
}
