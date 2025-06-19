import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Define product categories and their details
const productData = {
  Electronics: {
    subcategories: ['Smartphones', 'Laptops', 'Tablets', 'Headphones', 'Cameras'],
    brands: ['Apple', 'Samsung', 'Sony', 'Dell', 'LG'],
    priceRange: { min: 100, max: 2000 },
    weightRange: { min: 0.2, max: 5 }
  },
  Clothing: {
    subcategories: ['T-Shirts', 'Jeans', 'Dresses', 'Jackets', 'Shoes'],
    brands: ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo'],
    priceRange: { min: 20, max: 200 },
    weightRange: { min: 0.1, max: 1 }
  },
  Books: {
    subcategories: ['Fiction', 'Non-Fiction', 'Educational', 'Comics', 'Children'],
    brands: ['Penguin', 'HarperCollins', 'Simon & Schuster', 'Scholastic'],
    priceRange: { min: 10, max: 50 },
    weightRange: { min: 0.3, max: 2 }
  },
  'Home & Garden': {
    subcategories: ['Furniture', 'Kitchen', 'Decor', 'Garden Tools', 'Lighting'],
    brands: ['IKEA', 'Bosch', 'Philips', 'Gardena', 'Dyson'],
    priceRange: { min: 30, max: 500 },
    weightRange: { min: 0.5, max: 20 }
  },
  Sports: {
    subcategories: ['Fitness', 'Team Sports', 'Outdoor', 'Swimming', 'Yoga'],
    brands: ['Nike', 'Adidas', 'Under Armour', 'Puma', 'Reebok'],
    priceRange: { min: 15, max: 300 },
    weightRange: { min: 0.2, max: 10 }
  }
};

const generateSKU = () => {
  return faker.string.alphanumeric({ length: 8, casing: 'upper' });
};

const generateDimensions = () => {
  const length = faker.number.int({ min: 5, max: 100 });
  const width = faker.number.int({ min: 5, max: 100 });
  const height = faker.number.int({ min: 5, max: 100 });
  return `${length}x${width}x${height}`;
};

const generateProduct = (sellerId: string) => {
  const category = faker.helpers.arrayElement(Object.keys(productData)) as keyof typeof productData;
  const categoryInfo = productData[category];
  const subcategory = faker.helpers.arrayElement(categoryInfo.subcategories);
  const brand = faker.helpers.arrayElement(categoryInfo.brands);
  
  return {
    sellerId,
    name: `${brand} - ${subcategory} ${faker.commerce.productName()}`,
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price({
      min: categoryInfo.priceRange.min,
      max: categoryInfo.priceRange.max
    })),
    stock: faker.number.int({ min: 0, max: 100 }),
    sku: generateSKU(),
    category,
    weight: parseFloat(
      faker.number.float({
        min: categoryInfo.weightRange.min,
        max: categoryInfo.weightRange.max,
        fractionDigits: 1
      }).toFixed(1)
    ),
    dimensions: generateDimensions(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
};

async function main() {
  try {
    const SELLER_USER_ID = 'cmc356ju80000v32pzmds7fsu';

    // Get the existing seller
    const seller = await prisma.seller.findUnique({
      where: { userId: SELLER_USER_ID },
    });

    if (!seller) {
      throw new Error('Seller not found');
    }

    console.log('Found seller:', seller.businessName);

    // Generate and insert 100 products
    const products = Array.from({ length: 100 }, () => 
      generateProduct(seller.id)
    );

    // Insert in batches of 10
    const batchSize = 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await prisma.product.createMany({
        data: batch,
      });
      console.log(`Inserted products ${i + 1} to ${i + batch.length}`);
    }

    const totalProducts = await prisma.product.count({
      where: { sellerId: seller.id }
    });

    console.log('Seeding completed successfully!');
    console.log(`Total products for seller: ${totalProducts}`);

  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
