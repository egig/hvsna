import { usePlatform } from "./screens/platform";

export const ResponsiveRoutes = () => {
  const { Routes } = usePlatform();
  return <Routes />;
};
