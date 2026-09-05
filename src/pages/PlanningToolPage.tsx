import { Badge, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import Legenda from '../components/Legenda';
import PlanningDetails from '../components/PlanningDetails';
import PlanningFilter from '../components/PlanningFilter';
import PlanningGrid, { PlanningGridSkeleton } from '../components/PlanningGrid';
import { usePlanningData } from '../hooks/usePlanningData';

const useStyles = makeStyles({
  container: {
    maxWidth: '1400px',
    display: 'grid',
    gridTemplateColumns: '260px minmax(0, 1fr)',
    alignItems: 'start',
    ...shorthands.margin('0', 'auto'),
    ...shorthands.gap('32px'),
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  main: {
    minWidth: 0,
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    ...shorthands.padding('8px', '0'),
  },
  message: {
    display: 'block',
    ...shorthands.margin('0', '0', '16px'),
  },
});

export default function PlanningToolPage() {
  const styles = useStyles();
  const {
    availabilityQuery,
    isAssignmentTimelineLoading,
    departments,
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
  } = usePlanningData();

  const data = availabilityQuery.data;

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
        departments={departments}
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

      <main className={styles.main}>
        {(availabilityQuery.isLoading || isAssignmentTimelineLoading) && <PlanningGridSkeleton />}

        {data?.source === 'mock' && (
          <Badge appearance="tint" className={styles.message} color="warning">
            Showing sample data. The planning tool API is not reachable from here.
          </Badge>
        )}

        {availabilityQuery.isError && (
          <Badge appearance="tint" className={styles.message} color="danger">
            Failed to load data from the planning tool API.
          </Badge>
        )}

        {data && !isAssignmentTimelineLoading && (
          <>
            <PlanningGrid employees={filteredEmployees} onEmployeeSelect={setSelectedEmployeeId} />
            <div className={styles.legend}>
              <Legenda />
            </div>
          </>
        )}

        <PlanningDetails
          open={selectedEmployeeId !== null}
          employeeName={selectedEmployee?.name}
          isInternal={isSelectedEmployeeInternal}
          employeeDetails={employeeDetailQuery.data}
          isEmployeeDetailsLoading={employeeDetailQuery.isLoading}
          office365Profile={office365ProfileQuery.data?.profile}
          office365Photo={office365ProfileQuery.data?.photo}
          isOffice365Loading={office365ProfileQuery.isLoading}
          isOffice365ProfileMissing={office365ProfileQuery.isSuccess && !office365ProfileQuery.data}
          office365ErrorMessage={
            office365ProfileQuery.isError ? office365ProfileQuery.error.message : undefined
          }
          onOpenChange={(open) => {
            if (!open) setSelectedEmployeeId(null);
          }}
        />
      </main>
    </div>
  );
}
