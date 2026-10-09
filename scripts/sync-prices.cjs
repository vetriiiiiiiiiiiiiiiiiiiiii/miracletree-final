const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { variants: true }
  });

  let syncedCount = 0;
  for (const product of products) {
    if (product.variants.length === 1) {
      const variant = product.variants[0];
      if (variant.price !== product.price || variant.compareAtPrice !== product.compareAtPrice) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            price: product.price,
            compareAtPrice: product.compareAtPrice
          }
        });
        syncedCount++;
        console.log(`Synced variant for product: ${product.slug} (Price: ${product.price})`);
      }
    }
  }
  console.log(`\nSuccessfully unified prices for ${syncedCount} products.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
