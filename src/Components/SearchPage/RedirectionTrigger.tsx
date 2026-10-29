import { useEffect, useState, FunctionComponent, useContext } from "react";
import {
  buildRedirectionTrigger,
  RedirectionTrigger as HeadlessRedirectionTrigger,
} from "@coveo/headless";
import EngineContext from "../../common/engineContext";

interface HeadlessRedirectionTriggerProps {
  controller: HeadlessRedirectionTrigger;
}

const RedirectionTriggerRenderer: FunctionComponent<
  HeadlessRedirectionTriggerProps
> = (props) => {
  const { controller } = props;
  const [state, setState] = useState(controller.state);

  useEffect(() => controller.subscribe(() => redirect()), []);
  useEffect(() => redirect(), [state.redirectTo]);

  const redirect = () => {
    setState(props.controller.state);
    if (state.redirectTo) {
      window.location.replace(controller.state.redirectTo);
    }
  };

  return null;
};

const RedirectionTrigger: FunctionComponent = () => {
  const engine = useContext(EngineContext)!;
  const controller = buildRedirectionTrigger(engine);

  return <RedirectionTriggerRenderer controller={controller} />;
};

export default RedirectionTrigger;
