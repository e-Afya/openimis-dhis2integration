/**
 * Created by harsh on 18/7/16.
 */

var request = require('request');

exports.postReq = function(url,data,auth,callback) {
    request({
        url: url,
        method: "POST",
        json: true,   // <--Very important!!!
        body: data,
        headers: {
            "Authorization": auth,
            "Content-Type": "application/json",
        }
    }, function (error, response, body) {
        callback(error,response,body);
    });
}

exports.putReq = function(url,data,auth,callback) {
    request({
        url: url,
        method: "PUT",
        json: true,   // <--Very important!!!
        body: data,
        headers: {
            "Authorization": auth,
            "Content-Type": "application/json",
        }
    }, function (error, response, body) {
        callback(error,response,body);
    });
}

exports.getReq = function(url,auth,callback) {
    
    request({
        url: url,
        method: "GET",
        headers: {
            "Authorization": auth
        }
    }, function (error, response, body) {
	
        callback(error,response,body);

    });
}


exports.getReq_force = function(url,auth,callback) {
    
    request({
        url: url,
        method: "GET",
        dataType: 'json',
        headers: {
            "Authorization": auth
        }
    }, function (error, response, body) {
	
        callback(error,response,body);

    });
}

exports.getReqWithoutAuth = function(url,callback){
    request({
        url: url,
        method: "GET"
    }, function (error, response, body){
        callback(error,response,body);
    });

}

exports.forwardMessage = function(body){
    var url = "";

    request({
        url: url,
        method: "POST",
        json: true,   // <--Very important!!!
        body: body,
        headers: {
            "Content-Type": "application/json"
        }
    }, function (error, response, body) {
        if (error==null){
            console.log(""+body)
        }else{
            console.log(error.message);
        }
    });
}

