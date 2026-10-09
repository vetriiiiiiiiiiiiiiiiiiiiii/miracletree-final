import { prisma } from "./src/lib/prisma.js";
import { slugify } from "./src/lib/utils.js";

async function run() {
  const name = "Test Category " + Date.now();
  const slug = slugify(name);
  try {
    const category = await prisma.category.create({
      data: { name, slug, isActive: true },
    });
    console.log("Success:", category);
  } catch (error) {
    console.error("Error:", error);
  }
}
run();
