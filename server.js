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
  var winston = require('winston');
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
*/
const {transports, createLogger, format } = require('winston');
const winston = require('winston');
 let alignColorsAndTime = winston.format.combine(
        winston.format.colorize({
            all:true
        }),
        winston.format.label({
            label:'[LOGGER]'
        }),
        winston.format.timestamp({
            format:"YY-MM-DD HH:mm:ss"
        }),
     winston.format.prettyPrint(),

        winston.format.printf(
            info => ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.message}`
        )
    );

global.__logger = createLogger({
    level:"silly",
    format: winston.format.combine(winston.format.colorize(), alignColorsAndTime),
    
    transports: [
        new transports.Console(),
        new transports.File({filename: 'logs/error.log', level: 'error'}),
        new transports.File({filename: 'logs/activity.log', level:'info'})
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

    dhis2api.getTrackerDes(function(error,des){
        if (error){
            __logger.error("Fetch De Error:"+error);
            return;
        }

        __logger.info("[ Fetched Data Elements ]");
        dataElements = des;
        deFHIRMap = des.reduce(function(map,obj){
            if (obj.code){
                map[obj.code] = obj
            }
            return map;
        },[]);

        fetchTEAs();
        
    })

    function fetchTEAs(){
        dhis2api.getTEAs(function(teas){
            __logger.info("[ Fetched Tracked Entity Attributes ]");
       
            trackedEntityAttributes = teas;
            teaFHIRMap = teas.reduce(function(map,obj){
                if (obj.code){
                    map[obj.code] = obj
                }
                return map;
            },[]);
            fetchOrgUnits();
        })       
    }
    
    function fetchOrgUnits(){
        dhis2api.getOrgUnits(function(ous){
            __logger.info("[ Fetched Org Units ]");
       
            ous = ous;
            orgUnitFHIRMap = ous.reduce(function(map,obj){
                if (obj.code){
                    map[obj.code] = obj
                }
                return map;
            },[]);
            new importer().init();
        
        })         
    }
    
}

job.start();

