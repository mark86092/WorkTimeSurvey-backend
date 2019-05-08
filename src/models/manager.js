const CompanyKeywordModel = require("./company_keyword_model");
const CompanyModel = require("./company_model");
const JobTitleKeywordModel = require("./job_title_keyword_model");
const SalaryWorkTimeModel = require("./salary_work_time_model");
const UserModel = require("./user_model");

class ModelManager {
    constructor(db) {
        this.db = db;
    }

    get CompanyKeywordModel() {
        return new CompanyKeywordModel(this);
    }

    get CompanyModel() {
        return new CompanyModel(this);
    }

    get JobTitleKeywordModel() {
        return new JobTitleKeywordModel(this);
    }

    get SalaryWorkTimeModel() {
        if (!this._salary_work_time_model) {
            this._salary_work_time_model = new SalaryWorkTimeModel(this);
        }
        return this._salary_work_time_model;
    }

    get UserModel() {
        return new UserModel(this);
    }
}

module.exports = ModelManager;