import React, { useContext } from "react";
import styled from "styled-components";
import ProfileSelector from "./ProfileSelector";
import ContextDataTable from "./ContextDataTable";
import { CustomContextContext } from "./CustomContextContext";

const ContextForm = () => {
  const {
    profileSelected,
    setProfiledSelected,
    ContextData,
    setContextData,
    handleSave,
  } = useContext(CustomContextContext);

  return (
    <Wrapper>
      <h4>Profile Selector</h4>
      <ProfileSelector
        setProfiledSelected={setProfiledSelected}
        profileSelected={profileSelected}
        ContextData={ContextData}
      />
      <h4>Context</h4>
      <ContextDataTable
        profileSelected={profileSelected}
        setContextData={setContextData}
        ContextData={ContextData}
        handleSave={handleSave}
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  margin: 20px;
  max-width: 600px;
  height: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  @media (max-width: 768px) {
    padding: 0px;
  }
  /* justify-content: space-around; */
`;

export default ContextForm;
