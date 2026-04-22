(function () {
  const THEME_STORAGE_KEY = 'nd-theme-mode';
  const CUSTOM_STORAGE_KEY = 'nd-theme-custom';
  const THEME_KEYS = [
    ['--bg-primary', 'Background'],
    ['--bg-secondary', 'Surface'],
    ['--bg-tertiary', 'Surface Alt'],
    ['--text-primary', 'Text'],
    ['--text-secondary', 'Text Muted'],
    ['--border-color', 'Border'],
    ['--accent-primary', 'Accent'],
    ['--accent-blue', 'Badge Blue'],
    ['--accent-green', 'Badge Green'],
    ['--accent-purple', 'Badge Purple'],
    ['--gradient-1', 'Gradient A'],
    ['--gradient-2', 'Gradient B'],
    ['--button-primary-bg', 'Button Primary'],
    ['--button-primary-hover', 'Button Primary Hover'],
    ['--button-secondary-bg', 'Button Secondary'],
    ['--button-secondary-text', 'Button Secondary Text'],
    ['--button-secondary-border', 'Button Secondary Border']
  ];

  const DEFAULT_THEMES = {
    light: {
      '--bg-primary': '#f5f0e8',
      '--bg-secondary': '#ede8de',
      '--bg-tertiary': '#e5dfd5',
      '--text-primary': '#2d2416',
      '--text-secondary': '#5a4a3a',
      '--border-color': '#d4cec0',
      '--accent-primary': '#8b7a6a',
      '--accent-blue': '#7a9fb5',
      '--accent-green': '#6b8e6f',
      '--accent-purple': '#9a7fa0',
      '--gradient-1': '#d4a5ff',
      '--gradient-2': '#a5e8ff',
      '--button-primary-bg': '#6b8e6f',
      '--button-primary-hover': '#7aa07e',
      '--button-secondary-bg': '#e5dfd5',
      '--button-secondary-text': '#5a4a3a',
      '--button-secondary-border': '#d4cec0'
    },
    dark: {
      '--bg-primary': '#0d1117',
      '--bg-secondary': '#161b22',
      '--bg-tertiary': '#21262d',
      '--text-primary': '#c9d1d9',
      '--text-secondary': '#8b949e',
      '--border-color': '#30363d',
      '--accent-primary': '#58a6ff',
      '--accent-blue': '#58a6ff',
      '--accent-green': '#3fb950',
      '--accent-purple': '#bc8cff',
      '--gradient-1': '#58a6ff',
      '--gradient-2': '#bc8cff',
      '--button-primary-bg': '#238636',
      '--button-primary-hover': '#2ea043',
      '--button-secondary-bg': '#21262d',
      '--button-secondary-text': '#c9d1d9',
      '--button-secondary-border': '#30363d'
    }
  };

  let customThemes = loadCustomThemes();
  let editorMode = 'light';

  function safeParse(jsonValue) {
    try {
      return JSON.parse(jsonValue);
    } catch {
      return null;
    }
  }

  function loadCustomThemes() {
    const parsed = safeParse(localStorage.getItem(CUSTOM_STORAGE_KEY));
    return parsed && parsed.light && parsed.dark ? parsed : { light: {}, dark: {} };
  }

  function saveCustomThemes() {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customThemes));
  }

  function prefersDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function getThemePalette(mode) {
    return { ...DEFAULT_THEMES[mode], ...(customThemes[mode] || {}) };
  }

  function applyTheme(mode) {
    const root = document.documentElement;
    const palette = getThemePalette(mode);
    Object.entries(palette).forEach(function ([key, value]) {
      root.style.setProperty(key, value);
    });
    root.setAttribute('data-theme', mode);
    updateThemeIcon(mode);
  }

  function updateThemeIcon(mode) {
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.textContent = mode === 'dark' ? 'Light' : 'Dark';
    }
  }

  function currentThemeMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function toggleTheme() {
    const nextMode = currentThemeMode() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    applyTheme(nextMode);
  }

  function buildEditorControls() {
    const controlsContainer = document.getElementById('theme-editor-controls');
    if (!controlsContainer) return;

    controlsContainer.innerHTML = '';
    const palette = getThemePalette(editorMode);

    THEME_KEYS.forEach(function ([cssVar, label]) {
      const row = document.createElement('div');
      row.className = 'theme-editor-control';

      const textLabel = document.createElement('label');
      textLabel.htmlFor = `theme-color-${cssVar}`;
      textLabel.textContent = label;

      const input = document.createElement('input');
      input.id = `theme-color-${cssVar}`;
      input.type = 'color';
      input.value = palette[cssVar];
      input.addEventListener('input', function () {
        if (!customThemes[editorMode]) customThemes[editorMode] = {};
        customThemes[editorMode][cssVar] = input.value;
        saveCustomThemes();
        if (editorMode === currentThemeMode()) applyTheme(editorMode);
      });

      row.appendChild(textLabel);
      row.appendChild(input);
      controlsContainer.appendChild(row);
    });
  }

  function openEditor() {
    const editor = document.getElementById('theme-editor');
    if (!editor) return;
    editor.hidden = false;
    const toggleButton = document.getElementById('theme-editor-toggle');
    if (toggleButton) {
      toggleButton.setAttribute('aria-label', 'Close color settings');
      toggleButton.setAttribute('aria-expanded', 'true');
    }
    editorMode = currentThemeMode();
    const modeSelect = document.getElementById('theme-editor-mode');
    if (modeSelect) modeSelect.value = editorMode;
    buildEditorControls();
  }

  function closeEditor() {
    const editor = document.getElementById('theme-editor');
    if (editor) editor.hidden = true;
    const toggleButton = document.getElementById('theme-editor-toggle');
    if (toggleButton) {
      toggleButton.setAttribute('aria-label', 'Open color settings');
      toggleButton.setAttribute('aria-expanded', 'false');
    }
  }

  function toggleEditor() {
    const editor = document.getElementById('theme-editor');
    if (!editor) return;
    if (editor.hidden) {
      openEditor();
    } else {
      closeEditor();
    }
  }

  function resetCurrentMode() {
    customThemes[editorMode] = {};
    saveCustomThemes();
    if (editorMode === currentThemeMode()) applyTheme(editorMode);
    buildEditorControls();
  }

  function resetAllModes() {
    customThemes = { light: {}, dark: {} };
    saveCustomThemes();
    applyTheme(currentThemeMode());
    buildEditorControls();
  }

  function initializeTheme() {
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY);
    const mode = savedMode === 'light' || savedMode === 'dark'
      ? savedMode
      : (prefersDarkMode() ? 'dark' : 'light');
    applyTheme(mode);
  }

  function initializeEditorBindings() {
    const toggleButton = document.getElementById('theme-editor-toggle');
    const modeSelect = document.getElementById('theme-editor-mode');
    const resetModeButton = document.getElementById('theme-reset-mode');
    const resetAllButton = document.getElementById('theme-reset-all');

    if (toggleButton) toggleButton.addEventListener('click', toggleEditor);
    if (modeSelect) {
      modeSelect.addEventListener('change', function () {
        editorMode = modeSelect.value === 'dark' ? 'dark' : 'light';
        buildEditorControls();
      });
    }
    if (resetModeButton) resetModeButton.addEventListener('click', resetCurrentMode);
    if (resetAllButton) resetAllButton.addEventListener('click', resetAllModes);
  }

  function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
  }

  function initializeSystemPreferenceListener() {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = function (event) {
      const savedMode = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode === 'light' || savedMode === 'dark') return;
      applyTheme(event.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', onChange);
    } else {
      mediaQuery.addListener(onChange);
    }
  }

  function initialize() {
    initializeTheme();
    initializeThemeToggle();
    initializeEditorBindings();
    initializeSystemPreferenceListener();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
