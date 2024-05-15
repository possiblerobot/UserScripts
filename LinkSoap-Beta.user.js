// ==UserScript==
// @name            LinkSoap-Beta - Affiliate Link Cleaner
// @version         12b
// @description     Bypasses affiliate links from multiple sources.
// @author  
// @downloadURL     na
// @updateURL       na
// @homepageURL     na
// @supportURL      na
// @license         na
// @match           *://*/*
// @run-at          document-start
// ==/UserScript==

// Function to get the readable domain name if a URL is an affiliate link
function getAffiliateDomain(url) {
    const affiliatePatterns = [
        { pattern: /go\.skimresources\.com/, domain: 'skimresources.com' },
        { pattern: /go\.redirectingat\.com/, domain: 'redirectingat.com' },
        { pattern: /click\.linksynergy\.com/, domain: 'linksynergy.com' },
        { pattern: /avantlink\.com/, domain: 'avantlink.com' },
        { pattern: /dpbolvw\.net/, domain: 'dpbolvw.net' },
        { pattern: /awin1\.com/, domain: 'awin1.com' },
        { pattern: /goto\.walmart\.com/, domain: 'walmart.com' },
        { pattern: /sjv\.io/, domain: 'sjv.io' },  // Simplified sjv.io pattern
        { pattern: /anrdoezrs\.net/, domain: 'anrdoezrs.net' },
        { pattern: /pntrac\.com/, domain: 'pntrac.com' },
        { pattern: /kqzyfj\.com/, domain: 'kqzyfj.com' },
        { pattern: /pntra\.com/, domain: 'pntra.com' },
        { pattern: /igs4ds\.net/, domain: 'igs4ds.net' }
    ];

    for (const { pattern, domain } of affiliatePatterns) {
        if (pattern.test(url)) {
            return domain;
        }
    }
    return null;
}

// Function to decode the actual target URL from an affiliate link's parameters.
function decodeTargetUrl(link) {
    const url = new URL(link.href);
    const params = url.searchParams;
    const potentialTargets = [
        params.get('murl'),
        params.get('url'),     // Common parameter for target URLs
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
    const domain = getAffiliateDomain(link.href);
    if (domain) {
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
