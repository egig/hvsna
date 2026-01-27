import { Navigate, Route, Routes, useLocation } from "react-router";
import Home from "./pages/view-today";
import MonthView from "./pages/view-month";
import YearView from "./pages/view-year";
import Layout from "./pages/layout";
import About from "./pages/about";
import TabsPage from "./pages/tabs";
import MetricsPage from "./pages/metrics";
import EvaluationsPage from "./pages/evaluation-list";

export const AppRoutes = () => {
  // https://blog.logrocket.com/building-react-modal-module-with-react-router/
  const location = useLocation();
  const settingsBackgroundLocation = location.state?.settingsBackgroundLocation;
  return (
    <>
      <Routes location={settingsBackgroundLocation || location}>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tabs" element={<TabsPage />} />
          <Route path="metrics" element={<MetricsPage />} />
          <Route path="evaluations" element={<EvaluationsPage />} />
          <Route path="about" element={<About />} />
          <Route path="y/:year/m/:month" element={<MonthView />} />
          <Route path="y/:year" element={<YearView />} />
        </Route>
      </Routes>
      <Routes>
        <Route path="settings" element={<div>Settings</div>} />
        <Route path="*" element={<div />} />
      </Routes>
    </>
  );
};
