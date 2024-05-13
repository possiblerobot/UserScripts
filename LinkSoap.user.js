
// ==UserScript==  
// @name            LinkSoap - Affiliate Link Cleaner
// @version         06  
// @description     Bypasses affiliate links from multiple sources.  
// @author          possiblerobot  
// @downloadURL     https://raw.githubusercontent.com/possiblerobot/UserScripts/main/LinkSoap.user.js  
// @updateURL       https://raw.githubusercontent.com/possiblerobot/UserScripts/main/LinkSoap.user.js  
// @homepageURL     na  
// @supportURL      na  
// @license         na  
// @match       *://*/*  
// @run-at         document-idle  
// ==/UserScript==

// Function to check if a URL is an affiliate link.  
function isAffiliateLink(url) {  
    // Includes checks against a list of known affiliate domains.  
    return url.includes("go.skimresources.com") || url.includes("go.redirectingat.com") ||  
           url.includes("click.linksynergy.com") || url.includes("www.avantlink.com") ||  
           url.includes("www.dpbolvw.net") || url.includes("www.awin1.com");  
}

// Function to decode the actual target URL from an affiliate link's parameters.  
function decodeTargetUrl(link) {  
    const url = new URL(link.href);  
    const params = url.searchParams;  
    // Decodes parameters that might contain the real, intended destination URL.  
    return decodeURIComponent(  
        params.get('murl') ||        // Parameter used by some affiliate networks.  
        params.get('url') ||         // Commonly used parameter for redirection.  
        params.get('ued')            // Specific to certain networks.  
    ) || link.href; // Fallback to the original link if no redirection parameter is found.  
}

// Function to modify the affiliate link.  
function modifyLink(link) {  
    if (isAffiliateLink(link.href)) {  
        const decodedUrl = decodeTargetUrl(link);  
        if (decodedUrl !== link.href) { // Only modify the link if it's different from the current URL.  
            link.href = decodedUrl;  
            link.title = 'This link has been redirected to the direct URL';  
            // Adds a visual indicator (emoji) to modified links.  
            if (!link.querySelector('.clean-link-emoji')) {  
                const emojiSpan = document.createElement('span');  
                emojiSpan.className = 'clean-link-emoji';  
                emojiSpan.textContent = ' 🧼';  
                link.appendChild(emojiSpan);  
            }  
            // Prevents the default link action and stops further event propagation.  
            link.addEventListener('click', function(e) {  
                e.preventDefault();  
                e.stopPropagation();  
                window.location.href = decodedUrl;  
                return false;  
            }, true);  
        }  
    }  
}

// Variable to store the interval ID for continuous checking.  
let checkLinksInterval;

// Function to start an interval that continuously checks and modifies affiliate links.  
function startInterval() {  
    if (!checkLinksInterval) {  
        checkLinksInterval = setInterval(() => {  
            document.querySelectorAll('a').forEach(link => {  
                if (isAffiliateLink(link.href)) {  
                    modifyLink(link);  
                }  
            });  
        }, 1000); // Interval set to check every second.  
    }  
}

// Function to stop the interval, conserving resources when not needed.  
function stopInterval() {  
    if (checkLinksInterval) {  
        clearInterval(checkLinksInterval);  
        checkLinksInterval = null;  
    }  
}

// Event listener for the DOMContentLoaded event to start the modification process as soon as the DOM is ready.  
document.addEventListener('DOMContentLoaded', () => {  
    document.querySelectorAll('a').forEach(link => {  
        if (isAffiliateLink(link.href)) {  
            modifyLink(link);  
        }  
    });  
    startInterval(); // Starts the interval after the initial modification.  
});

// Event listener for the pageshow event to handle cases when navigating back to the page from cache.  
window.addEventListener("pageshow", function(event) {  
    if (event.persisted) {  
        // Delays link checking by 0.5 seconds after the page is shown, which includes loading from bfcache.  
        setTimeout(() => {  
            document.querySelectorAll('a').forEach(link => {  
                if (isAffiliateLink(link.href)) {  
                    modifyLink(link);  
                }  
            });  
        }, 500);  
    }  
});

// Event listener for the visibilitychange event to manage resource usage based on the visibility of the document.  
document.addEventListener('visibilitychange', () => {  
    if (document.visibilityState === 'hidden') {  
        stopInterval(); // Stops the interval when the document is not visible.  
    } else {  
        startInterval(); // Restarts the interval when the document becomes visible again.  
    }  
});
