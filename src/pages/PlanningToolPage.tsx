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
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import {
  ChevronLeftRegular,
  ChevronRightRegular,
  PeopleTeamRegular,
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
  weekValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
  },
  main: {
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    marginBottom: '20px',
  },
  titleIcon: {
    fontSize: '32px',
    color: tokens.colorBrandForeground1,
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
  },
  tableWrapper: {
    overflowX: 'auto',
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
    textAlign: 'right',
    fontWeight: tokens.fontWeightSemibold,
  },
  summaryRow: {
    marginTop: '16px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  legendRow: {
    display: 'flex',
    flexWrap: 'wrap',
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
  detailSection: {
    marginTop: '32px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    ...shorthands.padding('48px', '0'),
  },
});

// Dominant hour type per week decides the cell color, matching the legend:
// 🟢 available · 🔵 assigned · 🟠 leave · 🔴 holiday
const TYPE_COLORS: Record<Uursoort, { background: string; foreground: string }> = {
  beschikbaar: { background: tokens.colorPaletteGreenBackground2, foreground: tokens.colorPaletteGreenForeground2 },
  inzet: { background: tokens.colorPaletteBlueBackground2, foreground: tokens.colorPaletteBlueForeground2 },
  reservering: { background: tokens.colorPaletteMarigoldBackground2, foreground: tokens.colorPaletteMarigoldForeground2 },
  feestdag: { background: tokens.colorPaletteRedBackground2, foreground: tokens.colorPaletteRedForeground2 },
};

function getDominantType(week: WeekAvailability): Uursoort | null {
  if (!week.week_uren.length) return null;
  const totals = new Map<Uursoort, number>();
  for (const entry of week.week_uren) {
    totals.set(entry.type, (totals.get(entry.type) ?? 0) + entry.hours);
  }
  let best: Uursoort | null = null;
  let bestHours = -1;
  for (const [type, hours] of totals) {
    if (hours > bestHours) {
      best = type;
      bestHours = hours;
    }
  }
  return best;
}

function weekCellStyle(week: WeekAvailability): { backgroundColor: string; color: string } {
  const dominant = getDominantType(week);
  if (!dominant) {
    return { backgroundColor: tokens.colorNeutralBackground2, color: tokens.colorNeutralForeground2 };
  }
  const { background, foreground } = TYPE_COLORS[dominant];
  return { backgroundColor: background, color: foreground };
}

export default function PlanningToolPage() {
  const styles = useStyles();

  const [week, setWeek] = useState<number | undefined>(undefined);
  const [year, setYear] = useState<number | undefined>(undefined);
  const [weeksToShow, setWeeksToShow] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [hideFullyAssigned, setHideFullyAssigned] = useState(false);
  const [department, setDepartment] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  const availabilityQuery = useQuery({
    queryKey: ['planning-tool', 'availability', week, year, weeksToShow, department],
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
      if (searchTerm.trim() && !employee.name.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
        return false;
      }
      if (hideFullyAssigned && employee.weeks.every((w) => w.is_fully_assigned)) {
        return false;
      }
      return true;
    });
  }, [data, searchTerm, hideFullyAssigned]);

  const handleWeekShift = (delta: number) => {
    const baseWeek = week ?? data?.week_start;
    const baseYear = year ?? data?.year;
    if (baseWeek === undefined || baseYear === undefined) return;
    const next = shiftIsoWeek(baseWeek, baseYear, delta);
    setWeek(next.week);
    setYear(next.year);
  };

  return (
    <div className={styles.container}>
      {/* Filters sidebar */}
      <aside className={styles.sidebar}>
        <Text weight="semibold" size={400}>Filters</Text>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Week</span>
          <div className={styles.weekNav}>
            <Button
              icon={<ChevronLeftRegular />}
              appearance="subtle"
              onClick={() => handleWeekShift(-1)}
              disabled={!data}
              aria-label="Previous week"
            />
            <span className={styles.weekValue}>
              {data ? `W${data.week_start} / ${data.year}` : '—'}
            </span>
            <Button
              icon={<ChevronRightRegular />}
              appearance="subtle"
              onClick={() => handleWeekShift(1)}
              disabled={!data}
              aria-label="Next week"
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Weeks to show</span>
          <Slider
            min={1}
            max={10}
            value={weeksToShow}
            onChange={(_, dataSlider) => setWeeksToShow(dataSlider.value)}
          />
          <Text size={200}>{weeksToShow}</Text>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Search employee name</span>
          <Input
            value={searchTerm}
            onChange={(_, dataInput) => setSearchTerm(dataInput.value)}
            placeholder="e.g. Bart"
          />
        </div>

        <Checkbox
          label="Hide fully assigned employees"
          checked={hideFullyAssigned}
          onChange={(_, dataCheckbox) => setHideFullyAssigned(!!dataCheckbox.checked)}
        />

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Department</span>
          <Dropdown
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
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        
        {availabilityQuery.isLoading && (
          <div className={styles.loadingContainer}>
            <Spinner size="medium" label="Loading planning data..." />
          </div>
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
                    <th className={styles.th}>Employee</th>
                    <th className={styles.th}>Dept</th>
                    <th className={styles.th}>H/wk</th>
                    {filteredEmployees[0]?.weeks.map((w) => (
                      <th key={w.week_nr} className={styles.th}>W{w.week_nr}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      onClick={() => setSelectedEmployeeId(employee.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className={styles.td}>{employee.name}</td>
                      <td className={styles.td}>{employee.department_category ?? '-'}</td>
                      <td className={styles.td}>{employee.hours_per_week}</td>
                      {employee.weeks.map((w) => {
                        const cellStyle = weekCellStyle(w);
                        return (
                          <td
                            key={w.week_nr}
                            className={`${styles.td} ${styles.weekCell}`}
                            style={cellStyle}
                          >
                            {w.total_hours}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Text className={styles.summaryRow}>
              {filteredEmployees.length} employees · {data.num_weeks} weeks from W{data.week_start} · Last refreshed{' '}
              {new Date(data.generated_at).toLocaleTimeString()}
            </Text>

            <Accordion collapsible>
              <AccordionItem value="legend">
                <AccordionHeader>Legend</AccordionHeader>
                <AccordionPanel>
                  <div className={styles.legendRow}>
                    <span className={styles.legendItem}>
                      <span className={styles.legendSwatch} style={{ backgroundColor: TYPE_COLORS.beschikbaar.background }} />
                      Available
                    </span>
                    <span className={styles.legendItem}>
                      <span className={styles.legendSwatch} style={{ backgroundColor: TYPE_COLORS.inzet.background }} />
                      Assigned
                    </span>
                    <span className={styles.legendItem}>
                      <span className={styles.legendSwatch} style={{ backgroundColor: TYPE_COLORS.reservering.background }} />
                      Leave
                    </span>
                    <span className={styles.legendItem}>
                      <span className={styles.legendSwatch} style={{ backgroundColor: TYPE_COLORS.feestdag.background }} />
                      Holiday
                    </span>
                  </div>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

            <div className={styles.detailSection}>
              <div className={styles.titleRow}>
                <PeopleTeamRegular className={styles.titleIcon} />
                <Text className={styles.title} style={{ fontSize: tokens.fontSizeBase500 }}>Employee Detail</Text>
              </div>
              <Dropdown
                placeholder="— select —"
                value={filteredEmployees.find((e) => e.id === selectedEmployeeId)?.name ?? ''}
                selectedOptions={selectedEmployeeId !== null ? [String(selectedEmployeeId)] : []}
                onOptionSelect={(_, optionData) => setSelectedEmployeeId(optionData.optionValue ? Number(optionData.optionValue) : null)}
              >
                {filteredEmployees.map((employee) => (
                  <Option key={employee.id} value={String(employee.id)}>{employee.name}</Option>
                ))}
              </Dropdown>

              {employeeDetailQuery.isLoading && selectedEmployeeId !== null && (
                <div className={styles.loadingContainer}>
                  <Spinner size="small" label="Loading employee detail..." />
                </div>
              )}

              {employeeDetailQuery.data && (
                <div className={styles.tableWrapper} style={{ marginTop: '16px' }}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Week</th>
                        <th className={styles.th}>Monday</th>
                        <th className={styles.th}>Total hours</th>
                        <th className={styles.th}>Fully assigned</th>
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
                                {u.type}: {u.hours}h{u.project_name ? ` — ${u.project_name}` : ''}
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
