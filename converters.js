module.exports = new converters();

var constants = require('./constants');

function converters(){


    this.insurees2teis = function(insurees){
        var teis = [];

        teis = insurees.entry.reduce(function(list,obj){
            
            var tei = makeTEI(obj);
            list.add(tei);
            return list;
        },[]);
        debugger
        return teis;

        function makeTEI(insuree){
            var tei = {
                orgUnit : "",
                trackedEntity : constants.metadata_trackedEntityType,
                attributes : [],
                enrollments : []
            }
            debugger
            var extensions = insuree.resource.extension; 
            for (var i=0;i < extensions.length;i++){
                var obj = extensions[i];
                switch(obj.id){
                case constants.FHIR_Insuree_isHead :
                    addAttr(tei,obj.id,obj.valueBoolean);
                    break
                case constants.FHIR_Insuree_Location:
                    var ou = orgUnitFHIRMap[obj.valueString];
                    if (!ou){
                        __logger.info("Org Unit Missing with Code="+obj.valueString);
                        break;
                    }
                    
                    tei.orgUnit = ou.id;
                    break;
                case constants.FHIR_Insuree_RegistrationDate:
                    tei.registrationDate = obj.valueString;
                }
            }
                
            debugger
            function addAttr(tei,id,value){
                var attr = teaFHIRMap[id];
                if (!attr){
                    return false;
                }
                
                var attrObj = {
                    attr: attr.id,
                    value : obj.valueBoolean
                }

                tei.attributes.push(attrObj);
                return true;
            }
        }
    }
    
}
