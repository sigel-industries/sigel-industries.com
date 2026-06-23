Mobile modal hidden hotfix

Fixes a mobile CSS cascade bug where .sigel-modal was forced to display:flex!important
inside a mobile media query even when the element still had the hidden attribute.
That caused the default empty "Detail" modal to appear on mobile page load.

The final override keeps [hidden]/aria-hidden=true modals fully hidden, while still
allowing opened modals to use the mobile viewport-safe layout.
