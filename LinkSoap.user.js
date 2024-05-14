
// ==UserScript==  
// @name            LinkSoap - Affiliate Link Cleaner
// @version         10
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
        /(?:[a-z0-9-]+\.)?sjv\.io/,
        /www\.anrdoezrs\.net/        
    ];
    
    return affiliatePatterns.some(pattern => pattern.test(url));
}

// Function to decode the actual target URL from an affiliate link's parameters.
function decodeTargetUrl(link) {
    const url = new URL(link.href);
    const params = url.searchParams;
    const potentialTargets = [
        params.get('murl'),
        params.get('url'),
        params.get('ued'),
        params.get('u')
    ];
    
    for (const target of potentialTargets) {
        if (target) return decodeURIComponent(target);
    }
    return link.href; // Fallback to the original link if no redirection parameter is found.
}

// Function to modify the affiliate link.
function modifyLink(link) {
    if (isAffiliateLink(link.href)) {
        const decodedUrl = decodeTargetUrl(link);
        if (decodedUrl !== link.href) { // Only modify the link if it's different from the current URL.
            link.href = decodedUrl;
            link.title = `This link has been sanitized`;
            
            // Adds a visual indicator (emoji) to modified links.
            if (!link.querySelector('.clean-link-emoji')) {
                const emojiSpan = document.createElement('span');
                emojiSpan.className = 'clean-link-emoji';
                emojiSpan.textContent = ' 🧼';
                link.appendChild(emojiSpan);
            }
            
            // Prevents the default link action and stops further event propagation.
            link.addEventListener('click', function (e) {
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
        modifyLink(link);
    });
}

// Debounce function to throttle function execution
function debounce(func, delay) {
    let timer;
    return function () {
        const context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(context, args), delay);
    };
}

const debouncedProcessLinks = debounce(processLinks, 300);

// MutationObserver to handle dynamically loaded content
const observer = new MutationObserver((mutations) => {
    let hasAddedNodes = false;
    mutations.forEach(mutation => {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            hasAddedNodes = true;
        }
    });
    if (hasAddedNodes) {
        debouncedProcessLinks();
    }
});
observer.observe(document.body, { childList: true, subtree: true });

// Event listeners for page load and navigation events
document.addEventListener('DOMContentLoaded', processLinks);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        processLinks();
    }
});
