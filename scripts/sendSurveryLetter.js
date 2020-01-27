require("dotenv").config();

const { SurveyTemplate } = require("../src/libs/email_templates");
const emailLib = require("../src/libs/email");
const { validateEmail } = require("../src/libs/validation");

const prepareVariables = user => {
    const { email, name: userName } = user;
    if (email && userName) {
        return {
            userName,
            surveryUrl: `https://docs.google.com/forms/d/e/1FAIpQLScie8Ii815plQoAtrtNjk_XPrxV_x3hBYRbMEshS-nLd4PL8A/viewform?usp=pp_url&entry.1421543239=${email}`,
        };
    }
    return null;
};

const sendSurveyLetter = async userList => {
    const template = new SurveyTemplate();
    try {
        let sendCount = 0;
        for (let user of userList) {
            const { email } = user;
            const variables = prepareVariables(user);
            if (validateEmail(email) && variables !== null) {
                await emailLib.sendEmailsFromTemplate(
                    [email],
                    template,
                    variables
                );
                // eslint-disable-next-line no-console
                console.log(user._id, user.name, email, new Date());
                sendCount += 1;
            }
        }
        // eslint-disable-next-line no-console
        console.log(`Sent/Total: ${sendCount}/${userList.length}`);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
    }
};

/**
 * Sample of userData.json format:
 *
 * [
 *  {
 *      "_id":"59074fbed17b740987654321",
 *      "name":"古嘉博",
 *      "email":"findyourgoodjob@gmail.com"
 *  }
 * ]
 */
(async () => {
    if (process.argv.length !== 3) {
        // eslint-disable-next-line no-console
        console.log("Usage: node sendSurveyLetter.js userData.json");
        process.exit(0);
    } else {
        const fs = require("fs");
        const userList = JSON.parse(fs.readFileSync(process.argv[2]));
        await sendSurveyLetter(userList);
        process.exit(0);
    }
})();
