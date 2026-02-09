import { createContext, useContext, ReactNode } from "react";

interface DrawerPortalContextType {
  getDrawerBodyElement: () => HTMLElement | null;
}

export const DrawerPortalContext = createContext<DrawerPortalContextType | null>(null);

export const useDrawerPortal = () => {
  const context = useContext(DrawerPortalContext);
  if (!context) {
    return null;
  }
  return context;
};