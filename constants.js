var config = require('./config.json');

/*** Authentication ***/
exports.auth = "Basic " + Buffer.from(config.dhis2.username + ":" + config.dhis2.password).toString("base64");
exports.DHIS_BASE_URL = config.dhis2.url + "/api/";
exports.OPENIMIS_BASE_URL = config.openIMIS.url + "/";
exports.auth_openIMIS = "Basic " + Buffer.from(config.openIMIS.username + ":" + config.openIMIS.password).toString("base64");


/*** Settings related to multithreading ***/
exports.Parallel_Insuree_Fetch = 1;


/*** FHIR Configuration Setting ***/
exports.FHIR_Insuree_isHead = "isHead";
exports.FHIR_Insuree_Location = "patientLocation";
exports.FHIR_Insuree_RegistrationDate = "registrationDate";


/*** DHIS2 Medata Settings ***/
exports.metadata_trackedEntityType = "EoBGArVCQ69";
exports.metadata_insuree_program = "IR5BiEXrBD7";

