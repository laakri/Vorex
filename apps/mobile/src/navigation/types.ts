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
  ActiveRoutes: undefined;
  AvailableRoutes: undefined;
  Earnings: undefined;
  Profile: undefined;
  History: undefined;
  Vehicle: undefined;
  Settings: undefined;
  OrderDetails: { orderId: string };
}; 