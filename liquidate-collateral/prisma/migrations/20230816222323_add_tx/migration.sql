-- CreateTable
CREATE TABLE "tx" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "network" "Network" NOT NULL,
    "data" TEXT NOT NULL,
    "method" TEXT,
    "contract" TEXT,
    "contractName" TEXT,
    "args" TEXT,
    "textTitle" TEXT,
    "textDescription" TEXT,
    "hash" TEXT,

    CONSTRAINT "tx_pkey" PRIMARY KEY ("id")
);
