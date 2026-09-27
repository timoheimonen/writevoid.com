# Changelog

All notable changes to writevoid.com are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.9] - 2026-09-27

### Added

- Menu handle at the top of the screen that opens the settings menu on touch
  devices, which previously had no way to reach it.
- Keyboard access to the settings menu: it shows while focused, Escape closes
  it and returns focus to the editor, and arrow keys move between options.

### Changed

- Redesigned the settings menu:
  - Mode and font are now segmented controls that show all options and the
    current selection.
  - Each font option is previewed in its own typeface.
  - The theme toggle is a sun/moon icon.
  - "word limit for download" is now a compact "goal … words" field.
  - The info icon is now an "about" button.
- On phones the settings menu wraps onto two rows with larger touch targets.
- Redesigned the about dialog with step-by-step instructions, mode cards that
  highlight the current mode, and a footer with links and the version number.
  On phones it opens as a bottom sheet.
- The about dialog now works properly with keyboards and screen readers: it is
  labelled as a dialog, focus moves into it and stays there while it is open,
  and closing it returns focus to the editor.
- Links to the About, Privacy and Terms pages now use extensionless URLs
  (`/about`, `/privacy`, `/tos`), including canonical URLs and the sitemap.

### Fixed

- Links at the bottom of the page failed in Safari with "Response served by
  service worker has redirections". The service worker cached `/page.html`
  URLs that the host redirects to `/page`, and Safari refuses redirected
  responses served by a service worker.
