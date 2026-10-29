import {
  RelevanceInspector as HeadlessRelevanceInspector,
  buildRelevanceInspector,
} from "@coveo/headless";
import { useEffect, useState, FunctionComponent, useContext } from "react";
import EngineContext from "../../common/engineContext";
import { Checkbox } from "@mui/material";

interface RelevanceInspectorProps {
  controller: HeadlessRelevanceInspector;
}

export const RelevanceInspectorRenderer: FunctionComponent<
  RelevanceInspectorProps
> = (props) => {
  const { controller } = props;
  const [state, setState] = useState({
    ...controller.state,
    fetchAllFields: false,
  });
  console.log(controller.state);
  useEffect(
    () =>
      controller.subscribe(() => {
        console.info("Debug information [fn]", controller.state);
        setState({
          ...controller.state,
          fetchAllFields: controller.state.fetchAllFields
            ? controller.state.fetchAllFields
            : false,
        });
      }),
    [],
  );

  return (
    <div
      style={{
        maxWidth: "550px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
      }}
    >
      <div>
        <Checkbox
          checked={state.isEnabled}
          onChange={() =>
            state.isEnabled ? controller.disable() : controller.enable()
          }
        />
        <label>Enable debug mode</label>
      </div>
      <div>
        <Checkbox
          checked={state.fetchAllFields}
          onChange={() =>
            state.fetchAllFields
              ? controller.disableFetchAllFields()
              : controller.enableFetchAllFields()
          }
        />
        <label>Enable fetch all fields</label>
      </div>
      <button onClick={() => controller.fetchFieldsDescription()}>
        Retrieve fields description
      </button>
    </div>
  );
};

const RelevanceInspector = () => {
  const Engine = useContext(EngineContext)!;

  const controller = buildRelevanceInspector(Engine);

  return <RelevanceInspectorRenderer controller={controller} />;
};

export default RelevanceInspector;

// usage

/**
 * ```tsx
 * const controller = buildRelevanceInspector(engine);
 *
 * <RelevanceInspector controller={controller} />;
 * ```
 */
