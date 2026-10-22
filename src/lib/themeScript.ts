export const THEME_KEY = "ir:theme";

/**
 * Runs in <head> before the page paints. The site is light unless the visitor
 * has picked dark with the toggle, so a saved dark theme never flashes white.
 */
export const THEME_SCRIPT = `(function(){try{var d=localStorage.getItem("${THEME_KEY}")==="dark";var r=document.documentElement;if(d)r.classList.add("dark");r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
