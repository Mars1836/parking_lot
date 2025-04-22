"use client";
// contexts/ServerUrlContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { db, ref, onValue } from "../lib/firebase";

const ServerUrlContext = createContext();

export function ServerUrlProvider({ children }) {
  const [serverUrl, setServerUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const serverUrlRef = ref(db, "server/url2");

    const unsubscribe = onValue(serverUrlRef, (snapshot) => {
      const url = snapshot.val();

      setServerUrl(url);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ServerUrlContext.Provider value={{ serverUrl, loading }}>
      {children}
    </ServerUrlContext.Provider>
  );
}

export function useServerUrl() {
  const context = useContext(ServerUrlContext);
  if (context === undefined) {
    throw new Error("useServerUrl must be used within a ServerUrlProvider");
  }
  return context;
}
