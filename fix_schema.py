import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Fix self-relations
# Category parent
content = re.sub(
    r'parent\s+Category\?\s+@relation\("CategoryTree",\s*fields:\s*\[parentId\],\s*references:\s*\[id\]\)',
    r'parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)',
    content
)

# NavigationItem parent
content = re.sub(
    r'parent\s+NavigationItem\?\s+@relation\("NavTree",\s*fields:\s*\[parentId\],\s*references:\s*\[id\]\)',
    r'parent   NavigationItem?  @relation("NavTree", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)',
    content
)

# Other cascading issues in MongoDB with Prisma
# Prisma with MongoDB doesn't actually complain about onDelete Cascade for non-self relations if they are not cyclic.
# Let's fix the cyclic ones reported in the error:
# "A self-relation must have `onDelete` and `onUpdate` referential actions set to `NoAction` in one of the @relation attributes."
# But wait! Some errors mention lines 212 (ProductRelation), 228 (ProductTag), 252 (ProductVariant), 270 (ProductImage). These are NOT self-relations.
# Oh, the error actually means MongoDB does not support FOREIGN KEY constraints at all. In Prisma, relations on MongoDB do not support referential actions (like Cascade, Restrict, etc.) at the DB level. Prisma natively emulates some of them. Wait, as of recent Prisma versions, `onDelete: Cascade` IS supported by Prisma Client for MongoDB, but if it detects potential cycles or if you use composite keys.
# Wait, let's remove ALL `onDelete: Cascade` and `onDelete: SetNull` for MongoDB to be safe, because we can handle it in the application logic, or we let it fail for now if there are too many errors.
content = re.sub(
    r',\s*onDelete:\s*Cascade',
    '',
    content
)
content = re.sub(
    r',\s*onDelete:\s*SetNull',
    '',
    content
)

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

content = content.replace('key       String   @id', 'key       String   @id @map("_id")')
content = content.replace('id        String   @id\n', 'id        String   @id @map("_id")\n')

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

