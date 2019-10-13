module.exports = insuree;

var ajax = require('./ajax');
var constants = require('./constants');


function* indexGenerator(){
    for (var i=1;i<Infinity;i++){
        yield i;
    }
}


function insuree(callback){
    
     var indexG = indexGenerator();
    
    __logger.info("[ Starting Insuree Import ]");


    for (var i=0;i<constants.Parallel_Insuree_Fetch;i++){
        importInsuree();
    }
    
    function importInsuree(){

        var index = indexG.next().value;
        
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
                callback(true);
                return;
                        }
            __logger.info("Fetched Insuree. Offset="+index);
            
            var insurees = response;
            
            importInsuree();
        }
        
    }
    
    
}
