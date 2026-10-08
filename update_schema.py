import re

with open('prisma/schema.prisma', 'r') as f:
    content = f.read()

# Replace provider and url
content = re.sub(
    r'datasource db \{[^\}]+\}',
    'datasource db {\n  provider = "mongodb"\n  url      = env("DATABASE_URL")\n}',
    content
)

# Replace id String @id @default(cuid()) with id String @id @default(auto()) @map("_id") @db.ObjectId
content = re.sub(
    r'id\s+String\s+@id\s+@default\(cuid\(\)\)',
    r'id String @id @default(auto()) @map("_id") @db.ObjectId',
    content
)

# Replace other id String @id
content = re.sub(
    r'id\s+String\s+@id\n',
    r'id String @id @map("_id") @db.ObjectId\n',
    content
)

# Replace relation fields that reference id
# This is tricky because we need to find all relation fields and change their types to @db.ObjectId

# Let's find all model names
models = re.findall(r'model\s+(\w+)\s+\{', content)

# Find all foreign keys: fieldName String, fieldName String? where it's part of a relation
# Actually, it's easier to just add @db.ObjectId to any String that acts as a foreign key.
# A foreign key is usually named `.*Id`.
content = re.sub(
    r'(\w+Id)\s+String(\?)?',
    r'\1 String\2 @db.ObjectId',
    content
)

# Some models use composite IDs (@@id([productId, collectionId])) which is NOT supported in Prisma MongoDB.
# We have to change composite IDs to unique constraints, and add an auto-generated _id.
# E.g., @@id([productId, collectionId]) -> id String @id @default(auto()) @map("_id") @db.ObjectId \n @@unique([productId, collectionId])

def replace_composite_id(match):
    fields = match.group(1)
    return f'id String @id @default(auto()) @map("_id") @db.ObjectId\n  @@unique([{fields}])'

content = re.sub(r'@@id\(\[(.*?)\]\)', replace_composite_id, content)

with open('prisma/schema.prisma', 'w') as f:
    f.write(content)

