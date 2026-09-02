import {
  makeStyles,
  shorthands,
  tokens,
  Text,
  Spinner,
  Input,
  Checkbox,
  Slider,
  Dropdown,
  Option,
  Button,
  Badge,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
} from '@fluentui/react-components';
import {
  ChevronLeftRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PlanningToolService,
  shiftIsoWeek,
  type EmployeeAvailability,
  type Uursoort,
  type WeekAvailability,
} from '../services/planningToolService';

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
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  filterLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  weekNav: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  weekNavButtonLeft: {
    display: 'flex',
    justifyContent: 'flex-start',
    ...shorthands.padding('0'),
  },
  weekNavButtonRight: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.padding('0'),
  },
  weekLabel: {
    fontSize: tokens.fontSizeBase300,
  },
  weekValue: {
    fontSize: tokens.fontSizeBase300,
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
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200,
  },
  th: {
    textAlign: 'left',
    ...shorthands.padding('10px', '12px'),
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightSemibold,
    position: 'sticky',
    top: 0,
    whiteSpace: 'nowrap',
  },
  td: {
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    whiteSpace: 'nowrap',
  },
  weekCell: {
    ...shorthands.padding('4px', '6px'),
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
  legendRow: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('16px'),
    ...shorthands.padding('8px', '0'),
  },
  legendRowAside: {
    display: 'flex',
    flexWrap: 'wrap',
    fontSize: tokens.fontSizeBase100,
    ...shorthands.gap('16px'),
    ...shorthands.padding('8px', '0'),
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    fontSize: tokens.fontSizeBase200,
  },
  legendSwatch: {
    width: '14px',
    height: '14px',
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    ...shorthands.padding('48px', '0'),
  },
  dialogSurface: {
    maxWidth: '60vw',
    width: '60vw',
  },
  orangeSlider: {
    '& .fui-Slider__activeTrack': {
      backgroundColor: tokens.colorPalettePeachBorderActive,
    },
    '& .fui-Slider__thumb': {
      backgroundColor: tokens.colorPalettePeachBorderActive,
    },
    '& .fui-Slider__progress': {
      backgroundColor: tokens.colorPalettePeachBorderActive,
    },
    '--fui-Slider__progress--color': tokens.colorPalettePeachBorderActive,
  },
  orangeInput: {
    '&:hover::after': {
      borderBottomColor: tokens.colorPalettePeachBorderActive,
    },

    '&:focus-within::after': {
      borderBottomColor: tokens.colorPalettePeachBorderActive,
    },
  },
});

// Colors per hour type, matching the legacy tool's legend: 🟢 assignment · ⬜ reserved · 🟠 available · 🟣 holiday
const TYPE_COLORS: Record<Uursoort, { background: string; foreground: string }> = {
  inzet: { background: tokens.colorPaletteLightGreenBackground2, foreground: tokens.colorPaletteLightGreenForeground2 },
  reservering: { background: tokens.colorNeutralBackground3, foreground: tokens.colorNeutralForeground2 },
  beschikbaar: { background: '#cfe4fa', foreground: tokens.colorPalettePeachForeground2 },
  feestdag: { background: tokens.colorPaletteGrapeBackground2, foreground: tokens.colorPaletteGrapeForeground2 },
};

type WeekUrenEntry = { type: Uursoort; hours: number; project_name?: string | null };

// Reservering hours for internal employees represent vacation, not a generic reservation —
// relabel and color it like a holiday so it's visually distinct in the timeline.
function getSegmentDisplay(u: WeekUrenEntry, isIntern: boolean): { label: string; background: string; foreground: string } {
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

// Renders each week as a horizontal bar split into segments per week_uren entry, sized
// proportionally to hours, so leave/holiday/multiple projects within one week stay visible
// (matches the ClockWise API's per-day breakdown, e.g. 4h reservering + 36h inzet in one week).
function WeekBar({ week, hoursPerWeek, isIntern }: { week: WeekAvailability; hoursPerWeek: number; isIntern: boolean }) {
  const styles = useStyles();
  const denominator = Math.max(week.total_hours, hoursPerWeek, 1);

  if (!week.week_uren.length) {
    return (
      <div className={styles.barTrack} title="No hours registered">
        <div
          className={styles.barSegment}
          style={{ width: '100%', backgroundColor: tokens.colorNeutralBackground2, color: tokens.colorNeutralForeground2 }}
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
    queryKey: ['planning-tool', 'availability', week, year, weeksToShow, department, departmentName],
    queryFn: () => PlanningToolService.getAvailability({ week, year, weeks: weeksToShow, department: department || undefined }),
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

  const filteredEmployees = useMemo(() => {
  if (!data) return [];

  return data.employees.filter((employee: EmployeeAvailability) => {
    if (
      searchTerm.trim() &&
      !employee.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    ) {
      return false;
    }

    if (
      hideFullyAssigned &&
      employee.weeks.every((w) => w.is_fully_assigned)
    ) {
      return false;
    }

    if (
      departmentName &&
      employee.department_name !== departmentName
    ) {
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
        .filter((name): name is string => !!name)
    )
  ).sort();
}, [data]);

  return (
    
    <div className={styles.container}>
        
      {/* Filters sidebar */}
      <aside className={styles.sidebar}>
        <Text weight="semibold" size={400}>Filters</Text>

        <div className={styles.filterGroup}>
          <div className={styles.weekNav}>
          
            <Button
              className={styles.weekNavButtonLeft}
              icon={<ChevronLeftRegular />}
              appearance="subtle"
              onClick={() => handleWeekShift(-1)}
              disabled={!data}
              aria-label="Previous week"
            /> <span className={styles.weekLabel}>Week</span>
            <span className={styles.weekValue}>
              {data ? `${data.week_start} | ${data.year}` : '—'}
            </span>
            <Button
              className={styles.weekNavButtonRight}
              icon={<ChevronRightRegular />}
              appearance="subtle"
              onClick={() => handleWeekShift(1)}
              disabled={!data}
              aria-label="Next week"
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Aantal weken om te tonen: {weeksToShow}</span>
          <Slider
            min={1}
            max={12}
            value={weeksToShow}
            className={styles.orangeSlider}
            onChange={(_, dataSlider) => setWeeksToShow(dataSlider.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Zoeken:</span>
          <Input
            className={styles.orangeInput}
            value={searchTerm}
            onChange={(_, dataInput) => setSearchTerm(dataInput.value)}
            placeholder="e.g. Bart"
          />
        </div>

        <Checkbox
          label="Verberg volledig ingeplande medewerkers"
          checked={hideFullyAssigned}
          onChange={(_, dataCheckbox) => setHideFullyAssigned(!!dataCheckbox.checked)}
        />
        <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Unit: </span>

        <Dropdown
            className={styles.orangeInput}
            value={departmentName || 'All'}
            selectedOptions={departmentName ? [departmentName] : []}
            onOptionSelect={(_, optionData) => {
            setDepartmentName(
                optionData.optionValue === 'All'
                ? undefined
                : optionData.optionValue
            );
            }}
        >
            <Option value="All">All</Option>

            {departmentNames.map((name) => (
            <Option key={name} value={name}>
                {name}
            </Option>
            ))}
        </Dropdown>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Type:</span>
          <Dropdown
            className={styles.orangeInput}
            value={department || 'All'}
            selectedOptions={[department]}
            onOptionSelect={(_, optionData) => setDepartment(optionData.optionValue === 'All' ? '' : optionData.optionValue ?? '')}
          >
            <Option value="All">All</Option>
            {departmentsQuery.data?.map((dept) => (
              <Option key={dept} value={dept}>{dept}</Option>
            ))}
          </Dropdown>
        </div>

        {data && (
          <div className={styles.summaryRow}>
            {filteredEmployees.length} employees · {data.num_weeks} weeks from W{data.week_start} <br /> Last refreshed{' '}
            {new Date(data.generated_at).toLocaleTimeString()}
          </div>
      )} 
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        
        {availabilityQuery.isLoading && (
          <div className={styles.loadingContainer}>
            <Spinner size="medium" label="Loading planning data..." />
          </div>
        )}

        {data?.source === 'mock' && (
          <Badge appearance="tint" color="warning" style={{ marginBottom: '16px' }}>
            Showing sample data — the planning tool API isn't reachable from here (uvicorn api.main:app --reload runs only locally).
          </Badge>
        )}

        {availabilityQuery.isError && (
          <Badge appearance="tint" color="danger">
            Failed to load data from the planning tool API. Make sure it's running locally (uvicorn api.main:app --reload).
          </Badge>
        )}

        {data && (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Naam</th>
                    <th className={styles.th}>Uren</th>
                    {filteredEmployees[0]?.weeks.map((w) => (
                      <th key={w.week_nr} className={styles.th}>W{w.week_nr}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr>
                      <td 
                      className={styles.td}  
                      key={employee.id}
                      onClick={() => setSelectedEmployeeId(employee.id)}
                      style={{ cursor: 'pointer' }}>
                        {employee.name}
                      </td>
                      <td className={styles.td}>{employee.hours_per_week}</td>
                      {employee.weeks.map((w) => (
                        <td key={w.week_nr} className={`${styles.td} ${styles.weekCell}`}>
                          <WeekBar week={w} hoursPerWeek={employee.hours_per_week} isIntern={employee.department_category === 'Intern'} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryRow} style={{ marginLeft: '16px' }}>    
                <span className={styles.legendItem}>
                  <span className={styles.legendSwatch} style={{ backgroundColor: TYPE_COLORS.inzet.background }} />
                  Opdracht / Inzet
                  
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.legendSwatch} style={{ backgroundColor: TYPE_COLORS.reservering.background }} />
                  Gereserveerd
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.legendSwatch} style={{ backgroundColor: TYPE_COLORS.beschikbaar.background }} />
                  Beschikbaar
                </span>
                <span className={styles.legendItem}>
                  <span className={styles.legendSwatch} style={{ backgroundColor: TYPE_COLORS.feestdag.background }} />
                  Vakantie
                </span>
              </span>
              
            </div>

            <Button className={styles.bottomAction}>Wietze</Button>


            <Dialog
              open={selectedEmployeeId !== null}
              onOpenChange={(_, dialogData) => {
                if (!dialogData.open) setSelectedEmployeeId(null);
              }}
            >
              <DialogSurface className={styles.dialogSurface}>
                <DialogBody>
                  <DialogTitle>
                    {filteredEmployees.find((e) => e.id === selectedEmployeeId)?.name ?? 'Employee Detail'}
                  </DialogTitle>
                  <DialogContent>
                    {employeeDetailQuery.isLoading && (
                      <div className={styles.loadingContainer}>
                        <Spinner size="small" label="Loading employee detail..." />
                      </div>
                    )}

                    {employeeDetailQuery.data && (
                      <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th className={styles.th}>Week</th>
                              <th className={styles.th}></th>
                              <th className={styles.th}>Uren totaal</th>
                              <th className={styles.th}>Ingezet</th>
                              <th className={styles.th}>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeeDetailQuery.data.weeks.map((w) => (
                              <tr key={w.week_nr}>
                                <td className={styles.td}>W{w.week_nr}</td>
                                <td className={styles.td}>{w.monday}</td>
                                <td className={styles.td}>{w.total_hours}</td>
                                <td className={styles.td}>{w.is_fully_assigned ? 'Yes' : 'No'}</td>
                                <td className={styles.td}>
                                  {w.week_uren.map((u, idx) => (
                                    <div key={idx}>
                                      {getSegmentDisplay(u, employeeDetailQuery.data?.department_category === 'Intern').label}: {u.hours}h{u.project_name ? ` — ${u.project_name}` : ''}
                                    </div>
                                  ))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </DialogContent>
                  <DialogActions>
                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="secondary" onClick={() => setSelectedEmployeeId(null)}>Close</Button>
                    </DialogTrigger>
                  </DialogActions>
                </DialogBody>
              </DialogSurface>
            </Dialog>
          </>
        )}
      </main>
    </div>
  );
}
