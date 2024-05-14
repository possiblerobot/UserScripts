
// ==UserScript==  
// @name            LinkSoap - Affiliate Link Cleaner
// @version         09
// @description     Bypasses affiliate links from multiple sources.  
// @author          possiblerobot  
// @downloadURL     https://raw.githubusercontent.com/possiblerobot/UserScripts/main/LinkSoap.user.js  
// @updateURL       https://raw.githubusercontent.com/possiblerobot/UserScripts/main/LinkSoap.user.js  
// @homepageURL     na  
// @supportURL      na  
// @license         na  
// @match       *://*/*  
// @run-at         document-start  
// ==/UserScript==

// Function to check if a URL is an affiliate link using regular expressions.
function isAffiliateLink(url) {
    const affiliatePatterns = [
        /go\.skimresources\.com/,
        /go\.redirectingat\.com/,
        /click\.linksynergy\.com/,
        /www\.avantlink\.com/,
        /www\.dpbolvw\.net/,
        /www\.awin1\.com/,
        /goto\.walmart\.com/,
        /(?:[a-z0-9-]+\.)?sjv\.io/,  // Generic `sjv.io` support
        /www\.anrdoezrs\.net/        // Added anrdoezrs.net support
    ];
    
    for (const pattern of affiliatePatterns) {
        if (pattern.test(url)) {
            const domain = url.match(pattern)[0]; // Extract the matched domain part
            return { isMatch: true, domain: domain };
        }
    }
    return { isMatch: false, domain: null };
}

// Function to decode the actual target URL from an affiliate link's parameters.
function decodeTargetUrl(link) {
    const url = new URL(link.href);
    const params = url.searchParams;
    // Decodes parameters that might contain the real, intended destination URL.
    return decodeURIComponent(
        params.get('murl') ||        // Parameter used by some affiliate networks.
        params.get('url') ||         // Commonly used parameter for redirection (including anrdoezrs.net).
        params.get('ued') ||         // Specific to certain networks.
        params.get('u')              // Parameter used by Walmart, Apple, and other sjv.io subdomains
    ) || link.href; // Fallback to the original link if no redirection parameter is found.
}

// Function to modify the affiliate link.
function modifyLink(link) {
    const { isMatch, domain } = isAffiliateLink(link.href);
    if (isMatch) {
        const decodedUrl = decodeTargetUrl(link);
        if (decodedUrl !== link.href) { // Only modify the link if it's different from the current URL.
            link.href = decodedUrl;
            link.title = `This link has been sanitized from ${domain}`;
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
        if (isAffiliateLink(link.href).isMatch) {
            modifyLink(link);
        }
    });
}

// Event listener for the DOMContentLoaded event to start the modification process as soon as the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
    processLinks();
    // Call processLinks again one second after the page load completes.
    setTimeout(processLinks, 1000);
});

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
