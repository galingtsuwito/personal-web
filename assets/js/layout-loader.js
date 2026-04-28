/**
 * Layout Loader - Dynamically loads navbar and footer components
 * and handles relative path adjustments.
 */

(function () {
    function init() {
        const navbarPlaceholder = document.getElementById("navbar-placeholder");
        const footerPlaceholder = document.getElementById("footer-placeholder");

        if (!navbarPlaceholder && !footerPlaceholder) return;

        // Check for file:// protocol
        if (window.location.protocol === 'file:') {
            console.error("Layout Loader: 'fetch' is blocked on the 'file://' protocol due to browser security (CORS). Please use a local web server (e.g., Live Server in VS Code, or 'python -m http.server').");
            
            // Show a helpful message in the UI if we're in a dev environment
            if (navbarPlaceholder) {
                navbarPlaceholder.innerHTML = '<div style="background:#ffdddd; color:#aa0000; padding:10px; text-align:center; border:1px solid #aa0000;"><b>Layout Error:</b> Components cannot be loaded via <code>file://</code> protocol. Please use a local server.</div>';
            }
            return;
        }

        // Determine root prefix based on script path
        let rootPrefix = "";
        const scriptTag = document.querySelector('script[src*="layout-loader.js"]');
        if (scriptTag) {
            const scriptSrc = scriptTag.getAttribute('src');
            // If src is "../assets/js/layout-loader.js", prefix is "../"
            // If src is "assets/js/layout-loader.js", prefix is ""
            rootPrefix = scriptSrc.split('assets/')[0];
        }

        async function loadComponent(url, placeholder) {
            if (!placeholder) return;
            try {
                const response = await fetch(rootPrefix + url);
                if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                
                let html = await response.text();
                
                // Adjust relative links in the component if we're in a subfolder
                if (rootPrefix && rootPrefix !== "./") {
                    html = adjustLinks(html, rootPrefix);
                }
                
                placeholder.outerHTML = html;
                
                // Post-load initialization
                if (url.includes("navbar")) {
                    initNavbarFeatures();
                }
            } catch (error) {
                console.error(`Error loading component (${url}):`, error);
                placeholder.innerHTML = `<div style="padding:10px; color:red; border:1px dashed red;">Failed to load ${url}. Check console for details.</div>`;
            }
        }

        function adjustLinks(html, prefix) {
            // Find all href="..." that don't start with http, /, or #
            return html.replace(/href="(?!(http|#|\/))([^"]+)"/g, `href="${prefix}$2"`);
        }

        function initNavbarFeatures() {
            // 1. Mark active link
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
            
            navLinks.forEach(link => {
                const href = link.getAttribute("href");
                if (!href) return;
                
                // Normalize paths for comparison
                const isHome = href === "index.html" || href === "./index.html" || href === "../index.html";
                const pathEndsWithHref = currentPath.endsWith(href.replace('../', '').replace('./', ''));
                
                if (pathEndsWithHref || (isHome && (currentPath === "/" || currentPath.endsWith("/index.html")))) {
                    link.parentElement.classList.add("active");
                    if (!link.innerHTML.includes("sr-only")) {
                        link.innerHTML += ' <span class="sr-only">(current)</span>';
                    }
                }
            });

            // 2. Re-initialize progress bar if setup function exists
            if (typeof progressBarSetup === "function") {
                setTimeout(progressBarSetup, 50);
            }

            // 3. Bind theme toggle (since it's injected dynamically)
            const themeToggle = document.getElementById("light-toggle");
            if (themeToggle && typeof toggleThemeSetting === "function") {
                themeToggle.addEventListener("click", toggleThemeSetting);
            }
        }

        loadComponent("components/navbar.html", navbarPlaceholder);
        loadComponent("components/footer.html", footerPlaceholder);
    }

    // Run when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
