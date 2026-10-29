import React, { useEffect, useState } from "react";
import { Result } from "@coveo/headless";

interface QuickViewModalContextType {
  result: any;
  openModal: boolean;
  setResult: (x: Result) => void;
  setOpenModal: (x: boolean) => void;
}

export const QuickViewModalContext =
  React.createContext<QuickViewModalContextType>({
    result: {},
    openModal: false,
    setResult: () => {},
    setOpenModal: () => {},
  });

const QuickViewModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [result, setResult] = useState<any>({});
  const [openModal, setOpenModal] = useState(false);

  return (
    <QuickViewModalContext.Provider
      value={{ result, openModal, setResult, setOpenModal }}
    >
      {children}
    </QuickViewModalContext.Provider>
  );
};

export default QuickViewModalProvider;
