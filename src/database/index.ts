// Single shared Prisma client instance. All modules import the client from
// here (or directly from `config/prisma`) so the database layer stays unified
// and no per-role client tables are duplicated.
export { prisma } from '../config/prisma';
