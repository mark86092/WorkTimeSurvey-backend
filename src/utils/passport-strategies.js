const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const { ObjectId } = require("mongodb");
const { User } = require("../models");

const { JWT_SECRET: secret } = process.env;

function jwtStrategy() {
    const opts = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: secret,
        algorithms: "HS256",
        passReqToCallback: true,
    };
    return new JwtStrategy(opts, (req, jwt_payload, done) => {
        const user_id = ObjectId(jwt_payload.user_id);

        User.findById(user_id).then(
            user => {
                if (user) {
                    done(null, user);
                } else {
                    done(null, false);
                }
            },
            err => {
                done(err);
            }
        );
    });
}

module.exports = {
    jwtStrategy,
};
