const { Schema } = require("mongoose");
const UserModel = require("../user_model");

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: 1,
    },
    email: {
        type: String,
    },
    email_status: {
        type: String,
        default: UserModel.UNVERIFIED,
    },
    facebook_id: {
        type: String,
        required: function() {
            return !this.google_id;
        },
    },
    google_id: {
        type: String,
        required: function() {
            return !this.facebook_id;
        },
    },
    facebook: {
        type: Schema.Types.Mixed,
    },
    google: {
        type: Schema.Types.Mixed,
    },
});

userSchema.index(
    { facebook_id: 1 },
    {
        unique: true,
        partialFilterExpression: { facebook_id: { $type: "string" } },
    }
);

userSchema.index(
    { google_id: 1 },
    {
        unique: true,
        partialFilterExpression: { google_id: { $type: "string" } },
    }
);

userSchema.statics.findOneByFacebookId = function(facebook_id) {
    return this.findOne({ facebook_id });
};

userSchema.statics.findOneByGoogleId = function(google_id) {
    return this.findOne({ google_id });
};

module.exports = userSchema;
