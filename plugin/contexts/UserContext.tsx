import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "../types";
import { getUser } from "../api/user";
import { useCommentasaurusConfig } from "../hooks/useConfig";

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  const { apiUrl } = useCommentasaurusConfig();

  const refreshUser = async () => {
    const { user: fetchedUser, error } = await getUser(apiUrl);
    if (error || !fetchedUser) {
      setUser(null);
      return;
    }
    setUser(fetchedUser);
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};
