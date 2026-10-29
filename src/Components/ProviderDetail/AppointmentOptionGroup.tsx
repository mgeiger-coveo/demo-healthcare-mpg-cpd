import { FunctionComponent } from "react";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import { Theme } from "../../config/theme";

export interface AppointmentOption {
  value: string;
  label: string;
}

interface AppointmentOptionGroupProps {
  /** Visible legend for the group, already localized by the caller. */
  legend: string;
  name: string;
  options: AppointmentOption[];
  value: string | null;
  onChange: (value: string) => void;
  /** Id of the live hint region the group's validity message lives in. */
  describedById?: string;
}

// Steps 1 and 2 are the same shape — a legend and a list of mutually exclusive options —
// so they share one component. Real `fieldset`/`legend`/`radio` semantics are used rather
// than clickable divs, so arrow-key navigation, the single roving tab stop and the
// grouped accessible name all come from the platform instead of being re-implemented.
// Every label arrives as a prop, so this component holds no copy of its own.
const AppointmentOptionGroup: FunctionComponent<AppointmentOptionGroupProps> = (
  props,
) => {
  const { legend, name, options, value, onChange, describedById } = props;

  return (
    <FormControl component="fieldset" sx={{ display: "block", width: "100%" }}>
      <FormLabel
        component="legend"
        sx={{
          color: Theme.secondaryText,
          fontSize: "0.875rem",
          marginBottom: "8px",
          "&.Mui-focused": { color: Theme.secondaryText },
        }}
      >
        {legend}
      </FormLabel>
      <RadioGroup
        name={name}
        value={value ?? ""}
        aria-describedby={describedById}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            label={option.label}
            control={<Radio />}
            sx={{
              margin: "0 0 8px",
              padding: "10px 12px",
              borderRadius: "12px",
              border:
                value === option.value
                  ? `1px solid ${Theme.primary}`
                  : "1px solid #e5e8e8",
              background:
                value === option.value ? `${Theme.primary}0d` : "#ffffff",
              "&:has(:focus-visible)": {
                outline: `2px solid ${Theme.primary}`,
                outlineOffset: "2px",
              },
            }}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
};

export default AppointmentOptionGroup;
