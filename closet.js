let coins = 0;

// disableBuy is called for any "Buy" button in the store corresponding to an
//   already-purchased item.
function disableBuy(hatName) {
    let buttonID = "buy" + hatName.charAt(0).toUpperCase() + hatName.slice(1);
    document.getElementById(buttonID).innerHTML = "Bought";
    document.getElementById(buttonID).disabled = true;
    document.getElementById(hatName).style.display = "inline";
    document.getElementById(hatName + "Label").style.display = "inline";
}

// store current outfit data if the corresponding radio button is selected
document.addEventListener("change", function (e) {
    if (e.target.name == "outfit") {
        chrome.storage.sync.set({"outfit":e.target.id});
    }
});

chrome.runtime.onMessage.addListener(function(request) {
    // Receiving info from background script about an attempted purchase
    if (request.cmd === "bought") {
        if (request.success) {
            coins -= request.coins;
            document.getElementById("coins").innerHTML = "Coins: " + coins;
            disableBuy(request.hat);
        } else {
            Swal.fire({
                text: "Not enough coins!",
                confirmButtonText: "Aww..",
                confirmButtonColor: "#c6e6be",
                icon: "error",
                width: 200
            });
        }
    }
});

document.addEventListener("DOMContentLoaded", function() {
    chrome.storage.sync.get({coins:0, outfit:"plain"}, function(result) {
        coins = result.coins;
        document.getElementById("coins").innerHTML = "Coins: " + coins;
        //console.log(result.coins);
        document.getElementById(result.outfit).checked = true;
    });
    chrome.storage.sync.get(function(result) {
        let storeItems = result.list.length;
        for (let i = 0; i < storeItems; ++i) {
            let hatName = result.list[i]["item"];
            if (!result.list[i]["bought"]) {
                document.getElementById(hatName).style.display = "none";
                document.getElementById(hatName + "Label").style.display = "none";
            } else {
                disableBuy(hatName);
            }
        }
    });

    // Event Listener for store buttons
    let topHatButton = document.getElementById("buyTopHat");
    topHatButton.addEventListener("click", function() {
        chrome.runtime.sendMessage({cmd:"buy", item:"topHat"});
    });
});
