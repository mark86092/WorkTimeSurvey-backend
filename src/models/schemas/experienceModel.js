const mongoose = require("mongoose");
const {
    experienceSchema,
    interviewExperienceSchema,
} = require("./experienceSchema");

const InterviewExperienceType = "interview";
const WorkExperienceType = "work";

const Experience = mongoose.model("Experience", experienceSchema);

const InterviewExperience = Experience.discriminator(
    "InterviewExperience",
    interviewExperienceSchema,
    InterviewExperienceType
);

module.exports = {
    // model
    Experience,
    InterviewExperience,
    // constant for type reference
    InterviewExperienceType,
    WorkExperienceType,
};
