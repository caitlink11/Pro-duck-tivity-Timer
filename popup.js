let seconds = 0;
let minutes = 0;
let hours = 0;

let started = false;
let coins = 0;

function resetTime() {
    seconds = 0;
    minutes = 0;
    hours = 0;
    document.getElementById("startEnd").innerHTML = "Start";
    document.getElementById("closetButton").disabled = false;
    started = false;

    // Updating time display
    document.getElementById("time").innerHTML = "00:00:00";
}

function startProcedure() {
    document.getElementById("startEnd").innerHTML = "End";
    document.getElementById("closetButton").disabled = true;
    document.getElementById("time").classList.remove("animate__animated", 
    "animate__pulse", "animate_slow");
    started = true;
}

chrome.runtime.onMessage.addListener(function(request) {
    if (request.cmd === "init") {
        coins = request.coins;
        started = request.started;
        chrome.storage.sync.set({"coins":coins, "started":started});
        document.getElementById("coins").innerHTML = "Coins: " + coins;
        if (started) {
            startProcedure();
        }
    } else if (request.cmd === "updateTime") {
        document.getElementById("time").innerHTML = request.h + ":" 
        + request.m + ":" + request.s;
        // accounting for delay if time updates after cancelling stopwatch
        if (!started) {
            document.getElementById("time").innerHTML = "00:00:00";   
        }
    } else if (request.cmd === "endSession") {
        document.getElementById("time").classList.add("animate__animated", 
            "animate__pulse", "animate_slow");
        document.getElementById("coins").innerHTML = "Coins: " +
            request.coinCount;
        let newCoins = request.coinCount - coins;
        // Removing plural if only 1 coin was earned
        let message = "You earned " + newCoins + " coins!";
        if (newCoins == 1) {
            message = message.slice(0, 17) + message.slice(18);
        }
        Swal.fire({
            text: message,
            toast: true,
            icon: "success",
            showConfirmButton: false,
            position: "top-end",
            timer: 2500,
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            }
        })
        coins = request.coinCount;
        resetTime();
    } else if (request.cmd === "start") {
        startProcedure();
    }
});

function goToCloset() {
    window.location.href = "closet.html";
}

function applyPersonalization() {
    // Set last selected outfit
    chrome.storage.sync.get({outfit:"plain"}, function(result) {
        document.getElementById("duck").src = result.outfit + "Duck.png";
    });
}

function test() {
    Swal.fire({
        text: "Cancelled session.",
        toast: true,
        icon: "error",
        showConfirmButton: false,
        position: "top-end",
        timer: 2500,
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        }
    })
}

document.addEventListener("DOMContentLoaded", function() {
    chrome.runtime.sendMessage({cmd:"initRequest"});
    let startEndButton = document.getElementById("startEnd");
    startEndButton.addEventListener("click", function() {
        chrome.runtime.sendMessage({cmd:"startEnd"});
    });
    let cancelButton = document.getElementById("cancel");
    cancelButton.addEventListener("click", function() {
        if (started) {
            Swal.fire({
                title: "Are you sure you want to cancel your session?",
                text: "You will not receive any coins.",
                showCancelButton: true,
                confirmButtonColor: "#c6e6be",
                cancelButtonColor: "#ffb7ae",
                cancelButtonText: "Cancel session",
                confirmButtonText: "Keep going!"
            }).then((result) => {
                if (result.isDismissed) {
                    chrome.runtime.sendMessage({cmd:"resetTime"});
                    document.getElementById("time").classList.add("animate__animated", 
                    "animate__pulse", "animate_slow");
                    resetTime();
                    Swal.fire({
                        text: "Session cancelled.",
                        toast: true,
                        icon: "success",
                        iconColor: "#ffb7ae",
                        showConfirmButton: false,
                        position: "top-end",
                        timer: 2000,
                        hideClass: {
                            popup: 'animate__animated animate__fadeOutUp'
                        }
                    })
                }
            })
        }
    });
    let closetButton = document.getElementById("closetButton");
    closetButton.addEventListener("click", function() {
        goToCloset();
    });
    applyPersonalization();
});

