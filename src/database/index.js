const { connectMongo } = require("../models/connect");
const migrations = require("./migrations");

const collection_name = "migrations";

async function isMigrated(db, name) {
    const result = await db.collection(collection_name).findOne({ _id: name });
    if (result) {
        return true;
    }

    return false;
}

function recordMigration(db, name) {
    return db.collection(collection_name).insertOne({
        _id: name,
        created_at: new Date(),
    });
}

async function migrate(db, name) {
    const result = await isMigrated(db, name);
    if (result === false) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const migration = require(`./migrations/${name}`);

        await migration(db);
        await recordMigration(db, name);

        // eslint-disable-next-line no-console
        console.log(`${name} is migrating, done`);
    } else {
        // eslint-disable-next-line no-console
        console.log(`${name} is migrated, skipped`);
    }
}

const main = async function() {
    const { client, db } = await connectMongo();

    try {
        for (const name of migrations) {
            await migrate(db, name); // eslint-disable-line no-await-in-loop
        }
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
    }

    try {
        await client.close();
    } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
    }
};

module.exports = {
    main,
};
