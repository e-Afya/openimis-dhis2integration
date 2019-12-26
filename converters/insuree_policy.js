module.exports = new insuree_policy();

var constants = require('../constants');
var moment = require('moment');
var Q = require('../queries');

function insuree_policy(){

    this.api = {};

    this.db = {};

    this.api.insureepolicy2events = function(insureepolicies){
        return _insureepolicy2events(insureepolicies);
    }
    
    function _insureepolicy2events(insureepolicies){

        var events = {events : []};
        
        events.events = insureepolicies.entry.reduce(function(list,obj){            
            var ev = makeEvent(obj);
            list.push(ev);
            return list;
        },[]);

        return events;

        function makeEvent(insureepolicy){
            
            var ev = {
                orgUnit : "",
                dataValues : [],
              
            }

            /*** Make UID ***/            
            ev.event = "I"+insureepolicy.resource.id.toString().padStart(10,"0");
            
            /** Convert Extensions ***/
            var extensions = insureepolicy.resource.extension; 
            for (var i=0;i < extensions.length;i++){
                var obj = extensions[i];
                var key = obj.url.split("/").pop();
                switch(key){
                case constants.FHIR_InsureePolicy_policyStatus :
                    addDV(ev,key,obj.valueString);
                    break
                case constants.FHIR_InsureePolicy_policyStage :
                    addDV(ev,key,obj.valueString);
                    break
                case constants.FHIR_InsureePolicy_policyProduct :
                    addDV(ev,key,obj.valueString);
                    break
                    
                case constants.FHIR_Insuree_Location:
                    var ou = orgUnitFHIRMap[obj.valueString];
                    if (!ou){
                        __logger.info("Org Unit Missing with Code="+obj.valueString);
                        break;
                    }
                    
                    ev.orgUnit = ou.id;
                    break;
                case constants.FHIR_InsureePolicy_patientStartDate:
                    var date = moment(obj.valueString).toISOString();   
                    ev.eventDate = date;
                    break
                case constants.FHIR_InsureePolicy_patientPolicyInsureeID:
                    addDV(ev,key,obj.valueString);
                    break
                }
            }
            
            return ev;
            
            function addDV(ev,id,value){
                var de = deFHIRMap[id];
                if (!de){
                    return false;
                }
                
                var dvObj = {
                    dataElement: de.id,
                    value : value
                }

                ev.dataValues.push(dvsObj);
                return true;
            }
        }
    }
    
}
