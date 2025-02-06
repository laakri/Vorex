import { Routes, Route } from "react-router-dom";
import { MainLayout } from "@/layers/main-layout";
import { MainHomePage } from "@/pages/main/main-home";
import { MainPricing } from "@/pages/main/main-pricing";
import { MainNetwork } from "./pages/main/main-network";
import { MainAbout } from "./pages/main/main-about";
import { MainTrack } from "./pages/main/main-track";
import { MainContact } from "./pages/main/main-contact";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<MainHomePage />} />
        <Route path="pricing" element={<MainPricing />} />
        <Route path="about" element={<MainAbout />} />
        <Route path="network" element={<MainNetwork />} />
        <Route path="track" element={<MainTrack />} />
        <Route path="contact" element={<MainContact />} />
        <Route path="services" element={<div>Services Page</div>} />
        <Route path="login" element={<div>Login Page</div>} />
        <Route path="register" element={<div>Register Page</div>} />

        {/* Seller Platform */}
        <Route path="seller">
          <Route index element={<div>Seller Dashboard</div>} />
          <Route path="products" element={<div>Products Management</div>} />
          <Route path="orders" element={<div>Orders Management</div>} />
        </Route>

        {/* Warehouse Platform */}
        <Route path="warehouse">
          <Route index element={<div>Warehouse Dashboard</div>} />
          <Route path="inventory" element={<div>Inventory Management</div>} />
          <Route path="sections" element={<div>Sections Management</div>} />
        </Route>

        {/* Delivery Platform */}
        <Route path="delivery">
          <Route index element={<div>Delivery Dashboard</div>} />
          <Route path="routes" element={<div>Routes Management</div>} />
          <Route path="drivers" element={<div>Drivers Management</div>} />
        </Route>
      </Route>
    </Routes>
  );
}
