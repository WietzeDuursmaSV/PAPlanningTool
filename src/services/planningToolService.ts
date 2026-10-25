import { PlanningAPIService } from '../generated';

export type Uursoort = 'feestdag' | 'reservering' | 'inzet' | 'beschikbaar';

export interface WeekUren {
  type: Uursoort;
  hours: number;
  project_id?: number | null;
  project_code?: string | null;
  project_name?: string | null;
}

export interface WeekAvailability {
  week_nr: number;
  monday: string;
  total_hours: number;
  is_fully_assigned: boolean;
  week_uren: WeekUren[];
}

export interface EmployeeAvailability {
  id: number;
  name: string;
  department_category?: string | null;
  department_name?: string | null;
  contract_type: string;
  hours_per_week: number;
  status: string;
  weeks: WeekAvailability[];
}

export interface EmployeeAssignment {
  internal_id: number;
  project_id: number;
  employee_id: number;
  status: string;
  start_date: string;
  end_date?: string | null;
  hours_budget?: number | null;
  hours_per_week: number;
  project: {
    internal_id: number;
    name: string;
    code?: string | null;
    status: string;
    customer: {
      internal_id: number;
      name: string;
    };
  };
}

export interface EmployeeDetails {
  internal_id: number;
  name: string;
  login: string;
  function?: string | null;
  start_date: string;
  end_date?: string | null;
  hours_per_week: number;
  contract_type: string;
  status: string;
  department_id: number;
  assignments: EmployeeAssignment[];
}

export interface AvailabilityResponse {
  week_start: number;
  year: number;
  num_weeks: number;
  generated_at: string;
  employees: EmployeeAvailability[];
  /** Set to 'mock' when the real API couldn't be reached and mock data was used instead. */
  source?: 'live' | 'mock';
}

export interface GetAvailabilityParams {
  week?: number;
  year?: number;
  weeks?: number;
  department?: string;
}

export const PlanningToolService = {
  async getAvailability(params: GetAvailabilityParams = {}): Promise<AvailabilityResponse> {
    try {
      const result = await PlanningAPIService.GetAvailability(
        params.week,
        params.year,
        params.weeks,
        params.department,
      );
      if (!result.success || !result.data) {
        throw result.error ?? new Error('Planning API beschikbaarheid kon niet worden geladen.');
      }
      return { ...(result.data as unknown as AvailabilityResponse), source: 'live' };
    } catch {
      const { buildMockAvailability } = await import('./mockPlanningData');
      return { ...buildMockAvailability(params), source: 'mock' };
    }
  },

  async getEmployeeAvailability(
    employeeId: number,
    params: Omit<GetAvailabilityParams, 'department'> = {},
  ): Promise<EmployeeAvailability> {
    try {
      const result = await PlanningAPIService.GetEmployeeAvailability(
        employeeId,
        params.week,
        params.year,
        params.weeks,
      );
      if (!result.success || !result.data) {
        throw (
          result.error ??
          new Error('Planning API medewerkerbeschikbaarheid kon niet worden geladen.')
        );
      }
      return result.data as unknown as EmployeeAvailability;
    } catch {
      const { buildMockEmployeeAvailability } = await import('./mockPlanningData');
      return buildMockEmployeeAvailability(employeeId, params);
    }
  },

  async getEmployeeDetails(employeeId: number): Promise<EmployeeDetails> {
    const result = await PlanningAPIService.GetEmployeeDetails(employeeId);
    if (!result.success || !result.data) {
      throw result.error ?? new Error('Planning API medewerkerdetails konden niet worden geladen.');
    }
    return result.data as unknown as EmployeeDetails;
  },

  async getDepartments(): Promise<string[]> {
    try {
      const result = await PlanningAPIService.GetDepartments();
      if (
        !result.success ||
        !Array.isArray(result.data) ||
        !result.data.every((department): department is string => typeof department === 'string')
      ) {
        throw result.error ?? new Error('Planning API afdelingen konden niet worden geladen.');
      }
      return result.data;
    } catch {
      const { getMockDepartments } = await import('./mockPlanningData');
      return getMockDepartments();
    }
  },
};

/** Returns the number of ISO weeks (52 or 53) in a given year. */
function isoWeeksInYear(year: number): number {
  const p = (y: number) => (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
  return p(year) === 4 || p(year - 1) === 3 ? 53 : 52;
}

/** Shifts an ISO (week, year) pair by `delta` weeks, rolling over into adjacent years. */
export function shiftIsoWeek(
  week: number,
  year: number,
  delta: number,
): { week: number; year: number } {
  let w = week + delta;
  let y = year;

  while (w < 1) {
    y -= 1;
    w += isoWeeksInYear(y);
  }
  while (w > isoWeeksInYear(y)) {
    w -= isoWeeksInYear(y);
    y += 1;
  }

  return { week: w, year: y };
}
