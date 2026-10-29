import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

interface IShowMoreFacetValuesProps {
  onClick: () => void;
}

export default function ShowMoreFacetValues({
  onClick,
}: IShowMoreFacetValuesProps) {
  return (
    <Button
      color="primary"
      onClick={onClick}
      startIcon={<AddIcon fontSize={"small"} />}
      size="small"
    >
      Show more
    </Button>
  );
}
