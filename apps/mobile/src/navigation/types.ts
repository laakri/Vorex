export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  DriverApplication: undefined;
  VehicleInfo: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Profile: undefined;
  Earnings: undefined;
  ActiveRoutes: undefined;
  AvailableRoutes: undefined;
  History: undefined;
  VehicleInfo: undefined;
  Settings: undefined;
  OrderDetails: { orderId: string };
  Notifications: undefined;
};

// Define the nested Profile stack screens
export type ProfileStackParamList = {
  ProfileMain: undefined;
  History: undefined;
  Vehicle: undefined;
  Settings: undefined;
}; 