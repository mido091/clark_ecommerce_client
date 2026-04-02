/**
 * @file useUI.js (Composable)
 * @description Global UI state management for Modals, Dialogs, and Toasts.
 *
 * This composable exposes global UI capabilities without relying on Vuex or Pinia.
 * The shared state variables (`toasts` and `modalState`) are declared *outside*
 * the exported function, creating a singleton pattern. Any component that injects
 * `useUI()` interacts with the exact same reactive variables.
 *
 * Capabilities:
 *  1. showToast / removeToast: Ephemeral non-blocking notifications.
 *  2. confirmAction: Promise-based confirmation dialog (e.g. "Are you sure you want to delete?").
 *  3. promptAction: Promise-based text input dialog.
 *
 * UX Enhancement:
 *  - Integrates a base64 encoded "Pop" audio file that plays slightly whenever a toast appears,
 *    improving physical feedback for the user without requiring external audio asset loading.
 */

import { reactive, ref, readonly } from "vue";

// ── Shared Singleton State ─────────────────────────────────────────────────────
// Declared outside the composable so they act as a global singleton across the app.

/** @type {import('vue').Ref<Array<Object>>} List of active toast notifications */
const toasts = ref([]);
let toastIdCounter = 0;

/** @type {Object} State governing the globally mounted App-level Modal Dialog */
const modalState = reactive({
  isOpen: false,
  title: "",
  message: "",
  confirmLabel: "",
  variant: "primary", // 'danger' (red) | 'primary' (blue)
  type: "confirm",    // 'confirm' (yes/no) | 'prompt' (text input)
  inputValue: "",     // value modeled for the prompt type
  resolve: null,      // Internal: Promise resolver binding
});

// ── Audio Feedback ─────────────────────────────────────────────────────────────
// A subtle "pop" sound embedded directly as base64 to avoid network fetching latency
const popSound =
  typeof window !== "undefined"
    ? new Audio(
        "data:audio/mp3;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAQAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
      )
    : null;

/** 
 * Safely plays the pop sound. Catch blocks handle browser AutoPlay prevention 
 * policies (which block audio if the user hasn't interacted with the page yet).
 */
function playPopSound() {
  if (popSound) {
    popSound.currentTime = 0; // Rewind to start in case of rapid fires
    popSound.play().catch(() => {
      // Ignore audio playback errors silently (e.g., restricted by DOM policies)
    });
  }
}

// ── Composable Definition ──────────────────────────────────────────────────────
export function useUI() {
  
  // ── Toasts API ──

  /**
   * Spawns a floating notification that vanishes automatically.
   * 
   * @param {string} message - Text to display
   * @param {'success'|'error'|'warning'|'info'} [type='info'] - Dictates the styling/colors
   * @param {number} [duration=3500] - Lifespan in milliseconds
   */
  const showToast = (message, type = "info", duration = 3500) => {
    const id = ++toastIdCounter;

    // Push the state into the singleton array
    toasts.value.push({
      id,
      message,
      type,
      duration,
      progress: 100, // Tied to the shrink-width animation bar
    });
    
    playPopSound(); // Auditory feedback

    // Calculate progression math to shrink the bar smoothly via setInterval
    const intervalTime = 10;
    const decrementAmount = 100 / (duration / intervalTime);

    // Drive the progress bar down to 0
    const progressInterval = setInterval(() => {
      const targetToast = toasts.value.find((t) => t.id === id);
      if (targetToast) {
        targetToast.progress -= decrementAmount;
        if (targetToast.progress <= 0) {
          targetToast.progress = 0;
          clearInterval(progressInterval);
        }
      } else {
        clearInterval(progressInterval);
      }
    }, intervalTime);

    // Hook auto-removal
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  /**
   * Immediately destroys a toast before its duration expires (e.g., if user clicks X)
   * @param {number} id 
   */
  const removeToast = (id) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  // ── Modals / Dialogs API ──

  /**
   * Prompts the user with a blocking Yes/No styled dialog.
   * Execution in the calling component pauses (await) until the user clicks an option.
   * 
   * @example
   * if (await confirmAction({ title: "Delete?", message: "Are you sure?", variant: "danger"})) { ... }
   * 
   * @param {Object} options
   * @returns {Promise<boolean>} True if confirmed, false if cancelled
   */
  const confirmAction = ({
    title,
    message,
    confirmLabel = "Confirm",
    variant = "danger",
  }) => {
    return new Promise((resolve) => {
      modalState.title = title;
      modalState.message = message;
      modalState.confirmLabel = confirmLabel;
      modalState.variant = variant;
      modalState.type = "confirm";
      modalState.isOpen = true;
      modalState.resolve = resolve; // Storing the promise resolver directly in state
    });
  };

  /**
   * Prompts the user with a dialog containing a text input field.
   * Execution pauses until the user submits text or cancels.
   * 
   * @param {Object} options 
   * @returns {Promise<string|null>} The inputted string, or null if cancelled
   */
  const promptAction = ({
    title,
    message,
    confirmLabel = "Confirm",
    variant = "primary",
  }) => {
    return new Promise((resolve) => {
      modalState.title = title;
      modalState.message = message;
      modalState.confirmLabel = confirmLabel;
      modalState.variant = variant;
      modalState.type = "prompt";
      modalState.inputValue = ""; // clear previous input
      modalState.isOpen = true;
      modalState.resolve = resolve;
    });
  };

  /**
   * Triggered internally by the UI Modal component when the user clicks a button inside it.
   * Fires the stored resolver, unblocking the calling Javascript.
   * 
   * @param {*} value The value to resolve the promise with
   * @private Should only be called by the actual Modal.vue Component
   */
  const resolveModal = (value) => {
    if (modalState.resolve) {
      modalState.resolve(value);
      modalState.resolve = null;
    }
    modalState.isOpen = false;
  };

  return {
    // Readonly exposure prevents accidental mutation from deep within components
    toasts: readonly(toasts),
    showToast,
    removeToast,

    modalState: readonly(modalState),
    confirmAction,
    promptAction,
    resolveModal,
  };
}
