import { Button } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";

interface IShowLessFacetValuesProps {
  onClick: () => void;
}

export default function ShowLessFacetValues({
  onClick,
}: IShowLessFacetValuesProps) {
  return (
    <Button
      color="inherit"
      onClick={onClick}
      startIcon={<RemoveIcon fontSize={"small"} />}
      size="small"
    >
      Show Less
    </Button>
  );
}
