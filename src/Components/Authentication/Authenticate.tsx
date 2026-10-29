import React from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState } from "react";
import App from "../../App";
import { usePersistedSessionState } from "../../customHooks/usePersistedState";

const firebaseConfig = {
  // Supplied via environment, so no Firebase project identifier is committed.
  // Required only when EnableAuthentication is true in src/config/HomeConfig.tsx.
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
};

const Authenticate: React.FC = () => {
  const [userLoggedIn, setUserLoggedIn] = usePersistedSessionState(
    "logged-in",
    false,
  );

  const app = initializeApp(firebaseConfig);
  const auth = getAuth();

  const authenticateUser = () => {
    let email: string | null =
      import.meta.env.VITE_AUTH_ADMIN_EMAIL ?? null;
    let password: string | null = prompt("Password");

    if (email && password) {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          setUserLoggedIn(true);
        })
        .catch((error) => {
          alert("Incorrect password");
          authenticateUser();
        });
    } else {
      alert("Incorrect password");
      authenticateUser();
    }
  };

  useEffect(() => {
    if (userLoggedIn === false) {
      authenticateUser();
    }
  }, []);

  return <>{userLoggedIn ? <App /> : null}</>;
};

export default Authenticate;
