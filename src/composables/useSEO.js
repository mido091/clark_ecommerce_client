import { ref, watchEffect } from 'vue';

/**
 * Composable for managing dynamic SEO meta tags and JSON-LD schema.
 */
export function useSEO() {
  const seoData = ref({
    title: '',
    description: '',
    image: '',
    url: '',
    jsonLd: null
  });

  const setMeta = (title, description, image = '', url = '') => {
    seoData.value = { ...seoData.value, title, description, image, url };
  };

  const setJsonLd = (jsonLd) => {
    seoData.value.jsonLd = jsonLd;
  };

  watchEffect(() => {
    const { title, description, image, url, jsonLd } = seoData.value;

    if (title) {
      document.title = title;
    }

    // Update Meta Description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = description;
    }

    // Update OG Tags
    const ogTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'website' },
    ];

    ogTags.forEach(({ property, content }) => {
      if (!content) return;
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    });

    // Update JSON-LD Schema
    if (jsonLd) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.text = JSON.stringify(jsonLd);
    }
  });

  return { setMeta, setJsonLd };
}
