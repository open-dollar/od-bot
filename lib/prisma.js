import { PrismaClient } from "@prisma/client";
import { neonConfig, Pool } from "@neondatabase/serverless";
import ws from 'ws'
import dotenv from 'dotenv'
import { PrismaNeon } from "@prisma/adapter-neon";
const globalForPrisma = global;

dotenv.config()
neonConfig.webSocketConstructor = ws
const connectionString = `${process.env.POSTGRES_URL}`

const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool)

// let prisma = globalForPrisma.prisma || new PrismaClient();
let prisma = globalForPrisma.prisma || new PrismaClient({ adapter });


if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;