import React, {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { IconButton } from "@mui/material";
import { SpeechToText } from "../../config/SearchConfig";
import { LanguageContext } from "../Internationalization/LanguageUtils";
import KeyboardVoiceIcon from "@mui/icons-material/KeyboardVoice";
import styled from "styled-components";
import _ from "lodash";

export const SpeechRecognitionButton = (props: any) => {
  const { controller } = props;
  const { selectedLanguage } = useContext(LanguageContext);
  const [isRendered, setIsRendered] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const recognition: any = createRecognitionModel(
    controller,
    selectedLanguage,
    setIsRecognizing,
  );

  useEffect(() => {
    if (!SpeechToText || !recognition) return setIsRendered(false);
    setIsRendered(true);
  }, []);

  return isRendered ? (
    <StyledMicButton
      disabled={isRecognizing}
      onClick={() => recognition?.start()}
    >
      <KeyboardVoiceIcon style={isRecognizing ? inUseStyle : {}} />
    </StyledMicButton>
  ) : null;
};

const createRecognitionModel = (
  controller: any,
  selectedLanguage: string,
  setState: Dispatch<SetStateAction<boolean>>,
) => {
  if (!("webkitSpeechRecognition" in window)) return null;

  // @ts-ignore (Here because we do not have a defined type for Speech Recognition)
  const recognition: any = new webkitSpeechRecognition();
  let finalResult = "";

  // Set recognition properties (When using interim results you must set continous to false otherwise you will need to setup a timeout functionality)
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = selectedLanguage;

  recognition.onstart = (event: any) => {
    setState(true);
  };

  recognition.onend = (event: any) => {
    setState(false);
    if (finalResult.length == 0) return;
    controller.updateText(_.capitalize(finalResult));
    controller.submit();
    // For the main search page this isn't needed but is required for the search on the home page.
    window.open("/search" + window.location.hash, "_self");
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = "";
    for (var i = event.resultIndex; i < event.results.length; i++) {
      let transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalResult += transcript;
      else {
        interimTranscript += transcript;
        controller.updateText(interimTranscript);
      }
    }
  };

  recognition.onerror = (event: any) => {
    console.error(
      "Speech recognition failed, please enter results manually or try again.",
    );
  };

  return recognition;
};

const inUseStyle = {
  color: "red",
};

const StyledMicButton = styled(IconButton)`
  transform: scale(0.75);
  padding: 0;
`;
