import { useAttendance, usePersistCurrentDate } from '@/hooks/useAttendance';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Login } from '@/components/Login';
import { UserManagement } from '@/components/UserManagement';
import { HeaderControls } from '@/components/HeaderControls';
import { AttendanceTable } from '@/components/AttendanceTable';
import { JustificationsSection } from '@/components/JustificationsSection';
import { DataExport } from '@/components/DataExport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect } from 'react';

const Index = () => {
  const {
    currentDate,
    setCurrentDate,
    selectedSupervisor,
    setSelectedSupervisor,
    currentUserRole,
    setCurrentUserRole,
    justifications,
    daysInMonth,
    filteredEmployees,
    currentSupervisor,
    supervisors,
    getRecord,
    updateRecord,
    clearAll,
    addJustification,
    removeJustification,
    getTotals,
    saveAll,
    refreshData,
  } = useAttendance();

  // sync auth user role into attendance hook
  const AuthSync = () => {
    const { user } = useAuth();
    useEffect(() => {
      if (user) {
        if (currentUserRole !== user.role) {
          setCurrentUserRole(user.role as 'admin' | 'supervisor' | 'expectador');
        }
        if (user.role === 'supervisor') {
          // auto-select the supervisor id associated with the logged user so the UI
          // filters employees and shows the correct view for that supervisor
          const supId = (user as any).supervisorId || (user as any).id || 'all';
          setSelectedSupervisor(supId);
        }
      } else {
        // no user -> default admin (or guest)
        setCurrentUserRole('expectador');
      }
    }, [user, currentUserRole]);
    return null;
  };

  // persist currentDate so page reload keeps the current period
  usePersistCurrentDate(currentDate);

  // Auto-select first supervisor when switching to supervisor role
  useEffect(() => {
    if (currentUserRole === 'supervisor' && selectedSupervisor === 'all') {
      setSelectedSupervisor(supervisors[0]?.id || 'all');
    }
  }, [currentUserRole, selectedSupervisor, supervisors, setSelectedSupervisor]);

  // período vigente: 26 deste mês → 25 do próximo
  const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 26);
  const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 25);
  const periodLabel = `${format(periodStart, 'MMMM yyyy', { locale: ptBR }).toUpperCase()} — ${format(periodEnd, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-background">
      <AuthSync />
      {/* Page Header */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-lg">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sistema de Apontamento de Presença</h1>
            <p className="text-sm text-primary-foreground/80">Gestão de frequência de funcionários</p>
          </div>
          <div className="flex items-center gap-2 text-sm bg-primary-foreground/10 px-3 py-1.5 rounded-lg">
            <span className="text-primary-foreground/70">Usuário:</span>
            <span className="font-semibold">
              {currentUserRole === 'admin' ? 'Administrador' : currentUserRole === 'expectador' ? 'Expectador' : currentSupervisor?.name || 'Supervisor'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 py-6">
        <HeaderControls
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          selectedSupervisor={selectedSupervisor}
          onSupervisorChange={setSelectedSupervisor}
          supervisors={supervisors}
          currentUserRole={currentUserRole}
          onRoleChange={setCurrentUserRole}
          onClearAll={clearAll}
          onRefresh={refreshData}
        />

        <AttendanceTable
          employees={filteredEmployees}
          daysInMonth={daysInMonth}
          getRecord={getRecord}
          updateRecord={updateRecord}
          getTotals={getTotals}
          currentUserRole={currentUserRole}
          supervisorName={currentSupervisor?.name}
          storeName={currentSupervisor?.store}
          periodLabel={periodLabel}
          onSave={saveAll}
        />

        <JustificationsSection
          justifications={justifications.filter(j => 
            filteredEmployees.some(e => e.id === j.employeeId)
          )}
          employees={filteredEmployees}
          daysInMonth={daysInMonth}
          onAdd={addJustification}
          onRemove={removeJustification}
          currentUserRole={currentUserRole}
        />

        {currentUserRole === 'admin' && (
          <DataExport
            employees={filteredEmployees}
            daysInMonth={daysInMonth}
            getRecord={getRecord}
            periodLabel={periodLabel}
            supervisors={supervisors}
          />
        )}

        {/* If not authenticated, show login */}
        {/* show user management for admin within the auth provider */}
        <AuthArea />
      </main>

      {/* Footer */}
      <footer className="bg-muted border-t border-border py-4 px-6 mt-8">
        <div className="max-w-[1800px] mx-auto text-center text-sm text-muted-foreground">
          Sistema de Apontamento de Presença © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Index;

function AuthArea(){
  const { user } = useAuth();
  if(!user) return (
    <main className="max-w-[1800px] mx-auto px-4 py-6">
      <Login />
    </main>
  );
  return (
    <main className="max-w-[1800px] mx-auto px-4 py-6">
      {user.role === 'admin' && <UserManagement />}
    </main>
  );
}
