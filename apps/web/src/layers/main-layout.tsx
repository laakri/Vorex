import { Outlet } from "react-router-dom";
import { MainNav } from "../pages/main/main-nav";

export function MainLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
