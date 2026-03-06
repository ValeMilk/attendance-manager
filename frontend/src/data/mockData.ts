import { Employee, Supervisor } from '@/types/attendance';

export const supervisors: Supervisor[] = [
  { id: 'sup_mari', name: 'MARIANA', store: 'REGIÃO - SUPERVISOR MARIANA' },
  { id: 'sup_paulo', name: 'PAULO ROBERTO', store: 'REGIÃO - SUPERVISOR PAULO ROBERTO' },
  { id: 'sup_paulinho', name: 'PAULINHO', store: 'REGIÃO - SUPERVISOR PAULINHO' },
  { id: 'sup_furtado', name: 'FURTADO', store: 'REGIÃO - SUPERVISOR FURTADO' },
];

export const employees: Employee[] = [
  // Supervisor: MARIANA
  { id: 'emp_m_1', name: 'MAX FELIX MONTEIRO', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_2', name: 'FRANCISCA NALDIANA DA SILVA OLIVEIRA', role: 'DEGUSTADORA (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_3', name: 'ANDERSON ABREU DA SILVA', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_4', name: 'DAVI ARAUJO DE LIMA', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_5', name: 'PAULA CELIA MOTA GOMES', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_6', name: 'JOAO MAKSON SA DE OLIVEIRA', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_7', name: 'CHRISTIAN WILLIAM ALVES DA SILVA', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_8', name: 'FRANKLIN MICHERTSY TERAN GONZALEZ', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_9', name: 'HERRYSON MESQUITA FREITAS', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_10', name: 'JAMYLLE MOREIRA DOS SANTOS', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_11', name: 'JOSE HUMBERTO SOUSA FERNANDES', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_12', name: 'TICIANA DANTAS CASSEMIRO DO NASCIMENTO', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_13', name: 'RICARDO VICTOR DE SOUSA SANTOS', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },
  { id: 'emp_m_14', name: 'ANTONIO JOSE VIEIRA FILHO', role: 'PROMOTOR (A)', supervisorId: 'sup_mari' },

  // Supervisor: PAULO ROBERTO
  { id: 'emp_p_1', name: 'DALTON CRISTIANO BARROS MEDEIROS', role: 'VENDEDOR (A)', supervisorId: 'sup_paulo' },
  { id: 'emp_p_2', name: 'RICARDO DE SOUSA LIMA', role: 'VENDEDOR (A)', supervisorId: 'sup_paulo' },
  { id: 'emp_p_3', name: 'FABRICIO GALDENCIO BRAGA', role: 'VENDEDOR (A)', supervisorId: 'sup_paulo' },
  { id: 'emp_p_4', name: 'DENIS FERNANDES DA COSTA', role: 'VENDEDOR (A)', supervisorId: 'sup_paulo' },
  { id: 'emp_p_5', name: 'ROBSON DE AMORIM', role: 'VENDEDOR (A)', supervisorId: 'sup_paulo' },
  { id: 'emp_p_6', name: 'LUCAS RODRIGUES SATIRO DE OLIVEIRA', role: 'VENDEDOR (A)', supervisorId: 'sup_paulo' },
  { id: 'emp_p_7', name: 'CHANDLE VITAL DINIZ DA SILVA', role: 'PROMOTOR (A)', supervisorId: 'sup_paulo' },
  { id: 'emp_p_8', name: 'ANTONIO GEAM FERREIRA DO NASCIMENTO', role: 'PROMOTOR (A)', supervisorId: 'sup_paulo' },
  { id: 'emp_p_9', name: 'CAROLINE IRINEU BARBOSA', role: 'PROMOTOR (A)', supervisorId: 'sup_paulo' },
  { id: 'emp_p_10', name: 'LEILIANE TEIXEIRA DOS SANTOS', role: 'PROMOTOR (A)', supervisorId: 'sup_paulo' },
  { id: 'emp_p_11', name: 'RAFAEL GOMES FELIX', role: 'PROMOTOR (A)', supervisorId: 'sup_paulo' },
  { id: 'emp_p_12', name: 'SAMUEL FERREIRA', role: 'PROMOTOR (A)', supervisorId: 'sup_paulo' },

  // Supervisor: PAULINHO
  { id: 'emp_pa_1', name: 'JOAO PAULO RODRIGUES DE SOUSA', role: 'VENDEDOR (A)', supervisorId: 'sup_paulinho' },
  { id: 'emp_pa_2', name: 'FELIPE JUNIOR ALVES DE FREITAS', role: 'VENDEDOR (A)', supervisorId: 'sup_paulinho' },
  { id: 'emp_pa_3', name: 'MARIA EDILENE MIRANDA', role: 'PROMOTOR (A)', supervisorId: 'sup_paulinho' },
  { id: 'emp_pa_4', name: 'MARCIO JOSE PEREIRA BARBOSA', role: 'VENDEDOR (A)', supervisorId: 'sup_paulinho' },
  { id: 'emp_pa_5', name: 'MARIA DANNIELY DOS SANTOS', role: 'PROMOTOR (A)', supervisorId: 'sup_paulinho' },
  { id: 'emp_pa_6', name: 'DANIEL PESSOA GOMES DA SILVA', role: 'PROMOTOR (A)', supervisorId: 'sup_paulinho' },
  { id: 'emp_pa_7', name: 'OLIVIA VIEIRA DA SILVA', role: 'VENDEDOR (A)', supervisorId: 'sup_paulinho' },
  { id: 'emp_pa_8', name: 'CLAUDECIL SANTOS DE CASTRO', role: 'PROMOTOR (A)', supervisorId: 'sup_paulinho' },
  { id: 'emp_pa_9', name: 'LUCILA RODRIGUES GALVAO', role: 'PROMOTOR (A)', supervisorId: 'sup_paulinho' },

  // Supervisor: FURTADO
  { id: 'emp_f_1', name: 'FRANCISCO JUNIOR LOURENCO BARBOSA', role: 'VENDEDOR (A)', supervisorId: 'sup_furtado' },
  { id: 'emp_f_2', name: 'JOSILENO GOIS DE SOUSA', role: 'VENDEDOR (A)', supervisorId: 'sup_furtado' },
  { id: 'emp_f_3', name: 'RAMON BARBOSA ROCHA', role: 'VENDEDOR (A)', supervisorId: 'sup_furtado' },
  { id: 'emp_f_4', name: 'FRANCISCO PEREIRA DOS ANJOS JUNIOR', role: 'VENDEDOR (A)', supervisorId: 'sup_furtado' },
  { id: 'emp_f_5', name: 'ROSILEIDE FERNANDES DE ARAUJO', role: 'VENDEDOR (A)', supervisorId: 'sup_furtado' },
  { id: 'emp_f_6', name: 'LUCAS DE LIMA SILVA', role: 'VENDEDOR (A)', supervisorId: 'sup_furtado' },
  { id: 'emp_f_7', name: 'ANTONIO ALEXANDRE DA SILVA SOUSA', role: 'VENDEDOR (A)', supervisorId: 'sup_furtado' },
  { id: 'emp_f_8', name: 'WESLEY OLIVEIRA SOUSA', role: 'PROMOTOR (A)', supervisorId: 'sup_furtado' },
];

// Brazilian holidays for 2025/2026
export const holidays: Record<string, string> = {
  '2025-01-01': 'Ano Novo',
  '2025-04-21': 'Tiradentes',
  '2025-05-01': 'Dia do Trabalho',
  '2025-09-07': 'Independência',
  '2025-10-12': 'N.S. Aparecida',
  '2025-11-02': 'Finados',
  '2025-11-15': 'Proclamação da República',
  '2025-12-25': 'Natal',
  '2026-01-01': 'Ano Novo',
  '2026-04-21': 'Tiradentes',
  '2026-05-01': 'Dia do Trabalho',
  '2026-09-07': 'Independência',
  '2026-10-12': 'N.S. Aparecida',
  '2026-11-02': 'Finados',
  '2026-11-15': 'Proclamação da República',
  '2026-12-25': 'Natal',
};
