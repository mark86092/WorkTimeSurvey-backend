const { Schema } = require("mongoose");

const archiveSchema = new Schema(
    {
        is_archived: {
            type: Boolean,
            required: true,
        },
        // it is required, but if we assign reason = "",
        // the required check fail
        reason: {
            type: String,
        },
    },
    { _id: false }
);

const experienceSchema = new Schema(
    {
        author_id: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        company: {
            id: {
                type: String,
            },
            name: {
                type: String,
                required: true,
            },
        },
        job_title: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        sections: {
            type: Array,
        },
        region: { type: String, required: true },
        experience_in_year: Number,
        education: String,
        like_count: {
            type: Number,
            required: true,
            default: 0,
        },
        reply_count: {
            type: Number,
            required: true,
            default: 0,
        },
        report_count: {
            type: Number,
            required: true,
            default: 0,
        },
        created_at: {
            type: Date,
            required: true,
            default: Date.now,
        },
        /// 公開 / 非公開
        status: {
            type: String,
            required: true,
            default: "published",
        },
        // 封存狀態
        archive: {
            type: archiveSchema,
            required: true,
            default: {
                is_archived: false,
                reason: "",
            },
        },
    },
    { collection: "experiences", discriminatorKey: "type" }
);

const interviewExperienceSchema = new Schema({
    overall_rating: { type: Number, required: true },
    // TODO: 補完 schema
});

module.exports = { experienceSchema, interviewExperienceSchema };
