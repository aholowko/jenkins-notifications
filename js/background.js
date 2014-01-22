
var background = {
    
    taskId: -1, //running monitoring task id
    
    setDefaultOptions: function () {
        // Conditionally initialize the options.
        if (!localStorage.isInitialized) {
            localStorage.isActivated = true;   // The display activation.
            localStorage.frequency = 0.5;      // The display frequency, in minutes.
            localStorage.isInitialized = true; // The option initialization.
            localStorage.jenkinsUrl = 'http://jenkins/';
        }
    },
    
    init: function () {
        background.setDefaultOptions();
        background.registerlListener();
        
        if (JSON.parse(localStorage.isActivated)) { 
            chrome.storage.local.get({builds: []}, function (result) {
                var builds = result.builds;
                console.log('init builds: ' + builds);
                if (builds.length > 0) {
                    background.startMonitoring();
                }
            });
        }
    },
    
    startMonitoring: function () {
        // Test for notification support.
        if (window.webkitNotifications) {
            if (background.isMonitoringRunning()) {
                console.log('Can\'t start monitoring. It is already running');
            } else {
                console.log('startMonitoring');
                
                var delay = 60 /* sec */ * 1000 * localStorage.frequency /* min */;
                console.log('delay: ' + delay);
                
                //do first job
                background.doMonitoring();
                
                //and start interval task
                background.taskId = setInterval(function() {
                    background.doMonitoring();
                }, delay); // 1 min
            }
        } else {
            localStorage.isActivated = false;
            console.error('There is no notification support !!!');
        }
    },
    
    doMonitoring: function() {
        console.log('doMonitoring... ' + new Date().toISOString());
        if (JSON.parse(localStorage.isActivated)) {
            background.checkBuilds();
        } else {
            background.stopMonitoring();
        }
    },
    
    stopMonitoring: function() {
        if (background.isMonitoringRunning()) {
            console.log('stopMonitoring ' + background.taskId);
            clearInterval(background.taskId);
            background.taskId = -1;
        } else {
            console.log('Can\'t stop monitoring. There is no monitoring running');
        }
    },
    
    isMonitoringRunning: function() {
        return background.taskId != -1;
    },
    
    checkBuilds: function() {
        chrome.storage.local.get({builds: []}, function (result) {
            var builds = result.builds;
            console.log('checkBuilds: ' + builds.length);
            if (builds.length > 0) {
                for(var i in builds) {
                    background.checkBuildStatus(builds[i]);
                }
            } else {
                background.stopMonitoring();
            }
        });
    },
    
    checkBuildStatus: function (buildUrl) {
        console.log("checking... " + buildUrl);
        $.get(util.apiUrl(buildUrl), function( data ) {
            if (data.building == false) {
                
                //remove finished build
                background.removeBuild(buildUrl);
                
                //show notification
                background.showNotification(buildUrl, data);
            }
        });
    },
    
    removeBuild: function (buildUrl, callback) {
        chrome.storage.local.get({builds: []}, function (result) {
            var builds = result.builds;
            var i = builds.indexOf(buildUrl);
            if (i > -1) {
                console.log('removeBuild: ' + buildUrl);
                builds.splice(i, 1);
                chrome.storage.local.set({builds: builds}, callback);
            } else {
                callback.apply(result);
            }
        });
    },
    
    showNotification: function (buildUrl, data) {
        console.log('showNotification: ' + data.fullDisplayName);
        var notification = background.createNotification(buildUrl, data);
        notification.show();
    },
    
    createNotification: function (buildUrl, data) {
        var success = false;
        
        var icon;
        switch (data.result) {
            case 'SUCCESS':
                success = true;
                icon = 'icons/blue.png';
                break;
            case 'UNSTABLE':
                icon = 'icons/yellow.png';
                break;
            default:
                icon = 'icons/red.png';
                break;
        }
        
        var notification =  window.webkitNotifications.createNotification(
            icon,
            'Build ' + data.fullDisplayName + ' - ' +(success ? 'SUKCES' : 'NIEPOWODZENIE'),      // The title.
            (success ? 'Yupiii, udało się.' : 'Kurka wodna... coś poszło nie tak. ') + ' Kliknij aby zobaczyć...'      // The body.
        );
        notification.onclick = function () {
          window.open(buildUrl);
          notification.close();
        }
        return notification;
    },
    
    registerlListener: function () {
        //for communication from content script
        chrome.extension.onMessage.addListener(
            function(message, sender, sendResponse) {
                if (message.type == 'getTabUrl') {
                    sendResponse({ 
                        tabUrl: util.unifyUrl(sender.tab.url)
                    });
                } else if (message.type == 'startMonitoring') {
                    background.startMonitoring();
                } else if (message.type == 'stopMonitoring') {
                    background.stopMonitoring();
                }
            }
        );
    }
}

background.init();


