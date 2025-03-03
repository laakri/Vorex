import React from 'react';
import { Heading, Package, Truck, Users } from "lucide-react"; // Importing icons
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";

const WelcomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-screen bg-gradient-to-r from-primary to-secondary">
      <div className="text-center mb-10">
        <Logo className="mb-4" />
        <h1 className="text-4xl font-bold mb-4">Welcome to Vorex!</h1>
        <p className="text-lg text-center mb-6">
        Your one-stop solution for managing deliveries and orders efficiently. 
        Whether you're a seller or a driver, we have the tools you need to succeed.
      </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        <Card className="p-6 bg-card shadow-lg rounded-lg transition-transform transform hover:scale-105">
          <Package className="h-10 w-10 text-primary mb-4" />
          <h2 className="text-xl font-semibold">Manage Your Products</h2>
          <p className="text-muted-foreground">Easily add, update, and manage your products in one place.</p>
        </Card>
        <Card className="p-6 bg-card shadow-lg rounded-lg transition-transform transform hover:scale-105">
          <Truck className="h-10 w-10 text-primary mb-4" />
          <h2 className="text-xl font-semibold">Track Deliveries</h2>
          <p className="text-muted-foreground">Stay updated with real-time tracking of your deliveries.</p>
        </Card>
        <Card className="p-6 bg-card shadow-lg rounded-lg transition-transform transform hover:scale-105">
          <Users className="h-10 w-10 text-primary mb-4" />
          <h2 className="text-xl font-semibold">Connect with Customers</h2>
          <p className="text-muted-foreground">Engage with your customers through our platform.</p>
        </Card>
      </div>

      <div className="text-center mb-10">
        <Heading size="lg" className="text-3xl font-bold text-primary-foreground">Get Started</Heading>
        <p className="text-lg text-primary-foreground mt-2">Complete your profile to unlock all features.</p>
        <Button className="mt-4 bg-primary text-primary-foreground hover:bg-secondary">Complete Profile</Button>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-lg">
        <Heading size="lg" className="text-2xl font-semibold mb-4">Why Choose Vorex?</Heading>
        <ul className="list-disc list-inside text-muted-foreground">
          <li>Efficient delivery management tailored for your business.</li>
          <li>Real-time analytics to track your performance.</li>
          <li>Dedicated support to assist you at every step.</li>
        </ul>
      </div>

      <footer className="mt-10 text-muted-foreground">
        <p>© 2023 Vorex Delivery. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default WelcomePage;