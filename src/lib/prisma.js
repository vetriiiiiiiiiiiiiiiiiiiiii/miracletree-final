import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis;
const createMockPrisma = () =>
  new Proxy(
    {},
    {
      get: (target, model) =>
        new Proxy(
          {},
          {
            get: (target, method) => async () => {
              if (method.startsWith("findMany")) return [];
              if (
                method.startsWith("findFirst") ||
                method.startsWith("findUnique")
              )
                return null;
              if (method === "count") return 0;
              return null;
            },
          },
        ),
    },
  );

export const prisma =
  globalForPrisma.prisma ??
  (process.env.DOCKER_BUILD === "1"
    ? createMockPrisma()
    : new PrismaClient({
        log:
          process.env.NODE_ENV === "development"
            ? ["warn", "error"]
            : ["error"],
      }));

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
/**
 * Case-insensitive text matching, portable across providers.
 *
 * Prisma's `contains` compiles to `LIKE`. On SQLite that is case-insensitive
 * for ASCII, so `contains: "moringa"` matches "Moringa" and everything appears
 * to work. On PostgreSQL `LIKE` is case-sensitive, and the same query silently
 * stops matching — instant search, admin order lookup and customer lookup all
 * quietly return nothing for a capitalised term.
 *
 * The obvious fix, `mode: "insensitive"`, is rejected outright by the SQLite
 * connector, so it cannot simply be written everywhere either. Spreading this
 * instead emits the mode only where the provider understands it, which keeps
 * local development on SQLite working and makes the switch to Postgres the
 * single line in the schema that DEPLOYMENT.md claims it is.
 */
export const insensitive =
  (process.env.DATABASE_URL ?? "").startsWith("postgres") ||
  (process.env.DATABASE_URL ?? "").startsWith("mongodb")
    ? { mode: "insensitive" }
    : {};
