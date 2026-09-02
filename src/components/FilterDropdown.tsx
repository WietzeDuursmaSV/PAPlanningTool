import { Dropdown, Option } from '@fluentui/react-components';

type FilterDropdownProps = {
  label: string;
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
};

export default function FilterDropdown({
  label,
  options,
  value,
  onValueChange,
  className,
  includeAllOption = true,
  allOptionLabel = 'All',
}: FilterDropdownProps) {
  return (
    <div>
      <span>{label}</span>
      <Dropdown
        className={className}
        value={value}
        selectedOptions={value ? [value] : []}
        onOptionSelect={(_, optionData) => onValueChange(optionData.optionValue ?? '')}
      >
        {includeAllOption && <Option value="All">{allOptionLabel}</Option>}
        {options.map((option) => (
          <Option key={option} value={option}>
            {option}
          </Option>
        ))}
      </Dropdown>
    </div>
  );
}
