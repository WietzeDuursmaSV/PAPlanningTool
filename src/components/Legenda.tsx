import { makeStyles, shorthands, tokens } from '@fluentui/react-components';

const LEGENDA_ITEMS = [
  { label: 'Opdracht / Inzet', color: tokens.colorPaletteLightGreenBackground2 },
  { label: 'Gereserveerd', color: tokens.colorNeutralBackground3 },
  { label: 'Beschikbaar', color: '#cfe4fa' },
  { label: 'Vakantie', color: tokens.colorPaletteGrapeBackground2 },
];

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    ...shorthands.gap('16px'),
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
  swatch: {
    width: '14px',
    height: '14px',
    flexShrink: 0,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
  },
});

export default function Legenda() {
  const styles = useStyles();

  return (
    <div className={styles.root} aria-label="Legenda">
      {LEGENDA_ITEMS.map((item) => (
        <span className={styles.item} key={item.label}>
          <span className={styles.swatch} style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
