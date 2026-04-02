/**
 * @file useSEO.js (Composable)
 * @description Dynamic SEO Meta Tags & JSON-LD Extractor for Vue Router SPA transitions.
 *
 * In a Single Page Application, standard HTML metadata doesn't naturally update
 * when navigating between views. This composable watches an internal object and directly
 * manipulates the DOM's `<head>` attributes.
 *
 * Capabilities:
 *  - Title Bar Text
 *  - Primary HTML Meta Description
 *  - Open Graph tags (og:title, og:image, etc.) for social media (FB/WhatsApp) link sharing rich previews
 *  - JSON-LD Structured Data Schema injections (crucial for Google Search's Product snippets)
 */

import { ref, watchEffect } from 'vue';

export function useSEO() {
  // Underlying reactive container
  const seoData = ref({
    title: '',
    description: '',
    image: '',
    url: '',
    jsonLd: null
  });

  /**
   * Overwrite standard Meta Tags.
   * @param {string} title 
   * @param {string} description 
   * @param {string} [image=''] Optional Thumbnail Image URL
   * @param {string} [url=''] Optional Canonical URL
   */
  const setMeta = (title, description, image = '', url = '') => {
    seoData.value = { ...seoData.value, title, description, image, url };
  };

  /**
   * Overwrite Structured Schema Injection object.
   * Expects standard schema.org syntax mappings inside a JSON object.
   * @param {Object} jsonLd 
   */
  const setJsonLd = (jsonLd) => {
    seoData.value.jsonLd = jsonLd;
  };

  // ── Reactive Binding Daemon ────────────────────────────────────────────────────
  // Triggers every time seoData is mutated via the exposed setters.
  watchEffect(() => {
    const { title, description, image, url, jsonLd } = seoData.value;

    // 1. Update tab title
    if (title) {
      document.title = title;
    }

    // 2. Update Primary Document Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        // If the tag wasn't hardcoded in index.html, mint a new one
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }

    // 3. Sync OpenGraph Definitions
    const ogTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'website' },
    ];

    ogTags.forEach(({ property, content }) => {
      // Don't inject empty elements
      if (!content) return;
      
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    });

    // 4. Mount/Update Application JSON-LD 
    if (jsonLd) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      // Serialize schema object into DOM node
      script.text = JSON.stringify(jsonLd);
    }
  });

  return { setMeta, setJsonLd };
}
