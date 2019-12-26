module.exports = new Queries();

var moment = require('moment');

function Queries(){

    this.makeTEI_Enrollment_Proc = function(index,teis,attrUIDToObjMap){
        var qData = teis.trackedEntityInstances.reduce(function(str,obj){
            //WITH  insuree (teiuid,rdate,ou,tet,puid,edate,attr1702,attr1633,attr13731) AS (
            var attrStr = getAttr(obj.attributes).join(",");
            str.push( `('${obj.trackedEntityInstance}','${moment(obj.registrationDate).format("YYYY-MM-DD")}'::date,'${obj.orgUnit}','${obj.trackedEntityType}','${obj.enrollments[0].program}','${moment(obj.enrollments[0].enrollmentDate).format("YYYY-MM-DD")}'::date,${attrStr})
`);
            
            return str;
        },[]);
        
        qData = qData.join(",");
        
        // prepare header
        var headerStr = "teiuid,rdate,ou,tet,puid,edate";
        var attrStrHeader=[],attrInserts=[],caseStatements = []
        for (var key in attrUIDToObjMap){
            var attr = attrUIDToObjMap[key];            
            attrStrHeader.push( `attr${attr.id}`);
            attrInserts.push(`(tei,${attr.id},now(),now(),r.attr${attr.id},null)
`);
            caseStatements.push(`when (excluded.trackedentityattributeid = ${attr.id} and excluded.trackedentityinstanceid = tei) then r.attr${attr.id}
`)
        }
        
        headerStr += ","+attrStrHeader.join(",");
        
        var q = q_tei_enr(
            'importInsuree_'+index,
            qData,
            headerStr,
            attrInserts.join(","),
            caseStatements.join(" "));
        
     
        return q;

        
        function getAttr(attr){
            var str = [];
            var attrUIDToValMap = attr.reduce(function(map,obj){
                map[obj.attribute] = obj.value;
                return map;
            },[]);

            for (var key in attrUIDToObjMap){
                attrID = attrUIDToObjMap[key].id;
                var val = attrUIDToValMap[key];
                if (!val){
                    val = "";
                }
                str.push(`'${val}'`);           
            }
            return str;
        }
    }

    function q_tei_enr(funcName,insertData,insertHeader,attrInsert,caseStatements){
        
        return `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
drop table if exists itei;
CREATE TEMP TABLE itei AS                                     
WITH  insuree (${insertHeader}) AS (
	VALUES ${insertData}	
	)
SELECT i.*,ou.organisationunitid,p.programid,tet.trackedentitytypeid FROM insuree i
inner join organisationunit ou on ou.uid = i.ou
inner join "program" p on p.uid = i.puid
inner join trackedentitytype tet on tet.uid = i.tet;

CREATE or replace FUNCTION ${funcName}() RETURNS void AS $$
DECLARE
tei integer;
enrollment integer;
psi integer;
r record;
i integer;
uid varchar;
casesuid varchar;
BEGIN
    RAISE NOTICE 'Starting cluster generation...';
    i:=0; 	
    FOR r IN SELECT * from itei 
    LOOP
    i:=i+1;
--    SELECT concat('I',right(uuid_generate_v4()::text,10)) into uid;


    INSERT INTO trackedentityinstance(
                                      trackedentityinstanceid, uid, code, created, lastupdated, lastupdatedby, 
                                      createdatclient, lastupdatedatclient, inactive, deleted, lastsynchronized, featuretype, coordinates,
                                      organisationunitid, trackedentitytypeid,geometry)
    VALUES (nextval('hibernate_sequence'),r.teiuid , null, now(), now(), 57, 
            now(), now(), false, false, now(),null,null, 
             r.organisationunitid, r.trackedentitytypeid,null)
    ON CONFLICT ON CONSTRAINT uk_rbr4kyuk4s0kb4jo1r77cuaq9
	DO update set
			organisationunitid = r.organisationunitid,lastupdated=now()
			
    returning trackedentityinstanceid into tei;

    SELECT concat('E',right(uuid_generate_v4()::text,10)) into uid;	
   
  
    INSERT INTO programinstance(
                                programinstanceid, uid, created, lastupdated, createdatclient, 
                                lastupdatedatclient, incidentdate, enrollmentdate, enddate, followup, 
                                completedby, deleted, status, trackedentityinstanceid, 
                                programid, organisationunitid,geometry)
                                
    VALUES 						(nextval('hibernate_sequence'), uid, now(), now(), now(), 
    							now(), r.edate, r.edate, null, false, 
            					null, false, 'COMPLETED', tei, 
             					r.programid, r.organisationunitid,null)
    returning programinstanceid into enrollment;
    --	RAISE NOTICE 'tei  %',tei;

    INSERT INTO trackedentityattributevalue(
                                            trackedentityinstanceid, trackedentityattributeid, created, lastupdated, value, encryptedvalue)
    VALUES 
  ${attrInsert}
    ON CONFLICT ON CONSTRAINT trackedentityattributevalue_pkey
	DO update set
	value = 
			(case 
			${caseStatements}
		 	end),
			lastupdated=now();

 

    INSERT INTO public.trackedentityprogramowner
	(trackedentityprogramownerid, trackedentityinstanceid, programid, created, lastupdated, organisationunitid, createdby)
	VALUES(nextval('hibernate_sequence'), tei, r.programid, now(), now(),r.organisationunitid,'admin')
  	ON CONFLICT ON CONSTRAINT uk_tei_program
		DO update set
						lastupdated=now();

		  		
    INSERT INTO public.programstageinstance(
                                        programstageinstanceid, uid, code, created, lastupdated, createdatclient, 
									    lastupdatedatclient, lastsynchronized, programinstanceid, programstageid, attributeoptioncomboid, 
									    deleted, storedby, duedate, executiondate, organisationunitid, 
									    status, completedby, completeddate, geometry, eventdatavalues, assigneduserid)
							values      (nextval('hibernate_sequence'), r.teiuid, null, now(), now(), now(), 
										now(),now(), enrollment, 1589, 20, 
										false, 'admin', r.edate, r.edate , r.organisationunitid, 
										'COMPLETED', 'admin', r.edate, null, '{"NAdBLHAdOGv": {"value": "SHSDC Non-Poor", "created": "2019-11-08T16:04:04.586", "storedBy": "admin", "lastUpdated": "2019-11-08T16:04:04.586", "providedElsewhere": false}}'::jsonb ,null)
    ON CONFLICT ON CONSTRAINT uk_gy44hufdeduoma7eeh3j6abm7
	DO update set
			organisationunitid = r.organisationunitid,
			lastupdated=now();
	        
	        END LOOP;
	
	        RAISE NOTICE 'Done';
	
END;
$$ LANGUAGE plpgsql;


select ${funcName}();
drop function ${funcName};

`;
    }


}
