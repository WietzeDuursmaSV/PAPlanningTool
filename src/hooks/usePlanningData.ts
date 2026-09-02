import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Office365UsersService } from '../generated';
import {
  PlanningToolService,
  shiftIsoWeek,
  type EmployeeAvailability,
} from '../services/planningToolService';

function toOffice365PhotoUrl(photo: string): string {
  return photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`;
}

function withTimeout<T>(request: Promise<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), 10000);
    request.then(
      (result) => {
        window.clearTimeout(timeoutId);
        resolve(result);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

export function usePlanningData() {
  const [week, setWeek] = useState<number | undefined>();
  const [year, setYear] = useState<number | undefined>();
  const [weeksToShow, setWeeksToShow] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [hideFullyAssigned, setHideFullyAssigned] = useState(false);
  const [department, setDepartment] = useState('Intern');
  const [departmentName, setDepartmentName] = useState<string | undefined>();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const availabilityQuery = useQuery({
    queryKey: ['planning-tool', 'availability', week, year, weeksToShow, department],
    queryFn: () =>
      PlanningToolService.getAvailability({
        week,
        year,
        weeks: weeksToShow,
        department: department || undefined,
      }),
  });

  const departmentsQuery = useQuery({
    queryKey: ['planning-tool', 'departments'],
    queryFn: () => PlanningToolService.getDepartments(),
  });

  const employeeDetailQuery = useQuery({
    queryKey: ['planning-tool', 'employee', selectedEmployeeId],
    queryFn: () => PlanningToolService.getEmployeeAvailability(selectedEmployeeId as number),
    enabled: selectedEmployeeId !== null,
  });

  const data = availabilityQuery.data;
  const selectedEmployee = data?.employees.find((employee) => employee.id === selectedEmployeeId);
  const isSelectedEmployeeInternal = selectedEmployee?.department_category === 'Intern';

  const office365ProfileQuery = useQuery({
    queryKey: ['office365-user', selectedEmployee?.name],
    queryFn: async () => {
      const searchResult = await withTimeout(
        Office365UsersService.SearchUserV2(selectedEmployee?.name, 10, true),
        'Office 365-profiel kon niet worden geladen.',
      );
      if (!searchResult.success) {
        throw searchResult.error ?? new Error('Office 365-profiel kon niet worden geladen.');
      }

      const office365User = searchResult.data?.value?.find(
        (user) =>
          user.DisplayName?.localeCompare(selectedEmployee?.name ?? '', undefined, {
            sensitivity: 'accent',
          }) === 0,
      );
      if (!office365User) return null;

      const profileResult = await withTimeout(
        Office365UsersService.UserProfile_V2(
          office365User.Id,
          'displayName,jobTitle,department,mail,mobilePhone,businessPhones,officeLocation',
        ),
        'Office 365-profiel kon niet worden geladen.',
      );
      if (!profileResult.success) {
        throw profileResult.error ?? new Error('Office 365-profiel kon niet worden geladen.');
      }

      let photo: string | undefined;
      try {
        const photoResult = await withTimeout(
          Office365UsersService.UserPhoto_V2(office365User.Id),
          'Office 365-foto kon niet worden geladen.',
        );
        if (photoResult.success && photoResult.data) photo = toOffice365PhotoUrl(photoResult.data);
      } catch {
        // A missing or unavailable photo must not prevent profile details from displaying.
      }

      return { profile: profileResult.data, photo };
    },
    enabled: isSelectedEmployeeInternal && !!selectedEmployee?.name,
    retry: false,
  });

  const filteredEmployees = useMemo(() => {
    if (!data) return [];

    return data.employees.filter((employee: EmployeeAvailability) => {
      if (
        searchTerm.trim() &&
        !employee.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
      ) {
        return false;
      }
      if (hideFullyAssigned && employee.weeks.every((entry) => entry.is_fully_assigned)) {
        return false;
      }
      return !departmentName || employee.department_name === departmentName;
    });
  }, [data, searchTerm, hideFullyAssigned, departmentName]);

  const departmentNames = useMemo(() => {
    if (!data) return [];
    return Array.from(
      new Set(
        data.employees
          .map((employee) => employee.department_name)
          .filter((name): name is string => !!name),
      ),
    ).sort();
  }, [data]);

  const handleWeekShift = (delta: number) => {
    const baseWeek = week ?? data?.week_start;
    const baseYear = year ?? data?.year;
    if (baseWeek === undefined || baseYear === undefined) return;
    const next = shiftIsoWeek(baseWeek, baseYear, delta);
    setWeek(next.week);
    setYear(next.year);
  };

  return {
    availabilityQuery,
    departments: departmentsQuery.data ?? [],
    weeksToShow,
    setWeeksToShow,
    searchTerm,
    setSearchTerm,
    hideFullyAssigned,
    setHideFullyAssigned,
    department,
    setDepartment,
    departmentName,
    setDepartmentName,
    selectedEmployeeId,
    setSelectedEmployeeId,
    selectedEmployee,
    isSelectedEmployeeInternal,
    filteredEmployees,
    departmentNames,
    handleWeekShift,
    employeeDetailQuery,
    office365ProfileQuery,
  };
}
