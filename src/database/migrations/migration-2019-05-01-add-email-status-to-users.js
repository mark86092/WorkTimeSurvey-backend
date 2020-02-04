const { UNVERIFIED } = require("../../models/email_status");

module.exports = async db => {
    const result = await db
        .collection("users")
        .updateMany({}, { $set: { email_status: UNVERIFIED } });

    // eslint-disable-next-line no-console
    console.log("ok:", result.result.ok);
    // eslint-disable-next-line no-console
    console.log("nModified:", result.result.nModified);
};
