import { makeStyles, shorthands, Skeleton, SkeletonItem, tokens } from '@fluentui/react-components';
import type { EmployeeAvailability } from '../services/planningToolService';
import WeekBar from './WeekBar';

type PlanningGridProps = {
  employees: EmployeeAvailability[];
  onEmployeeSelect: (employeeId: number) => void;
};

function getIsoWeekLabel(monday: string, fallbackWeek: number): string {
  const date = new Date(`${monday}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return `W${fallbackWeek}`;

  date.setUTCDate(date.getUTCDate() + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstThursdayDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDay + 3);
  const weekNumber = 1 + Math.round((date.valueOf() - firstThursday.valueOf()) / 604800000);

  return `W${weekNumber}`;
}

const useStyles = makeStyles({
  wrapper: {
    width: '100%',
    maxWidth: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
  },
  grid: {
    width: '100%',
    minWidth: '760px',
    fontSize: tokens.fontSizeBase200,
  },
  row: {
    display: 'grid',
  },
  header: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  headerCell: {
    textAlign: 'left',
    whiteSpace: 'nowrap',
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.padding('10px', '12px'),
  },
  cell: {
    whiteSpace: 'nowrap',
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
  },
  employeeName: {
    cursor: 'pointer',
  },
  weekCell: {
    minWidth: '110px',
    ...shorthands.padding('4px', '0'),
  },
  skeleton: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    ...shorthands.padding('16px'),
  },
  skeletonRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, 1fr) 72px repeat(5, minmax(72px, 1fr))',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
});

export function PlanningGridSkeleton() {
  const styles = useStyles();
  return (
    <div className={styles.wrapper} aria-label="Planning laden">
      <Skeleton className={styles.skeleton} animation="wave">
        {Array.from({ length: 6 }, (_, rowIndex) => (
          <div className={styles.skeletonRow} key={rowIndex}>
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

export default function PlanningGrid({ employees, onEmployeeSelect }: PlanningGridProps) {
  const styles = useStyles();
  const weeks = employees[0]?.weeks ?? [];
  const columns = `minmax(160px, 1fr) 80px repeat(${weeks.length}, minmax(110px, 1fr))`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.grid} role="grid">
        <div
          className={`${styles.row} ${styles.header}`}
          role="row"
          style={{ gridTemplateColumns: columns }}
        >
          <div className={styles.headerCell} role="columnheader">
            Naam
          </div>
          <div className={styles.headerCell} role="columnheader">
            Uren
          </div>
          {weeks.map((week) => (
            <div className={styles.headerCell} key={week.week_nr} role="columnheader">
              {getIsoWeekLabel(week.monday, week.week_nr)}
            </div>
          ))}
        </div>
        {employees.map((employee) => (
          <div
            className={styles.row}
            key={employee.id}
            role="row"
            style={{ gridTemplateColumns: columns }}
          >
            <div
              className={`${styles.cell} ${styles.employeeName}`}
              role="gridcell"
              onClick={() => onEmployeeSelect(employee.id)}
            >
              {employee.name}
            </div>
            <div className={styles.cell} role="gridcell">
              {employee.hours_per_week}
            </div>
            {employee.weeks.map((week) => (
              <div
                className={`${styles.cell} ${styles.weekCell}`}
                key={week.week_nr}
                role="gridcell"
              >
                <WeekBar week={week} hoursPerWeek={employee.hours_per_week} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
