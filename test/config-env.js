const mongoose = require("mongoose");

process.env.CONTENTFUL_ACCESS_TOKEN = "FakeTokenYouWillFail";
process.env.CONTENTFUL_SPACE = "rhotsuly6hr2";
process.env.JWT_SECRET = "DontUseMe";
process.env.VERIFY_EMAIL_JWT_SECRET = "DontUseMe";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost";
process.env.MONGODB_DBNAME = process.env.MONGODB_DBNAME || "goodjob-test";

const { MONGODB_URI, MONGODB_DBNAME } = process.env;

mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DBNAME,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
});
