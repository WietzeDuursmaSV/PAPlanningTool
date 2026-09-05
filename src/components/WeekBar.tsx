import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import type { Uursoort, WeekAvailability } from '../services/planningToolService';

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

const useStyles = makeStyles({
  track: {
    display: 'flex',
    width: '100%',
    height: '28px',
    overflow: 'hidden',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
  segment: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    height: '100%',
    overflow: 'hidden',
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.borderRight('1px', 'solid', tokens.colorNeutralBackground1),
  },
});

function getSegmentDisplay(type: Uursoort, hours: number) {
  if (type === 'reservering' && hours >= 8) {
    return { label: 'Vakantie', ...TYPE_COLORS.feestdag };
  }
  return { label: type, ...TYPE_COLORS[type] };
}

export default function WeekBar({
  week,
  hoursPerWeek,
}: {
  week: WeekAvailability;
  hoursPerWeek: number;
}) {
  const styles = useStyles();
  const denominator = Math.max(week.total_hours, hoursPerWeek, 1);

  if (!week.week_uren.length) {
    return (
      <div className={styles.track} title="No hours registered">
        <div className={styles.segment} style={{ width: '100%' }}>
          {week.total_hours || 0}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.track}>
      {week.week_uren.map((entry, index) => {
        const display = getSegmentDisplay(entry.type, entry.hours);
        return (
          <div
            className={styles.segment}
            key={index}
            title={`${display.label}: ${entry.hours}h${entry.project_name ? ` - ${entry.project_name}` : ''}`}
            style={{
              width: `${(entry.hours / denominator) * 100}%`,
              backgroundColor: display.background,
              color: display.foreground,
            }}
          >
            {entry.hours}
          </div>
        );
      })}
    </div>
  );
}
