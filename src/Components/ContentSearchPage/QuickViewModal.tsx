import React, { useContext, useEffect, useState } from "react";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import { QuickViewModalContext } from "./QuickViewModalContext";
import { buildQuickview } from "@coveo/headless";
import EngineContext from "../../common/engineContext";
import { DialogContent } from "@mui/material";
import { x } from "react-icons-kit/feather/x";
import { Icon } from "react-icons-kit";
import styled from "styled-components";

export const QuickViewRenderer: React.FC<{ controller: any }> = ({
  controller,
}) => {
  const [state, setState] = useState(controller.state);

  useEffect(() => controller.subscribe(() => setState(controller.state)), []);

  return (
    <iframe
      title={state.title}
      srcDoc={state.content}
      style={{ width: "100%", height: "95%" }}
    ></iframe>
  );
};

const QuickViewModal = () => {
  const { openModal, result, setOpenModal } = useContext(
    QuickViewModalContext,
  )!;
  const engine = useContext(EngineContext)!;

  if (openModal) {
    const controller = buildQuickview(engine!, { options: { result: result } });
    controller.fetchResultContent();
    const handleClose = () => {
      setOpenModal(false);
    };

    return (
      <Dialog onClose={handleClose} open={openModal} fullWidth maxWidth="lg">
        <DialogTitle>{result.title}</DialogTitle>
        <CrossButton icon={x} size={24} onClick={() => handleClose()} />
        <DialogContent style={{ height: "70vh" }}>
          <QuickViewRenderer controller={controller} />
        </DialogContent>
      </Dialog>
    );
  } else {
    return null;
  }
};

export default QuickViewModal;

const CrossButton = styled(Icon)`
  position: absolute;
  right: 20px;
  top: 15px;
  cursor: pointer;
`;
