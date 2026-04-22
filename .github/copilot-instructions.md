# Copilot Project Instructions

## Static Website Structure

- Organize all HTML files in the `html/` directory.
- Place all CSS files in the `css/` directory.
- Place all JavaScript files in the `js/` directory.
- Do not generate single large files containing HTML, CSS, and JS together. Keep them separate.
- When creating or editing files, always use the appropriate subdirectory.
- Use clear, descriptive file names (e.g., `index.html`, `main.css`, `app.js`).

## General Guidelines

- Follow best practices for static site organization.
- Keep code modular and easy to maintain.
- Ask for clarification if requirements are ambiguous.

## JavaScript Simplicity & Maintainability

- Write small, single-purpose functions (ideally under 30 lines).
- Avoid deep nesting; use early returns to reduce indentation.
- Use clear, descriptive variable and function names.
- Split code into multiple files/modules if it grows large.
- Add comments for complex or non-obvious logic.
- Avoid global variables; use local scope or modules.
- Favor modern ES6+ syntax (let/const, arrow functions, etc.).

## CSS Maintainability

- Always use CSS variables for colors, backgrounds, and borders—never hardcode hex values in rules.
- When adding new colors, define them as variables at the top of the CSS file.
- Reuse existing variables instead of creating duplicates.
- If a color is missing, add a new variable rather than hardcoding.
- Use clear, descriptive class and ID names.
- Group related styles together and use comments to separate sections.
- Prefer classes over IDs for styling.
- Avoid !important unless absolutely necessary.
- Use CSS variables for repeated values (colors, spacing, etc.).
- Keep selectors simple and avoid deep nesting.
- Organize CSS into multiple files if it grows large (e.g., base.css, layout.css, components.css).
