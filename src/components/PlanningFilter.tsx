import {
  Button,
  Checkbox,
  Input,
  makeStyles,
  shorthands,
  Slider,
  Text,
  tokens,
} from '@fluentui/react-components';
import { ChevronLeftRegular, ChevronRightRegular } from '@fluentui/react-icons';
import FilterDropdown from './FilterDropdown';

type PlanningFilterProps = {
  week?: number;
  year?: number;
  weeksToShow: number;
  searchTerm: string;
  hideFullyAssigned: boolean;
  departmentName?: string;
  department: string;
  departmentNames: string[];
  departments: string[];
  employeeCount?: number;
  totalWeeks?: number;
  generatedAt?: string;
  onWeekShift: (delta: number) => void;
  onWeeksToShowChange: (weeks: number) => void;
  onSearchTermChange: (searchTerm: string) => void;
  onHideFullyAssignedChange: (hideFullyAssigned: boolean) => void;
  onDepartmentNameChange: (departmentName?: string) => void;
  onDepartmentChange: (department: string) => void;
};

const useStyles = makeStyles({
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
  weekLabel: {
    fontSize: tokens.fontSizeBase300,
  },
  weekValue: {
    fontSize: tokens.fontSizeBase300,
  },
  summary: {
    ...shorthands.padding('8px', '0'),
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
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

export default function PlanningFilter({
  week,
  year,
  weeksToShow,
  searchTerm,
  hideFullyAssigned,
  departmentName,
  department,
  departmentNames,
  departments,
  employeeCount,
  totalWeeks,
  generatedAt,
  onWeekShift,
  onWeeksToShowChange,
  onSearchTermChange,
  onHideFullyAssignedChange,
  onDepartmentNameChange,
  onDepartmentChange,
}: PlanningFilterProps) {
  const styles = useStyles();
  const hasPlanningData = week !== undefined && year !== undefined;

  return (
    <aside className={styles.sidebar}>
      <Text weight="semibold" size={400}>
        Filter
      </Text>

      <div className={styles.filterGroup}>
        <div className={styles.weekNav}>
          <Button
            icon={<ChevronLeftRegular />}
            appearance="subtle"
            onClick={() => onWeekShift(-1)}
            disabled={!hasPlanningData}
            aria-label="Previous week"
          />
          <span className={styles.weekLabel}>Week</span>
          <span className={styles.weekValue}>{hasPlanningData ? `${week} | ${year}` : '-'}</span>
          <Button
            icon={<ChevronRightRegular />}
            appearance="subtle"
            onClick={() => onWeekShift(1)}
            disabled={!hasPlanningData}
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
          onChange={(_, data) => onWeeksToShowChange(data.value)}
        />
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Zoeken:</span>
        <Input
          className={styles.orangeInput}
          value={searchTerm}
          onChange={(_, data) => onSearchTermChange(data.value)}
          placeholder="e.g. Bart"
        />
      </div>

      <Checkbox
        label="Verberg volledig ingeplande medewerkers"
        checked={hideFullyAssigned}
        onChange={(_, data) => onHideFullyAssignedChange(!!data.checked)}
      />

      <div className={styles.filterGroup}>
        <FilterDropdown
          label="Unit:"
          options={departmentNames}
          className={styles.orangeInput}
          value={departmentName || 'All'}
          onValueChange={(value) => onDepartmentNameChange(value === 'All' ? undefined : value)}
        />
      </div>

      <div className={styles.filterGroup}>
        <FilterDropdown
          label="Type:"
          options={departments}
          className={styles.orangeInput}
          value={department || 'All'}
          onValueChange={(value) => onDepartmentChange(value === 'All' ? '' : value)}
        />
      </div>

      {employeeCount !== undefined && totalWeeks !== undefined && generatedAt && (
        <div className={styles.summary}>
          {employeeCount} employees · {totalWeeks} weeks from W{week}
          <br />
          Last refreshed {new Date(generatedAt).toLocaleTimeString()}
        </div>
      )}
    </aside>
  );
}
