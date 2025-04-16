import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Package, 
  ShoppingCart, 
  Truck, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  BarChart,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SellerGuide() {
  const [expandedSection, setExpandedSection] = useState<string | null>("getting-started");

  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: BookOpen,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to the Seller Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                This guide will help you understand how to use our platform effectively to manage your products, 
                process orders, and grow your business.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li>
                        <Link to="/seller/dashboard" className="text-primary hover:underline flex items-center gap-2">
                          <BarChart className="h-4 w-4" />
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link to="/seller/products" className="text-primary hover:underline flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Products
                        </Link>
                      </li>
                      <li>
                        <Link to="/seller/orders" className="text-primary hover:underline flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          Orders
                        </Link>
                      </li>
                      <li>
                        <Link to="/seller/settings" className="text-primary hover:underline flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      If you need additional assistance, our support team is here to help.
                    </p>
                    <Button className="w-full">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: "products",
      title: "Products",
      icon: Package,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Managing Your Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Your product catalog is the foundation of your business. Learn how to create, manage, and optimize your products.
              </p>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="add-products">
                  <AccordionTrigger>How do I add new products?</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Navigate to the Products section</li>
                      <li>Click on "Add New Product"</li>
                      <li>Fill in all required product details</li>
                      <li>Set delivery options</li>
                      <li>Save your product</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="manage-inventory">
                  <AccordionTrigger>How do I manage my inventory?</AccordionTrigger>
                  <AccordionContent>
                    <p>Effective inventory management is crucial for your business:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                      <li>Regularly update stock levels</li>
                      <li>Set up low stock alerts</li>
                      <li>Archive discontinued products</li>
                      <li>Use bulk actions for multiple products</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: "orders",
      title: "Orders",
      icon: ShoppingCart,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processing Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Learn how to efficiently process and fulfill customer orders.
              </p>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="order-workflow">
                  <AccordionTrigger>What is the order processing workflow?</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal pl-6 space-y-2">
                      <li>Receive order notification</li>
                      <li>Review order details</li>
                      <li>Confirm stock availability</li>
                      <li>Prepare the order</li>
                      <li>Update order status</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: "delivery",
      title: "Delivery",
      icon: Truck,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Understand how our delivery system works and how to ensure smooth delivery of your products.
              </p>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="delivery-options">
                  <AccordionTrigger>What delivery options are available?</AccordionTrigger>
                  <AccordionContent>
                    <p>We offer several delivery options to meet different needs:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                      <li>Local Delivery</li>
                      <li>Intercity Delivery</li>
                      <li>Express Delivery</li>
                      <li>Scheduled Delivery</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: "payments",
      title: "Payments",
      icon: CreditCard,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Learn about payment processing, payouts, and financial management.
              </p>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="payment-methods">
                  <AccordionTrigger>What payment methods are supported?</AccordionTrigger>
                  <AccordionContent>
                    <p>We support various payment methods:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                      <li>Credit and debit cards</li>
                      <li>Cash on delivery</li>
                      <li>Digital wallets</li>
                      <li>Bank transfers</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: BarChart,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics and Reporting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Use analytics and reporting tools to track your performance.
              </p>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="dashboard">
                  <AccordionTrigger>What can I see on my dashboard?</AccordionTrigger>
                  <AccordionContent>
                    <p>Your dashboard provides key metrics:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                      <li>Sales performance</li>
                      <li>Order volume</li>
                      <li>Top-selling products</li>
                      <li>Customer insights</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Seller Guide</h1>
        <p className="text-muted-foreground">
          Everything you need to know to succeed on our platform
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card 
            key={section.id}
            className="overflow-hidden transition-all duration-200 hover:shadow-md"
          >
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="w-full"
            >
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <section.icon className="h-5 w-5 text-primary" />
                  <CardTitle>{section.title}</CardTitle>
                </div>
                {expandedSection === section.id ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </CardHeader>
            </button>
            <AnimatePresence>
              {expandedSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="pt-0">
                    {section.content}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  );
} 