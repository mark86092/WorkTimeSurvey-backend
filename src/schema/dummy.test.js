const { inspect } = require("util");
const { makeExecutableSchema } = require("graphql-tools");
const { graphql } = require("graphql");
const resolvers = require("./resolvers");
const typeDefs = require("./typeDefs");
const { connectMongo } = require("../models/connect");
const ModelManager = require("../models/manager");
const { User } = require("../models");

const run = async input => {
    const { db } = await connectMongo();
    const manager = new ModelManager(db);

    const schema = makeExecutableSchema({
        typeDefs,
        resolvers,
    });

    const query = /* GraphQL */ `
        mutation CreateDummy($input: CreateDummyInput!) {
            createDummy(input: $input) {
                dummy {
                    title
                    name
                }
            }
        }
    `;

    return await graphql(schema, query, null, { db, manager }, { input });
};

describe.skip("", () => {
    it("", async () => {
        await run({
            title: null,
            name: "a",
        });

        await run({
            name: "a",
        });

        await run({
            title: undefined,
            name: "a",
        });
    });

    it("", async () => {
        const { db } = await connectMongo();
        const collection = db.collection("temp");

        await collection.insertMany([
            {
                title: undefined,
                name: "a",
            },
            {
                title: null,
                name: "a",
            },
            {
                name: "a",
            },
            {
                title: "a",
                name: "a",
            },
        ]);

        // eslint-disable-next-line no-console
        console.log(await collection.find().toArray());

        // eslint-disable-next-line no-console
        console.log(
            await collection.find({ title: { $exists: true } }).toArray()
        );

        // eslint-disable-next-line no-console
        console.log(
            await collection.find({ title: { $exists: false } }).toArray()
        );

        // eslint-disable-next-line no-console
        console.log(
            await collection.find({ title: { $type: "string" } }).toArray()
        );

        await collection.deleteMany({});
    });
});

describe.skip("", () => {
    it("", async () => {
        const user = new User({
            name: "hello",
            facebook_id: "1",
        });

        await user.save();

        const user2 = new User({
            name: "hello",
            facebook_id: "2",
            google_id: null,
        });

        await user2.save();

        //console.log(user, user2);

        //console.log(await User.collection.find().toArray());
    });

    it("", async () => {
        console.log(
            await User.find({
                $and: [
                    { google_id: { $eq: null } },
                    { google_id: { $exists: true } },
                ],
            })
        );

        console.log(
            await User.find({
                google_id: { $ne: null },
            })
        );
    });

    it("", async () => {
        console.log(inspect(await User.listIndexes(), { depth: null }));
    });

    after(async () => {
        await User.deleteMany({});
    });
});
