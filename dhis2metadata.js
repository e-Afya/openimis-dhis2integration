module.exports = new dhis2metadata();

var ajax = require('./ajax');
var constants = require('./constants');

function dhis2metadata(){

    this.getTrackerDes = function(callback){
        ajax.getReq(constants.DHIS_BASE_URL + "dataElements?fields=id,name,code&paging=false",
                    constants.auth,
                    function(error,body,response){
                        if (error){
                            callback(null);
                            return;
                        }
                        callback(JSON.parse(response).dataElements)                        
                    });        
    } 

    this.getTEAs = function(callback){
        ajax.getReq(constants.DHIS_BASE_URL + "trackedEntityAttributes?fields=id,name,code&paging=false",
                    constants.auth,
                    function(error,body,response){
                        if (error){
                            callback(null);
                            return;
                        }
                        callback(JSON.parse(response).trackedEntityAttributes)                        
                    });        
    } 

    
    
}
