/**
 * Client for the local ClockWise Planning Tool API (see /Users/wietduur/Documents/DEV/planning-tool).
 *
 * NOTE: This currently talks directly to the FastAPI server via fetch (CORS is open on the API).
 * Once a Power Platform custom connector is registered for this API, this file can be swapped
 * for a generated `src/generated/services/PlanningToolService.ts` client without changing the
 * page code, as long as the exported function signatures below stay the same.
 */

// Configurable via VITE_PLANNING_API_BASE_URL, defaults to the local dev server.
const BASE_URL = (import.meta.env.VITE_PLANNING_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

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

export interface AvailabilityResponse {
  week_start: number;
  year: number;
  num_weeks: number;
  generated_at: string;
  employees: EmployeeAvailability[];
}

export interface GetAvailabilityParams {
  week?: number;
  year?: number;
  weeks?: number;
  department?: string;
}

async function getJson<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Planning tool API request failed (${response.status}): ${path}`);
  }
  return response.json() as Promise<T>;
}

export const PlanningToolService = {
  getAvailability(params: GetAvailabilityParams = {}): Promise<AvailabilityResponse> {
    return getJson<AvailabilityResponse>('/availability', {
      week: params.week,
      year: params.year,
      weeks: params.weeks,
      department: params.department,
    });
  },

  getEmployeeAvailability(
    employeeId: number,
    params: Omit<GetAvailabilityParams, 'department'> = {},
  ): Promise<EmployeeAvailability> {
    return getJson<EmployeeAvailability>(`/availability/${employeeId}`, {
      week: params.week,
      year: params.year,
      weeks: params.weeks,
    });
  },

  getDepartments(): Promise<string[]> {
    return getJson<string[]>('/departments');
  },
};

/** Returns the number of ISO weeks (52 or 53) in a given year. */
function isoWeeksInYear(year: number): number {
  const p = (y: number) => (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
  return p(year) === 4 || p(year - 1) === 3 ? 53 : 52;
}

/** Shifts an ISO (week, year) pair by `delta` weeks, rolling over into adjacent years. */
export function shiftIsoWeek(week: number, year: number, delta: number): { week: number; year: number } {
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
