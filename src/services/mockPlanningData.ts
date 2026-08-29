/**
 * Fallback mock data used when the Planning Tool API (localhost-only FastAPI service) can't be
 * reached — e.g. when this app runs inside a Power Apps environment without access to the
 * developer's local machine. Keeps the page populated instead of showing an error.
 */
import type {
  AvailabilityResponse,
  EmployeeAvailability,
  GetAvailabilityParams,
  WeekAvailability,
  WeekUren,
} from './planningToolService';

interface MockEmployee {
  id: number;
  name: string;
  department_category: string;
  department_name: string;
  contract_type: string;
  hours_per_week: number;
  /** Hours reserved (leave/overhead) each week, mirrors the small "reservering" block seen in real data. */
  reserveHours: number;
  projectCode: string;
  projectClient: string;
}

const MOCK_EMPLOYEES: MockEmployee[] = [
  { id: 1, name: 'Vincent van Gogh', department_category: 'Intern', department_name: 'Direct mdw', contract_type: 'fulltime', hours_per_week: 40, reserveHours: 4, projectCode: 'P010001-01-100', projectClient: 'Contoso' },
  { id: 2, name: 'Claude Monet', department_category: 'Intern', department_name: 'Direct mdw', contract_type: 'fulltime', hours_per_week: 40, reserveHours: 4, projectCode: 'P010002-01-100', projectClient: 'Fabrikam' },
  { id: 3, name: 'Frida Kahlo', department_category: 'Business', department_name: 'Business Unit', contract_type: 'parttime', hours_per_week: 32, reserveHours: 4, projectCode: 'P010003-01-100', projectClient: 'Northwind Traders' },
  { id: 4, name: 'Pablo Picasso', department_category: 'Intern', department_name: 'Direct mdw', contract_type: 'fulltime', hours_per_week: 40, reserveHours: 8, projectCode: 'P010004-01-100', projectClient: 'Adventure Works' },
  { id: 5, name: 'Rembrandt van Rijn', department_category: 'Intern', department_name: 'Direct mdw', contract_type: 'fulltime', hours_per_week: 40, reserveHours: 0, projectCode: 'P010005-01-100', projectClient: 'Tailwind Traders' },
  { id: 6, name: 'Johannes Vermeer', department_category: 'Extern', department_name: 'Externen', contract_type: 'fulltime', hours_per_week: 0, reserveHours: 0, projectCode: '', projectClient: '' },
  { id: 7, name: 'Georgia O\u2019Keeffe', department_category: 'Extern', department_name: 'Externen', contract_type: 'fulltime', hours_per_week: 0, reserveHours: 0, projectCode: '', projectClient: '' },
  { id: 8, name: 'Salvador Dal\u00ed', department_category: 'Extern', department_name: 'Externen', contract_type: 'fulltime', hours_per_week: 0, reserveHours: 0, projectCode: '', projectClient: '' },
  { id: 9, name: 'Piet Mondriaan', department_category: 'Business', department_name: 'Business Unit', contract_type: 'fulltime', hours_per_week: 40, reserveHours: 4, projectCode: 'P010009-01-100', projectClient: 'Wingtip Toys' },
  { id: 10, name: 'Henri Matisse', department_category: 'Business', department_name: 'Business Unit', contract_type: 'fulltime', hours_per_week: 40, reserveHours: 8, projectCode: 'P010010-01-100', projectClient: 'Woodgrove Bank' },
];

const MOCK_DEPARTMENTS = Array.from(new Set(MOCK_EMPLOYEES.map((e) => e.department_category))).sort();

function isoWeeksInYear(year: number): number {
  const p = (y: number) => (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
  return p(year) === 4 || p(year - 1) === 3 ? 53 : 52;
}

function getCurrentIsoWeek(): { week: number; year: number } {
  const now = new Date();
  const target = new Date(now.valueOf());
  const dayNr = (now.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target.valueOf() - firstThursday.valueOf();
  const week = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
  return { week, year: target.getFullYear() };
}

function mondayOfIsoWeek(week: number, year: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const monday = new Date(simple);
  monday.setDate(simple.getDate() - (dow === 0 ? 6 : dow - 1));
  return monday;
}

// Mirrors the real ClockWise pattern (e.g. Sem/Jordi): a small "reservering" block plus the
// remaining hours booked as "inzet" on one project, with the final week fully reserved (leave).
function buildMockWeekUren(employee: MockEmployee, weekIndex: number, numWeeks: number): WeekUren[] {
  if (employee.hours_per_week === 0) return [];

  const isLastWeek = weekIndex === numWeeks - 1;
  if (isLastWeek && employee.id % 3 === 0) {
    return [{ type: 'reservering', hours: employee.hours_per_week }];
  }

  const segments: WeekUren[] = [];
  if (employee.reserveHours > 0) {
    segments.push({ type: 'reservering', hours: employee.reserveHours });
  }

  const projectHours = employee.hours_per_week - employee.reserveHours;
  if (projectHours > 0) {
    segments.push({
      type: 'inzet',
      hours: projectHours,
      project_id: 20000 + employee.id,
      project_code: employee.projectCode,
      project_name: `${employee.name} - via BrightPath bij ${employee.projectClient}`,
    });
  }

  return segments;
}

function buildMockWeeks(employee: MockEmployee, startWeek: number, year: number, numWeeks: number): WeekAvailability[] {
  const weeks: WeekAvailability[] = [];
  for (let i = 0; i < numWeeks; i++) {
    const totalWeeksInYear = isoWeeksInYear(year);
    const weekNr = ((startWeek - 1 + i) % totalWeeksInYear) + 1;
    const weekUren = buildMockWeekUren(employee, i, numWeeks);
    const totalHours = weekUren.reduce((sum, u) => sum + u.hours, 0);
    weeks.push({
      week_nr: weekNr,
      monday: mondayOfIsoWeek(weekNr, year).toISOString().slice(0, 10),
      total_hours: totalHours,
      is_fully_assigned: employee.hours_per_week > 0 && totalHours >= employee.hours_per_week,
      week_uren: weekUren,
    });
  }
  return weeks;
}

function toEmployeeAvailability(employee: MockEmployee, startWeek: number, year: number, numWeeks: number): EmployeeAvailability {
  return {
    id: employee.id,
    name: employee.name,
    department_category: employee.department_category,
    department_name: employee.department_name,
    contract_type: employee.contract_type,
    hours_per_week: employee.hours_per_week,
    status: 'actief',
    weeks: buildMockWeeks(employee, startWeek, year, numWeeks),
  };
}

export function buildMockAvailability(params: GetAvailabilityParams): AvailabilityResponse {
  const current = getCurrentIsoWeek();
  const startWeek = params.week ?? current.week;
  const year = params.year ?? current.year;
  const numWeeks = params.weeks ?? 5;

  const employees = params.department
    ? MOCK_EMPLOYEES.filter((e) => e.department_category === params.department)
    : MOCK_EMPLOYEES;

  return {
    week_start: startWeek,
    year,
    num_weeks: numWeeks,
    generated_at: new Date().toISOString(),
    employees: employees.map((e) => toEmployeeAvailability(e, startWeek, year, numWeeks)),
  };
}

export function buildMockEmployeeAvailability(
  employeeId: number,
  params: Omit<GetAvailabilityParams, 'department'>,
): EmployeeAvailability {
  const current = getCurrentIsoWeek();
  const startWeek = params.week ?? current.week;
  const year = params.year ?? current.year;
  const numWeeks = params.weeks ?? 5;

  const employee = MOCK_EMPLOYEES.find((e) => e.id === employeeId) ?? MOCK_EMPLOYEES[0];
  return toEmployeeAvailability(employee, startWeek, year, numWeeks);
}

export function getMockDepartments(): string[] {
  return MOCK_DEPARTMENTS;
}
