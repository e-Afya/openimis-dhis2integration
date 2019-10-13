module.exports = insuree;

var ajax = require('./ajax');
var constants = require('./constants');
var converters = require('./converters');
var dhis2api = require('./dhis2api');


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
                if (response.issue.details.text == "Invalid page.");
                //show error
                return;
            }
            __logger.info("Fetched Insuree. Offset="+index);
            
            var teis = converters.insurees2teis(response);
            dhis2api.importTEIs(teis,function(){
                importInsuree();

            });
        }
    }        
}
