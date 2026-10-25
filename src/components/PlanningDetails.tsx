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
import type { EmployeeAvailability, EmployeeDetails } from '../services/planningToolService';

type PlanningDetailsProps = {
  open: boolean;
  employeeName?: string;
  isInternal: boolean;
  employeeDetails?: EmployeeAvailability;
  selectedEmployeeDetails?: EmployeeDetails;
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
    // gridTemplateColumns: 'minmax(180px, 240px) minmax(0, 1fr)',
    ...shorthands.gap('24px'),
    '@media (max-width: 700px)': {
      gridTemplateColumns: '1fr',
    },
  },
  dialogAsideContent: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  profilePanel: {
    display: 'flex',
    flexDirection: 'row',
    ...shorthands.gap('32px'),
  },
  profilePhoto: {
    width: '96px',
    height: '96px',
    objectFit: 'cover',
    ...shorthands.borderRadius('50%'),
  },
  profileSkeleton: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: '300px',
    ...shorthands.gap('32px'),
  },
  detailSkeleton: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1, // Zorgt ervoor dat de kolom de overige ruimte inneemt
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

function formatDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}-${month}-${year}`;
}

export default function PlanningDetails({
  open,
  employeeName,
  isInternal,
  employeeDetails,
  selectedEmployeeDetails,
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
          <DialogContent className={styles.dialogContent}>
            {isInternal && (
              <aside className={styles.profilePanel}>
                {isOffice365Loading && (
                  <Skeleton animation="wave">
                    <div className={styles.profileSkeleton}>
                      <SkeletonItem shape="circle" size={96} />
                      <div className={styles.detailSkeleton}>
                        <SkeletonItem size={16} />
                        <SkeletonItem size={16} />
                        <SkeletonItem size={16} />
                        <SkeletonItem size={16} />
                      </div>
                    </div>
                  </Skeleton>
                )}
                {office365Photo && (
                  <img className={styles.profilePhoto} src={office365Photo} alt="" />
                )}
                <div className={styles.dialogAsideContent}>
                  {office365Profile && (
                    <>
                      <DialogTitle>
                        {employeeName ?? (office365Profile?.displayName || 'Employee Detail')}
                      </DialogTitle>
                      {office365Profile.jobTitle && (
                        <Text weight="semibold">{office365Profile.jobTitle}</Text>
                      )}
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
                  {isOffice365ProfileMissing && (
                    <>
                      <Text>{employeeName}</Text>
                      <Text>Geen Office 365-profiel gevonden.</Text>
                    </>
                  )}
                  {office365ErrorMessage && (
                    <Text>
                      Office 365-gegevens konden niet worden geladen: {office365ErrorMessage}
                    </Text>
                  )}
                </div>
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
              {employeeDetails && selectedEmployeeDetails && (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Project naam</th>
                        <th className={styles.th}>Klant</th>
                        <th className={styles.th}>Start datum</th>
                        <th className={styles.th}>Eind datum</th>
                        <th className={styles.th}>Uren per week</th>
                        <th className={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEmployeeDetails.assignments
                        .filter((assignment) => assignment.hours_per_week > 0)
                        .map((assignement) => (
                          <tr key={assignement.project_id}>
                            <td className={styles.td}>W{assignement.project.name}</td>
                            <td className={styles.td}>{assignement.project.customer.name}</td>
                            <td className={styles.td}>{formatDate(assignement.start_date)}</td>
                            <td className={styles.td}>
                              {assignement.end_date ? formatDate(assignement.end_date) : ''}
                            </td>
                            <td className={styles.td}>{assignement.hours_per_week}</td>
                            <td className={styles.td}>{assignement.project.status}</td>
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
