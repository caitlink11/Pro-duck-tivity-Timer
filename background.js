let seconds = 0;
let minutes = 0;
let hours = 0;

let interval = null;
let started = false;

let coins = 0;

// Array of store items (objects):
let store = [
    {
        "index": 0,
        "item": "topHat",
        "cost": 10,
        "bought": false
    }
]

// updateTime is called every second to change the hours/minutes/seconds display
function updateTime() {
    ++seconds;
    if (seconds == 60) {
        ++minutes;
        seconds = 0;
        if (minutes == 60) {
            ++hours;
            minutes = 0;
            if (hours == 2) {
                endSession();
            }
        }
    }
    // Send message to update the time display
    chrome.runtime.sendMessage({cmd:"updateTime", h:("00" + hours).slice(-2),
        m:("00" + minutes).slice(-2), s:("00" + seconds).slice(-2)});
}

// endSession is called when the End button is clicked OR if two hours have 
//   passed
function endSession() {
    coins += (hours * 60 + minutes);
    chrome.runtime.sendMessage({cmd:"endSession", coinCount:coins});
    resetTime();
}

// startEnd is called when the Start/End button is clicked
function startEnd() {
    if (!started) {
        interval = window.setInterval(updateTime, 10);
        chrome.runtime.sendMessage({cmd:"start"})
        started = true;
    } else {
        endSession();
    }
}

function resetTime() {
    seconds = 0;
    minutes = 0;
    hours = 0;
    window.clearInterval(interval);
    started = false;
    chrome.storage.sync.set({"coins":coins, "started":false});
}

// Communicating with popup.js or closet.js
chrome.runtime.onMessage.addListener(function(request) {
    if (request.cmd === "startEnd") {
        startEnd();
    } else if (request.cmd === "resetTime") {
        resetTime();
    } else if (request.cmd === "initRequest") {
        chrome.runtime.sendMessage({cmd:"init", coins:coins, started:started});
    } else if (request.cmd === "buy") {
        chrome.storage.sync.get({list:store}, function(result) {
            let item = result.list.find(function(data) {
                if (data.item === request.item) {
                    return true;
                }
            });
            if (coins >= item.cost) { // If user can afford the item
                coins -= item.cost;
                chrome.storage.sync.set({"coins":coins});
                // Update the store
                store[item["index"]]["bought"] = true;
                chrome.storage.sync.set({list:store});
                chrome.runtime.sendMessage({cmd:"bought", success: true, 
                    hat: request.item, coins: item.cost});
            } else {
                chrome.runtime.sendMessage({cmd:"bought", success: false});
            }
        })
    }
});

// Initializing data upon loading
document.addEventListener("DOMContentLoaded", function() {
    chrome.storage.sync.get({coins:0, started:false, outfit:"plain", list:store}, 
        function(result) {
            coins = result.coins;
            started = result.started;
            store = result.list;
            chrome.runtime.sendMessage({cmd:"init", coins:coins, started:started})
            chrome.storage.sync.set({"coins":coins, "started":started, 
                "outfit":result.oufit, list:store});
    });
});