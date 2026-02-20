import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Snackbar } from "./snackbar";

interface SnackbarItem {
  id: string;
  message: React.ReactNode;
  autoHideDuration?: number;
  showCloseButton?: boolean;
}

interface SnackbarContextType {
  showSnackbar: (
    message: React.ReactNode,
    options?: {
      autoHideDuration?: number;
      showCloseButton?: boolean;
    },
  ) => string;
  createSnackbar: (
    message: React.ReactNode,
    options?: {
      autoHideDuration?: number;
      showCloseButton?: boolean;
    },
  ) => string;
  hideSnackbar: (id?: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined,
);

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
}

interface SnackbarProviderProps {
  children: ReactNode;
  maxSnackbars?: number;
}

export function SnackbarProvider({
  children,
  maxSnackbars = 3,
}: SnackbarProviderProps) {
  const [snackbars, setSnackbars] = useState<SnackbarItem[]>([]);

  const generateId = () =>
    `snackbar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const showSnackbar = (
    message: React.ReactNode,
    options?: {
      autoHideDuration?: number;
      showCloseButton?: boolean;
    },
  ) => {
    const id = generateId();
    const newSnackbar: SnackbarItem = {
      id,
      message,
      autoHideDuration: options?.autoHideDuration,
      showCloseButton: options?.showCloseButton,
    };

    setSnackbars((prev) => {
      const updated = [...prev, newSnackbar];
      // Keep only the most recent snackbars
      return updated.slice(-maxSnackbars);
    });

    return id;
  };

  const createSnackbar = (
    message: React.ReactNode,
    options?: {
      autoHideDuration?: number;
      showCloseButton?: boolean;
    },
  ) => {
    return showSnackbar(message, options);
  };

  const hideSnackbar = (id?: string) => {
    if (id) {
      // Hide specific snackbar
      setSnackbars((prev) => prev.filter((snackbar) => snackbar.id !== id));
    } else {
      // Hide the most recent snackbar
      setSnackbars((prev) => prev.slice(0, -1));
    }
  };

  return (
    <SnackbarContext.Provider
      value={{ showSnackbar, createSnackbar, hideSnackbar }}
    >
      {children}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto sm:max-w-md z-50 flex flex-col gap-2">
        {snackbars.map((snackbar, index) => (
          <Snackbar
            key={snackbar.id}
            isOpen={true}
            onClose={() => hideSnackbar(snackbar.id)}
            autoHideDuration={snackbar.autoHideDuration}
            showCloseButton={snackbar.showCloseButton}
            className={`
              transition-all duration-300 ease-out
              ${index === snackbars.length - 1 ? "translate-y-0 opacity-100" : "translate-y-1 opacity-80"}
            `}
          >
            {snackbar.message}
          </Snackbar>
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}
