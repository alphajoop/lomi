/** Toast / portal-aware outside click handler for dialogs and sheets. */
export function createToastAwarePointerDownOutside() {
  return (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (
      target.closest("[data-toast]") ||
      target.closest("[data-radix-toast-viewport]") ||
      target.closest("[data-radix-toast-root]") ||
      target.closest("[data-onboarding-dropdown]") ||
      target.closest("[data-sileo-title]") ||
      target.closest("[data-sileo-description]") ||
      target.closest("[data-sileo-badge]") ||
      target.closest("[data-sileo-button]") ||
      target.closest('[role="status"]') ||
      target.matches(
        "[data-toast] *, [data-radix-toast-viewport] *, [data-radix-toast-root] *, [data-sileo-title] *, [data-sileo-description] *, [data-sileo-badge] *, [data-sileo-button] *",
      )
    ) {
      if (event.cancelable) {
        event.preventDefault();
      }
    }
  };
}
