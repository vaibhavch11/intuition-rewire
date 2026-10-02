export const THEME_KEY = "ir:theme";

/**
 * Runs in <head> before the page paints: applies the saved theme, or the
 * system preference when nothing is saved, so dark mode never flashes white.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var r=document.documentElement;if(d)r.classList.add("dark");r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;
