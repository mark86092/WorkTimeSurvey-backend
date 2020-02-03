const winston = require("winston");
const Joi = require("@hapi/joi");
const UserModel = require("../../models/user_model");
const helper = require("./helper");
const companyHelper = require("../company_helper");
const recommendation = require("../../libs/recommendation");
const { HttpError, ObjectIdError } = require("../../libs/errors");
const { validateEmail } = require("../../libs/validation");

function checkBodyField(req, field) {
    if (
        req.body[field] &&
        typeof req.body[field] === "string" &&
        req.body[field] !== ""
    ) {
        return true;
    }
    return false;
}

const inputSchema = Joi.object({
    job_title: Joi.string()
        .min(1)
        .max(100)
        .required(),
    sector: Joi.string().optional(),
    gender: Joi.string()
        .valid("male", "female", "other")
        .optional(),
    employment_type: Joi.string()
        .valid(
            "full-time",
            "part-time",
            "intern",
            "temporary",
            "contract",
            "dispatched-labor"
        )
        .required(),
    is_currently_employed: Joi.string()
        .valid("yes", "no")
        .required(),
    job_ending_time_year: Joi.when("is_currently_employed", {
        is: Joi.valid("no"),
        then: Joi.number()
            .integer()
            .required(),
        otherwise: Joi.forbidden(),
    }),
    job_ending_time_month: Joi.when("is_currently_employed", {
        is: Joi.valid("no"),
        then: Joi.number()
            .integer()
            .min(1)
            .max(12)
            .required(),
        otherwise: Joi.forbidden(),
    }),
}).unknown(true);

function inputCheck(req, res, next) {
    try {
        Joi.assert(req.body, inputSchema);
        next();
    } catch (e) {
        next(new HttpError(e.message, 422));
    }
}

/*
 * req.user.facebook
 *
 * req.custom.working
 * req.custom.company_query
 */
function collectData(req, res, next) {
    req.custom.working = {
        user_id: req.user._id,
        company: {},
        status: "published",
        created_at: new Date(),
    };
    const working = req.custom.working;

    // common data
    working.job_title = req.body.job_title.toUpperCase();
    if (req.body.sector) {
        working.sector = req.body.sector;
    }
    if (req.body.gender) {
        working.gender = req.body.gender;
    }
    working.employment_type = req.body.employment_type;
    working.is_currently_employed = req.body.is_currently_employed;

    // pick these fields only
    // make sure the field is string
    [
        // workingtime data
        "week_work_time",
        "overtime_frequency",
        "day_promised_work_time",
        "day_real_work_time",
        "has_overtime_salary",
        "is_overtime_salary_legal",
        "has_compensatory_dayoff",
        // salary data
        "experience_in_year",
        // issue: https://github.com/goodjoblife/WorkTimeSurvey-backend/issues/476
        "campaign_name",
        "about_this_job",
        "email",
    ].forEach(field => {
        if (checkBodyField(req, field)) {
            working[field] = req.body[field];
        }
    });

    // FIXME
    if (req.body.extra_info) {
        working.extra_info = req.body.extra_info;
    }

    if (checkBodyField(req, "company_id")) {
        working.company.id = req.body.company_id;
    }
    if (checkBodyField(req, "company")) {
        req.custom.company_query = req.body.company;
    }

    if (checkBodyField(req, "job_ending_time_year")) {
        req.custom.job_ending_time_year = req.body.job_ending_time_year;
    }
    if (checkBodyField(req, "job_ending_time_month")) {
        req.custom.job_ending_time_month = req.body.job_ending_time_month;
    }
    if (checkBodyField(req, "salary_type")) {
        req.custom.salary_type = req.body.salary_type;
    }
    if (checkBodyField(req, "salary_amount")) {
        req.custom.salary_amount = req.body.salary_amount;
    }

    // user recommendation
    if (checkBodyField(req, "recommendation_string")) {
        req.custom.recommendation_string = req.body.recommendation_string;
    }

    next();
}

/*
 * req.custom.working
 * [req.custom.company_query]
 *
 * - company.id || company_query
 * - is_currently_employed: "yes", "no"
 * - is_currently_employed == "yes": job_ending_time_year undefined
 * - is_currently_employed == "yes": job_ending_time_month undefined
 * - is_currently_employed == "no": job_ending_time_year
 * - is_currently_employed == "no": job_ending_time_month
 */
function validateCommonData(req) {
    const data = req.custom.working;
    const company_query = req.custom.company_query;
    const custom = req.custom;

    if (!data.company.id) {
        if (!company_query) {
            throw new HttpError("公司/單位名稱必填", 422);
        }
    }
    if (data.is_currently_employed === "yes") {
        if (custom.job_ending_time_year || custom.job_ending_time_month) {
            throw new HttpError("若在職，則離職時間這個欄位沒有意義", 422);
        }
    }
    if (data.is_currently_employed === "no") {
        if (!custom.job_ending_time_year) {
            throw new HttpError("離職年份必填", 422);
        }
        if (!custom.job_ending_time_month) {
            throw new HttpError("離職月份必填", 422);
        }
        custom.job_ending_time_year = parseInt(custom.job_ending_time_year, 10);
        custom.job_ending_time_month = parseInt(
            custom.job_ending_time_month,
            10
        );
        const now = new Date();
        if (isNaN(custom.job_ending_time_year)) {
            throw new HttpError("離職年份需為數字", 422);
        } else if (custom.job_ending_time_year <= now.getFullYear() - 10) {
            throw new HttpError("離職年份需在10年內", 422);
        }
        if (isNaN(custom.job_ending_time_month)) {
            throw new HttpError("離職月份需為數字", 422);
        } else if (
            custom.job_ending_time_month < 1 ||
            data.job_ending_time_month > 12
        ) {
            throw new HttpError("離職月份需在1~12月", 422);
        }
        if (
            (custom.job_ending_time_year === now.getFullYear() &&
                custom.job_ending_time_month > now.getMonth() + 1) ||
            custom.job_ending_time_year > now.getFullYear()
        ) {
            throw new HttpError("離職月份不能比現在時間晚", 422);
        }
    }

    // issue: https://github.com/goodjoblife/WorkTimeSurvey-backend/issues/476
    if (data.extra_info) {
        if (!Array.isArray(data.extra_info)) {
            throw new HttpError("extra_info should be Array", 422);
        }
        if (
            !data.extra_info.every(
                e => typeof e.key === "string" && typeof e.value === "string"
            )
        ) {
            throw new HttpError("extra_info data structure is wrong", 422);
        }
    }

    if (data.email) {
        if (!validateEmail(data.email)) {
            throw new HttpError("E-mail 格式錯誤", 422);
        }
    }
}

/*
 * - week_work_time
 * - overtime_frequency
 * - day_promised_work_time
 * - day_real_work_time
 * - [has_overtime_salary]
 * - [is_overtime_salary_legal]
 * - [has_compensatory_dayoff]
 */
function validateWorkingTimeData(req) {
    const data = req.custom.working;

    /*
     * Check all the required fields, or raise an 422 http error
     */
    if (!data.week_work_time) {
        throw new HttpError("最近一週實際工時未填", 422);
    }
    data.week_work_time = parseFloat(data.week_work_time);
    if (isNaN(data.week_work_time)) {
        throw new HttpError("最近一週實際工時必須是數字", 422);
    }
    if (data.week_work_time < 0 || data.week_work_time > 168) {
        throw new HttpError("最近一週實際工時必須在0~168之間", 422);
    }

    if (!data.overtime_frequency) {
        throw new HttpError("加班頻率必填", 422);
    }
    if (["0", "1", "2", "3"].indexOf(data.overtime_frequency) === -1) {
        throw new HttpError("加班頻率格式錯誤", 422);
    }
    data.overtime_frequency = parseInt(data.overtime_frequency, 10);

    if (!data.day_promised_work_time) {
        throw new HttpError("工作日表訂工時未填", 422);
    }
    data.day_promised_work_time = parseFloat(data.day_promised_work_time);
    if (isNaN(data.day_promised_work_time)) {
        throw new HttpError("工作日表訂工時必須是數字", 422);
    }
    if (data.day_promised_work_time < 0 || data.day_promised_work_time > 24) {
        throw new HttpError("工作日表訂工時必須在0~24之間", 422);
    }

    if (!data.day_real_work_time) {
        throw new HttpError("工作日實際工時必填", 422);
    }
    data.day_real_work_time = parseFloat(data.day_real_work_time);
    if (isNaN(data.day_real_work_time)) {
        throw new HttpError("工作日實際工時必須是數字", 422);
    }
    if (data.day_real_work_time < 0 || data.day_real_work_time > 24) {
        throw new HttpError("工作日實際工時必須在0~24之間", 422);
    }

    if (data.has_overtime_salary) {
        if (
            ["yes", "no", "don't know"].indexOf(data.has_overtime_salary) === -1
        ) {
            throw new HttpError("加班是否有加班費應為是/否/不知道", 422);
        }
    }

    if (data.is_overtime_salary_legal) {
        if (data.has_overtime_salary) {
            if (data.has_overtime_salary !== "yes") {
                throw new HttpError("加班應有加班費，本欄位才有意義", 422);
            } else if (
                ["yes", "no", "don't know"].indexOf(
                    data.is_overtime_salary_legal
                ) === -1
            ) {
                throw new HttpError("加班費是否合法應為是/否/不知道", 422);
            }
        } else {
            throw new HttpError("加班應有加班費，本欄位才有意義", 422);
        }
    }

    if (data.has_compensatory_dayoff) {
        if (
            ["yes", "no", "don't know"].indexOf(
                data.has_compensatory_dayoff
            ) === -1
        ) {
            throw new HttpError("加班是否有補修應為是/否/不知道", 422);
        }
    }
}

/*
 * - salary_type
 * - salary_amount
 * - experience_in_year
 */
function validateSalaryData(req) {
    const data = req.custom.working;
    const custom = req.custom;

    if (!custom.salary_type) {
        throw new HttpError("薪資種類必填", 422);
    }
    if (["year", "month", "day", "hour"].indexOf(custom.salary_type) === -1) {
        throw new HttpError("薪資種類需為年薪/月薪/日薪/時薪", 422);
    }

    if (!custom.salary_amount) {
        throw new HttpError("薪資多寡必填", 422);
    }
    custom.salary_amount = parseInt(custom.salary_amount, 10);
    if (isNaN(custom.salary_amount)) {
        throw new HttpError("薪資需為整數", 422);
    }
    if (custom.salary_amount < 0) {
        throw new HttpError("薪資不小於0", 422);
    }
    if (custom.salary_amount > 100000000) {
        throw new HttpError("薪資不大於一億", 422);
    }

    if (!data.experience_in_year) {
        throw new HttpError("相關職務工作經驗必填", 422);
    }
    data.experience_in_year = parseInt(data.experience_in_year, 10);
    if (isNaN(data.experience_in_year)) {
        throw new HttpError("相關職務工作經驗需為整數", 422);
    }
    if (data.experience_in_year < 0 || data.experience_in_year > 50) {
        throw new HttpError("相關職務工作經驗需大於等於0，小於等於50", 422);
    }
}

function validation(req, res, next) {
    const data = req.custom.working;
    const custom = req.custom;

    try {
        validateCommonData(req);
    } catch (err) {
        winston.info("validating fail", { ip: req.ip, ips: req.ips });

        throw err;
    }

    let hasWorkingTimeData = false;
    let hasSalaryData = false;

    if (
        data.week_work_time ||
        data.overtime_frequency ||
        data.day_promised_work_time ||
        data.day_real_work_time ||
        data.has_overtime_salary ||
        data.is_overtime_salary_legal ||
        data.has_compensatory_dayoff
    ) {
        hasWorkingTimeData = true;
        try {
            validateWorkingTimeData(req);
        } catch (err) {
            throw err;
        }
    }

    if (custom.salary_type || custom.salary_amount || data.experience_in_year) {
        hasSalaryData = true;
        try {
            validateSalaryData(req);
        } catch (err) {
            throw err;
        }
    }

    if (!hasWorkingTimeData && !hasSalaryData) {
        throw new HttpError("薪資或工時欄位擇一必填", 422);
    }

    next();
}

async function normalizeData(req, res, next) {
    const working = req.custom.working;
    const company_model = req.manager.CompanyModel;

    /*
     * Normalize the data
     */
    if (req.custom.job_ending_time_year && req.custom.job_ending_time_month) {
        working.job_ending_time = {
            year: req.custom.job_ending_time_year,
            month: req.custom.job_ending_time_month,
        };
    }
    if (req.custom.salary_type && req.custom.salary_amount) {
        working.salary = {
            type: req.custom.salary_type,
            amount: req.custom.salary_amount,
        };

        const estimated_hourly_wage = helper.calculateEstimatedHourlyWage(
            working
        );
        if (typeof estimated_hourly_wage !== "undefined") {
            working.estimated_hourly_wage = estimated_hourly_wage;
        }

        const estimated_monthly_wage = helper.calculateEstimatedMonthlyWage(
            working
        );
        if (typeof estimated_monthly_wage !== "undefined") {
            working.estimated_monthly_wage = estimated_monthly_wage;
        }
    }
    if (working.is_currently_employed === "no") {
        working.data_time = {
            year: working.job_ending_time.year,
            month: working.job_ending_time.month,
        };
    } else if (working.is_currently_employed === "yes") {
        const date = new Date(working.created_at);
        working.data_time = {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
        };
    }

    const company_query = req.custom.company_query;
    /*
     * 如果使用者有給定 company id，將 company name 補成查詢到的公司
     *
     * 如果使用者是給定 company name，如果只找到一間公司，才補上 id
     *
     * 其他情況看 issue #7
     */
    const company = await companyHelper.getCompanyByIdOrQuery(
        company_model,
        working.company.id,
        company_query
    );
    working.company = company;

    next();
}
async function main(req, res) {
    const { working } = req.custom;
    const response_data = { working };

    try {
        let rec_user = null;
        // 這邊嘗試從recommendation_string去取得推薦使用者的資訊
        if (req.custom.recommendation_string) {
            try {
                const result = await recommendation.getUserByRecommendationString(
                    req.db,
                    req.custom.recommendation_string
                );

                if (result !== null) {
                    rec_user = result;
                }
            } catch (err) {
                // if recommendation_string is valid
                if (!(err instanceof ObjectIdError)) {
                    throw err;
                }
            }
        }
        if (rec_user !== null) {
            working.recommended_by = rec_user;
            await req.db
                .collection("recommendations")
                .update({ user: rec_user }, { $inc: { count: 1 } });
        } else if (req.custom.recommendation_string) {
            // 如果不是 user，依然把 recommendation_string 儲存起來
            working.recommended_by = req.custom.recommendation_string;
        }

        working.archive = {
            is_archived: false,
            reason: "",
        };

        await req.manager.SalaryWorkTimeModel.createSalaryWorkTime(working);
        await req.manager.UserModel.increaseSalaryWorkTimeCount(req.user._id);

        // update user email & subscribeEmail, if email field exists
        if (working.email) {
            const user_model = new UserModel(req.manager);
            await user_model.updateSubscribeEmail(req.user._id, working.email);
        }

        winston.info("workings insert data success", {
            id: working._id,
            ip: req.ip,
            ips: req.ips,
        });
        // delete some sensitive information before sending response
        delete response_data.working.recommended_by;
        delete response_data.working.user_id;

        res.send(response_data);
    } catch (err) {
        winston.info("workings insert data fail", {
            id: working._id,
            ip: req.ip,
            ips: req.ips,
            err,
        });

        throw err;
    }
}

module.exports = {
    inputCheck,
    collectData,
    validation,
    normalizeData,
    main,
};
