import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Deleting existing warehouses...');
    // Delete all existing warehouses
    await prisma.warehouse.deleteMany({});
    console.log('Existing warehouses deleted.');

    console.log('Creating warehouses...');

    // Define the warehouses to be created with coverageGovernorate
    const warehouses = [
      {
        name: 'Sousse Warehouse',
        address: '123 Sousse St',
        city: 'Sousse',
        governorate: 'Sousse',
        postalCode: '4000',
        phone: '+216 73 123 456',
        capacity: 10000,
        currentLoad: 0, // Default current load
        latitude: 35.8256,
        longitude: 10.6381,
        coverageGovernorate: [
          'Sousse', 'Monastir', 'Mahdia', 'Kairouan', 'Kasserine', 
          'Gabès', 'Medenine' // Coverage for Sousse Warehouse
        ],
      },
      {
        name: 'Tunis Warehouse',
        address: '456 Tunis St',
        city: 'Tunis',
        governorate: 'Tunis',
        postalCode: '1000',
        phone: '+216 71 123 456',
        capacity: 15000,
        currentLoad: 0, // Default current load
        latitude: 36.8065,
        longitude: 10.1815,
        coverageGovernorate: [
          'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Zaghouan', 
          'Bizerte', 'Kef', 'Siliana' // Coverage for Tunis Warehouse
        ],
      },
      {
        name: 'Sfax Warehouse',
        address: '789 Sfax St',
        city: 'Sfax',
        governorate: 'Sfax',
        postalCode: '3000',
        phone: '+216 74 123 456',
        capacity: 12000,
        currentLoad: 0, // Default current load
        latitude: 34.7405,
        longitude: 10.7603,
        coverageGovernorate: [
          'Sfax', 'Gabès', 'Medenine', 'Tataouine', 'Gafsa', 
          'Tozeur', 'Kebili' // Coverage for Sfax Warehouse
        ],
      },
    ];

    // Create each warehouse in the database
    for (const warehouse of warehouses) {
      await prisma.warehouse.create({
        data: warehouse,
      });
      console.log(`Created warehouse: ${warehouse.name}`);
    }

    const totalWarehouses = await prisma.warehouse.count();
    console.log('Warehouse creation completed successfully!');
    console.log(`Total warehouses: ${totalWarehouses}`);

  } catch (error) {
    console.error('Error creating warehouses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();