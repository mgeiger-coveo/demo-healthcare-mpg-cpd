import React from "react";
import styled from "styled-components";
import classes from "./ContextDataTable.module.css";
import { trash2 } from "react-icons-kit/feather/trash2";
import { Icon } from "react-icons-kit";
import { plus } from "react-icons-kit/feather/plus";
import { Theme } from "../../config/theme";

const ContextDataTable = ({
  ContextData,
  profileSelected,
  setContextData,
  handleSave,
}) => {
  const FilteredProfileContext = ContextData.filter(
    (item) => item.name === profileSelected,
  );
  const handleInput = (e, index) => {
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    setContextData((prev) => {
      const indexOF = prev.findIndex((item) => item.name === profileSelected);
      prev[indexOF].context[index][name] = value;
      return [...prev];
    });
  };

  const handleNewRow = () => {
    setContextData((prev) => {
      const indexOF = prev.findIndex((item) => item.name === profileSelected);
      prev[indexOF].context.push({
        active: false,
        keyName: "",
        keyValue: "",
        customQRF: false,
      });
      return [...prev];
    });
  };

  const handleDelete = (ev, index) => {
    setContextData((prev) => {
      const indexOF = prev.findIndex((item) => item.name === profileSelected);
      prev[indexOF].context.splice(index, 1);
      return [...prev];
    });
  };

  return (
    <>
      <Wrapper>
        <table style={{ width: "100%" }} className={classes.table}>
          <thead>
            <tr>
              <th>
                <Title>Active</Title>
              </th>
              <th>
                <Title>Key Name</Title>
              </th>
              <th>
                <Title>Key Value</Title>
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {FilteredProfileContext[0].context.length > 0 ? (
              <>
                {FilteredProfileContext[0].context.map((item, index) => {
                  return (
                    <tr key={item.keyName + index}>
                      <td>
                        <input
                          type="checkbox"
                          name="active"
                          checked={item.active}
                          onChange={(ev) => handleInput(ev, index)}
                          disabled={item.disabled}
                        />
                      </td>
                      <td>
                        <Input
                          autoFocus
                          type="string"
                          name="keyName"
                          value={item.keyName}
                          disabled={item.disabled}
                          onChange={(ev) => handleInput(ev, index)}
                        />
                      </td>
                      <td>
                        <Input
                          type="string"
                          name="keyValue"
                          value={item.keyValue}
                          disabled={item.disabled}
                          onChange={(ev) => handleInput(ev, index)}
                        />
                      </td>
                      <td>
                        <Icon
                          style={{
                            cursor: "pointer",
                            opacity: item.disabled ? 0.5 : 1,
                          }}
                          icon={trash2}
                          onClick={(ev) =>
                            !item.disabled && handleDelete(ev, index)
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </>
            ) : null}
          </tbody>
        </table>
        <AddIcon icon={plus} size={32} onClick={handleNewRow} />
      </Wrapper>
      <Button onClick={handleSave}>Save</Button>
    </>
  );
};

const Wrapper = styled.div`
  margin-top: 15px;
  width: 95%;
  padding: 20px;
  /* height: 200px; */
  max-height: 250px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  font-size: 16px;
  font-weight: 300;
`;

const Title = styled.h4`
  font-size: 16px;
  font-weight: 400;
`;

const AddIcon = styled(Icon)`
  /* marginTop: '20px', border: '2px black solid', borderRadius : '20px', cursor:'pointer' */
  margin-top: 20px;
  border: 2px ${Theme.button} solid;
  color: ${Theme.primaryText};
  border-radius: 20px;
  cursor: pointer;
  transition: 0.1s ease-in-out all;
  &:hover {
    background: ${Theme.button};
    color: ${Theme.buttonText};
  }
`;

const Button = styled.button`
  position: absolute;
  bottom: 20px;
  padding: 8px 16px;
  width: 100px;
  height: 40px;
  background-color: ${Theme.button};
  border-radius: 8px;
  font-family: inherit;
  font-style: normal;
  font-weight: 400;
  font-size: 13px;
  line-height: 24px;
  color: ${Theme.buttonText};
  border: none;
  cursor: pointer;
  transition: 0.2s ease-in-out;
  &:hover {
    background-color: ${Theme.button}CC;
  }
`;

export default ContextDataTable;
