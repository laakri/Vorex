import { Routes, Route } from "react-router-dom";
// Main layers
import { MainLayout } from "@/layers/main-layout";
import { MainHomePage } from "@/pages/main/main-home";
import { MainPricing } from "@/pages/main/main-pricing";
import { MainNetwork } from "@/pages/main/main-network";
import { MainAbout } from "@/pages/main/main-about";
import { MainContact } from "@/pages/main/main-contact";
// Auth layers
import { AuthLayout } from "@/layers/auth-layout";
import { SignIn } from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import Unauthorized from "@/pages/auth/Unauthorized";
import { VerifyEmail } from "@/pages/auth/verify-email";
import { ForgotPassword } from "@/pages/auth/forgot-password";
import { ResetPassword } from "@/pages/auth/reset-password";
// Seller layers
import { SellerLayout } from "@/layers/seller-layout";
import { SellerOnboarding } from "@/pages/seller/seller-onboarding";
import { SellerDashboard } from "@/pages/seller/seller-dashboard";
import { ProductsPage } from "@/pages/seller/products/products";
import { OrdersPage } from "@/pages/seller/orders/orders";
import { StoreSettingsPage } from "@/pages/seller/settings/store-settings";
import InvoicePage from "@/pages/seller/orders/invoice";
import SellerGuide from "@/pages/seller/seller-guide";
// Driver layers
import { DriverLayout } from "@/layers/driver-layout";
import { DriverApplication } from "@/pages/driver/driver-application";
// Protected route
import { SellerGuard } from "./seller-guard";
import { GoogleCallback } from "@/pages/auth/google-callback";
import { RoleSelectionPage } from "@/pages/auth/RoleSelectionPage";
import { DriverAvailableRoutes } from "@/pages/driver/driver-available-routes";
import { ProtectedRoute } from "./protected-route";
import { DriverDashboard } from "@/pages/driver/driver-dashboard";
import { ActiveDelivery } from "@/pages/driver/driver-active-delivery";
import { DriverHistory } from "@/pages/driver/driver-history";
import DriverVehicle from "@/pages/driver/driver-vehicle";
import DriverSettings from "@/pages/driver/driver-settings";
import { DriverGuard } from "./driver-guard";
import { TrackPage } from "@/pages/track/track";
import TrackOrderPage from "@/pages/track/track-order";
import { WarehouseLayout } from "@/layers/warehouse-layout";
import { AdminLayout } from "@/layers/admin-layout";
import { AdminWarehouseManagersPage } from "@/pages/admin/warehouse-managers";
import { WarehouseSectionsPage } from "@/pages/warehouse/warehouse-sections";
import { WarehouseGuard } from "./warehouse-guard";
import WarehouseInventoryPage from "@/pages/warehouse/warehouse-inventory";
import IncomingOrdersPage from "@/pages/warehouse/warehouse-incoming-orders";
import OutgoingOrdersPage from "@/pages/warehouse/warehouse-outgoing-orders";
import WarehouseDashboard from "@/pages/warehouse/warehouse-dashboard";
import WarehouseSettings from "@/pages/warehouse/warehouse-settings";
import NotificationPage from "@/pages/notification/NotificationPage";
// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import UsersPage from "@/pages/admin/users";
import WarehousesPage from "@/pages/admin/warehouses";
import { DriverEarnings } from "@/pages/driver/driver-earnings";
// Add voice agent import
import { SellerApiPage } from "@/pages/seller/seller-api";

export function AppRoutes() {
  return (
    <Routes>
      {/* Main Platform */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<MainHomePage />} />
        <Route path="pricing" element={<MainPricing />} />
        <Route path="about" element={<MainAbout />} />
        <Route path="network" element={<MainNetwork />} />
        <Route path="contact" element={<MainContact />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/track/:trackingId" element={<TrackOrderPage />} />
       
      </Route>

      {/* Auth Platform */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="sign-in" element={<SignIn />} />
        <Route path="sign-up" element={<SignUp />} />
        <Route path="google/callback" element={<GoogleCallback />} />
        <Route path="verify-email" element={<VerifyEmail />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
      </Route>
      <Route path="role-selection" element={<RoleSelectionPage />} />

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
        <Route
          path="onboarding"
          element={
            <ProtectedRoute>
              <SellerGuard>
                <SellerOnboarding />
              </SellerGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <ProtectedRoute>
              <NotificationPage />
            </ProtectedRoute>
          }
        />
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
        <Route
          path="orders/:orderId/invoice"
          element={
            <ProtectedRoute>
              <SellerGuard>
                <InvoicePage />
              </SellerGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <SellerGuard>
                <StoreSettingsPage />
              </SellerGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="guide"
          element={
            <ProtectedRoute>
              <SellerGuard>
                <SellerGuide />
              </SellerGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="api"
          element={
                <SellerApiPage />
          }
        />
      </Route>

      {/* Unauthorized Route */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Admin Platform */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="warehouses-managers" element={<AdminWarehouseManagersPage />} />
        <Route path="notifications" element={<NotificationPage />} />
      </Route>

      {/* Warehouse Platform */}
      <Route
        path="/warehouse"
        element={
          <WarehouseGuard>
            <WarehouseLayout />
          </WarehouseGuard>
        }
      >
        <Route
          index
          element={
            <WarehouseGuard>
              <WarehouseDashboard />
            </WarehouseGuard>
          }
        />
        <Route
          path="dashboard"
          element={
            <WarehouseGuard>
              <WarehouseDashboard />
            </WarehouseGuard>
          }
        />
        <Route
          path="notifications"
          element={
            <WarehouseGuard>
              <NotificationPage />
            </WarehouseGuard>
          }
        />
        <Route
          path="sections"
          element={
            <WarehouseGuard>
              <WarehouseSectionsPage />
            </WarehouseGuard>
          }
        />
        <Route
          path="inventory"
          element={
            <WarehouseGuard>
              <WarehouseInventoryPage />
            </WarehouseGuard>
          }
        />
        <Route
          path="incoming-orders"
          element={
            <WarehouseGuard>
              <IncomingOrdersPage />
            </WarehouseGuard>
          }
        />
        <Route
          path="outgoing-orders"
          element={
            <WarehouseGuard>
              <OutgoingOrdersPage />
            </WarehouseGuard>
          }
        />
        <Route
          path="settings"
          element={
            <WarehouseGuard>
              <WarehouseSettings />
            </WarehouseGuard>
          }
        />
      </Route>

      {/* Driver Platform */}
      <Route path="/driver" element={<DriverLayout />}>
        <Route
          index
          element={
            <ProtectedRoute>
              <DriverGuard>
                <DriverDashboard />
              </DriverGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <DriverGuard>
                <DriverDashboard />
              </DriverGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <ProtectedRoute>
              <DriverGuard>
                <NotificationPage />
              </DriverGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="application"
          element={
            <ProtectedRoute>
              <DriverApplication />
            </ProtectedRoute>
          }
        />
        <Route
          path="active-delivery"
          element={
            <ProtectedRoute>
              <DriverGuard>
                <ActiveDelivery />
              </DriverGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="history"
          element={
            <ProtectedRoute>
              <DriverGuard>
                <DriverHistory />
              </DriverGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="earnings"
          element={
            <ProtectedRoute>
              <DriverGuard>
                <DriverEarnings />
              </DriverGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="vehicle"
          element={
            <ProtectedRoute>
              <DriverGuard>
                <DriverVehicle />
              </DriverGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute>
              <DriverGuard>
                <DriverSettings />
              </DriverGuard>
            </ProtectedRoute>
          }
        />
        <Route
          path="available-routes"
          element={
            <ProtectedRoute>
              <DriverGuard>
                <DriverAvailableRoutes />
              </DriverGuard>
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Direct Invoice Access */}
      <Route path="/invoice/:orderId" element={<InvoicePage />} />
    </Routes>
  );
}
