# Scientific Calculator

A polished scientific calculator built with plain HTML, CSS, and JavaScript. It combines a clean single-screen interface with live evaluation, graph plotting, local persistence, and responsive mobile behavior.

## Live Demo

[GitHub Pages Demo](https://<your-username>.github.io/<repo-name>/)

Update the link above after publishing your repository.

## Screenshots

| Desktop Workspace | Mobile Quick Menu | Graph Mode |
| --- | --- | --- |
| ![Desktop calculator workspace](docs/calculator-preview.svg) | ![Mobile calculator menu](docs/calculator-mobile-preview.svg) | ![Graph plotting panel](docs/calculator-graph-preview.svg) |

| History Panel | Formula Library | Theme Picker |
| --- | --- | --- |
| ![History panel preview](docs/calculator-history-preview.svg) | ![Formula library preview](docs/calculator-formulas-preview.svg) | ![Theme picker preview](docs/calculator-theme-preview.svg) |

## Feature Highlights

- Dual display with editable expression line and live result preview
- Cursor editing with left/right arrows, insert-anywhere input, `Backspace`, `Delete`, `Home`, and `End`
- Smart input handling with invalid-sequence prevention, decimal guards, bracket pairing, and implicit multiplication such as `2(3+4)`
- Scientific functions including `sin`, `cos`, `tan`, `log`, `ln`, `sqrt`, powers, percent, factorial, `pi`, and `e`
- Real calculator-style percent behavior for expressions like `200 + 10%`
- Degree/Radian mode toggle shared by both calculations and graph plotting
- Graph plotting for expressions like `y = sin(x)` and `y = x^2`
- History saved in `localStorage`, with reload persistence, per-item delete, and TXT/JSON export
- Theme system with `Dark`, `Ocean`, `Neon`, and `Minimal` presets
- Memory controls with `M+`, `M-`, and `MR`
- Responsive one-screen layout for desktop, tablet, and mobile
- Installable PWA with offline shell caching
- Keyboard shortcuts and clipboard support
- Modular calculation core built around `tokenize`, `toRPN`, and `evaluateRPN`
- Automated tests for arithmetic, graph helpers, percentage rules, factorials, and error cases

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas API
- Service Worker + Web App Manifest
- Node.js `assert` for local test coverage

## Project Structure

- `index.html` - app shell and panels
- `style.css` - layout, themes, responsive UI, and component styling
- `app.js` - interaction logic, storage, history, graph UI, and panel controls
- `calculator-core.js` - tokenizer, parser, RPN evaluator, and graph-expression helpers
- `calculator.test.js` - automated math and edge-case tests
- `docs/` - README preview assets

## Getting Started

1. Clone or download this project.
2. Open the project folder.
3. Launch `index.html` in your browser, or run it through a static server such as VS Code Live Server.

Optional local test run:

```bash
npm test
```

## Keyboard Support

- `0-9`, `.`, `+`, `-`, `*`, `/`, `^`, `%`, `!`, `(`, `)`
- `Enter` or `=` to evaluate
- `Backspace` to delete backward
- `Delete` to delete forward
- `ArrowLeft` and `ArrowRight` to move the cursor
- `Home` and `End` to jump through the expression
- `Escape` to close panels or clear the editor
- `S`, `C`, `T`, `G`, `L`, `Q`, `P`, `E` for `sin`, `cos`, `tan`, `log`, `ln`, `sqrt`, `pi`, `e`
- `R` to toggle Degree/Radian mode
- `Ctrl + C` to copy the current result

## Deployment

1. Create a GitHub repository and upload the project files.
2. Keep `index.html`, `style.css`, `app.js`, and `calculator-core.js` in the repository root.
3. Push your project to your publishing branch, usually `main`.
4. Open `Settings -> Pages` in GitHub.
5. Under `Build and deployment`, choose `Deploy from a branch`.
6. Select the branch and `/(root)` folder, then save.
7. Wait for GitHub Pages to publish the site.
8. Replace the placeholder demo URL in this README with the final GitHub Pages link.

This project also includes `.nojekyll` so GitHub Pages serves it as a plain static site.

## Future Improvements

- More graph controls such as zoom presets and trace points
- Unit conversion and engineering utilities
- Matrix and statistics modes
- Import/export presets beyond history snapshots
- Optional accessibility presets for larger text and high-contrast layouts

## Notes

- History is capped at the latest 20 calculations.
- Theme, angle mode, and history are stored locally in the browser.
- For the latest GitHub Pages publishing details, check the official docs:
  https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
