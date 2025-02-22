import { Routes, Route } from "react-router-dom";
// Main layers
import { MainLayout } from "@/layers/main-layout";
import { MainHomePage } from "@/pages/main/main-home";
import { MainPricing } from "@/pages/main/main-pricing";
import { MainNetwork } from "@/pages/main/main-network";
import { MainAbout } from "@/pages/main/main-about";
import { MainTrack } from "@/pages/main/main-track";
import { MainContact } from "@/pages/main/main-contact";
// Auth layers
import { AuthLayout } from "@/layers/auth-layout";
import { SignIn } from "@/pages/auth/sign-in";
import { SignUp } from "@/pages/auth/sign-up";
// Seller layers
import { SellerLayout } from "@/layers/seller-layout";
import { SellerOnboarding } from "@/pages/seller/seller-onboarding";
import { SellerDashboard } from "@/pages/seller/seller-dashboard";
import { ProductsPage } from "@/pages/seller/products/products";
import { OrdersPage } from "@/pages/seller/orders/orders";
import OrderPage from "@/pages/seller/orders/order-page";

// Protected route
import { ProtectedRoute } from "./protected-route";
import { SellerGuard } from "./seller-guard";
import { StoreSettingsPage } from "@/pages/seller/settings/store-settings";
import { DriverApplication } from "@/pages/driver/driver-application";
import { GoogleCallback } from "@/pages/auth/google-callback";


export function AppRoutes() {
  return (
    <Routes>
      {/* Main Platform */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<MainHomePage />} />
        <Route path="pricing" element={<MainPricing />} />
        <Route path="about" element={<MainAbout />} />
        <Route path="network" element={<MainNetwork />} />
        <Route path="track" element={<MainTrack />} />
        <Route path="contact" element={<MainContact />} />
        <Route path="order/:orderId" element={<OrderPage />} />

      </Route>

      {/* Auth Platform */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="sign-in" element={<SignIn />} />
        <Route path="sign-up" element={<SignUp />} />
        <Route path="google-callback" element={<GoogleCallback />} />
      </Route>

      {/* Seller Platform */}
      <Route path="/seller" element={<SellerLayout />}>
        <Route
          index
          element={
            <ProtectedRoute>
              <SellerGuard>
                <SellerDashboard />
              </SellerGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <SellerGuard>
                <SellerDashboard />
              </SellerGuard>
            </ProtectedRoute>
          }
        />
        <Route path="onboarding" element={<SellerOnboarding />} />
        <Route
          path="products"
          element={
            <ProtectedRoute>
              <SellerGuard>
                <ProductsPage />
              </SellerGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <SellerGuard>
                <OrdersPage />
              </SellerGuard>
            </ProtectedRoute>
          }
        />
        <Route path="settings" element={<ProtectedRoute>
              <SellerGuard>
                <StoreSettingsPage />
              </SellerGuard>
            </ProtectedRoute>} />
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
    <Route path="driver/application" element={<DriverApplication />} />
    </Routes>
  );
}
