const { Schema } = require("mongoose");

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: 1,
    },
    email: {
        type: String,
        required: true,
    },
    email_status: {
        type: String,
    },
    facebook_id: {
        type: String,
        index: true,
        required: function() {
            return !this.google_id;
        },
    },
    google_id: {
        type: String,
        index: true,
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

userSchema.statics.findOneByFacebookId = function(facebook_id) {
    return this.findOne({ facebook_id });
};

userSchema.statics.findOneByGoogleId = function(google_id) {
    return this.findOne({ google_id });
};

module.exports = userSchema;
