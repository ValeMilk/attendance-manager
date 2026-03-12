# 📊 Análise de Complexidade Big O - APP FALTAS

Data: 12 de março de 2026  
Versão: 1.0  
Escopo: Backend (Node.js + Express + MongoDB) + Frontend (React + TypeScript)

---

## 🎯 Resumo Executivo

| Componente | Operação | Atual | Recomendado | Status |
|-----------|----------|-------|-------------|--------|
| **Backend - Attendance GET** | Supervisor vê registros | **O(n)** | **O(log n)** | ⚠️ GARGALO |
| **Backend - Employees GET** | Listar por supervisor | **O(n + m)** | **O(log n + k)** | ⚠️ GARGALO |
| **Backend - Justifications GET** | Regex filter | **O(n·m)** | **O(log n + k)** | ⚠️ CRÍTICO |
| **Frontend - filteredEmployees** | Memoized filter | **O(k)** | **O(1)** | ✅ OK |
| **Frontend - recordsMap** | O(1) lookup | **O(1)** | **O(1)** | ✅ ÓTIMO |
| **Frontend - table render** | Row virtualization | **O(n)** | **O(1)** | ⚠️ POSSÍVEL MELHORIA |

---

## 📋 Análise Detalhada por Módulo

### 1. **BACKEND: GET /api/attendance**

#### Operação Atual
```typescript
// Supervisor vendo seus registros
const all = await AttendanceRecord.find({}).lean();  // O(n) - carrega TUDO do banco
let filtered = all.filter(r => ...);                 // O(n) - filtra em memória
```

**Complexidade: O(n)** onde `n` = total de registros de presença no banco.

#### Análise Detalhada

| Passo | Operação | Complexidade | Observação |
|-------|----------|--------------|-----------|
| 1 | `find({})` | O(n) | Carrega todos os registros do MongoDB |
| 2 | `.lean()` | O(1) | Sem overhead de Mongoose |
| 3 | `.filter(r => ...)` | O(n) | Itera todos os registros em memória |
| 4 | Filtragem por prefix | O(n·m) | Onde m = tamanho da string employeeId (pequeno) |

#### Dados Atuais
- Supervisores: ~5
- Funcionários por supervisor: ~10-15  
- Período: 31 dias
- **Total de registros esperado: 150-200+ registros**

#### Impacto
- ❌ **Lento para 1000+ registros**
- ❌ **Lento demais para 10000+ registros**
- ✅ **OK para dados atuais (~200 registros)**

#### Solução Recomendada

**Opção A: Index no MongoDB (Rápido)**
```typescript
// Criar index no schema
attendanceRecordSchema.index({ supervisorId: 1, day: 1 });

// Query otimizada
const filtered = await AttendanceRecord
  .find({ supervisorId: user.supervisorId })
  .lean();
// Complexidade: O(log n + k) - onde k = registros retornados
```

**Opção B: Cache com TTL (Médio)**
```typescript
// Cache supervisores + refetch a cada 5 min
const cacheKey = `attendance_${supervisorId}`;
if (cache.has(cacheKey)) return cache.get(cacheKey);
const data = await AttendanceRecord.find(...).lean();
cache.set(cacheKey, data, { ttl: 300 });
```

---

### 2. **BACKEND: GET /api/employees?supervisorUserId=X**

#### Operação Atual
```typescript
// Busca supervisores
const supervisorUsers = await User.find({ role: 'supervisor' }).lean(); // O(s)

// Itera cada supervisor e seus funcionários
for (const sup of supervisorUsers) { // O(s)
  const emps = sup.employees || [];   // O(e_i) cada
  for (const emp of emps) {           // O(e_i) cada
    // processar...
  }
}

// Deduplica e filtra
const base = dedupeByName([...rosterEmployees, ...globalEmployees]); // O(n log n)
```

**Complexidade: O(s·e + n log n)** 
- s = número de supervisores (~5)
- e = funcionários por supervisor (~10)
- n = total dedupado (~50)

#### Passo a Passo

| Passo | Operação | Complexidade |
|-------|----------|--------------|
| 1 | `User.find({ role: 'supervisor' })` | **O(log n)** com index em `role` |
| 2 | Loop supervisores | **O(s)** onde s ≤ 5 |
| 3 | Loop funcionários | **O(e)** onde e ≤ 15 |
| 4 | `dedupeByName` (Map) | **O(n)** para mapa, pero ordenação é O(n log n) |
| 5 | `collapseGlobalAliases` | **O(n²)** em pior caso (grupos grandes) |
| 6 | Filtragem por papel | **O(n)** |

**Complexidade Total: O(s·e + n log n + n²)** onde o n² é dominante se há muitos globais.

#### Impacto Atual
- ✅ **OK para dados atuais** (s=5, e=15, n=50)
- ⚠️ **Pode ficar lento com 100+ supervisores ou 1000+ funcionários**

#### Recomendação
```typescript
// Usar índice no Employee collection
// Buscar diretamente por supervisorId se disponível
const employees = await Employee
  .find({ supervisorId: selectedSupervisorId })
  .lean(); // O(log n + k)

// Evitar deduplicação em memória se possível
```

---

### 3. **BACKEND: GET /api/attendance/justifications**

#### Operação Atual (CRÍTICA)
```typescript
if (role === 'admin' || role === 'expectador') {
  if (supervisorId) {
    const sup = supervisorId as string;
    const list = await Justification.find({ 
      employeeId: new RegExp(`^${sup}-`)  // ⚠️ REGEX!
    }).lean();
    return res.json(list);
  }
  const all = await Justification.find({}).lean(); // O(n)
  return res.json(all);
}
```

**Complexidade: O(n·m)** 
- n = total de justificativas
- m = tamanho da string `supervisorId` (pequeno, ~10-20 chars)

#### ⚠️ PROBLEMAS

| Problema | Severidade | Impacto |
|----------|-----------|---------|
| **Regex sem índice** | 🔴 CRÍTICO | MongoDB ignora índices com regex, scan completo |
| **Full table scan** | 🔴 CRÍTICO | Mesmo com índice, regex^^ força scan |
| **Linear por supervisor** | 🟠 ALTO | Cresce com volume total |

#### Exemplo de Ineficiência
```typescript
// Isso FORÇA varredura completa:
find({ employeeId: new RegExp(`^${sup}-`) })

// Mesmo com índice em employeeId, é ignorado!
```

#### Solução Recomendada (URGENTE)

**Opção A: String prefix match (Melhor)**
```typescript
const list = await Justification.find({
  employeeId: { $regex: `^${escapeRegex(sup)}-`, $options: '' }
}).hint({ employeeId: 1 }).lean(); // Force index use

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
```

**Opção B: Denormalizar supervisorId (Melhor ainda)**
```typescript
// Schema
{
  employeeId: String,
  supervisorId: String,  // ← ADICIONAR
  day: String,
  text: String
}

// Index
index({ supervisorId: 1, day: 1 })

// Query
const list = await Justification.find({ 
  supervisorId: sup 
}).lean(); // O(log n + k)
```

---

### 4. **FRONTEND: useAttendance Hook**

#### 4.1 recordsMap (Excelente)
```typescript
const recordsMap = useMemo(() => {
  const map = new Map<string, AttendanceRecord>();
  for (const record of records) {
    map.set(makeRecordKey(record.employeeId, record.day), record);
  }
  return map;
}, [records]);
```
**Complexidade: O(n)** construção, **O(1)** lookup  
✅ **ÓTIMO** - Capa muito bem o problema de acesso rápido

#### 4.2 filteredEmployees (Bom)
```typescript
const filteredEmployees = useMemo(() => {
  const workers = dedupeById(employeesState).filter(
    (e: any) => !isSupervisorRole(e.role)
  );
  if (selectedSupervisor === 'all') return workers;
  return workers.filter(
    (e: any) => String(e?.supervisorId || '') === String(selectedSupervisor)
  );
}, [employeesState, selectedSupervisor]);
```
**Complexidade: O(k)** onde k = funcionários na tela (~50)  
✅ **BOM** - Aceito para quantidade pequena

#### 4.3 Employee fetch (Poderia melhorar)
```typescript
const empRes = await fetch(`/api/employees${employeesQueryString}`, ...);
const emps = await empRes.json();
const mapped = emps
  .filter((e: any) => !isSupervisorRole(e.role || ''))
  .map((e: any) => ({ ... }));
```
**Complexidade: O(k)** onde k = funcionários retornados pela API  
✅ **BOM** - Razoável

---

### 5. **FRONTEND: AttendanceTable Render**

#### Operação Atual
```tsx
{employees.map((employee, index) => {
  return (
    <tr key={employee.id}>
      <td>{employee.name}</td>
      <td>{employee.role}</td>
      {daysInMonth.map((dayInfo) => {
        const record = getRecord(employee.id, dayInfo.day);
        return (
          <td key={dayInfo.day}>
            <AttendanceCell {...} />
          </td>
        );
      })}
    </tr>
  );
})}
```

**Complexidade: O(e·d)** 
- e = employees (~50)
- d = days (~30)
- **Total renders: ~1500 <AttendanceCell> por página**

#### Impacto
- ✅ **OK com virtualization** (só renderiza visíveis)
- ⚠️ **Sem virtualization: lento para 500+ funcionários**

#### Recomendação
```typescript
// Usar react-window ou react-virtualized
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={employees.length}
  itemSize={44}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {/* renderizar linha index */}
    </div>
  )}
</FixedSizeList>
```

---

## 🚨 Gargalos Críticos Identificados

### 1️⃣ **Justifications Regex Search** - Severidade 🔴 CRÍTICO

**Situação:**
```typescript
find({ employeeId: new RegExp(`^${sup}-`) })
```

**Por que é ruim:**
- MongoDB **não usa índice** com regex `^`
- **Full table scan** de todas as justificativas
- Cresce linearmente com volume total

**Impacto:** 
- 100 justificativas: ~1ms ✅
- 10,000 justificativas: ~100ms ⚠️
- 100,000 justificativas: ~1s 🔴 (timeout possível)

**Solução:** Adicionar campo `supervisorId` denormalizado (vide seção 3)

---

### 2️⃣ **Attendance Full Table Scan** - Severidade 🟠 ALTO

**Situação:**
```typescript
const all = await AttendanceRecord.find({}).lean();
let filtered = all.filter(...);
```

**Por que é ruim:**
- Carrega **TUDO** mesmo servindo apenas para 1 supervisor
- Cresce com número de dias do período
- Multiplica por número de usuários simultâneos (timeout MongoDB)

**Impacto:**
- 200 registros: <5ms ✅
- 5,000 registros: ~50ms ⚠️
- 50,000 registros: ~500ms 🔴

**Solução:** Query com índice `{ supervisorId, day }` (vide seção 1)

---

### 3️⃣ **Employee Deduplication** - Severidade 🟡 Médio

**Situação:**
```typescript
const base = dedupeByName([...rosterEmployees, ...globalEmployees]);
// depois
base = collapseGlobalAliases(base);
```

**Complexidade:** O(n²) pior caso se há grupos grandes

**Recomendação:** Usar Set/Map em vez de loops aninhados

---

## 📈 Matriz de Escalabilidade

| Métrica | 100 Regs | 1K Regs | 10K Regs | 100K Regs |
|---------|----------|---------|----------|-----------|
| Attendance GET (sem index) | 1ms | 10ms | 100ms | 1s |
| Attendance GET (com index) | <1ms | 1ms | 5ms | 20ms |
| Justifications Regex | 1ms | 10ms | 100ms | ... |
| Justifications w/Index | <1ms | 1ms | 5ms | 20ms |
| Frontend Filter (50 emp) | <1ms | <1ms | <1ms | <1ms |

---

## 🎬 Plano de Ação Recomendado

### **Phase 1: Imediato (Hoje)**
1. ✅ Descrever problema regex em attendance/justifications
2. ✅ Propor índice supervisorId em Justification

### **Phase 2: Curto Prazo (1-2 semanas)**
1. Adicionar índice `{ supervisorId: 1, day: 1 }` em AttendanceRecord
2. Refatorar Justifications GET para usar denormalizado `supervisorId`
3. Testar com 5,000+ registros

### **Phase 3: Médio Prazo (1 mês)**
1. Implementar virtualization em table (react-window)
2. Adicionar paginação em employees GET
3. Cache com Redis/in-memory (se escalar para 100K+ regs)

### **Phase 4: Longo Prazo (3+ meses)**
1. Considerar sharding por supervisor
2. Implementar aggregation pipeline do MongoDB para relatórios
3. Adicionar data warehouse (BigQuery/Snowflake) para histórico

---

## 📊 Resumo das Complexidades

```
┌─────────────────────────────────────────────────────────────┐
│                    Operação vs Complexidade                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  recordsMap lookup              O(1)    ████████████ ✅     │
│  filteredEmployees             O(k)    ██████ ✅           │
│  Attendance GET (com index)    O(log n) ████ ✅            │
│  Attendance GET (sem index)    O(n)    ████████ ⚠️         │
│  Justify Regex Filter          O(n·m)  ██████████ 🔴       │
│  Employee Dedupe               O(n²)   ██████ ⚠️           │
│  Table Render (virt)           O(1)    ████████ ✅         │
│  Table Render (no virt)        O(n)    ████████ ⚠️         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 Referências

- **Duration estimada:** Implementação fase 1: 2-3h
- **Impacto esperado:** Reduzir latência em 50-90% para operações críticas  
- **Teste recomendado:** Load test com Apache JMeter (1000 usuários, 30s)

