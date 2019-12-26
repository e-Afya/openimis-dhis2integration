module.exports = claim;

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

function claim(callback){
    preImportFetch(function(totalClaims){
        begin(totalClaims,callback);
    });    
}

function preImportFetch(callback){    
    ajax.getReq(constants.OPENIMIS_BASE_URL + "ClaimResponse/?format=json&page-offset=1",
                constants.auth_openIMIS,
                function(error,body,response){
                    if (error){
                        __logger.error("Failed to fetch preimport data. Aborting.");                        
                        return;
                    }
                    callback(JSON.parse(response).total)
                });
}

function begin(totalClaims,callback){
    var indexG = indexGenerator(totalClaims);
    
    __logger.info("[ Starting Claim Import ]");

    for (var i=0;i<constants.Parallel_Insuree_Fetch;i++){
        importClaim();
    }
    
    function importClaim(){

        var _index = indexG.next();
        if (_index.done){
            __logger.info("[[ All Done ]]");
            callback(true);
            return;
        };var index = _index.value;

        var indexKey = "("+index +")";
        ajax.getReq(constants.OPENIMIS_BASE_URL + "ClaimResponse/?format=json&page-offset="+index,
                    constants.auth_openIMIS,
                    processData);
        
        function processData(error,body,response){
            if (error){
                __logger.error("Failed to fetch Claim. Offset="+index);
                importClaim();
                return;
            }
            
            response = JSON.parse(response);
            
            if (response.resourceType == "OperationOutcome"){
                __logger.error(indexKey+"Claim OperationOutcome");

                __logger.error(indexKey+JSON.stringify(response));
                //show error
                return;
            }
            __logger.debug("Fetched Claim. Offset="+index);

           viaAPI(response);
          // viaDB(index,response);
          
        }

        function viaAPI(response){
            debugger
            var teis = converters.api.insurees2teis(response);
            
            dhis2api.importTEIs(teis,function(error,response){
                
                if (error){
                    __logger.error(indexKey+"TEI push failed");
                    importClaim();
                    return;
                }
                
                __logger.info(indexKey+ dhis2api.parseResponse(response));
                
                importClaim();
                
            });
        }

        
    }        
}
