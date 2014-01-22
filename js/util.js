/**
 * Created by Andrzej on 16.01.14.
 */

var util = (function() {
    
    var _tryFindNumber = function(str) {
        var regexp = /\d+/;
        return str.match(regexp);
    }
    
    var _unifyUrl = function(url) {
        var regexp = /job\/\S*/gi;
        var path = URI(url).path().match(regexp);
        var uri = URI('http://jenkins/').path(path);
        return uri.toString();
    }
    
    var _apiUrl = function(url) {
        var uri = URI(url);
        return uri.path(uri.path() + 'api/json').toString()
    }
    
    //public functions
    return {
        tryFindNumber: _tryFindNumber,
        unifyUrl: _unifyUrl,
        apiUrl: _apiUrl
    };
})();