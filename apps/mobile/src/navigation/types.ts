export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
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
  OrderDetails: { orderId: string };
  History: undefined;
  Notifications: undefined;
  Vehicle: undefined;
  Settings: undefined;
};

// Define the nested Profile stack screens
export type ProfileStackParamList = {
  ProfileMain: undefined;
  History: undefined;
  Vehicle: undefined;
  Settings: undefined;
}; 