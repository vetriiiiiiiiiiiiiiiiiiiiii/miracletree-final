import { createCategoryInlineAction } from "./src/app/actions/admin/products.js";
createCategoryInlineAction("Test Category").then(console.log).catch(console.error);
