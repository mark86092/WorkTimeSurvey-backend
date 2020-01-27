const R = require("ramda");
const merge = R.reduce(R.mergeDeepLeft, {});

module.exports = merge([
    // 盡量按造字典排序
    require("./company_keyword").resolvers,
    require("./company").resolvers,
    require("./dummy").resolvers,
    require("./experience").resolvers,
    require("./job_title_keyword").resolvers,
    require("./job_title").resolvers,
    require("./labor_right").resolvers,
    require("./me").resolvers,
    require("./reply").resolvers,
    require("./salary_work_time").resolvers,
    require("./user").resolvers,
    require("./verify_email").resolvers,
    require("./view_log").resolvers,
]);
