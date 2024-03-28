import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { gql } from "graphql-tag";
import prisma from "../../lib/prisma";

const typeDefs = gql`
  type Query {
    globalStats(network: String): [globalStats!]!
    recentTransactions(network: String): [tx!]!
  }

  type tx {
    createdAt: String!
    updatedAt: String
    network: String!
    method: String!
    contractName: String
    hash: String!
    textTitle: String
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
    globalStats: (_, args) => {
      const whereClause = {};

      if (args.network) {
        whereClause.network = args.network;
      }

      return prisma.globalStats.findMany({
        where: whereClause,
      });
    },
    recentTransactions: (_, args) => {
      const whereClause = {
        hash: {
          not: null,
        },
      };

      if (args.network) {
        whereClause.network = args.network;
      }

      return prisma.tx.findMany({
        take: 20,
        orderBy: {
          createdAt: "desc",
        },
        where: whereClause,
      });
    },
  },
};

const server = new ApolloServer({
  resolvers,
  typeDefs,
});

export default startServerAndCreateNextHandler(server);
