import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";

const MainLayout = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <Navbar />
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
