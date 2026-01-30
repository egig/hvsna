import { Outlet } from "react-router";
import { TabBar } from "../modules/navigation";

export default function TabLayout() {
  return (
    <div className="max-w-[520px] m-auto">
      <Outlet />
      <TabBar />
    </div>
  );
}
