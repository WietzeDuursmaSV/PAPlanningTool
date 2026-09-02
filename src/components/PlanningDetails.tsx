import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  makeStyles,
  shorthands,
  Skeleton,
  SkeletonItem,
  Text,
  tokens,
} from '@fluentui/react-components';
import type { GraphUser_V1 } from '../generated/models/Office365UsersModel';
import type { EmployeeAvailability, Uursoort } from '../services/planningToolService';

type PlanningDetailsProps = {
  open: boolean;
  employeeName?: string;
  isInternal: boolean;
  employeeDetails?: EmployeeAvailability;
  isEmployeeDetailsLoading: boolean;
  office365Profile?: GraphUser_V1;
  office365Photo?: string;
  isOffice365Loading: boolean;
  isOffice365ProfileMissing: boolean;
  office365ErrorMessage?: string;
  onOpenChange: (open: boolean) => void;
};

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '60vw',
    width: '60vw',
  },
  dialogContent: {
    display: 'grid',
    gridTemplateColumns: 'minmax(180px, 240px) minmax(0, 1fr)',
    ...shorthands.gap('24px'),
    '@media (max-width: 700px)': {
      gridTemplateColumns: '1fr',
    },
  },
  profilePanel: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  profilePhoto: {
    width: '96px',
    height: '96px',
    objectFit: 'cover',
    ...shorthands.borderRadius('50%'),
  },
  profileSkeleton: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  detailSkeleton: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  tableWrapper: {
    width: '100%',
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
    whiteSpace: 'nowrap',
  },
  td: {
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
    whiteSpace: 'nowrap',
  },
});

function getHourTypeLabel(type: Uursoort, hours: number, isInternal: boolean): string {
  if (type === 'reservering' && hours > 8 && isInternal) return 'Vakantie';
  return type;
}

export default function PlanningDetails({
  open,
  employeeName,
  isInternal,
  employeeDetails,
  isEmployeeDetailsLoading,
  office365Profile,
  office365Photo,
  isOffice365Loading,
  isOffice365ProfileMissing,
  office365ErrorMessage,
  onOpenChange,
}: PlanningDetailsProps) {
  const styles = useStyles();

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle>{employeeName ?? 'Employee Detail'}</DialogTitle>
          <DialogContent className={styles.dialogContent}>
            {isInternal && (
              <aside className={styles.profilePanel}>
                {isOffice365Loading && (
                  <Skeleton className={styles.profileSkeleton} animation="wave">
                    <SkeletonItem shape="circle" size={96} />
                    <SkeletonItem size={24} />
                    <SkeletonItem size={16} />
                    <SkeletonItem size={16} />
                    <SkeletonItem size={16} />
                  </Skeleton>
                )}
                {office365Photo && (
                  <img className={styles.profilePhoto} src={office365Photo} alt="" />
                )}
                {office365Profile && (
                  <>
                    <Text weight="semibold">{office365Profile.displayName}</Text>
                    {office365Profile.jobTitle && <Text>{office365Profile.jobTitle}</Text>}
                    {office365Profile.department && <Text>{office365Profile.department}</Text>}
                    {office365Profile.officeLocation && (
                      <Text>{office365Profile.officeLocation}</Text>
                    )}
                    <a href={`mailto:${office365Profile.mail}`}>
                      <Text>{office365Profile.mail}</Text>
                    </a>

                    {office365Profile.mobilePhone && <Text>{office365Profile.mobilePhone}</Text>}
                    {office365Profile.businessPhones?.map((phone) => (
                      <Text key={phone}>{phone}</Text>
                    ))}
                  </>
                )}
                {isOffice365ProfileMissing && <Text>Geen Office 365-profiel gevonden.</Text>}
                {office365ErrorMessage && (
                  <Text>
                    Office 365-gegevens konden niet worden geladen: {office365ErrorMessage}
                  </Text>
                )}
              </aside>
            )}

            <div>
              {isEmployeeDetailsLoading && (
                <Skeleton className={styles.detailSkeleton} animation="wave">
                  <SkeletonItem size={28} />
                  {Array.from({ length: 5 }, (_, rowIndex) => (
                    <SkeletonItem key={rowIndex} size={40} />
                  ))}
                </Skeleton>
              )}
              {employeeDetails && (
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
                      {employeeDetails.weeks.map((week) => (
                        <tr key={week.week_nr}>
                          <td className={styles.td}>W{week.week_nr}</td>
                          <td className={styles.td}>{week.monday}</td>
                          <td className={styles.td}>{week.total_hours}</td>
                          <td className={styles.td}>{week.is_fully_assigned ? 'Yes' : 'No'}</td>
                          <td className={styles.td}>
                            {week.week_uren.map((entry, index) => (
                              <div key={index}>
                                {getHourTypeLabel(
                                  entry.type,
                                  entry.hours,
                                  employeeDetails.department_category === 'Intern',
                                )}
                                : {entry.hours}h
                                {entry.project_name ? ` - ${entry.project_name}` : ''}
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
          </DialogContent>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
