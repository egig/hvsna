import { Navigate, Route, Routes, useLocation } from "react-router";
import Home from "./pages/view-today";
import DateView from "./pages/view-date";
import MonthView from "./pages/view-month";
import YearView from "./pages/view-year";

export const AppRoutes = () => {
  // https://blog.logrocket.com/building-react-modal-module-with-react-router/
  const location = useLocation();
  const settingsBackgroundLocation = location.state?.settingsBackgroundLocation;
  return (
    <>
      <Routes location={settingsBackgroundLocation || location}>
        <Route index element={<Home/>}/>
        <Route path="y/:year/m/:month/d/:date" element={<DateView/>}/>
        <Route path="y/:year/m/:month" element={<MonthView/>}/>
        <Route path="y/:year" element={<YearView/>}/>
      </Routes>
      <Routes>
        <Route path="settings" element={<div>Settings</div>} />
        <Route path="*" element={<div />} />
      </Routes>
    </>
  );
};
