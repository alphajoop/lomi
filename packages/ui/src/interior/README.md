Vendored from [interior.dev](https://github.com/ddoemonn/interior) (MIT).

Import from `@lomi./ui/interior/<file>`, not the package root. These files target `motion`; shared primitives on `@lomi./ui` keep Button/Dialog/Input APIs and use interior’s stone / 9px / 13px writing (PressDepth `whileTap`, flat border, focus `#4568FF`). Use kit components at matching interactions (CopyButton, LoadingButton, HoldToConfirm, Modal, OtpInput) rather than restyling every control into a Copy Button.
