module.exports = new postgresqlService();

const { Pool, Client } = require('pg')
var constants = require("./constants");

function postgresqlService(){

    this.runQuery = function(query,callback){
        var connection = new Client (constants.pg_params);
	connection.connect();
	connection.query(query,(err, res) => {            
	    connection.end();
            callback(err,res)
	})
    }
    this.dataFetcher = function(){
	return new function(){
	    this.getDVSByDeUID = function(deuid,limit,callback){
		var connection = new Client (constants.postgresql_params);
		connection.connect()
		
		var query = constants.SQL_DE_WISE(deuid,limit);
		console.log(query)
		connection.query(query,(err, res) => {
		    callback(err, res, res?res.rows:null);
		    connection.end();
		})
	    }
	}
    }

    this.dataUpdater = function(){
	return new function(){
	    var connection = new Pool (constants.postgresql_params);
	    connection.connect()

	    this.updateDVSRecord = function(dvs_rows,callback){
		var query="";
		for (var i=0;i<dvs_rows.length;i++){
		    var dvs_row = dvs_rows[i];
		    query = query +
			"\n " +
			constants.SQL_UPDATE_DVS(dvs_row.dataelementid,
						 dvs_row.periodid,
						 dvs_row.categoryoptioncomboid,
						 dvs_row.sourceid
						);
		}
	//	console.log(query)
		connection.query(query,(err, res) => {
		    callback(err, res, res?res.rows:null);
debugger		})
	    };
	    
	    this.endConnection = function(){
		connection.end();
	    }
	}
    }    
}
