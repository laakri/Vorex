# Vorex Driver Mobile App Structure

## Project Setup
- React Native with Expo
- TypeScript
- Bun as package manager
- Shared components from web app
- Clean architecture

## Required Pages

### 1. Authentication
- **Login Screen**
  - Email/Password login
  - Remember me option
  - Forgot password link
  - Error handling
  - Loading states

### 2. Main App Screens

#### 2.1 Dashboard
- Current delivery status
- Today's earnings
- Quick stats
- Recent deliveries
- Performance metrics

#### 2.2 Active Delivery
- Map view with route
- Delivery details
- Customer information
- Status updates
- Navigation integration
- Contact customer
- Issue reporting

#### 2.3 Available Routes
- List of available routes
- Route details
- Distance and time estimates
- Earnings per route
- Accept/Reject functionality

#### 2.4 Earnings
- Daily/Weekly/Monthly earnings
- Earnings breakdown
- Payment history
- Withdrawal options
- Performance metrics

#### 2.5 History
- Past deliveries
- Delivery details
- Customer ratings
- Earnings per delivery
- Filtering options

#### 2.6 Vehicle Info
- Vehicle details
- Maintenance schedule
- Issue reporting
- Document management
- Insurance information

#### 2.7 Settings
- Profile management
- Notification preferences
- Language settings
- App preferences
- Logout option

## Component Structure

### 1. Shared Components
- Logo
- Buttons
- Cards
- Input fields
- Loading indicators
- Error messages
- Status badges
- Icons

### 2. Layout Components
- Bottom navigation
- Header
- Drawer menu
- Modal components
- Toast notifications

### 3. Feature Components
- Map view
- Route display
- Delivery card
- Earnings chart
- Status updates
- Customer info card

## Navigation Structure
- Bottom tab navigation for main screens
- Stack navigation for nested screens
- Modal navigation for overlays
- Drawer navigation for settings

## State Management
- Authentication state
- Delivery state
- User preferences
- App settings
- Cache management

## API Integration
- Authentication endpoints
- Delivery management
- Earnings tracking
- Vehicle management
- User profile

## Required Permissions
- Location access
- Camera access (for document uploads)
- Push notifications
- Background location
- Network access

## UI/UX Guidelines
- Material Design principles
- Dark/Light mode support
- Responsive layouts
- Touch-friendly interfaces
- Clear navigation
- Consistent styling
- Loading states
- Error handling
- Offline support

## Performance Considerations
- Image optimization
- Lazy loading
- Caching strategies
- Background sync
- Battery optimization
- Memory management

## Security Measures
- Secure storage
- Token management
- Input validation
- Error handling
- Secure communication
- Session management 