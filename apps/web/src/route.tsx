import { Routes, Route } from "react-router-dom";
import { MainLayout } from "@/layers/main-layout";
import { MainHomePage } from "@/pages/main/main-home";
import { MainPricing } from "@/pages/main/main-pricing";
import { MainNetwork } from "./pages/main/main-network";
import { MainAbout } from "./pages/main/main-about";
import { MainTrack } from "./pages/main/main-track";
import { MainContact } from "./pages/main/main-contact";
import { AuthLayout } from "./layers/auth-layout";
import { SignIn } from "./pages/auth/sign-in";
import { SignUp } from "./pages/auth/sign-up";
import { SellerLayout } from "./layers/seller-layout";
import { SellerOnboarding } from "./pages/seller/seller-onboarding";
import { SellerDashboard } from "./pages/seller/seller-dashboard";

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
      </Route>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="sign-in" element={<SignIn />} />
        <Route path="sign-up" element={<SignUp />} />
      </Route>

      {/* Seller Platform */}
      <Route path="/seller" element={<SellerLayout />}>
        <Route index element={<SellerDashboard />} />
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="onboarding" element={<SellerOnboarding />} />
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
    </Routes>
  );
}
