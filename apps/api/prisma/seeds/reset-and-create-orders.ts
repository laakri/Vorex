import { PrismaClient, OrderStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { CreateOrderDto } from '../../src/modules/orders/dto/create-order.dto';

const prisma = new PrismaClient(); // Instantiate PrismaClient

// Function to get seller ID from user ID
const getSellerIdFromUserId = async (userId: string) => {
  console.log('Fetching seller for user ID:', userId); // Log the user ID
  const seller = await prisma.seller.findUnique({
    where: { userId },
    select: { id: true, governorate: true, latitude: true, longitude: true }
  });

  console.log('Seller found:', seller); // Log the seller found

  if (!seller) {
    throw new Error('Seller not found for the given user ID');
  }

  return seller;
};

// Function to find a suitable primary warehouse based on seller and buyer locations
const findPrimaryWarehouse = async (sellerGovernorate: string, buyerGovernorate: string) => {
  const warehouses = await prisma.warehouse.findMany();

  // Check for a primary warehouse that covers the seller's and buyer's governorates
  const primaryWarehouse = warehouses.find(warehouse => 
    warehouse.coverageGovernorate.includes(sellerGovernorate) &&
    warehouse.coverageGovernorate.includes(buyerGovernorate)
  );

  return primaryWarehouse || null; // Return the found primary warehouse or null if none found
};

// Function to find a suitable secondary warehouse based on seller's location
const findSecondaryWarehouse = async (sellerGovernorate: string) => {
  const warehouses = await prisma.warehouse.findMany();

  // Check for a secondary warehouse that covers the seller's governorate
  const secondaryWarehouse = warehouses.find(warehouse => 
    warehouse.coverageGovernorate.includes(sellerGovernorate) && 
    warehouse.id !== sellerGovernorate // Ensure it's not the same as the primary warehouse
  );

  return secondaryWarehouse || null; // Return the found secondary warehouse or null if none found
};

// Tunisian governorates and their major cities
const tunisianRegions = {
  'Tunis': ['Tunis', 'Le Bardo', 'La Marsa', 'Carthage'],
  'Ariana': ['Ariana', 'La Soukra', 'Raoued', 'Sidi Thabet'],
  'Ben Arous': ['Ben Arous', 'El Mourouj', 'Radès', 'Mégrine'],
  'Manouba': ['Manouba', 'Den Den', 'Douar Hicher', 'Oued Ellil'],
  'Nabeul': ['Nabeul', 'Hammamet', 'Dar Chaabane', 'Kelibia'],
  'Sousse': ['Sousse', 'Msaken', 'Kalaa Kebira', 'Enfidha'],
  'Monastir': ['Monastir', 'Moknine', 'Jemmal', 'Ksar Hellal'],
  'Sfax': ['Sfax', 'Kerkennah', 'Mahrès', 'Jebiniana'],
  'Gabes': ['Gabes', 'El Kef', 'El Hamma', 'El Kef'],
  'Medenine': ['Medenine', 'El Kef', 'El Hamma', 'El Kef'],
  'Kebili': ['Kebili', 'El Kef', 'El Hamma', 'El Kef'],
  'Kairouan': ['Kairouan', 'El Kef', 'El Hamma', 'El Kef'],
  'Sidi Bouzid': ['Sidi Bouzid', 'El Kef', 'El Hamma', 'El Kef'],
  'Kasserine': ['Kasserine', 'El Kef', 'El Hamma', 'El Kef'],
  'Gafsa': ['Gafsa', 'El Kef', 'El Hamma', 'El Kef'],
  'Tozeur': ['Tozeur', 'El Kef', 'El Hamma', 'El Kef'],
};

const generateOrder = async (sellerId, products, sellerGovernorate) => {
  const governorate = faker.helpers.arrayElement(Object.keys(tunisianRegions));
  const city = faker.helpers.arrayElement(tunisianRegions[governorate]) as string;

  const numItems = faker.number.int({ min: 1, max: 5 });
  const selectedProducts = faker.helpers.arrayElements(products, numItems);
  const orderItems = selectedProducts.map((product: { id: string; price: number; weight?: number; dimensions?: string }) => ({
    productId: product.id,
    quantity: faker.number.int({ min: 1, max: 5 }),
    price: product.price,
    weight: product.weight ?? 1,
    dimensions: product.dimensions ?? '10x10x10',
    packagingType: faker.helpers.arrayElement(['Box', 'Envelope', 'Bag', 'Tube']),
    fragile: faker.datatype.boolean(),
    perishable: faker.datatype.boolean()
  }));

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Find a suitable primary warehouse based on seller's and buyer's governorates
  const primaryWarehouse = await findPrimaryWarehouse(sellerGovernorate, governorate);
  if (!primaryWarehouse) {
    console.warn(`No suitable primary warehouse found for seller in ${sellerGovernorate} and buyer in ${governorate}`);
    return; // Skip order creation if no suitable primary warehouse is found
  }

  // Find a suitable secondary warehouse based on seller's location
  const secondaryWarehouse = await findSecondaryWarehouse(sellerGovernorate);
  if (!secondaryWarehouse) {
    console.warn(`No suitable secondary warehouse found for seller in ${sellerGovernorate}`);
    return; // Skip order creation if no suitable secondary warehouse is found
  }

  // Create the order directly in the database
  const order = await prisma.order.create({
    data: {
      sellerId,
      customerName: faker.person.fullName(),
      customerEmail: faker.internet.email(),
      address: faker.location.streetAddress(),
      city,
      governorate,
      postalCode: faker.number.int({ min: 1000, max: 9999 }).toString(),
      phone: faker.phone.number({ style: 'international' }),
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
      totalAmount,
      dropLatitude: faker.location.latitude(),
      dropLongitude: faker.location.longitude(),
      warehouseId: primaryWarehouse.id, // Assign the found primary warehouse ID
      secondaryWarehouseId: secondaryWarehouse.id, // Assign the found secondary warehouse ID
      items: {
        create: orderItems
      },
      status: OrderStatus.PENDING // Set initial order status
    }
  });

  console.log('Order created:', order);
};

async function main() {
  try {
    const SELLER_USER_ID = 'cm7sxtbh00000dazygnv6uruw';

    // Log all sellers to verify their user IDs
    const allSellers = await prisma.seller.findMany();
    console.log('All sellers in the database:', allSellers);

    // Get the seller details from the user ID
    const seller = await getSellerIdFromUserId(SELLER_USER_ID);
    const sellerId = seller.id;
    const sellerGovernorate = seller.governorate;

    console.log('Seller ID:', sellerId); // Log the seller ID

    console.log('Deleting existing orders...');
    await prisma.order.deleteMany({
      where: { sellerId }
    });

    const products = await prisma.product.findMany({
      where: { sellerId }
    });

    if (products.length === 0) {
      throw new Error('No products found for seller. Run product seed first.');
    }

    console.log(`Found ${products.length} products`);

    const NUM_ORDERS = 200; // Adjust the number of orders to create
    console.log(`Generating ${NUM_ORDERS} new orders...`);

    for (let i = 0; i < NUM_ORDERS; i++) {
      await generateOrder(sellerId, products, sellerGovernorate);
      
      if ((i + 1) % 10 === 0) {
        console.log(`Created ${i + 1} orders`);
      }
    }

    console.log('Order reset and seeding completed successfully!');

  } catch (error) {
    console.error('Error resetting and seeding orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();