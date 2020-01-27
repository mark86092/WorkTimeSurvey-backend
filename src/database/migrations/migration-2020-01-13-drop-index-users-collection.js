module.exports = async db => {
    db.collection("users").dropIndex("facebook_id_1");
};
