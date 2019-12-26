module.exports = importer;

var dhis2api = require('./dhis2api');

var insureeimport = require('./insuree');
var insureepolicyimport = require('./insuree-policy');
var claimimport = require('./claim');

function importer(){

    function begin(callback){

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
                callback();                
            })         
        }
        
    }
    this.init = function(){

        // import ou

        /*     // import insuree policy
               new insureepolicyimport(function(){
               __logger.info("[ Post Insuree Policy Import -> [] ]");
               
               debugger
               });
        */   
        // import insuree
        /*   new insureeimport(function(){
             __logger.info("[ Post Insuree Import -> [] ]");
             
             debugger
             });
        */
        new claimimport(function(){
            __logger.info("[ Post Claim Import -> [] ]");
            
            debugger
        });
    }

    this.claim = function(callback){
        begin(function(){
            new claimimport(function(){
                __logger.info("[ Post Claim Import -> [] ]");                
                debugger
            });
        })
    }

    this.insuree = function(callback){
        begin(function(){
            new insureeimport(function(){
                __logger.info("[ Post Insuree Import -> [] ]");                
                debugger
            });
        })
    }
}
