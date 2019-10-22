module.exports = insuree;

var ajax = require('./ajax');
var constants = require('./constants');
var converters = require('./converters');

var dhis2api = require('./dhis2api');
var dhis2db = require('./postgres-service');

function* indexGenerator(n){
    for (var i=1;i<n;i++){
        yield i;
    }
}


function insuree(callback){
    preImportFetch(function(totalInsurees){
        begin(totalInsurees,callback);
    });    
}

function preImportFetch(callback){    
    ajax.getReq(constants.OPENIMIS_BASE_URL + "Patient/?format=json&page-offset=1",
                constants.auth_openIMIS,
                function(error,body,response){
                    if (error){
                        __logger.error("Failed to fetch preimport data. Aborting.");                        
                        return;
                    }
                    callback(JSON.parse(response).total)
                });
}

function begin(totalInsurees,callback){
    var indexG = indexGenerator(totalInsurees);
    
    __logger.info("[ Starting Insuree Import ]");


    for (var i=0;i<constants.Parallel_Insuree_Fetch;i++){
        importInsuree();
    }
    
    function importInsuree(){

        var _index = indexG.next();
        if (_index.done){
            __logger.info("[[ All Done ]]");
            callback(true);
            return;
        };var index = _index.value;

        var indexKey = "("+index +")";
        ajax.getReq(constants.OPENIMIS_BASE_URL + "Patient/?format=json&page-offset="+index,
                    constants.auth_openIMIS,
                    processData);
        
        function processData(error,body,response){
            if (error){
                __logger.error("Failed to fetch Insuree. Offset="+index);
                importInsuree();
                return;
            }
            
            response = JSON.parse(response);
            
            if (response.resourceType == "OperationOutcome"){
                __logger.error(indexKey+"Insuree OperationOutcome");

                if (response.issue.details.text == "Invalid page."){
                    __logger.error(indexKey+"Insuree Invalid Page");
                }
                //show error
                return;
            }
            __logger.debug("Fetched Insuree. Offset="+index);

         //   viaAPI(response);
            viaDB(index,response);
          
        }

        function viaAPI(response){
            var teis = converters.api.insurees2teis(response);
            
            dhis2api.importTEIs(teis,function(error,response){
                
                if (error){
                    __logger.error(indexKey+"TEI push failed");
                    importInsuree();
                    return;
                }
                
                __logger.info(indexKey+ dhis2api.parseResponse(response));
                
                importInsuree();
                
            });
        }

        function viaDB(index,response){
            var q = converters.db.insurees2teis(index,response);
            dhis2db.runQuery(q,function(error,res){
                if (error){
                    __logger.error(indexKey+"[DB] teiEnrollment Insert");
                    __logger.debug(JSON.stringify(error));
                    importInsuree();
                    return;
                }

                __logger.info(indexKey+"[DB] teiEnrollment Insert");
                
                importInsuree();
            })

        }
    }        
}
