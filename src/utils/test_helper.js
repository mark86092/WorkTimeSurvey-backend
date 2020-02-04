const { User } = require("../models");
const jwt = require("../utils/jwt");

class FakeUserFactory {
    async setUp() {}

    async create(user) {
        await User.collection.insertOne(user);
        const token = await jwt.signUser(user);
        return token;
    }

    async tearDown() {
        await User.deleteMany({});
    }
}

module.exports = { FakeUserFactory };
