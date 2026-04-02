/**
 * @file animate.js (Vue Custom Directive)
 * @description Intersection Observer-based Scroll Animation Engine (`v-animate`).
 *
 * This directive enables "fade-up" reveal animations as elements scroll into the viewport.
 * It is applied via the `v-animate` attribute in templates.
 * 
 * Flow:
 *  1. `mounted`: Immediately hides the element (`opacity: 0`) and shifts it down by 40px (`translateY`).
 *  2. Configures a delay if one is provided (e.g., `v-animate="{ delay: 200 }"` — useful for staggering grids).
 *  3. Binds an `IntersectionObserver` to monitor when the element crosses the screen threshold.
 *  4. Upon intersecting the threshold, CSS shifts back to normal (`opacity: 1`, `translateY: 0`) 
 *     which activates the smooth 1.2s `cubic-bezier` CSS transition.
 *  5. Once revealed, the observer unhooks (`unobserve`) so it doesn't constantly re-trigger if scrolling up and down.
 */

export default {
  /**
   * Hook called exactly once when the element is bound and inserted into the DOM.
   * @param {HTMLElement} el - The native DOM element
   * @param {Object} binding - Configuration passed down from the directive tag in the template
   */
  mounted(el, binding) {
    // 1. Initial State: Invisible and shifted downwards slightly
    el.style.opacity = "0";
    el.style.transform = "translateY(40px) scale(0.98)";
    // The curve here pushes a strong, smooth deceleration at the end of the reveal motion.
    el.style.transition = "all 1.2s cubic-bezier(0.16, 1, 0.3, 1)";

    // 2. Cascade Delay Injection
    // Staggered delays create "waterfall" reveals in product grids
    if (binding.value && binding.value.delay) {
      el.style.transitionDelay = `${binding.value.delay}ms`;
    }

    // 3. Setup Observer
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          // Has the user scrolled far enough down to see this element?
          if (entry.isIntersecting) {
            // Yes! Execute Reveal State:
            el.style.opacity = "1";
            el.style.transform = "translateY(0) scale(1)";
            
            // Unobserve so the animation only happens the **first time** it enters the screen.
            obs.unobserve(el); 
          }
        });
      },
      {
        // Fire when the element is 50px away from entering the bottom of the visible screen.
        rootMargin: "0px 0px -50px 0px",
        // Minimum visibility ratio required to trigger
        threshold: 0.1,
      },
    );

    // 4. Activate surveillance
    observer.observe(el);
  },
};
