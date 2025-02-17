import { PrismaClient, OrderStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Tunisian governorates and their major cities
const tunisianRegions = {
  'Tunis': ['Tunis', 'Le Bardo', 'La Marsa', 'Carthage'],
  'Ariana': ['Ariana', 'La Soukra', 'Raoued', 'Sidi Thabet'],
  'Ben Arous': ['Ben Arous', 'El Mourouj', 'Radès', 'Mégrine'],
  'Manouba': ['Manouba', 'Den Den', 'Douar Hicher', 'Oued Ellil'],
  'Nabeul': ['Nabeul', 'Hammamet', 'Dar Chaabane', 'Kelibia'],
  'Sousse': ['Sousse', 'Msaken', 'Kalaa Kebira', 'Enfidha'],
  'Monastir': ['Monastir', 'Moknine', 'Jemmal', 'Ksar Hellal']
};

const generateOrder = async (sellerId: string, products: any[]) => {
  // Select random governorate and city
  const governorate = faker.helpers.arrayElement(Object.keys(tunisianRegions));
  const city = faker.helpers.arrayElement(tunisianRegions[governorate]);

  // Generate 1-5 order items
  const numItems = faker.number.int({ min: 1, max: 5 });
  const selectedProducts = faker.helpers.arrayElements(products, numItems);
  
  const orderItems = selectedProducts.map(product => ({
    productId: product.id,
    quantity: faker.number.int({ min: 1, max: 5 }),
    price: product.price,
    weight: product.weight || 1,
    dimensions: product.dimensions || '10x10x10',
    packagingType: faker.helpers.arrayElement(['Box', 'Envelope', 'Bag', 'Tube']),
    fragile: faker.datatype.boolean(),
    perishable: faker.datatype.boolean()
  }));

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Set date range from January 1st, 2025
  const startDate = new Date('2025-01-01T00:00:00Z');
  const now = new Date();

  return {
    sellerId,
    status: faker.helpers.arrayElement(Object.values(OrderStatus)),
    totalAmount,
    address: faker.location.streetAddress(),
    city,
    governorate,
    postalCode: faker.number.int({ min: 1000, max: 9999 }).toString(),
    phone: faker.phone.number({ style: 'international' }).replace(/[^0-9+]/g, ''),
    customerName: faker.person.fullName(),
    customerEmail: faker.internet.email(),
    notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    items: {
      create: orderItems
    },
    createdAt: faker.date.between({ 
      from: startDate,
      to: now 
    }),
    updatedAt: faker.date.recent()
  };
};

async function main() {
  try {
    const SELLER_USER_ID = 'cm796s9mh0000dak1id8obabj';

    // Get the seller
    const seller = await prisma.seller.findUnique({
      where: { userId: SELLER_USER_ID },
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    console.log('Found seller:', seller.businessName);

    // First, delete all existing orders for this seller
    console.log('Deleting existing orders...');
    const deletedOrders = await prisma.order.deleteMany({
      where: { sellerId: seller.id }
    });
    console.log(`Deleted ${deletedOrders.count} existing orders`);

    // Get all products for this seller
    const products = await prisma.product.findMany({
      where: { sellerId: seller.id }
    });

    if (products.length === 0) {
      throw new Error('No products found for seller');
    }

    console.log(`Found ${products.length} products`);

    // Generate and insert 100 orders within the last 30 days
    const NUM_ORDERS = 100;
    console.log(`Generating ${NUM_ORDERS} new orders...`);

    for (let i = 0; i < NUM_ORDERS; i++) {
      const orderData = await generateOrder(seller.id, products);
      await prisma.order.create({
        data: {
          ...orderData,
          city: orderData.city as string // Explicitly cast city to string
        },
        include: {
          items: true
        }
      });
      
      if ((i + 1) % 10 === 0) {
        console.log(`Created ${i + 1} orders`);
      }
    }

    const totalOrders = await prisma.order.count({
      where: { sellerId: seller.id }
    });

    console.log('Order reset and seeding completed successfully!');
    console.log(`Total orders for seller: ${totalOrders}`);

  } catch (error) {
    console.error('Error resetting and seeding orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 