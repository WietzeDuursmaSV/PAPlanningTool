import {
  makeStyles,
  shorthands,
  tokens,
  Skeleton,
  SkeletonItem,
  Badge,
} from '@fluentui/react-components';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PlanningToolService,
  shiftIsoWeek,
  type EmployeeAvailability,
  type Uursoort,
  type WeekAvailability,
} from '../services/planningToolService';
import { Office365UsersService } from '../generated';
import Legenda from '../components/Legenda';
import PlanningDetails from '../components/PlanningDetails';
import PlanningFilter from '../components/PlanningFilter';

const useStyles = makeStyles({
  container: {
    maxWidth: '1400px',
    ...shorthands.margin('0', 'auto'),
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    ...shorthands.gap('32px'),
    alignItems: 'start',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  main: {
    minWidth: 0,
  },
  bottomAction: {
    ...shorthands.margin('20px', '0', '0'),
  },

  tableWrapper: {
    width: '100%',
    maxWidth: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  planningGrid: {
    width: '100%',
    minWidth: '760px',
    fontSize: tokens.fontSizeBase200,
  },
  planningGridRow: {
    display: 'grid',
  },
  planningGridHeader: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  planningGridHeaderCell: {
    textAlign: 'left',
    ...shorthands.padding('10px', '12px'),
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap',
  },
  planningGridCell: {
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    whiteSpace: 'nowrap',
  },
  employeeNameCell: {
    cursor: 'pointer',
  },
  weekCell: {
    ...shorthands.padding('4px', '0px'),
    minWidth: '110px',
  },
  barTrack: {
    display: 'flex',
    width: '100%',
    height: '28px',
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  barSegment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    height: '100%',
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralBackground1),
  },
  summaryRow: {
    display: 'flex',

    ...shorthands.gap('8px'),
    ...shorthands.padding('8px', '0'),
    alignItems: 'center',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    ...shorthands.padding('48px', '0'),
  },
  planningSkeleton: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px'),
  },
  planningSkeletonRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, 1fr) 72px repeat(5, minmax(72px, 1fr))',
    ...shorthands.gap('12px'),
    alignItems: 'center',
  },
});

// Colors per hour type, matching the legacy tool's legend: 🟢 assignment · ⬜ reserved · 🟠 available · 🟣 holiday
const TYPE_COLORS: Record<Uursoort, { background: string; foreground: string }> = {
  inzet: {
    background: tokens.colorPaletteLightGreenBackground2,
    foreground: tokens.colorPaletteLightGreenForeground2,
  },
  reservering: {
    background: tokens.colorNeutralBackground3,
    foreground: tokens.colorNeutralForeground2,
  },
  beschikbaar: { background: '#cfe4fa', foreground: tokens.colorPalettePeachForeground2 },
  feestdag: {
    background: tokens.colorPaletteGrapeBackground2,
    foreground: tokens.colorPaletteGrapeForeground2,
  },
};

type WeekUrenEntry = { type: Uursoort; hours: number; project_name?: string | null };

// Reservering hours for internal employees represent vacation, not a generic reservation —
// relabel and color it like a holiday so it's visually distinct in the timeline.
function getSegmentDisplay(
  u: WeekUrenEntry,
  isIntern: boolean,
): { label: string; background: string; foreground: string } {
  if (u.type === 'reservering' && u.hours > 8 && isIntern) {
    return { label: 'Vakantie', ...TYPE_COLORS.feestdag };
  }
  const { background, foreground } = TYPE_COLORS[u.type];
  return { label: u.type, background, foreground };
}

function weekTooltip(u: WeekUrenEntry, isIntern: boolean): string {
  const { label } = getSegmentDisplay(u, isIntern);
  return `${label}: ${u.hours}h${u.project_name ? ` — ${u.project_name}` : ''}`;
}

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

// Renders each week as a horizontal bar split into segments per week_uren entry, sized
// proportionally to hours, so leave/holiday/multiple projects within one week stay visible
// (matches the ClockWise API's per-day breakdown, e.g. 4h reservering + 36h inzet in one week).
function WeekBar({
  week,
  hoursPerWeek,
  isIntern,
}: {
  week: WeekAvailability;
  hoursPerWeek: number;
  isIntern: boolean;
}) {
  const styles = useStyles();
  const denominator = Math.max(week.total_hours, hoursPerWeek, 1);

  if (!week.week_uren.length) {
    return (
      <div className={styles.barTrack} title="No hours registered">
        <div
          className={styles.barSegment}
          style={{
            width: '100%',
            backgroundColor: tokens.colorNeutralBackground2,
            color: tokens.colorNeutralForeground2,
          }}
        >
          {week.total_hours || 0}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.barTrack}>
      {week.week_uren.map((u, idx) => {
        const { background, foreground } = getSegmentDisplay(u, isIntern);
        const widthPercent = (u.hours / denominator) * 100;
        return (
          <div
            key={idx}
            className={styles.barSegment}
            title={weekTooltip(u, isIntern)}
            style={{ width: `${widthPercent}%`, backgroundColor: background, color: foreground }}
          >
            {u.hours}
          </div>
        );
      })}
    </div>
  );
}

function PlanningSkeleton() {
  const styles = useStyles();

  return (
    <div className={styles.tableWrapper} aria-label="Planning laden">
      <Skeleton className={styles.planningSkeleton} animation="wave">
        {Array.from({ length: 6 }, (_, rowIndex) => (
          <div className={styles.planningSkeletonRow} key={rowIndex}>
            <SkeletonItem size={20} />
            <SkeletonItem size={20} />
            {Array.from({ length: 5 }, (_, columnIndex) => (
              <SkeletonItem key={columnIndex} size={28} />
            ))}
          </div>
        ))}
      </Skeleton>
    </div>
  );
}

export default function PlanningToolPage() {
  const styles = useStyles();

  const [week, setWeek] = useState<number | undefined>(undefined);
  const [year, setYear] = useState<number | undefined>(undefined);
  const [weeksToShow, setWeeksToShow] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [hideFullyAssigned, setHideFullyAssigned] = useState(false);
  const [department, setDepartment] = useState<string>('Intern');
  const [departmentName, setDepartmentName] = useState<string | undefined>(undefined);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const availabilityQuery = useQuery({
    queryKey: [
      'planning-tool',
      'availability',
      week,
      year,
      weeksToShow,
      department,
      departmentName,
    ],
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

  const selectedEmployee = availabilityQuery.data?.employees.find(
    (employee) => employee.id === selectedEmployeeId,
  );
  const isSelectedEmployeeInternal = selectedEmployee?.department_category === 'Intern';

  const office365ProfileQuery = useQuery({
    queryKey: ['office365-user', selectedEmployee?.name],
    queryFn: async () => {
      const searchResult = await withTimeout(
        Office365UsersService.SearchUserV2(selectedEmployee?.name, 10, true),
        'Office 365-profiel kon niet worden geladen.',
      );
      if (!searchResult.success)
        throw searchResult.error ?? new Error('Office 365-profiel kon niet worden geladen.');

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
      if (!profileResult.success)
        throw profileResult.error ?? new Error('Office 365-profiel kon niet worden geladen.');

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

  const data = availabilityQuery.data;

  const filteredEmployees = useMemo(() => {
    if (!data) return [];

    return data.employees.filter((employee: EmployeeAvailability) => {
      if (
        searchTerm.trim() &&
        !employee.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
      ) {
        return false;
      }

      if (hideFullyAssigned && employee.weeks.every((w) => w.is_fully_assigned)) {
        return false;
      }

      if (departmentName && employee.department_name !== departmentName) {
        return false;
      }

      return true;
    });
  }, [data, searchTerm, hideFullyAssigned, departmentName]);

  const handleWeekShift = (delta: number) => {
    const baseWeek = week ?? data?.week_start;
    const baseYear = year ?? data?.year;
    if (baseWeek === undefined || baseYear === undefined) return;
    const next = shiftIsoWeek(baseWeek, baseYear, delta);
    setWeek(next.week);
    setYear(next.year);
  };

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

  const planningGridColumns = `minmax(160px, 1fr) 80px repeat(${filteredEmployees[0]?.weeks.length ?? 0}, minmax(110px, 1fr))`;

  return (
    <div className={styles.container}>
      <PlanningFilter
        week={data?.week_start}
        year={data?.year}
        weeksToShow={weeksToShow}
        searchTerm={searchTerm}
        hideFullyAssigned={hideFullyAssigned}
        departmentName={departmentName}
        department={department}
        departmentNames={departmentNames}
        departments={departmentsQuery.data ?? []}
        employeeCount={data ? filteredEmployees.length : undefined}
        totalWeeks={data?.num_weeks}
        generatedAt={data?.generated_at}
        onWeekShift={handleWeekShift}
        onWeeksToShowChange={setWeeksToShow}
        onSearchTermChange={setSearchTerm}
        onHideFullyAssignedChange={setHideFullyAssigned}
        onDepartmentNameChange={setDepartmentName}
        onDepartmentChange={setDepartment}
      />

      {/* Main content */}
      <main className={styles.main}>
        {availabilityQuery.isLoading && <PlanningSkeleton />}

        {data?.source === 'mock' && (
          <Badge appearance="tint" color="warning" style={{ marginBottom: '16px' }}>
            Showing sample data — the planning tool API isn't reachable from here (uvicorn
            api.main:app --reload runs only locally).
          </Badge>
        )}

        {availabilityQuery.isError && (
          <Badge appearance="tint" color="danger">
            Failed to load data from the planning tool API. Make sure it's running locally (uvicorn
            api.main:app --reload).
          </Badge>
        )}

        {data && (
          <>
            <div className={styles.tableWrapper}>
              <div className={styles.planningGrid} role="grid">
                <div
                  className={`${styles.planningGridRow} ${styles.planningGridHeader}`}
                  role="row"
                  style={{ gridTemplateColumns: planningGridColumns }}
                >
                  <div className={styles.planningGridHeaderCell} role="columnheader">
                    Naam
                  </div>
                  <div className={styles.planningGridHeaderCell} role="columnheader">
                    Uren
                  </div>
                  {filteredEmployees[0]?.weeks.map((week) => (
                    <div
                      className={styles.planningGridHeaderCell}
                      key={week.week_nr}
                      role="columnheader"
                    >
                      W{week.week_nr}
                    </div>
                  ))}
                </div>
                {filteredEmployees.map((employee) => (
                  <div
                    className={styles.planningGridRow}
                    key={employee.id}
                    role="row"
                    style={{ gridTemplateColumns: planningGridColumns }}
                  >
                    <div
                      className={`${styles.planningGridCell} ${styles.employeeNameCell}`}
                      role="gridcell"
                      onClick={() => setSelectedEmployeeId(employee.id)}
                    >
                      {employee.name}
                    </div>
                    <div className={styles.planningGridCell} role="gridcell">
                      {employee.hours_per_week}
                    </div>
                    {employee.weeks.map((week) => (
                      <div
                        className={`${styles.planningGridCell} ${styles.weekCell}`}
                        key={week.week_nr}
                        role="gridcell"
                      >
                        <WeekBar
                          week={week}
                          hoursPerWeek={employee.hours_per_week}
                          isIntern={employee.department_category === 'Intern'}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.summaryRow}>
              <Legenda />
            </div>

            <PlanningDetails
              open={selectedEmployeeId !== null}
              employeeName={selectedEmployee?.name}
              isInternal={isSelectedEmployeeInternal}
              employeeDetails={employeeDetailQuery.data}
              isEmployeeDetailsLoading={employeeDetailQuery.isLoading}
              office365Profile={office365ProfileQuery.data?.profile}
              office365Photo={office365ProfileQuery.data?.photo}
              isOffice365Loading={office365ProfileQuery.isLoading}
              isOffice365ProfileMissing={
                office365ProfileQuery.isSuccess && !office365ProfileQuery.data
              }
              office365ErrorMessage={
                office365ProfileQuery.isError ? office365ProfileQuery.error.message : undefined
              }
              onOpenChange={(open) => {
                if (!open) setSelectedEmployeeId(null);
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
