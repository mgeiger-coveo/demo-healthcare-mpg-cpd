import react, { createContext, useState } from "react";
import {
  DefaultLanguage,
  InternationalizationEnabled,
} from "../../config/InternationalizationConfig";
import usePersistedState from "../../customHooks/usePersistedState";

export const LanguageContext = createContext<any>({} as any);

export const LanguageContextProvider = ({ children }: any) => {
  const [selectedLanguage, setSelectedLanguage] = usePersistedState(
    "locale",
    DefaultLanguage,
  );

  const changeLanguage = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
  };

  const getText = (
    defaultText: string,
    config: Record<string, any> | null = null,
    field: string | null = null,
  ) => {
    const getProperty = (
      data: Record<string, any>,
      property: string,
      defaultText: string,
    ) => {
      const hasProperty = Object(data).hasOwnProperty(property);
      const hasSelectedLanguage = Object(data[property]).hasOwnProperty(
        selectedLanguage,
      );
      const hasDefaultLanguage = Object(data[property]).hasOwnProperty(
        DefaultLanguage,
      );

      if (hasProperty && hasSelectedLanguage)
        return data[property][selectedLanguage];
      else if (hasProperty && hasDefaultLanguage)
        return data[property][DefaultLanguage];
      else return defaultText;
    };

    return config && field && InternationalizationEnabled
      ? getProperty(config, field, defaultText)
      : defaultText;
  };

  const contextValue: LanguageContextValue = {
    selectedLanguage,
    changeLanguage,
    getText,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

interface LanguageContextValue {
  selectedLanguage: string;
  changeLanguage: (newLanguage: string) => void;
  getText: (
    defaultText: string,
    config?: Record<string, any> | null,
    field?: string | null,
  ) => string;
}
