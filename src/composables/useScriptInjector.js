/**
 * @file useScriptInjector.js (Composable)
 * @description Safe DOM Script Injection Engine.
 *
 * Injecting raw HTML strings (containing `<script>` blocks) directly using Vue's
 * `v-html` directive doesn't work out-of-the-box — modern browsers outright refuse
 * to evaluate and execute Javascript introduced via `innerHTML` as a security precaution.
 *
 * This composable bypasses that hurdle securely by constructing raw document elements,
 * specifically converting passive script blocks back into active `HTMLScriptElement` blocks.
 *
 * Primary Use Case:
 *  Dynamically applying Marketing Tool Pixels (Google Analytics, Meta Pixel).
 *  These snippets are configured by the admin dashboard and applied on the client layer.
 *
 * Security Caution:
 *  Because this manually executes arbitrary JS configured from the database, the API's
 *  `/settings` update controls MUST remain strictly locked behind Super Admin roles
 *  so malicious scripts cannot be driven into the payload.
 */

let injected = false;

/**
 * Re-create a <script> element natively so the browser treats it as executable code.
 * (Merely cloning an existing <script> node does NOT re-execute its context.)
 *
 * @param {HTMLScriptElement} sourceEl - The initial passive node from innerHTML parser.
 * @returns {HTMLScriptElement} - An actively parsed Javascript fragment block.
 */
function cloneExecutableScript(sourceEl) {
  const script = document.createElement("script");

  // Copy all structural attributes (src, async, defer, type, data-* etc.)
  Array.from(sourceEl.attributes).forEach((attr) => {
    script.setAttribute(attr.name, attr.value);
  });

  // Transfer textual script instructions (Must use textContent, NOT innerHTML, for scripts)
  if (sourceEl.textContent) {
    script.textContent = sourceEl.textContent;
  }

  return script;
}

/**
 * Process a raw HTML string and graft each top-level element into a specified HTML container.
 * Crucially, blocks tagged as "SCRIPT" face a deep-copy reboot so the browser engine actually executes them.
 *
 * @param {string} htmlString  - Raw textual HTML
 * @param {Element} container  - Either `document.head` or `document.body` DOM targets
 */
function injectHtml(htmlString, container) {
  if (!htmlString?.trim()) return;

  // Use a detached div as a temporary parser space
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlString;

  // Iterate over extracted children and mount to main document
  Array.from(tmp.children).forEach((el) => {
    if (el.tagName === "SCRIPT") {
      container.appendChild(cloneExecutableScript(el));
    } else {
      container.appendChild(el.cloneNode(true));
    }
  });
}

/**
 * Calling `useScriptInjector()` returns a single `injectScripts` procedure.
 * Due to the `injected` boolean singleton residing outside the function block, 
 * repeated invocations within the same browser session are aborted silently.
 */
export function useScriptInjector() {

  /**
   * Dispatches snippets to their exact hierarchical regions.
   * Reconstructs standard `gtag.js` patterns if respective analytical IDs were configured.
   *
   * @param {string} [headerHtml]  User-defined code for <head>
   * @param {string} [footerHtml]  User-defined code for <body>
   * @param {string} [gaId]        Google Analytics Property ID (Format: "G-XXXXXXXX")
   * @param {string} [adsId]       Google Ads Client ID (Format: "AW-XXXXXXXX")
   * @param {boolean} [force=false] Bypasses injection duplicate guard boolean (useful for dev)
   */
  function injectScripts(headerHtml, footerHtml, gaId = "", adsId = "", force = false) {
    if (injected && !force) return;

    // ── 1. Google Tag Manager Auto-Wiring Boilerplate ────────────────────────
    const primaryId = gaId || adsId;
    
    if (primaryId) {
      // 1A. Call remote Google source loader library
      const gTagScript = document.createElement("script");
      gTagScript.async = true;
      gTagScript.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;
      document.head.appendChild(gTagScript);

      // 1B. Setup local window variable space and configuration identifiers
      const gTagConfig = document.createElement("script");
      gTagConfig.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        ${gaId ? `gtag('config', '${gaId}');` : ""}
        ${adsId ? `gtag('config', '${adsId}');` : ""}
      `;
      document.head.appendChild(gTagConfig);
    }

    // ── 2. Arbitrary Source Code Mount Hook ──────────────────────────────────
    if (headerHtml) injectHtml(headerHtml, document.head);
    if (footerHtml) injectHtml(footerHtml, document.body);

    injected = true;
  }

  return { injectScripts };
}
