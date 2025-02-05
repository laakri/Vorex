import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/main/Home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      // Future routes will go here
      // {
      //   path: '/about',
      //   element: <About />
      // },
      // {
      //   path: '/contact',
      //   element: <Contact />
      // }
    ],
  },
  // Future platform routes will go here
  // {
  //   path: '/seller/*',
  //   element: <SellerLayout />,
  // },
  // {
  //   path: '/warehouse/*',
  //   element: <WarehouseLayout />,
  // },
  // {
  //   path: '/delivery/*',
  //   element: <DeliveryLayout />,
  // }
]);
