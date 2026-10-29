import * as React from "react";
import { useTheme } from "@mui/material/styles";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Avatar from "@mui/material/Avatar";
import { CustomContextContext } from "./CustomContextContext";
import styles from "./ContextDataTable.module.css";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(name, personName, theme) {
  return {
    fontWeight:
      personName.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}

export default function ProfileSelector({
  ContextData,
  setProfiledSelected,
  profileSelected,
}) {
  const FilteredProfileContext = ContextData.filter(
    (item) => item.name === profileSelected,
  );
  const { settingContext } = React.useContext(CustomContextContext);
  const theme = useTheme();
  /* const [personName, setPersonName] = React.useState([]); */

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setProfiledSelected(value);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "90%",
        justifyContent: "space-between",
      }}
    >
      <Avatar
        alt="Remy Sharp"
        src={FilteredProfileContext[0].profile}
        className={styles["profile-image"]}
      />
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel id="demo-multiple-name-label">Name</InputLabel>
        <Select
          labelId="demo-multiple-name-label"
          id="demo-multiple-name"
          value={profileSelected}
          onChange={handleChange}
          input={<OutlinedInput label="Name" />}
          MenuProps={MenuProps}
        >
          {ContextData.map((item) => (
            <MenuItem
              key={item.name}
              value={item.name}
              style={getStyles(item.name, profileSelected, theme)}
            >
              {item.name}
              {item.email && (
                <>
                  <br />({item.email})
                </>
              )}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
