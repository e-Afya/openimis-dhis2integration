var config = require('./config.json');

exports.auth = "Basic " + Buffer.from(config.dhis2.username + ":" + config.dhis2.password).toString("base64");

exports.DHIS_BASE_URL = config.dhis2.url + "/api/";

exports.OPENIMIS_BASE_URL = config.openIMIS.url + "/";
exports.auth_openIMIS = "Basic " + Buffer.from(config.openIMIS.username + ":" + config.openIMIS.password).toString("base64");

exports.Parallel_Insuree_Fetch = 1;
