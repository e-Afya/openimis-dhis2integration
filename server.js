var CronJob = require('cron').CronJob;
var moment = require("moment");
var express = require('express');
var importer = require('./importer');
var dhis2api = require('./dhis2api');


// Initialise
var app = express();
/**
 * Set up CORS Settings
 */ app.use(function (req, res, next) {

     // Website you wish to allow to connect
     res.setHeader('Access-Control-Allow-Origin', '*');

     // Request methods you wish to allow
     res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

     // Request headers you wish to allow
     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

     // Pass to next layer of middleware
     next();
 });/**
     */
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));


/** Set Up Logging
 */ var winston = require('winston');
global.__logger = winston.createLogger({
    level : 'silly',
    transports: [
        new (winston.transports.Console)({
            colorize: true,
            timestamp: true
        }),
        new (winston.transports.File)({
            filename: './logs/server.log',
            timestamp: true
        })
    ]
});
/**
 */

var server = app.listen(8020, function () {
    var host = server.address().address
    var port = server.address().port

    __logger.info("Server listening at http://%s:%s", host, port);
    
})



__logger.info("Starting service");
var job = new CronJob({
    cronTime: '00 59 13 * * *',
    onTick: function() {

        begin();
    },
    start: false,
    runOnInit : true
});


function begin(){

    dhis2api.getTrackerDes(function(des){
        dataElements = des;
        deFHIRMap = des.reduce(function(map,obj){
            if (obj.name){
                map[obj.name] = obj
            }
            return map;
        },[]);
        
        dhis2api.getTEAs(function(teas){
            trackedEntityAttributes = teas;
            teaFHIRMap = teas.reduce(function(map,obj){
                if (obj.name){
                    map[obj.name] = obj
                }
                return map;
            },[]);
            new importer().init();
        })        
    })
    
}

job.start();

