import React from "react";
import { UserProvider } from "../contexts/UserContext";

export default function Root({ children }) {
  return <UserProvider>{children}</UserProvider>;
}
