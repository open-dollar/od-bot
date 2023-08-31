import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { gql } from "graphql-tag";
import prisma from "../../lib/prisma";

const typeDefs = gql`
  type Query {
    globalStats: [globalStats!]!
    recentTransactions: [tx!]!
  }

  type tx {
    createdAt: String!
    updatedAt: String
    network: String!
    method: String!
    hash: String!
  }

  type globalStats {
    id: Int!
    createdAt: String!
    updatedAt: String!
    network: String!
    blockTimestamp: String
    erc20Supply: String
    globalDebt: String
    globalDebtCeiling: String
    globalDebtUtilization: String
    surplusInTreasury: String
    marketPrice: String
    redemptionRate: String
    redemptionPrice: String
    annualRate: String
    eightRate: String
    pRate: String
    iRate: String
    lastUpdateTime: String
  }
`;

const resolvers = {
  Query: {
    globalStats: () => {
      return prisma.globalStats.findMany();
    },
    recentTransactions: () => {
      return prisma.tx.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        where: {
          hash: {
            not: null,
          },
        },
      });
    },
  },
};

const server = new ApolloServer({
  resolvers,
  typeDefs,
});

export default startServerAndCreateNextHandler(server);
