import { useState } from "react";
import { Package, Truck, Scale, MapPin, Calculator, AlertCircle,Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function MainPricing() {
  const [weight, setWeight] = useState(5);
  const [dimensions, setDimensions] = useState({ length: 30, width: 20, height: 15 });
  const [quantity, setQuantity] = useState(1);
  const [isFragile, setIsFragile] = useState(false);
  const [isPerishable, setIsPerishable] = useState(false);
  const [deliveryGovernorate, setDeliveryGovernorate] = useState("Tunis");
  const [sellerGovernorate, setSellerGovernorate] = useState("Tunis");
  const [pricePreview, setPricePreview] = useState<{
    basePrice: number;
    weightFactor: number;
    volumeFactor: number;
    specialHandlingFactor: number;
    finalPrice: number;
    breakdown: {
      weight: number;
      volume: number;
      fragileItems: number;
      perishableItems: number;
    };
  } | null>(null);

  // Calculate price preview based on inputs
  const calculatePrice = () => {
    // Calculate total weight and volume
    const totalWeight = weight * quantity;
    const totalVolume = dimensions.length * dimensions.width * dimensions.height * quantity;
    
    // Check if it's local delivery
    const isLocalDelivery = sellerGovernorate === deliveryGovernorate;
    
    // Base price based on delivery type
    const basePrice = isLocalDelivery ? 3 : 7;
    
    // Weight factor (exponential increase)
    const weightFactor = Math.pow(totalWeight / 10, 1.2);
    
    // Volume factor
    const volumeFactor = Math.pow(totalVolume / 1000, 1.1);
    
    // Special handling factors
    const fragileItems = isFragile ? quantity : 0;
    const perishableItems = isPerishable ? quantity : 0;
    const specialHandlingFactor = 1 + (fragileItems * 0.1) + (perishableItems * 0.15);
    
    // Calculate final price
    let finalPrice = basePrice * weightFactor * volumeFactor * specialHandlingFactor;
    
    // Apply price caps
    if (isLocalDelivery) {
      finalPrice = Math.min(Math.max(finalPrice, 3), 30);
    } else {
      finalPrice = Math.min(Math.max(finalPrice, 7), 250);
    }
    
    finalPrice = Math.round(finalPrice * 100) / 100;
    
    setPricePreview({
      basePrice,
      weightFactor,
      volumeFactor,
      specialHandlingFactor,
      finalPrice,
      breakdown: {
        weight: totalWeight,
        volume: totalVolume,
        fragileItems,
        perishableItems
      }
    });
  };

  return (
    <div className="min-h-screen ">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="container relative mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight">Delivery Pricing</h1>
            <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
              Calculate your delivery cost based on package details, distance, and special handling requirements.
              Our transparent pricing ensures you only pay for what you need.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Calculator Section */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="mb-6 text-2xl font-semibold">Delivery Cost Calculator</h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="weight">Package Weight (kg)</Label>
                    <div className="flex items-center gap-4">
                      <Slider 
                        id="weight" 
                        min={0.1} 
                        max={30} 
                        step={0.1} 
                        value={[weight]} 
                        onValueChange={(value) => setWeight(value[0])} 
                        className="mt-2"
                      />
                      <span className="text-sm font-medium w-12">{weight} kg</span>
                    </div>
        </div>

                  <div>
                    <Label>Dimensions (cm)</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                        <Label htmlFor="length" className="text-xs">Length</Label>
                        <Input 
                          id="length" 
                          type="number" 
                          value={dimensions.length} 
                          onChange={(e) => setDimensions({...dimensions, length: Number(e.target.value)})} 
                          className="h-8"
                        />
                      </div>
                        <div>
                        <Label htmlFor="width" className="text-xs">Width</Label>
                        <Input 
                          id="width" 
                          type="number" 
                          value={dimensions.width} 
                          onChange={(e) => setDimensions({...dimensions, width: Number(e.target.value)})} 
                          className="h-8"
                        />
                        </div>
                      <div>
                        <Label htmlFor="height" className="text-xs">Height</Label>
                        <Input 
                          id="height" 
                          type="number" 
                          value={dimensions.height} 
                          onChange={(e) => setDimensions({...dimensions, height: Number(e.target.value)})} 
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input 
                      id="quantity" 
                      type="number" 
                      min={1} 
                      value={quantity} 
                      onChange={(e) => setQuantity(Number(e.target.value))} 
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fragile">Fragile Items</Label>
                    <Switch 
                      id="fragile" 
                      checked={isFragile} 
                      onCheckedChange={setIsFragile} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perishable">Perishable Items</Label>
                    <Switch 
                      id="perishable" 
                      checked={isPerishable} 
                      onCheckedChange={setIsPerishable} 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sellerGovernorate">Seller Location</Label>
                    <select 
                      id="sellerGovernorate" 
                      value={sellerGovernorate} 
                      onChange={(e) => setSellerGovernorate(e.target.value)}
                      className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="Tunis">Tunis</option>
                      <option value="Sfax">Sfax</option>
                      <option value="Sousse">Sousse</option>
                      <option value="Kairouan">Kairouan</option>
                      <option value="Bizerte">Bizerte</option>
                      <option value="Gabes">Gabes</option>
                      <option value="Ariana">Ariana</option>
                      <option value="Gafsa">Gafsa</option>
                      <option value="Monastir">Monastir</option>
                      <option value="Ben Arous">Ben Arous</option>
                    </select>
                  </div>
                  
                <div>
                    <Label htmlFor="deliveryGovernorate">Delivery Location</Label>
                    <select 
                      id="deliveryGovernorate" 
                      value={deliveryGovernorate} 
                      onChange={(e) => setDeliveryGovernorate(e.target.value)}
                      className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="Tunis">Tunis</option>
                      <option value="Sfax">Sfax</option>
                      <option value="Sousse">Sousse</option>
                      <option value="Kairouan">Kairouan</option>
                      <option value="Bizerte">Bizerte</option>
                      <option value="Gabes">Gabes</option>
                      <option value="Ariana">Ariana</option>
                      <option value="Gafsa">Gafsa</option>
                      <option value="Monastir">Monastir</option>
                      <option value="Ben Arous">Ben Arous</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <Button onClick={calculatePrice} className="mt-6 w-full">
                Calculate Price
              </Button>
            </div>

            {pricePreview && (
              <div className="mt-6 rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Estimated Delivery Cost</h3>
                  <Badge variant={sellerGovernorate === deliveryGovernorate ? "default" : "secondary"} className="text-sm">
                    {sellerGovernorate === deliveryGovernorate ? "Local Delivery" : "Intercity Delivery"}
                  </Badge>
                </div>
                
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{pricePreview.finalPrice.toFixed(2)}</span>
                  <span className="text-xl font-medium">DT</span>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>{pricePreview.basePrice.toFixed(2)} DT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight Factor:</span>
                    <span>{pricePreview.weightFactor.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Volume Factor:</span>
                    <span>{pricePreview.volumeFactor.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Special Handling:</span>
                    <span>{pricePreview.specialHandlingFactor.toFixed(2)}x</span>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Price range: {sellerGovernorate === deliveryGovernorate ? "3-30 DT" : "7-250 DT"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Guide Section */}
          <div>
            <div className="sticky top-4">
              <h2 className="mb-6 text-2xl font-semibold">Pricing Guide</h2>
              
              <div className="space-y-6">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Local Delivery</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    For deliveries within the same governorate, we offer competitive rates with quick delivery times.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span className="font-medium">3 DT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum Price:</span>
                      <span className="font-medium">3 DT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maximum Price:</span>
                      <span className="font-medium">30 DT</span>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Intercity Delivery</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    For deliveries between different governorates, we provide reliable service with appropriate pricing.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span className="font-medium">7 DT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum Price:</span>
                      <span className="font-medium">7 DT</span>
                        </div>
                    <div className="flex justify-between">
                      <span>Maximum Price:</span>
                      <span className="font-medium">250 DT</span>
                    </div>
                    </div>
                  </div>

                <div className="rounded-lg border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Special Handling</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Additional care and handling for special items to ensure safe delivery.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">Fragile Items</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Adds 10% to the final price for each fragile item. Includes special packaging and careful handling.
                      </p>
                  </div>

                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Perishable Items</span>
                      </div>
                    <p className="text-sm text-muted-foreground">
                        Adds 15% to the final price for each perishable item. Includes temperature-controlled transport when needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h2 className="mb-10 text-center text-3xl font-bold">Why Choose Our Delivery Service</h2>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
                <Scale className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Weight-Based Pricing</h3>
              <p className="text-sm text-muted-foreground">
                Pay only for the actual weight of your package with our fair pricing model.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                <MapPin className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Location-Based Rates</h3>
              <p className="text-sm text-muted-foreground">
                Different rates for local and intercity deliveries to ensure fair pricing.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Package className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Special Handling</h3>
              <p className="text-sm text-muted-foreground">
                Additional care for fragile and perishable items with transparent pricing.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <Shield className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Secure Delivery</h3>
              <p className="text-sm text-muted-foreground">
                All packages are insured and tracked throughout the delivery process.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="mb-10 text-center text-3xl font-bold">Frequently Asked Questions</h2>
          
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-medium">How is the delivery price calculated?</h3>
              <p className="text-sm text-muted-foreground">
                Our pricing is based on several factors including package weight, dimensions, delivery distance, and special handling requirements. The base price varies between local (3 DT) and intercity (7 DT) deliveries, with additional factors applied based on your specific package details.
              </p>
            </div>
            
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-medium">What is considered a local delivery?</h3>
              <p className="text-sm text-muted-foreground">
                A local delivery is when the seller and delivery locations are in the same governorate. For example, if both the seller and recipient are in Tunis, it's considered a local delivery with a base price of 3 DT.
              </p>
            </div>
            
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-medium">How do I know if my item needs special handling?</h3>
              <p className="text-sm text-muted-foreground">
                Fragile items include glass, electronics, ceramics, and other breakable goods. Perishable items include food, plants, and other time-sensitive products. If you're unsure, it's better to select the appropriate option to ensure proper handling.
              </p>
            </div>
            
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-lg font-medium">Is there a maximum weight or size limit?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, our calculator supports packages up to 30kg in weight. For larger or heavier items, please contact our customer service for a custom quote. We can accommodate most package sizes within reasonable limits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
