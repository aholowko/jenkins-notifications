/**
 * Created by Andrzej on 13.01.14.
 */

//------------------------------------------------------------
var PageContext = function(url, buildNumber, isBuildPage) {
    
    var _subscribeLabel = isBuildPage ? 'Powiadom o zakończeniu buildu (' + buildNumber + ')' 
                          /* job page */ : 'Powiadom o zakończeniu następnego buildu (' + buildNumber + ')';
    
    var _unsubscribeLabel = isBuildPage ? 'Nie powiadamiaj o zakończeniu buildu (' + buildNumber + ')' 
                            /* job page */ : 'Nie powiadamiaj o zakończeniu następnego buildu (' + buildNumber + ')';
    
    var _injectSelector = isBuildPage ? '.build-caption'
                          /* job page */ : 'td#main-panel h1'
    
    //public functions and props
    return {
        url: url,
        buildNumber: buildNumber,
        isBuildPage: isBuildPage,
        subscribeLabel: _subscribeLabel,
        unsubscribeLabel: _unsubscribeLabel,
        injectSelector: _injectSelector
    }
};

//------------------------------------------------------------
    
var subscription = (function() {
    
    var init = function () {
        chrome.storage.local.get({builds: []}, function (result) {
            var builds = result.builds;
            chrome.extension.sendMessage({ type: 'getTabUrl' }, function(res) {
                _createPageContext(res.tabUrl, function(pageCtx) {
                    console.log(builds);
                    console.log('is in builds?: ' + pageCtx.url + ' ' + $.inArray(pageCtx.url, builds));
                    if ($.inArray(pageCtx.url, builds) > -1) {
                        _addUnsubscribeBtn(pageCtx);
                    } else {
                        if (pageCtx.isBuildPage) {
                            _apiJson(pageCtx.url, function(data) {
                                if (data.building == true) {
                                    _addSubscribeBtn(pageCtx);
                                }
                            });
                        } else {
                            _addSubscribeBtn(pageCtx);
                        }
                    }
                });
            })
        });
    };
    
    var _createPageContext = function(url, callback) {
        console.log('_createPageContext: ' + url);
        
        var buildNumber = util.tryFindNumber(url);
        var isBuildPage = buildNumber != null;
        
        console.log(buildNumber + ' ' + isBuildPage)
        
        if (isBuildPage) {
            callback(new PageContext(url, buildNumber, isBuildPage));
        } else {
            _apiJson(url, function(data) {
                var nextBuildNumber = data.nextBuildNumber;
                var nextBuildUrl = url + nextBuildNumber + '/';
                
                console.log('nextBuildNumber: ' + nextBuildNumber);
                console.log('nextBuildUrl: ' + nextBuildUrl);
                
                callback(new PageContext(nextBuildUrl, nextBuildNumber, isBuildPage));
            });
        }
    };
    
    var _apiJson = function(url, successCallback, failureCallback) {
        console.log('apiUrl: ' + util.apiUrl(url));
        $.get(util.apiUrl(url), successCallback).fail(failureCallback);
    };
    
    var _subscribe = function (pageCtx) {
        console.log("Subscribe: " + pageCtx.url);
        chrome.storage.local.get({builds: []}, function (result) {
            var builds = result.builds;
            builds.push(pageCtx.url);
            
            // set the new array value to the same key
            chrome.storage.local.set({builds: builds}, function () {
                _removeSubscribeBtn();
                _addUnsubscribeBtn(pageCtx);
                if (builds.length == 1) {
                    chrome.extension.sendMessage({ type: 'startMonitoring' });
                }
                alert('Dodano ' + pageCtx.buildNumber);
            });
        });
    };
    
    var _unsubscribe = function (pageCtx) {
        console.log("Unsubscribe: " + pageCtx.url);
        chrome.storage.local.get({builds: []}, function (result) {
            var builds = result.builds;
            
            //remove
            var i = builds.indexOf(pageCtx.url);
            builds.splice(i, 1);
            
            //save builds
            chrome.storage.local.set({builds: builds}, function () {
                _removeUnsubscribeBtn();
                _addSubscribeBtn(pageCtx);
                if (builds.length == 0) {
                   chrome.extension.sendMessage({ type: 'stopMonitoring' });
                }
                alert('Usunięto ' + pageCtx.buildNumber);
            });
        });
    };
    
    var _addSubscribeBtn = function (pageCtx) {
        var subscribeBtn = $('<button/>', {
            id: 'jn-subscribe',
            text: pageCtx.subscribeLabel,
            click: function () {
                _subscribe(pageCtx);
            }
        });
        $(pageCtx.injectSelector).append(subscribeBtn);
    };
    
    var _removeSubscribeBtn = function() {
        $('#jn-subscribe').remove();
    }
    
    var _addUnsubscribeBtn = function(pageCtx) {
         var unsubscribeBtn = $('<button/>', {
            id: 'jn-unsubscribe',
            text: pageCtx.unsubscribeLabel,
            click: function () {
                _unsubscribe(pageCtx);
            }
        });
        $(pageCtx.injectSelector).append(unsubscribeBtn);
    }
    
    var _removeUnsubscribeBtn = function() {
        $('#jn-unsubscribe').remove();
    }   
    
    //public functions;
    return {
        init: init
    }
})();

subscription.init();




