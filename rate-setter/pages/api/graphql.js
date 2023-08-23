import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { gql } from 'graphql-tag';
import prisma from '../../lib/prisma'

const typeDefs = gql`
   type Query {
        globalStats: [globalStats!]!
    }

    type globalStats {
        id:                    Int!
        createdAt:             String! 
        updatedAt:             String! 
        network:               String!
        blockTimestamp:        String
        erc20Supply:           String
        globalDebt:            String
        globalDebtCeiling:     String
        globalDebtUtilization: String
        surplusInTreasury:     String
        marketPrice:           String
        redemptionRate:        String
        redemptionPrice:       String
        annualRate:            String
        eightRate:             String
        pRate:                 String
        iRate:                 String
        lastUpdateTime:        String
    }
`;

const resolvers = {
    Query: {
        globalStats: () => {
            return prisma.globalStats.findMany();
        }
    }
};

const server = new ApolloServer({
    resolvers,
    typeDefs,
});

export default startServerAndCreateNextHandler(server);