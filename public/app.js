'use strict';

// ── Constants ──────────────────────────────────────────────
const INACTIVITY_MS = 5000;
const STORAGE_LIMIT = 'writevoid_limit';
const STORAGE_THEME = 'writevoid_theme';
const STORAGE_MODE = 'writevoid_mode';
const DEFAULT_LIMIT = 1000;

// Mode fade durations (in seconds)
const FADE_DURATION_FOCUS = 10;
const FADE_DURATION_HARDCORE = 5;

// ── DOM refs ───────────────────────────────────────────────
const editor = document.getElementById('editor');
const wordcountEl = document.getElementById('wordcount');
const downloadBtn = document.getElementById('download-btn-bottom');
const themeBtn = document.getElementById('theme-btn');
const modeBtn = document.getElementById('mode-btn');
const limitInput = document.getElementById('limit-input');
const menuBar = document.getElementById('menu-bar');
const topHoverZone = document.getElementById('top-hover-zone');

// ── State ──────────────────────────────────────────────────
let wordLimit = parseInt(localStorage.getItem(STORAGE_LIMIT), 10) || DEFAULT_LIMIT;
let theme = localStorage.getItem(STORAGE_THEME) || 'light';
let mode = localStorage.getItem(STORAGE_MODE) || 'focus';
let inactivityTimer = null;
let isFading = false;
let menuHideTimer = null;

// ── Menu hover behavior ───────────────────────────────────
function showMenu() {
  clearTimeout(menuHideTimer);
  menuBar.classList.add('visible');
}

function hideMenuDelayed() {
  menuHideTimer = setTimeout(() => {
    menuBar.classList.remove('visible');
  }, 500);
}

function hideMenu() {
  clearTimeout(menuHideTimer);
  menuBar.classList.remove('visible');
}

function keepMenuOpen() {
  clearTimeout(menuHideTimer);
}

topHoverZone.addEventListener('mouseenter', showMenu);
menuBar.addEventListener('mouseenter', keepMenuOpen);
menuBar.addEventListener('mouseleave', hideMenuDelayed);

// ── Theme ──────────────────────────────────────────────────
function applyTheme(t) {
  theme = t;
  document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : '');
  themeBtn.textContent = t === 'dark' ? 'light' : 'dark';
  localStorage.setItem(STORAGE_THEME, t);
}

themeBtn.addEventListener('click', () => {
  applyTheme(theme === 'dark' ? 'light' : 'dark');
});

// ── Mode toggle ────────────────────────────────────────────
function applyMode(m) {
  mode = m;
  const fadeDuration = m === 'hardcore' ? FADE_DURATION_HARDCORE : FADE_DURATION_FOCUS;
  document.documentElement.style.setProperty('--fade-duration', `${fadeDuration}s`);
  modeBtn.textContent = m;
  localStorage.setItem(STORAGE_MODE, m);
}

modeBtn.addEventListener('click', () => {
  applyMode(mode === 'hardcore' ? 'focus' : 'hardcore');
});

// ── Word limit input ─────────────────────────────────────
limitInput.addEventListener('change', () => {
  const val = parseInt(limitInput.value, 10);
  if (!isNaN(val) && val > 0) {
    wordLimit = val;
    localStorage.setItem(STORAGE_LIMIT, wordLimit);
    updateWordCount();
  }
});

limitInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    limitInput.blur();
    editor.focus();
  }
});

// ── Word count ─────────────────────────────────────────────
function countWords(text) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
}

function updateWordCount() {
  const text = editor.innerText || '';
  const words = countWords(text);
  const limitReached = words >= wordLimit;

  wordcountEl.textContent = words.toLocaleString();
  
  if (limitReached) {
    wordcountEl.classList.add('active');
  } else {
    wordcountEl.classList.remove('active');
  }

  // Download button appears only when word count EXCEEDS the limit
  if (words > wordLimit && words > 0) {
    downloadBtn.classList.add('visible');
  } else {
    downloadBtn.classList.remove('visible');
  }
}

// ── Download ───────────────────────────────────────────────
function downloadText() {
  const text = editor.innerText || '';
  if (!text.trim()) return;

  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `writevoid-${date}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

downloadBtn.addEventListener('click', downloadText);

// ── Fade mechanic ──────────────────────────────────────────
function startFadeTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(beginFade, INACTIVITY_MS);
}

function cancelFade() {
  clearTimeout(inactivityTimer);
  if (isFading) {
    isFading = false;
    editor.classList.remove('fading');
    void editor.offsetHeight;
  }
}

function beginFade() {
  const text = editor.innerText || '';
  if (text.trim() === '') return;
  isFading = true;
  editor.classList.add('fading');
}

editor.addEventListener('transitionend', (e) => {
  if (e.propertyName === 'opacity' && isFading) {
    editor.innerHTML = '';
    isFading = false;
    editor.classList.remove('fading');
    updateWordCount();
    editor.focus();
    
    // Move cursor to the start
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(editor, 0);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
});

// ── Input handlers ─────────────────────────────────────────
function scrollToCursor() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = editor.getBoundingClientRect();
    
    // Check if cursor is below the visible area
    if (rect.bottom > editorRect.bottom - 50) {
      range.startContainer.parentElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }
}

function resetActivityTimer() {
  cancelFade();
  startFadeTimer();
  hideMenu();
}

function handleInput() {
  resetActivityTimer();
  updateWordCount();
  scrollToCursor();
}

editor.addEventListener('input', handleInput);
editor.addEventListener('keydown', resetActivityTimer);

// Handle paste to strip formatting
editor.addEventListener('paste', (e) => {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
  handleInput();
});

// ── Init ───────────────────────────────────────────────────
function init() {
  applyTheme(theme);
  applyMode(mode);
  limitInput.value = wordLimit;
  updateWordCount();
  editor.focus();

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
