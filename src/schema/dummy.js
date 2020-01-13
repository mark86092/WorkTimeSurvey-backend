const { gql } = require("apollo-server-express");

const Type = gql`
    type Dummy {
        title: String
        name: String!
    }
`;

const Query = gql`
    extend type Query {
        dummies: [Dummy!]!
    }
`;

const Mutation = gql`
    input CreateDummyInput {
        title: String
        name: String!
    }

    type CreateDummyPayload {
        dummy: Dummy
    }

    extend type Mutation {
        createDummy(input: CreateDummyInput!): CreateDummyPayload!
    }
`;

const resolvers = {
    Query: {
        async dummies(root, args, ctx) {
            const collection = ctx.db.collection("dummies");
            const results = await collection.find().toArray();

            // eslint-disable-next-line no-console
            console.log("resolvers.Query.dummies", results);

            return results;
        },
    },
    Mutation: {
        async createDummy(root, { input }) {
            // eslint-disable-next-line no-console
            console.log("Mutation.createDummy", input);

            return { dummy: null };
        },
    },
};

const types = [Type, Query, Mutation];

module.exports = {
    resolvers,
    types,
};
