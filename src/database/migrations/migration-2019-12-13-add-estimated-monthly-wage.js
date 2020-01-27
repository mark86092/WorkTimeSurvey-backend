const {
    calculateEstimatedMonthlyWage,
} = require("../../routes/workings/helper");

module.exports = async db => {
    const collection = await db.collection("workings");

    const workings = await collection
        .find({
            "salary.amount": { $exists: true },
            day_real_work_time: { $exists: true },
            week_work_time: { $exists: true },
        })
        .toArray();
    const workingsOps = collection.initializeOrderedBulkOp();

    if (workings.length == 0) {
        return;
    }
    for (let working of workings) {
        const estimated_monthly_wage = calculateEstimatedMonthlyWage(working);
        if (estimated_monthly_wage > 100000000) {
            continue;
        }
        workingsOps.find({ _id: working._id }).update({
            $set: {
                estimated_monthly_wage,
            },
        });
    }
    const workingOpsResult = await workingsOps.execute();
    // eslint-disable-next-line no-console
    console.log("Update ok:", workingOpsResult.ok);
    // eslint-disable-next-line no-console
    console.log("nModified:", workingOpsResult.nModified);
};
