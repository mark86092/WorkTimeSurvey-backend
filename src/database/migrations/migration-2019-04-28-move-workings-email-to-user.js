// reference https://stackoverflow.com/a/46181/9332375
function validateEmail(email) {
    // eslint-disable-next-line no-useless-escape
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

module.exports = async db => {
    // get all emails from salary work times
    const salary_work_times = await db
        .collection("workings")
        .find({ "author.email": { $ne: null } })
        .sort({ created_at: -1 })
        .project({ _id: 1, author: 1 })
        .toArray();

    // validate email and get the newest email for each user
    const user_emails = {};
    for (let salary_work_time of salary_work_times) {
        const user_facebook_id = salary_work_time.author.id;

        const email = salary_work_time.author.email.trim().toLowerCase();
        if (!validateEmail(email)) {
            // eslint-disable-next-line no-console
            console.log(`invalid email: |${email}| will be skipped`);
            continue;
        }
        if (!user_emails[user_facebook_id]) {
            user_emails[user_facebook_id] = email;
        }
    }

    // update each user email
    if (Object.keys(user_emails).length == 0) {
        return;
    }
    const bulk_ops = db.collection("users").initializeOrderedBulkOp();
    for (let facebook_id of Object.keys(user_emails)) {
        bulk_ops.find({ facebook_id: facebook_id }).update({
            $set: { email: user_emails[facebook_id] },
        });
    }
    const bulk_write_result = await bulk_ops.execute();
    // eslint-disable-next-line no-console
    console.log("ok:", bulk_write_result.ok);
    // eslint-disable-next-line no-console
    console.log("nModified:", bulk_write_result.nModified);
};
