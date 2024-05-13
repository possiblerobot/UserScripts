// ==UserScript==  
// @name            LinkSoap-Beta - Affiliate Link Cleaner  
// @version         07b  
// @description     Bypasses affiliate links from multiple sources.  
// @author          possiblerobot  
// @downloadURL     na  
// @updateURL       na  
// @homepageURL     na  
// @supportURL      na  
// @license         na  
// @match           *://*/*  
// @run-at          document-start  
// ==/UserScript==

// Function to check if a URL is an affiliate link.  
function isAffiliateLink(url) {  
    // Includes checks against a list of known affiliate domains.  
    return url.includes("go.skimresources.com") || url.includes("go.redirectingat.com") ||  
           url.includes("click.linksynergy.com") || url.includes("www.avantlink.com") ||  
           url.includes("www.dpbolvw.net") || url.includes("www.awin1.com") || 
           url.includes("goto.walmart.com");  // Added Walmart affiliate URL 
}

// Function to decode the actual target URL from an affiliate link's parameters.  
function decodeTargetUrl(link) {  
    const url = new URL(link.href);  
    const params = url.searchParams;  
    // Decodes parameters that might contain the real, intended destination URL.  
    return decodeURIComponent(  
        params.get('murl') ||        // Parameter used by some affiliate networks.  
        params.get('url') ||         // Commonly used parameter for redirection.  
        params.get('ued') ||         // Specific to certain networks.  
        params.get('u')              // Added Walmart specific parameter  
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

// Function to process all links on the document
function processLinks() {
    document.querySelectorAll('a').forEach(link => {  
        if (isAffiliateLink(link.href)) {  
            modifyLink(link);  
        }  
    });
}

// Event listener for the DOMContentLoaded event to start the modification process as soon as the DOM is ready.  
document.addEventListener('DOMContentLoaded', processLinks);

// Event listener for the pageshow event to handle cases when navigating back to the page from cache.  
window.addEventListener("pageshow", function(event) {  
    if (event.persisted) {  
        // Ensures link checking when the page is shown from the bfcache.
        processLinks(); 
    }  
});

// MutationObserver to handle dynamically loaded content
const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            processLinks();
        }
    });
});
observer.observe(document.body, { childList: true, subtree: true });

// Event listener for the visibilitychange event to manage resource usage based on the visibility of the document.
document.addEventListener('visibilitychange', () => {  
    if (document.visibilityState === 'visible') {  
        processLinks(); // Ensure links are processed when the document becomes visible again.  
    }  
});
