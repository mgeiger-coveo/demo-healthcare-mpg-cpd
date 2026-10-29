import react, { useContext } from "react";
import { LanguagesConfig } from "../../config/InternationalizationConfig";
import { LanguageContext } from "./LanguageUtils";
import styled from "styled-components";

export const InternationalizationDropdown = () => {
  const { selectedLanguage, changeLanguage } = useContext(LanguageContext);

  const onElementChange = (event: any) => {
    changeLanguage(event.target.value);
    window.location.reload();
  };

  return (
    <CustomSelect value={selectedLanguage} onChange={onElementChange}>
      {Object.entries(LanguagesConfig).map(([key, value]) => (
        <option value={key} key={key}>
          {value}
        </option>
      ))}
    </CustomSelect>
  );
};

const CustomSelect = styled.select`
  display: flex;
  align-items: center;
  background-color: white;
  border: 0;
  margin-left: 25px;
  font-size: 25px;
  &:hover {
    cursor: pointer;
  }
`;
