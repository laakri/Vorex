import { PrismaClient, OrderStatus, BatchType, PaymentStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Define governorates for Tunisia
const governorates = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan', 'Bizerte', 
  'Béja', 'Jendouba', 'Kef', 'Siliana', 'Sousse', 'Monastir', 'Mahdia', 
  'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid', 'Gabès', 'Medenine', 
  'Tataouine', 'Gafsa', 'Tozeur', 'Kebili'
];

// Define warehouse coverage mapping
const warehouseCoverage = {
  'TUNIS_NORTH': ['Tunis', 'Ariana', 'Ben Arous', 'Manouba'],
  'TUNIS_SOUTH': ['Nabeul', 'Zaghouan', 'Bizerte'],
  'CENTRAL': ['Béja', 'Jendouba', 'Kef', 'Siliana', 'Kairouan', 'Kasserine', 'Sidi Bouzid'],
  'COASTAL': ['Sousse', 'Monastir', 'Mahdia', 'Sfax'],
  'SOUTH': ['Gabès', 'Medenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kebili']
};

// Helper function to get warehouse ID for a governorate
async function getWarehouseForGovernorate(governorate: string) {
  // Find a warehouse that covers this governorate
  const warehouse = await prisma.warehouse.findFirst({
    where: {
      governorate: {
        equals: governorate,
        mode: 'insensitive'
      }
    }
  });
  
  if (!warehouse) {
    // If no warehouse found in the same governorate, find the closest one
    const allWarehouses = await prisma.warehouse.findMany();
    
    if (allWarehouses.length === 0) {
      throw new Error('No warehouses found in the database. Please run warehouse seed first.');
    }
    
    // For simplicity, just return the first warehouse
    // In a real application, you would calculate the closest warehouse based on coordinates
    return allWarehouses[0].id;
  }
  
  return warehouse.id;
}

// Helper function to get a seller by user ID
async function getSellerByUserId(userId: string) {
  // Find the seller associated with the user ID
  const seller = await prisma.seller.findFirst({
    where: { userId },
    select: {
      id: true,
      governorate: true,
      latitude: true,
      longitude: true
    }
  });

  if (!seller) {
    throw new Error(`No seller found for user ID: ${userId}`);
  }

  return seller;
}

// Helper function to get a random seller (keeping for backward compatibility)
async function getRandomSeller() {
  const sellers = await prisma.seller.findMany({
    take: 10,
    select: {
      id: true,
      governorate: true,
      latitude: true,
      longitude: true
    }
  });

  if (sellers.length === 0) {
    throw new Error('No sellers found in the database');
  }

  return faker.helpers.arrayElement(sellers);
}

// Helper function to get random products from a seller
async function getRandomProducts(sellerId: string, count: number) {
  const products = await prisma.product.findMany({
    where: {
      sellerId,
      stock: {
        gt: 0
      }
    },
    take: 10,
    select: {
      id: true,
      price: true,
      weight: true,
      dimensions: true,
      stock: true
    }
  });

  if (products.length === 0) {
    throw new Error(`No products found for seller: ${sellerId}`);
  }

  // Select random products and quantities
  const selectedProducts: Array<{
    product: { connect: { id: string } };
    quantity: number;
    price: number;
    weight: number | null;
    dimensions: string | null;
    packagingType: 'BOX' | 'BAG' | 'ENVELOPE';
    fragile: boolean;
    perishable: boolean;
  }> = [];
  const numProducts = faker.number.int({ min: 1, max: Math.min(count, products.length) });

  for (let i = 0; i < numProducts; i++) {
    const product = faker.helpers.arrayElement(products);
    const quantity = faker.number.int({ min: 1, max: Math.min(5, product.stock) });
    
    selectedProducts.push({
      product: { connect: { id: product.id } },
      quantity,
      price: product.price,
      weight: product.weight,
      dimensions: product.dimensions,
      packagingType: faker.helpers.arrayElement(['BOX', 'BAG', 'ENVELOPE']),
      fragile: faker.datatype.boolean(),
      perishable: faker.datatype.boolean()
    });
  }

  return selectedProducts;
}

// Helper function to calculate total amount
function calculateTotalAmount(items: any[]) {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Helper function to determine if delivery is local
function isLocalDelivery(sellerGovernorate: string, buyerGovernorate: string) {
  // Find which warehouse covers the seller's governorate
  let sellerWarehouseKey = '';
  for (const [key, coveredGovernorates] of Object.entries(warehouseCoverage)) {
    if (coveredGovernorates.includes(sellerGovernorate)) {
      sellerWarehouseKey = key;
      break;
    }
  }

  // Find which warehouse covers the buyer's governorate
  let buyerWarehouseKey = '';
  for (const [key, coveredGovernorates] of Object.entries(warehouseCoverage)) {
    if (coveredGovernorates.includes(buyerGovernorate)) {
      buyerWarehouseKey = key;
      break;
    }
  }

  // If both are covered by the same warehouse, it's a local delivery
  return sellerWarehouseKey === buyerWarehouseKey;
}

// Helper function to generate random coordinates within a governorate
function generateRandomCoordinates(governorate: string) {
  // Approximate center coordinates for each governorate
  const governorateCoordinates: Record<string, { lat: number, lng: number }> = {
    'Tunis': { lat: 36.8065, lng: 10.1815 },
    'Ariana': { lat: 36.8601, lng: 10.1934 },
    'Ben Arous': { lat: 36.7533, lng: 10.2217 },
    'Manouba': { lat: 36.8078, lng: 10.0972 },
    'Nabeul': { lat: 36.4561, lng: 10.7376 },
    'Zaghouan': { lat: 36.4029, lng: 10.1429 },
    'Bizerte': { lat: 37.2744, lng: 9.8739 },
    'Béja': { lat: 36.7256, lng: 9.1817 },
    'Jendouba': { lat: 36.5012, lng: 8.7802 },
    'Kef': { lat: 36.1822, lng: 8.7146 },
    'Siliana': { lat: 36.0848, lng: 9.3708 },
    'Sousse': { lat: 35.8245, lng: 10.6346 },
    'Monastir': { lat: 35.7779, lng: 10.8262 },
    'Mahdia': { lat: 35.5047, lng: 11.0622 },
    'Sfax': { lat: 34.7373, lng: 10.7603 },
    'Kairouan': { lat: 35.6781, lng: 10.0957 },
    'Kasserine': { lat: 35.1684, lng: 8.8362 },
    'Sidi Bouzid': { lat: 35.0382, lng: 9.4849 },
    'Gabès': { lat: 33.8815, lng: 10.0982 },
    'Medenine': { lat: 33.3549, lng: 10.5055 },
    'Tataouine': { lat: 32.9297, lng: 10.4518 },
    'Gafsa': { lat: 34.4220, lng: 8.7842 },
    'Tozeur': { lat: 33.9197, lng: 8.1335 },
    'Kebili': { lat: 33.7044, lng: 8.9690 }
  };

  const center = governorateCoordinates[governorate] || { lat: 36.8065, lng: 10.1815 }; // Default to Tunis
  
  // Generate random coordinates within approximately 10km of the center
  const lat = center.lat + (faker.number.float({ min: -0.1, max: 0.1 }));
  const lng = center.lng + (faker.number.float({ min: -0.1, max: 0.1 }));
  
  return { latitude: lat, longitude: lng };
}

// Helper function to create products for a seller if they don't exist
async function ensureSellerHasProducts(sellerId: string) {
  // Check if the seller has any products
  const existingProducts = await prisma.product.findMany({
    where: { sellerId },
    take: 1
  });

  // If the seller has no products, create some
  if (existingProducts.length === 0) {
    console.log(`Creating products for seller: ${sellerId}`);
    
    // Create 10 products for the seller
    const products: any[] = [];
    for (let i = 0; i < 10; i++) {
      const product = await prisma.product.create({
        data: {
          sellerId,
          name: faker.commerce.productName(),
          description: faker.commerce.productDescription(),
          price: Number(faker.commerce.price({ min: 10, max: 1000 })),
          stock: faker.number.int({ min: 10, max: 100 }),
          sku: faker.string.alphanumeric(8).toUpperCase(),
          weight: faker.number.float({ min: 0.1, max: 10, fractionDigits: 1 }),
          dimensions: `${faker.number.int({ min: 5, max: 50 })}x${faker.number.int({ min: 5, max: 50 })}x${faker.number.int({ min: 5, max: 50 })}`,
          category: faker.helpers.arrayElement(['Electronics', 'Clothing', 'Home', 'Food', 'Books', 'Toys', 'Sports', 'Beauty', 'Health', 'Automotive'])
        }
      });
      products.push(product);
    }
    
    console.log(`Created ${products.length} products for seller: ${sellerId}`);
    return products;
  }
  
  return existingProducts;
}

// Helper function to delete all existing orders
async function deleteExistingOrders() {
  console.log('Deleting existing orders...');
  
  // Delete all order items first (due to foreign key constraints)
  await prisma.orderItem.deleteMany();
  
  // Delete all orders
  const result = await prisma.order.deleteMany();
  
  console.log(`Deleted ${result.count} orders`);
}

// Main function to create fake orders
async function createFakeOrders(count: number, userId?: string) {
  console.log(`Creating ${count} fake orders...`);
  
  // Delete existing orders first
  //   await deleteExistingOrders();
  
  const createdOrders: any[] = [];
  
  for (let i = 0; i < count; i++) {
    try {
      // Get the seller based on user ID if provided, otherwise get a random seller
      const seller = userId ? await getSellerByUserId(userId) : await getRandomSeller();
      
      // Ensure the seller has products
      await ensureSellerHasProducts(seller.id);
      
      // Generate random buyer governorate
      const buyerGovernorate = faker.helpers.arrayElement(governorates);
      
      // Determine if this is a local delivery
      const isLocal = isLocalDelivery(seller.governorate, buyerGovernorate);
      
      // Get warehouse IDs
      const warehouseId = await getWarehouseForGovernorate(seller.governorate);
      const secondaryWarehouseId = isLocal ? null : await getWarehouseForGovernorate(buyerGovernorate);
      
      // Get random products
      const items = await getRandomProducts(seller.id, 3);
      
      // Calculate total amount
      const totalAmount = calculateTotalAmount(items);
      
      // Generate random coordinates
      const dropCoordinates = generateRandomCoordinates(buyerGovernorate);
      
      // Create the order
      const order = await prisma.order.create({
        data: {
          sellerId: seller.id,
          warehouseId: warehouseId, // Assign the primary warehouse
          secondaryWarehouseId: secondaryWarehouseId, // Assign the secondary warehouse for intercity deliveries
          status: 'PENDING',
          totalAmount: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          deliveryPrice: Number(faker.number.float({ min: 5, max: 30, fractionDigits: 2 })),
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          governorate: buyerGovernorate,
          postalCode: faker.location.zipCode(),
          phone: faker.phone.number(),
          customerName: faker.person.fullName(),
          customerEmail: faker.internet.email(),
          notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
          pickupLatitude: seller.latitude,
          pickupLongitude: seller.longitude,
          dropLatitude: dropCoordinates.latitude,
          dropLongitude: dropCoordinates.longitude,
          isLocalDelivery: isLocal,
          estimatedDeliveryTime: faker.date.future(),
          items: {
            create: items.map(item => ({
              productId: item.product.connect.id,
              quantity: item.quantity,
              price: item.price,
              weight: item.weight || 0,
              dimensions: item.dimensions || '0x0x0',
              packagingType: item.packagingType,
              fragile: item.fragile,
              perishable: item.perishable
            }))
          }
        }
      });
      
      createdOrders.push(order);
      console.log(`Created order ${i + 1}/${count}: ${order.id} with warehouse ${warehouseId}${secondaryWarehouseId ? ` and secondary warehouse ${secondaryWarehouseId}` : ''}`);
      
      // Update product stock
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.product.connect.id },
          data: { stock: { decrement: item.quantity } }
        });
      }
      
      // Create driver earnings for some orders
      if (faker.datatype.boolean() && ['LOCAL_DELIVERED', 'CITY_DELIVERED'].includes(order.status)) {
        // Get a random driver
        const driver = await prisma.driver.findFirst({
          select: { id: true }
        });
        
        if (driver) {
          const baseAmount = Number(faker.number.float({ min: 10, max: 50, fractionDigits: 2 }));
          const bonusAmount = Number(faker.number.float({ min: 0, max: 20, fractionDigits: 2 }));
          
          await prisma.driverEarnings.create({
            data: {
              driverId: driver.id,
              orderId: order.id,
              baseAmount,
              bonusAmount,
              totalAmount: baseAmount + bonusAmount,
              percentage: 70,
              status: faker.helpers.arrayElement([PaymentStatus.PENDING, PaymentStatus.PAID]),
              paidAt: faker.datatype.boolean() ? faker.date.past() : null
            }
          });
        }
      }
      
    } catch (error) {
      console.error(`Error creating order ${i + 1}:`, error);
    }
  }
  
  console.log(`Successfully created ${createdOrders.length} fake orders`);
  return createdOrders;
}

// Execute the script
async function main() {
  try {
    const FAKE_ORDERS_COUNT = 50;
    const USER_ID = 'cmc356ju80000v32pzmds7fsu'; // The user ID provided
    await createFakeOrders(FAKE_ORDERS_COUNT, USER_ID);
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 