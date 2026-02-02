import { Outlet } from "react-router";
import { TabBar } from "../modules/navigation";

export default function TabLayout() {
  return (
    <div className="m-auto h-[100%]">
      <div className="h-[calc(100%-70px)]">
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
}
