import { ThemeProvider } from "@/theme/theme-provider";
import { AppRoutes } from "@/routes";

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}
