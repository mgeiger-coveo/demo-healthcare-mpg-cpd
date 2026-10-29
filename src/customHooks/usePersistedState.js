import React from "react";

export default function usePersistedState(name, defaultValue) {
  const [value, setValue] = React.useState(() => {
    const persistedValue =
      typeof window !== "undefined" && window.localStorage.getItem(name);

    return persistedValue !== null ? JSON.parse(persistedValue) : defaultValue;
  });

  React.useEffect(() => {
    window.localStorage.setItem(name, JSON.stringify(value));
  }, [name, value]);

  return [value, setValue];
}

export function usePersistedSessionState(name, defaultValue) {
  const [value, setValue] = React.useState(() => {
    const persistedValue =
      typeof window !== "undefined" && window.sessionStorage.getItem(name);

    return persistedValue !== null ? JSON.parse(persistedValue) : defaultValue;
  });

  React.useEffect(() => {
    window.sessionStorage.setItem(name, JSON.stringify(value));
  }, [name, value]);

  return [value, setValue];
}
