module.exports = new dhis2api();

var ajax = require('./ajax');
var constants = require('./constants');

function dhis2api(){

    this.parseErrors = function(response){
        debugger
        

        
    }

    this.parseResponse = function(response){
        debugger
        var msg = "";
        var res = response.response;
        msg = `[${response.status} ${response.httpStatusCode}] [total: ${res.total}, Imported: ${res.imported}, Updated:${res.updated} ]`;
        
        return msg;
    }
    
    
    this.getTrackerDes = function(callback){
        ajax.getReq(constants.DHIS_BASE_URL + "dataElements?fields=id,name,code&paging=false",
                    constants.auth,
                    function(error,body,response){
                        if (error){
                            callback(error);
                            return;
                        }
                        callback(null,JSON.parse(response).dataElements)                        
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

    this.getOrgUnits = function(callback){
        ajax.getReq(constants.DHIS_BASE_URL + "organisationUnits?fields=id,name,code&paging=false",
                    constants.auth,
                    function(error,body,response){
                        if (error){
                            callback(null);
                            return;
                        }
                        callback(JSON.parse(response).organisationUnits)                        
                    });        
    }
    
    this.importTEIs = function(teis,callback){
        
        ajax.postReq(constants.DHIS_BASE_URL + "trackedEntityInstances?strategy="+constants.insuree_import_strategy,
                     teis,
                     constants.auth,
                     function(error,body,response){
                         if (error){
                             callback(error);
                             return;
                         }
                         
                         callback(null,response)                        
                     });            
    }
    
    
}
