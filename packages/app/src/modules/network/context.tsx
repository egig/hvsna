import { createNetworkProvider } from "@/infra";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface NetworkContextType {
  initiated: boolean;
  isOnline: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetworkContext = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error(
      "useLocaitonContext must be used within a LocationProvider"
    );
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({
  children,
}) => {
  const [isOnline, setIsOnline] = useState(false);
  const [initiated, setIsInitiated] = useState(false);
  const networkDriver = createNetworkProvider();

  // Network status monitoring
  useEffect(() => {
    let networkListener: any = null;

    const initializeNetworkMonitoring = async () => {
      try {
        // Get initial network status
        const status = await networkDriver.getStatus();
        setIsOnline(status.connected);

        // Add network status listener
        networkListener = await networkDriver.addListener((networkStatus) => {
          setIsOnline(networkStatus.connected);
        });
      } catch (error) {
        // TODO
      }
    };

    initializeNetworkMonitoring();
    setIsInitiated(true);

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        initiated,
        isOnline,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};
