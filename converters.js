module.exports = new converters();

var constants = require('./constants');
var moment = require('moment');
var Q = require('./queries');

function converters(){

    this.insureePolicy = require('./converters/insuree_policy');
    
    this.api = {};

    this.db = {};

    this.db.insurees2teis = function(index,insurees){
        
        var teis = _insuree2teis(insurees);

        var attrUIDToObjMap = constants.DHIS2_db_attrHeaders_config.attributes.reduce(function(map,obj){
            map[obj.uid] = obj;
            return map;
        },[]);

        var q = Q.makeTEI_Enrollment_Proc(index,teis,attrUIDToObjMap)
        return q;
    }
    
    this.api.insurees2teis = function(insurees){
        return _insuree2teis(insurees);
    }
    
    function _insuree2teis(insurees){
        var teis = {trackedEntityInstances : []};
        
        teis.trackedEntityInstances = insurees.entry.reduce(function(list,obj){
            
            var tei = makeTEI(obj);
            
            list.push(tei);
            return list;
        },[]);
        return teis;

        function makeTEI(insuree){
            var tei = {
                orgUnit : "",
                trackedEntityType : constants.metadata_trackedEntityType,
                attributes : [],
                enrollments : [{
                    orgUnit: "",
                    program: constants.metadata_insuree_program,
                    enrollmentDate: ""
                }]
            }

            /*** Make UID ***/            
            tei.trackedEntityInstance = "I"+insuree.resource.id.substr(-10);
            
            /** Convert Extensions ***/
            var extensions = insuree.resource.extension; 
            for (var i=0;i < extensions.length;i++){
                
                var obj = extensions[i];
                var key = obj.url.split("/").pop();
                switch(key){
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
                    tei.enrollments[0].orgUnit = ou.id;
                    break;
                case constants.FHIR_Insuree_RegistrationDate:
                    var date = moment(obj.valueString).toISOString();
                //    __logger.debug("DATE - "+obj.valueString);
                    tei.registrationDate = date;
                    tei.enrollments[0].enrollmentDate = date;
                    
                }
            }
            
            
            /*** Convert identifiers ***/
            var identifiers = insuree.resource.identifier; 
            for (var i=0;i < identifiers.length;i++){
                var obj = identifiers[i];
                var identifierCode = "identifier_"+obj.type.coding[0].code;
                addAttr(tei,identifierCode,obj.value);
            }
            
            return tei;
            
            function addAttr(tei,id,value){
                var attr = teaFHIRMap[id];
                if (!attr){
                    return false;
                }
                
                var attrObj = {
                    attribute: attr.id,
                    value : value
                }

                tei.attributes.push(attrObj);
                return true;
            }
        }
    }
    
}
