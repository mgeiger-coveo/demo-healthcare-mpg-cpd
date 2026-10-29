import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export default function BasicMenu() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const [menuitems, setmenuitems] = React.useState([]);

  const fetchlistings = async () => {
    try {
      const plpListResponse = await fetch(
        new URL(
          `${import.meta.env.VITE_PLATFORM_URL}/rest/organizations/${import.meta.env.VITE_ORGANIZATION_ID}/commerce/v2/listings/pages?trackingId=${import.meta.env.VITE_COMMERCE_ENGINE_TRACKING_ID}&page=0&perPage=100`,
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_GET_PRODUCT_LISTING_API_KEY}`,
          },
        },
      );

      if (!plpListResponse.ok) {
        console.error(
          `Failed to fetch listings: ${plpListResponse.status} ${plpListResponse.statusText}`,
        );
        return;
      }

      const json = await plpListResponse.json();
      if (json && Array.isArray(json.items)) {
        setmenuitems(json.items);
      }
    } catch (e) {
      console.error("Failed to fetch product listings:", e);
    }
  };

  React.useEffect(() => {
    fetchlistings();
  }, []);

  if (menuitems.length === 0) {
    return null;
  }

  return (
    <div>
      <Button
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onMouseOver={handleClick}
      >
        Products
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        {menuitems &&
          menuitems.map((item, index) => {
            if (item.name === "GLOBAL") {
              return null;
            }
            return (
              <MenuItem
                key={item.id}
                onClick={() =>
                  window.open(
                    item.patterns[0].url.replace(
                      `${import.meta.env.VITE_COMMERCE_ENGINE_URL}`,
                      "",
                    ),
                    "_self",
                  )
                }
              >
                {item.name}
              </MenuItem>
            );
          })}
      </Menu>
    </div>
  );
}
