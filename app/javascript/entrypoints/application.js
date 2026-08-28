import Lenis from 'lenis'

// To see this message, add the following to the `<head>` section in your
// views/layouts/application.html.erb
//
//    <%= vite_client_tag %>
//    <%= vite_javascript_tag 'application' %>
console.log('Vite ⚡️ Rails')

// If using a TypeScript entrypoint file:
//     <%= vite_typescript_tag 'application' %>
//
// If you want to use .jsx or .tsx, add the extension:
//     <%= vite_javascript_tag 'application.jsx' %>

console.log('Visit the guide for more information: ', 'https://vite-ruby.netlify.app/guide/rails')

// Example: Load Rails libraries in Vite.
//
// import * as Turbo from '@hotwired/turbo'
// Turbo.start()
//
// import ActiveStorage from '@rails/activestorage'
// ActiveStorage.start()
//
// // Import all channels.
// const channels = import.meta.globEager('./**/*_channel.js')

// Example: Import a stylesheet in app/frontend/index.css
// import '~/index.css'
//import "../javascript/application"
console.log("mirador", Mirador)

let lenisInstance = null
let lenisRafStarted = false

const rafLenis = (time) => {
  if (lenisInstance) {
    lenisInstance.raf(time)
  }
  window.requestAnimationFrame(rafLenis)
}

const initLenis = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    if (lenisInstance) {
      lenisInstance.destroy()
      lenisInstance = null
    }
    return
  }

  if (!lenisInstance) {
    lenisInstance = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      smoothTouch: false,
      prevent: (node) => {
        if (!(node instanceof Element)) return false

        return Boolean(
          node.closest(
            '#my-mirador, .mirador-viewer, .mirador-window, .mirador-thumbnail-nav-container, [class*="GalleryView"], [class*="ThumbnailNav"], [class*="Thumbnail"], [data-lenis-prevent], .modal, dialog'
          )
        )
      }
    })
  }

  if (!lenisRafStarted) {
    lenisRafStarted = true
    window.requestAnimationFrame(rafLenis)
  }
}

document.addEventListener('DOMContentLoaded', initLenis)
document.addEventListener('turbo:load', initLenis)

let pageViewer = document.getElementById("my-mirador")
if(pageViewer) {
    pageViewer.setAttribute('data-lenis-prevent', 'true')
    let language = document.documentElement.lang || "en";
    const workspaceLabel = language.startsWith('fr') ? 'Espace de travail' : 'Workspace';

    const demoteMiradorMainLandmark = () => {
      const nestedMain = pageViewer.querySelector('main.mirador-viewer');
      if (!nestedMain) return;

      const replacement = document.createElement('div');
      Array.from(nestedMain.attributes).forEach(({ name, value }) => {
        replacement.setAttribute(name, value);
      });

      replacement.removeAttribute('role');
      replacement.setAttribute('role', 'region');
      if (!replacement.hasAttribute('aria-label') && !replacement.hasAttribute('aria-labelledby')) {
        replacement.setAttribute('aria-label', workspaceLabel);
      }

      while (nestedMain.firstChild) {
        replacement.appendChild(nestedMain.firstChild);
      }
      nestedMain.replaceWith(replacement);
    };

    const documentId = pageViewer.getAttribute("data-docid")
    let contentSearch = {}
    //let canvasIndex = 0
    const params = new URLSearchParams(window.location.search)
    //if(params.has("pageNum")) canvasIndex = parseInt(params.get("pageNum")-1)
    if(params.has("q")) contentSearch = {  query: params.get("q") }
    const manifestBase = document.querySelector('meta[name="iiif-manifest-base"]')?.content || "https://www-iiif-pres.canadiana.ca/manifest";
    let normalizedBase = manifestBase.endsWith('/') ? manifestBase : manifestBase + '/';
    let manifest = documentId.replace("https://n2t.net/ark:/", normalizedBase)
    const manifestList = {} 
    manifestList[manifest] = { "provider": "Canadian Research Knowledge Network" }
    console.log("Mirador", Mirador)
    let mconfig = {
        id: "my-mirador",
        manifests: manifestList,
        windows: [
        {
            manifestId: manifest,
            //view: 'single',
            //canvasIndex,
            contentSearch
        }],
        view: "catalogueView",
        selectedTheme: 'light', // light | dark
        language,
        window: {

            imageToolsOpen: false,
    
            //global window defaults
    
            allowClose: false, // Configure if windows can be closed or not
    
            allowFullscreen: true, // Configure to show a "fullscreen" button in the WindowTopBar
    
            allowMaximize: false, // Configure if windows can be maximized or not
    
            allowTopMenuButton: true, // Configure if window view and thumbnail display menu are visible or not
    
            allowWindowSideBar: false, // Configure if side bar menu is visible or not
    
            authNewWindowCenter: "parent", // Configure how to center a new window created by the authentication flow. Options: parent, screen
    
            sideBarPanel: "info", // Configure which sidebar is selected by default. Options: info, attribution, canvas, annotations, search
    
            defaultSidebarPanelHeight: 201, // Configure default sidebar height in pixels
    
            defaultSidebarPanelWidth: 235, // Configure default sidebar width in pixels
    
            defaultView: "single", // Configure which viewing mode (e.g. single, book, gallery) for windows to be opened in
    
            forceDrawAnnotations: true,
    
            hideWindowTitle: true, // Configure if the window title is shown in the window title bar or not
    
            highlightAllAnnotations: false, // Configure whether to display annotations on the canvas by default
    
            showLocalePicker: false, // Configure locale picker for multi-lingual metadata
    
            sideBarOpen:  false, // Configure if the sidebar (and its content panel) is open by default
    
            switchCanvasOnSearch: true, // Configure if Mirador should automatically switch to the canvas of the first search result
    
            panels: {
    
              // Configure which panels are visible in WindowSideBarButtons
    
              info: true,
    
              attribution: false,
    
              canvas: true, // table of contents
    
              annotations: false,
    
              search: false,
    
              layers: false
    
            },
    
            views: [
    
              { key: "single", behaviors: ["individuals"] },
    
              { key: "book", behaviors: ["paged"] },
    
              { key: "scroll", behaviors: ["continuous"] }
    
            ],
    
            elastic: {
    
              height: 400,
    
              width: 480
    
            }
    
          },
          osdConfig: {
            prefixUrl: "/assets/",
            // Default config used for OpenSeadragon
            showNavigationControl: 1,
            /**
             * fullpage_rest.png:1   GET http://localhost:3000/images/fullpage_rest.png 404 (Not Found)
                fullpage_pressed.png:1   GET http://localhost:3000/images/fullpage_pressed.png 404 (Not Found)
                fullpage_grouphover.png:1   GET http://localhost:3000/images/fullpage_grouphover.png 404 (Not Found)
            zoomin
            zoomout
            home
                */
          },
          workspace: {
    
            draggingEnabled: false,
    
            allowNewWindows: true,
    
            isWorkspaceAddVisible: false, // Catalog/Workspace add window feature visible by default
    
            exposeModeOn: false, // unused?
    
            height: 5000, // height of the elastic mode's virtual canvas
    
            showZoomControls: false, // Configure if zoom controls should be displayed by default
    
            type: "mosaic", // Which workspace type to load by default. Other possible values are "elastic". If "mosaic" or "elastic" are not selected no worksapce type will be used.
    
            viewportPosition: {
    
              // center coordinates for the elastic mode workspace
    
              x: 0,
    
              y: 0
    
            },
    
            width: 5000 // width of the elastic mode's virtual canvas
    
          },
    
          workspaceControlPanel: {
    
            enabled: false // Configure if the control panel should be rendered.  Useful if you want to lock the viewer down to only the configured manifests
    
          },
    }
    let miradorViewer = Mirador.viewer(mconfig);
    console.log("miradorViewer", miradorViewer)

    demoteMiradorMainLandmark();
    const miradorLandmarkObserver = new MutationObserver(() => {
      demoteMiradorMainLandmark();
    });
    miradorLandmarkObserver.observe(pageViewer, { childList: true, subtree: true });
    window.addEventListener('beforeunload', () => miradorLandmarkObserver.disconnect(), { once: true });

    miradorViewer.store.subscribe((e) => {
      console.log("m?", e)
    })
}
import "bootstrap-icons/font/bootstrap-icons.css";
import BlacklightRangeLimit from 'blacklight-range-limit';
//Blacklight.onLoad(() => {});
BlacklightRangeLimit.init({ onLoadHandler: Blacklight.onLoad });
console.log("here???")

// Enhance search bars (navbar + home hero) consistently
function enhanceSearchBar(rootSelector) {
  const root = document.querySelector(rootSelector);
  if (!root) return;
  const form = root.querySelector('form.search-query-form');
  const input = root.querySelector('input#q');
  const submit = root.querySelector('#search');
  if (!form || !input || !submit) return;

  const body = document.body;
  const isCatalogPageSearch = root.matches('.navbar-search') && (
    body.classList.contains('blacklight-catalog-show') ||
    body.classList.contains('blacklight-catalog-index')
  );
  const hasCatalogHero = body.classList.contains('blacklight-catalog-index') &&
    !!document.querySelector('.catalog-search-hero');

  if (hasCatalogHero && !root.classList.contains('catalog-search-hero__search')) {
    return;
  }

  if (isCatalogPageSearch && !root.querySelector('.catalog-show-search-heading')) {
    const headingContainer = document.createElement('div');
    headingContainer.className = 'container';

    const heading = document.createElement('h1');
    heading.id = 'catalog-show-search-heading';
    heading.className = 'catalog-show-search-heading';
    heading.textContent = (document.documentElement.lang || 'en').startsWith('fr')
      ? 'Rechercher dans la collection Canadiana'
      : 'Search the Canadiana Collection';

    headingContainer.appendChild(heading);
    root.insertBefore(headingContainer, root.firstChild);
    root.setAttribute('aria-labelledby', heading.id);
    root.removeAttribute('aria-label');
  }

  // Prevent duplicate clear button
  if (submit.previousElementSibling && submit.previousElementSibling.classList?.contains('btn-clear-search')) return;

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn btn-outline-secondary btn-clear-search';
  const lang = document.documentElement.lang || 'en';
  const clearLabel = lang.startsWith('fr') ? 'Effacer la recherche' : 'Clear search';
  const clearText = lang.startsWith('fr') ? 'Effacer' : 'Clear';
  clearBtn.innerHTML = `<i class="bi bi-x-lg" aria-hidden="true"></i><span class="visually-hidden">${clearText}</span>`;
  clearBtn.setAttribute('aria-label', clearLabel);
  clearBtn.hidden = !input.value;

  clearBtn.addEventListener('click', () => {
    input.value = '';
    input.focus();
    clearBtn.hidden = true;
  });

  input.addEventListener('input', () => {
    clearBtn.hidden = input.value.length === 0;
  });

  submit.parentElement.insertBefore(clearBtn, submit);

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    const isTypingInInput = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
    if (!isTypingInInput && (e.key === '/' || (e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)))) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && input.value) {
      input.value = '';
      clearBtn.hidden = true;
      e.stopPropagation();
    }
  });

  // Accessibility hint
  const helpId = `${rootSelector.replace(/[^a-z]/gi,'')}-search-help`;
  let help = document.getElementById(helpId);
  if (!help) {
    help = document.createElement('div');
    help.id = helpId;
    help.className = 'visually-hidden';
    const lng = document.documentElement.lang || 'en';
    help.textContent = lng.startsWith('fr')
      ? 'Utilisez la barre oblique (/) ou Ctrl+K pour activer la recherche. Appuyez sur Échap pour effacer.'
      : 'Use slash (/) or Ctrl+K to focus search. Press Escape to clear.';
    form.appendChild(help);
  }
  input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'), helpId].filter(Boolean).join(' '));
}

function parseTypedPlaceholderPhrases(input) {
  const raw = input?.dataset?.typedPlaceholderPhrases;
  if (!raw) return [];
  return raw.split('|').map((phrase) => phrase.trim()).filter(Boolean);
}

function attachTypedPlaceholder(input) {
  if (!input || input.dataset.typedPlaceholderReady === 'true') return;
  const phrases = parseTypedPlaceholderPhrases(input);
  if (!phrases.length) return;

  input.dataset.typedPlaceholderReady = 'true';
  const defaultPhrase = phrases[0];

  input.addEventListener('focus', () => {
    if (input.value.length === 0) {
      input.setAttribute('placeholder', '');
    }
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    input.setAttribute('placeholder', defaultPhrase);
    input.addEventListener('blur', () => {
      if (input.value.length === 0) {
        input.setAttribute('placeholder', defaultPhrase);
      }
    });
    return;
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let timerId = null;

  const typeSpeed = 85;
  const deleteSpeed = 42;
  const holdDelay = 1250;
  const betweenDelay = 280;
  const idleDelay = 260;

  const step = () => {
    if (!document.body.contains(input)) return;

    if (input === document.activeElement || input.value.length > 0) {
      timerId = window.setTimeout(step, idleDelay);
      return;
    }

    const phrase = phrases[phraseIndex];

    if (!isDeleting) {
      charIndex += 1;
      input.setAttribute('placeholder', phrase.slice(0, charIndex));
      if (charIndex >= phrase.length) {
        isDeleting = true;
        timerId = window.setTimeout(step, holdDelay);
        return;
      }
      timerId = window.setTimeout(step, typeSpeed);
      return;
    }

    charIndex -= 1;
    input.setAttribute('placeholder', phrase.slice(0, charIndex));
    if (charIndex <= 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      timerId = window.setTimeout(step, betweenDelay);
      return;
    }
    timerId = window.setTimeout(step, deleteSpeed);
  };

  timerId = window.setTimeout(step, 450);

  input.addEventListener('blur', () => {
    if (!timerId) timerId = window.setTimeout(step, idleDelay);
  });
}

function initTypedPlaceholders() {
  document.querySelectorAll('input.js-typed-placeholder').forEach((input) => {
    attachTypedPlaceholder(input);
  });
}

function initSearchBarEnhancements() {
  enhanceSearchBar('.navbar-search');
  enhanceSearchBar('.home-search');
}

document.addEventListener('DOMContentLoaded', () => {
  initSearchBarEnhancements();
  initTypedPlaceholders();
});
document.addEventListener('turbo:load', () => {
  initSearchBarEnhancements();
  initTypedPlaceholders();
});

// Page search: fetch IIIF search + manifest on the client so the Rails render doesn't block
function getMetaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim();
}

function trimTrailingSlash(str = '') {
  if (!str) return '';
  return str.endsWith('/') ? str.slice(0, -1) : str;
}

function arrayWrap(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function firstString(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const str = firstString(item);
      if (str) return str;
    }
  }
  return '';
}

function serviceMarkerText(service) {
  return [
    service?.type,
    service?.['@type'],
    service?.profile,
    service?.id,
    service?.['@id'],
  ]
    .flatMap((value) => arrayWrap(value))
    .map((value) => String(value || '').toLowerCase())
    .join(' ');
}

function extractManifestSearchServiceUrl(manifestJson) {
  const services = [
    ...arrayWrap(manifestJson?.service),
    ...arrayWrap(manifestJson?.services),
  ];

  const searchService = services.find((service) => {
    const marker = serviceMarkerText(service);
    return marker.includes('search') || marker.includes('contentsearchservice');
  });

  if (!searchService) return '';
  return firstString(searchService.id) || firstString(searchService['@id']);
}

function encodeArkPathForUrl(arkPath) {
  return String(arkPath || '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function addQueryParam(url, key, value) {
  try {
    const parsed = new URL(url, window.location.href);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  } catch (_) {
    const separator = String(url).includes('?') ? '&' : '?';
    return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fetchJsonWithTimeout(url, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal })
    .finally(() => clearTimeout(timer))
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
}

function parseSearchItems(json) {
  if (Array.isArray(json?.items) && json.items.length) return json.items;
  if (Array.isArray(json?.resources) && json.resources.length) return json.resources;
  return [];
}

function buildCanvasIndexMap(manifestJson) {
  const canvases = Array.isArray(manifestJson?.items)
    ? manifestJson.items
    : manifestJson?.sequences?.[0]?.canvases || [];
  const map = {};
  canvases.forEach((canvas, idx) => {
    const id = canvas.id || canvas['@id'];
    if (id) map[id] = idx + 1;
  });
  return map;
}

function collectPageNumbers(items, canvasMap) {
  const pages = [];
  items.forEach((item) => {
    const target = item.target || item.on;
    if (!target) return;
    const canvasUrl = String(target).split('#')[0];
    let index = canvasMap[canvasUrl];
    if (index == null) {
      const trailing = canvasUrl.split('/').pop();
      const match = Object.keys(canvasMap).find((key) => key.endsWith(`/${trailing}`));
      if (match) index = canvasMap[match];
    }
    if (index) pages.push(index);
  });
  return Array.from(new Set(pages)).sort((a, b) => a - b);
}

function renderPageSearchEmpty(container) {
  const body = container.querySelector('[data-page-search-body]');
  const badge = container.querySelector('.page-search-count');
  const status = container.querySelector('.page-search-status');
  if (badge) badge.textContent = '0';
  if (status) status.textContent = '';
  const emptyMsg = container.dataset.noResultsHtml || 'No page matches found.';
  if (body) body.innerHTML = `<div class="page-search-header"><span>${emptyMsg}</span></div>`;
}

function renderPageSearchResults(container, pages, term, docId) {
  const body = container.querySelector('[data-page-search-body]');
  const badge = container.querySelector('.page-search-count');
  const status = container.querySelector('.page-search-status');
  if (badge) badge.textContent = pages.length;
  if (status) status.textContent = '';
  const params = new URLSearchParams(window.location.search);
  const currentPage = parseInt(params.get('pageNum'), 10) || 0;
  const ariaTemplate = container.dataset.goToPageAriaTemplate || 'Go to page __PAGE__';
  const showMoreLabel = container.dataset.showMoreLabel || 'Show more';
  const lang = document.documentElement.lang || 'en';
  const showLessLabel =
    container.dataset.showLessLabel ||
    (lang.startsWith('fr') ? 'Afficher moins' : 'Show less');
  const prevHitLabel = escapeHtml(container.dataset.prevHitLabel || '');
  const prevHitAria = escapeHtml(container.dataset.prevHitAria || '');
  const nextHitLabel = escapeHtml(container.dataset.nextHitLabel || '');
  const nextHitAria = escapeHtml(container.dataset.nextHitAria || '');

  const hrefFor = (pageNum) =>
    `/catalogue/${encodeURIComponent(docId)}?pageNum=${pageNum}&q=${encodeURIComponent(term)}`;

  const chips = pages.map((page) => {
    const isCurrent = currentPage === page;
    const aria = escapeHtml(ariaTemplate.replace('__PAGE__', page));
    return `<a role="listitem"
               class="chip page-chip ${isCurrent ? 'is-current' : ''}"
               ${isCurrent ? 'aria-current="page"' : ''}
               aria-label="${aria}"
               href="${hrefFor(page)}">
              ${page}
            </a>`;
  });

  const visibleChips = chips.slice(0, 24).join('');
  const restChips = chips.slice(24).join('');
  const moreWrapper = restChips ? `<span class="page-search-more" hidden>${restChips}</span>` : '';

  const prevHit = currentPage > 0 ? pages.filter((p) => p < currentPage).pop() : null;
  const nextHit = currentPage > 0 ? pages.find((p) => p > currentPage) : null;

  const prevBtn = prevHit
    ? `<a class="btn btn-outline-secondary btn-sm chip-nav"
           href="${hrefFor(prevHit)}"
           aria-label="${prevHitAria}">
        <i class="bi bi-arrow-left" aria-hidden="true"></i>
        <span class="d-none d-sm-inline">${prevHitLabel}</span>
      </a>`
    : '';

  const nextBtn = nextHit
    ? `<a class="btn btn-outline-secondary btn-sm chip-nav"
           href="${hrefFor(nextHit)}"
           aria-label="${nextHitAria}">
        <span class="d-none d-sm-inline">${nextHitLabel}</span>
        <i class="bi bi-arrow-right ms-sm-1" aria-hidden="true"></i>
      </a>`
    : '';

  const toolbar = prevBtn || nextBtn
    ? `<div class="page-search-toolbar d-flex align-items-center gap-2 mb-2">${prevBtn}${nextBtn}</div>`
    : '';

  const toggle = restChips
    ? `<div class="page-search-togglebar mt-2">
         <button type="button"
                 class="btn btn-link btn-sm page-search-toggle p-0"
                 data-label-more="${escapeHtml(showMoreLabel)}"
                 data-label-less="${escapeHtml(showLessLabel)}">
           <i class="bi bi-chevron-down" aria-hidden="true"></i>
           <span>${escapeHtml(showMoreLabel)}</span>
         </button>
       </div>`
    : '';

  if (body) {
    body.innerHTML = `${toolbar}
      <div class="page-chip-list" role="list">
        ${visibleChips}
        ${moreWrapper}
      </div>
      ${toggle}`;
  }
}

async function hydratePageSearch(container) {
  const term = (container.dataset.term || '').trim();
  const arkUrl = container.dataset.arkUrl || '';
  const arkPath = container.dataset.arkPath || arkUrl.replace(/^https?:\/\/n2t.net\/ark:\//i, '');
  if (/^69429\/s/i.test(arkPath)) {
    renderPageSearchEmpty(container);
    return;
  }
  if (!term || term === '*:*' || !arkUrl) {
    renderPageSearchEmpty(container);
    return;
  }

  const contentBase =
    trimTrailingSlash(getMetaContent('iiif-content-search-base')) ||
    'https://www-iiif-search.canadiana.ca/search';
  const manifestBase =
    trimTrailingSlash(getMetaContent('iiif-manifest-base')) ||
    'https://www-iiif-pres.canadiana.ca/manifest';

  const manifestUrl = `${manifestBase}/${arkPath}`;
  let searchUrl = '';

  try {
    const manifestJson = await fetchJsonWithTimeout(manifestUrl, 6000);
    const searchServiceUrl =
      extractManifestSearchServiceUrl(manifestJson) ||
      `${contentBase}/${encodeArkPathForUrl(arkPath)}`;
    searchUrl = addQueryParam(searchServiceUrl, 'q', term);
    const searchJson = await fetchJsonWithTimeout(searchUrl, 6000);
    const items = parseSearchItems(searchJson);
    const canvasMap = buildCanvasIndexMap(manifestJson);
    const pages = collectPageNumbers(items, canvasMap);
    if (!pages.length) {
      renderPageSearchEmpty(container);
      return;
    }
    renderPageSearchResults(container, pages, term, container.dataset.docId);
  } catch (err) {
    console.warn('Page search fetch failed', err, searchUrl, manifestUrl);
    const status = container.querySelector('.page-search-status');
    if (status) status.textContent = '';
    const body = container.querySelector('[data-page-search-body]');
    if (body) {
      body.innerHTML = '<div class="text-muted small">Unable to load page matches right now.</div>';
    }
  }
}

function initPageSearch() {
  const containers = document.querySelectorAll('[data-page-search="true"]');
  containers.forEach((container) => {
    if (container.dataset.pageSearchHydrated === '1') return;
    container.dataset.pageSearchHydrated = '1';
    hydratePageSearch(container);
  });
}

document.addEventListener('DOMContentLoaded', initPageSearch);

async function hydrateDownloadChip(container) {
  const docid = container.dataset.docid;
  const arkpath = container.dataset.arkpath;
  const chip = container.querySelector('[data-full-text-chip]');
  if (!docid || !arkpath || !chip) return;

  const encodedArkPath = arkpath.split('/').map(encodeURIComponent).join('/');
  const url = `/dl/${encodeURIComponent(docid)}/${encodedArkPath}?pageNum=1`;

  try {
    const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    if (data?.docPdfUri) chip.hidden = false;
  } catch (_error) {}
}

function initDownloadChips() {
  document.querySelectorAll('[data-download-chip]').forEach((container) => {
    if (container.dataset.downloadChipHydrated === '1') return;
    container.dataset.downloadChipHydrated = '1';
    hydrateDownloadChip(container);
  });
}

document.addEventListener('DOMContentLoaded', initDownloadChips);
document.addEventListener('turbo:load', initDownloadChips);

// Page search chips: toggle show more/less
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.page-search-toggle');
  if (!btn) return;
  const container = btn.closest('.page-search-res-wrap');
  if (!container) return;
  const more = container.querySelector('.page-search-more');
  if (!more) return;
  const span = btn.querySelector('span');
  const icon = btn.querySelector('i');
  const lang = document.documentElement.lang || 'en';
  const labelMore = btn.dataset.labelMore || (lang.startsWith('fr') ? 'Afficher plus' : 'Show more');
  const labelLess = btn.dataset.labelLess || (lang.startsWith('fr') ? 'Afficher moins' : 'Show less');

  const hidden = more.hasAttribute('hidden');
  if (hidden) {
    more.removeAttribute('hidden');
    if (span) span.textContent = labelLess;
    if (icon) icon.classList.remove('bi-chevron-down'), icon.classList.add('bi-chevron-up');
  } else {
    more.setAttribute('hidden', '');
    if (span) span.textContent = labelMore;
    if (icon) icon.classList.remove('bi-chevron-up'), icon.classList.add('bi-chevron-down');
  }
});

// Members section interactions: tabs, province chips, name filter
function normalizeMemberFilterValue(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function initMembersSection() {
  const sections = document.querySelectorAll('.members-section');
  sections.forEach((section) => {
    if (section.dataset.membersInit === '1') return;
    section.dataset.membersInit = '1';

    const tabs = section.querySelectorAll('[data-members-tab]');
    const groups = section.querySelectorAll('[data-members-group]');
    const filterChips = section.querySelectorAll('.chip-filter');
    const input = section.querySelector('#members-filter-input');
    const clearBtn = section.querySelector('.btn-clear-members');
    const emptyState = section.querySelector('[data-members-empty]');

    let activeGroup = section.querySelector('[data-members-tab].active')?.dataset.membersTab || 'institutional';
    let activeProvince = section.querySelector('.chip-filter.active')?.dataset.province || 'all';
    let text = '';

    const applyFilters = () => {
      let hasVisibleItems = false;
      const activeChip = section.querySelector('.chip-filter.active');
      activeProvince = activeChip?.dataset?.province || activeProvince || 'all';
      const hasActiveFilter = activeProvince !== 'all' || text !== '';

      groups.forEach((group) => {
        const isActiveGroup = group.dataset.membersGroup === activeGroup;
        group.classList.toggle('d-none', !isActiveGroup);
        group.setAttribute('aria-hidden', isActiveGroup ? 'false' : 'true');
        group.classList.toggle('is-filtered-view', isActiveGroup && hasActiveFilter);
        if (!isActiveGroup) return;

        const seenMemberNames = new Set();

        group.querySelectorAll('.members-marquee-row').forEach((row) => {
          let rowHasVisibleItem = false;

          row.querySelectorAll('.member-logo').forEach((logo) => {
            const prov = logo.dataset.province || '';
            const name = logo.dataset.memberName || '';
            const isClone = logo.dataset.memberClone === 'true' || logo.getAttribute('tabindex') === '-1';
            const provinceMatch = activeProvince === 'all' || prov === activeProvince;
            const textMatch = text === '' || name.includes(text);
            const isVisible = provinceMatch && textMatch;
            const isDuplicateName = hasActiveFilter && seenMemberNames.has(name);
            const shouldShowLogo = isVisible && (!hasActiveFilter || (!isClone && !isDuplicateName));

            logo.classList.toggle('is-filtered-out', !shouldShowLogo);
            if (shouldShowLogo && !isClone) {
              seenMemberNames.add(name);
              rowHasVisibleItem = true;
            }
          });

          row.classList.toggle('d-none', !rowHasVisibleItem);
          if (rowHasVisibleItem) hasVisibleItems = true;
        });
      });

      if (emptyState) emptyState.classList.toggle('d-none', hasVisibleItems);
    };

    const activateTab = (btn) => {
      tabs.forEach((item) => {
        const selected = item === btn;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-selected', selected ? 'true' : 'false');
        item.setAttribute('tabindex', selected ? '0' : '-1');
      });
      activeGroup = btn.dataset.membersTab || 'institutional';
      applyFilters();
    };

    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        activateTab(btn);
      });
      btn.addEventListener('keydown', (event) => {
        const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        const tabArray = Array.from(tabs);
        const currentIndex = tabArray.indexOf(btn);
        let nextIndex = currentIndex;
        if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabArray.length;
        if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabArray.length) % tabArray.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabArray.length - 1;
        const nextTab = tabArray[nextIndex];
        if (!nextTab) return;
        activateTab(nextTab);
        nextTab.focus();
      });
    });

    const activateProvince = (chip) => {
      filterChips.forEach((item) => {
        const selected = item === chip;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      activeProvince = chip.dataset.province || 'all';
      applyFilters();
    };

    filterChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        activateProvince(chip);
      });
    });

    if (input) {
      if (clearBtn) clearBtn.hidden = input.value.length === 0;
      input.addEventListener('input', () => {
        text = normalizeMemberFilterValue(input.value);
        if (clearBtn) clearBtn.hidden = input.value.length === 0;
        applyFilters();
      });
    }

    if (clearBtn && input) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        text = '';
        clearBtn.hidden = true;
        input.focus();
        applyFilters();
      });
    }

    const selectedTab = section.querySelector('[data-members-tab].active') || tabs[0];
    if (selectedTab) activateTab(selectedTab);
    const selectedProvince = section.querySelector('.chip-filter.active') || filterChips[0];
    if (selectedProvince) activateProvince(selectedProvince);
    else applyFilters();
  });
}

document.addEventListener('DOMContentLoaded', initMembersSection);

// Home explore sliders: horizontal scroll with prev/next controls
function initExploreSliders() {
  const sliders = document.querySelectorAll('[data-slider="explore"]');
  sliders.forEach((slider) => {
    if (slider.dataset.sliderInit === '1') return;

    const viewport = slider.querySelector('[data-slider-viewport]');
    const track = slider.querySelector('[data-slider-track]');
    const prev = slider.querySelector('[data-slider-prev]');
    const next = slider.querySelector('[data-slider-next]');
    if (!viewport || !track || !prev || !next) return;

    slider.dataset.sliderInit = '1';

    const maxScroll = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const snapPoints = () => {
      const cards = Array.from(track.querySelectorAll('.home-split-card'));
      const max = maxScroll();
      if (!cards.length) return [0, max];

      const viewportRect = viewport.getBoundingClientRect();
      const points = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        const left = rect.left - viewportRect.left + viewport.scrollLeft;
        return Math.max(0, Math.min(max, left));
      });

      points.push(0, max);

      return Array.from(new Set(points.map((point) => Math.round(point))))
        .sort((a, b) => a - b);
    };

    const updateControls = () => {
      const max = maxScroll();
      const left = viewport.scrollLeft;
      const canScroll = max > 4;
      slider.classList.toggle('is-static', !canScroll);
      prev.disabled = !canScroll || left <= 4;
      next.disabled = !canScroll || left >= (max - 4);
    };

    const scrollByStep = (dir) => {
      const points = snapPoints();
      const left = viewport.scrollLeft;
      const epsilon = 6;
      let target = left;

      if (dir > 0) {
        target = points.find((point) => point > left + epsilon);
        if (target === undefined) target = maxScroll();
      } else {
        const previousPoints = points.filter((point) => point < left - epsilon);
        target = previousPoints.length ? previousPoints[previousPoints.length - 1] : 0;
      }

      viewport.scrollTo({ left: target, behavior: 'smooth' });
      window.setTimeout(updateControls, 320);
    };

    prev.addEventListener('click', () => scrollByStep(-1));
    next.addEventListener('click', () => scrollByStep(1));
    viewport.addEventListener('scroll', updateControls, { passive: true });
    window.addEventListener('resize', updateControls);

    updateControls();
  });
}

document.addEventListener('DOMContentLoaded', initExploreSliders);

let scrollRevealObserver = null;

function shouldInitScrollRevealText() {
  const body = document.body;
  if (!body) return false;
  return (
    body.classList.contains('blacklight-pages-home') ||
    body.classList.contains('blacklight-pages-about_canadiana') ||
    body.classList.contains('blacklight-pages-about_heritage')
  );
}

function collectScrollRevealTargets(root) {
  const selector = [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'li',
    'summary',
    'blockquote',
    'figcaption',
    'a.home-inline-link',
    'a.home-hero__cta',
    'a.about-modern-cta',
    'a.home-statement-cta'
  ].join(', ');

  return Array.from(root.querySelectorAll(selector)).filter((element) => {
    if (element.dataset.scrollRevealBound === '1') return false;
    if (element.classList.contains('visually-hidden') || element.closest('.visually-hidden')) return false;
    return (element.textContent || '').trim().length > 0;
  });
}

function initScrollRevealText() {
  if (!shouldInitScrollRevealText()) return;

  const body = document.body;
  const isHome = body.classList.contains('blacklight-pages-home');
  const isAbout =
    body.classList.contains('blacklight-pages-about_canadiana') ||
    body.classList.contains('blacklight-pages-about_heritage');

  let roots = [];
  if (isHome) {
    roots = Array.from(document.querySelectorAll('.home-page'));
  } else if (isAbout) {
    roots = Array.from(document.querySelectorAll('#main-container'));
  }

  if (!roots.length) return;

  const targets = [];
  roots.forEach((root) => {
    targets.push(...collectScrollRevealTargets(root));
  });
  if (!targets.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach((element) => {
      element.dataset.scrollRevealBound = '1';
      element.classList.add('scroll-reveal-text', 'is-visible');
    });
    return;
  }

  if (!scrollRevealObserver) {
    scrollRevealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    );
  }

  targets.forEach((element, index) => {
    element.dataset.scrollRevealBound = '1';
    element.classList.add('scroll-reveal-text');
    element.style.setProperty('--scroll-reveal-delay', `${(index % 8) * 30}ms`);
    scrollRevealObserver.observe(element);
  });
}

document.addEventListener('DOMContentLoaded', initScrollRevealText);
document.addEventListener('turbo:load', initScrollRevealText);

let aboutFeaturePanTargets = [];
let aboutFeaturePanRafId = null;
let aboutFeaturePanListenersBound = false;

function getAboutFeaturePanContainer(img) {
  return img.closest(
    '.about-modern-card--media, .canadiana-story-mosaic__card--image'
  );
}

function shouldInitAboutFeaturePan() {
  const body = document.body;
  if (!body) return false;
  return (
    body.classList.contains('blacklight-pages-about_canadiana') ||
    body.classList.contains('blacklight-pages-about_heritage')
  );
}

function queueAboutFeaturePanUpdate() {
  if (aboutFeaturePanRafId !== null) return;
  aboutFeaturePanRafId = window.requestAnimationFrame(() => {
    aboutFeaturePanRafId = null;
    if (!aboutFeaturePanTargets.length) return;

    const viewportHeight = Math.max(window.innerHeight || 0, 1);
    aboutFeaturePanTargets.forEach((img) => {
      const mediaCard = getAboutFeaturePanContainer(img);
      if (!mediaCard) return;

      const rect = mediaCard.getBoundingClientRect();
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));
      img.style.setProperty('--about-scroll-pan-y', `${(clamped * 100).toFixed(2)}%`);
    });
  });
}

function initAboutFeaturePan() {
  if (!shouldInitAboutFeaturePan()) {
    aboutFeaturePanTargets = [];
    return;
  }

  aboutFeaturePanTargets = Array.from(
    document.querySelectorAll(
      '.about-modern-feature-grid .about-modern-card--media img, .about-modern-work-grid .about-modern-card--media img, .canadiana-story-mosaic__card--image img'
    )
  );
  if (!aboutFeaturePanTargets.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  aboutFeaturePanTargets.forEach((img) => {
    img.dataset.scrollPan = '1';
    img.style.setProperty('--about-scroll-pan-y', prefersReducedMotion ? '50%' : '0%');
  });

  if (prefersReducedMotion) return;

  queueAboutFeaturePanUpdate();

  if (aboutFeaturePanListenersBound) return;

  window.addEventListener('scroll', queueAboutFeaturePanUpdate, { passive: true });
  window.addEventListener('resize', queueAboutFeaturePanUpdate);
  aboutFeaturePanListenersBound = true;
}

document.addEventListener('DOMContentLoaded', initAboutFeaturePan);
document.addEventListener('turbo:load', initAboutFeaturePan);

function syncCanadianaWorkGridHeights() {
  const body = document.body;
  if (!body || !body.classList.contains('blacklight-pages-about_canadiana')) return;

  const workGrid = document.querySelector('.about-modern-work-grid');
  if (!workGrid) return;

  const mediaCard = workGrid.querySelector('.about-modern-card--media');
  const stepsCard = workGrid.querySelector('.about-modern-card--steps');
  if (!mediaCard || !stepsCard) return;

  mediaCard.style.removeProperty('--canadiana-work-card-height');

  if (window.innerWidth < 993) return;

  const stepsHeight = stepsCard.getBoundingClientRect().height;
  if (stepsHeight > 0) {
    mediaCard.style.setProperty('--canadiana-work-card-height', `${stepsHeight}px`);
  }
}

document.addEventListener('DOMContentLoaded', syncCanadianaWorkGridHeights);
document.addEventListener('turbo:load', syncCanadianaWorkGridHeights);
window.addEventListener('resize', syncCanadianaWorkGridHeights);

function moveCatalogAppliedParams() {
  const target = document.querySelector('[data-catalog-applied-params-target]');
  const appliedParams = document.querySelector('.blacklight-catalog-index #appliedParams');

  if (!target || !appliedParams) return;
  if (target.contains(appliedParams)) return;

  target.appendChild(appliedParams);
}

function adjustCatalogShowBreadcrumbActions() {
  if (!document.body.classList.contains('blacklight-catalog-show')) return;

  const breadcrumb = document.querySelector('.blacklight-catalog-show .collection-breadcrumbs');
  const appliedParams = document.querySelector('.blacklight-catalog-show #appliedParams');
  const paginationWidgets = document.querySelector('.blacklight-catalog-show .pagination-search-widgets');
  const documentElement = document.querySelector('.blacklight-catalog-show #document');

  if (!breadcrumb) return;

  const isIssue = documentElement?.dataset.isIssue === 'true';
  const parentSerialId = documentElement?.dataset.parentSerialId;
  const serialTitle = documentElement?.dataset.serialTitle?.replace(/\s*\/\s*$/, '').trim();

  let actionRow = document.querySelector('.blacklight-catalog-show .catalog-show-breadcrumb-row');
  if (!actionRow) {
    actionRow = document.createElement('div');
    actionRow.className = 'catalog-show-breadcrumb-row';
    breadcrumb.insertAdjacentElement('afterend', actionRow);
  }

  if (appliedParams && appliedParams.parentElement !== actionRow) {
    actionRow.appendChild(appliedParams);
  }

  if (paginationWidgets) {
    paginationWidgets.remove();
  }

  if (appliedParams) appliedParams.classList.add('catalog-show-breadcrumb-actions');

  const lang = document.documentElement.lang || 'en';
  const isFr = lang.startsWith('fr');
  const startOverText = isFr ? 'Recommencer' : 'Start Over';
  const backToSearchText = isFr ? 'Retour à la recherche' : 'Back to Search';
  const backToResultsText = isFr ? 'Retour aux résultats de recherche' : 'Back to Search Results';

  appliedParams?.querySelectorAll('a, button, .btn').forEach((control) => {
    const label = control.textContent.replace(/\s+/g, ' ').trim();
    const isBackToResultsControl = label === backToSearchText ||
      label === backToResultsText ||
      label.startsWith(isFr ? 'Retour aux résultats' : 'Back to Search');

    if (label === startOverText || (isFr && label === 'Accueil')) {
      control.remove();
      return;
    }

    if (isBackToResultsControl) {
      control.remove();
    }
  });

  if (isIssue && parentSerialId && !actionRow.querySelector('.view-all-issues-link')) {
    const viewAllIssues = document.createElement('a');
    viewAllIssues.className = 'btn btn-outline-secondary btn-sm view-all-issues-link';
    viewAllIssues.href = `/catalogue/${encodeURIComponent(parentSerialId)}?lang=${encodeURIComponent(lang)}`;
    const viewAllIssuesIcon = document.createElement('i');
    viewAllIssuesIcon.className = 'bi bi-arrow-90deg-up me-1';
    viewAllIssuesIcon.setAttribute('aria-hidden', 'true');
    const viewAllIssuesLabel = document.createElement('span');
    viewAllIssuesLabel.textContent = isFr
      ? `Voir le catalogue complet de "${serialTitle || 'ce titre de périodique'}"`
      : `View full catalogue of "${serialTitle || 'this serial title'}"`;
    viewAllIssues.append(viewAllIssuesIcon, viewAllIssuesLabel);
    actionRow.insertBefore(viewAllIssues, actionRow.firstChild);
  }

  if (appliedParams && !appliedParams.children.length) {
    appliedParams.remove();
  }
}

function syncCheckboxFacetMoreLink(link) {
  const form = link.closest('form.checkbox-facet-form');
  if (!form) return;

  const url = new URL(link.getAttribute('href'), window.location.href);
  const checkboxes = Array.from(form.querySelectorAll('input[type="checkbox"][name^="f_inclusive["]'));
  const facetKeys = Array.from(new Set(checkboxes.map((checkbox) => {
    const match = checkbox.name.match(/^f_inclusive\[([^\]]+)\]\[\]$/);
    return match && match[1];
  }).filter(Boolean)));

  facetKeys.forEach((facetKey) => {
    url.searchParams.delete(`f[${facetKey}][]`);
    url.searchParams.delete(`f_inclusive[${facetKey}][]`);
    url.searchParams.delete(`checkbox_facet_selections[${facetKey}][]`);
  });

  checkboxes.forEach((checkbox) => {
    if (checkbox.checked && !checkbox.disabled) {
      const match = checkbox.name.match(/^f_inclusive\[([^\]]+)\]\[\]$/);
      const facetKey = match && match[1];
      if (facetKey) {
        url.searchParams.append(`checkbox_facet_selections[${facetKey}][]`, checkbox.value);
      }
    }
  });

  link.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
}

function syncSingleCheckboxToSidebar(modalCheckbox) {
  if (!modalCheckbox || !modalCheckbox.name) return;

  const sidebarForms = Array.from(document.querySelectorAll('form.checkbox-facet-form')).filter((f) => !f.closest('.modal'));
  const sidebarForm = sidebarForms.find((f) => f.querySelector(`input[name="${CSS.escape(modalCheckbox.name)}"]`) ||
    f.querySelector(`input[name^="f_inclusive["]`)?.name === modalCheckbox.name);

  if (!sidebarForm) return;

  const sidebarCheckbox = Array.from(sidebarForm.querySelectorAll(`input[name="${CSS.escape(modalCheckbox.name)}"]`))
    .find((cb) => cb.value === modalCheckbox.value);

  if (sidebarCheckbox) {
    sidebarCheckbox.checked = modalCheckbox.checked;
  } else if (modalCheckbox.checked) {
    const ul = sidebarForm.querySelector('ul.checkbox-facet-values');
    if (ul && !ul.querySelector(`input[name="${CSS.escape(modalCheckbox.name)}"][value="${CSS.escape(modalCheckbox.value)}"]`)) {
      const li = document.createElement('li');
      li.className = 'dynamically-synced-facet-option';
      li.dataset.syncedValue = modalCheckbox.value;

      const label = document.createElement('label');
      label.className = 'checkbox-facet-option';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = modalCheckbox.name;
      input.value = modalCheckbox.value;
      input.checked = true;
      input.className = 'form-check-input checkbox-facet-input';

      const labelSpan = document.createElement('span');
      labelSpan.className = 'checkbox-facet-label';
      const modalLabel = modalCheckbox.closest('label')?.querySelector('.checkbox-facet-label');
      labelSpan.textContent = modalLabel ? modalLabel.textContent.trim() : modalCheckbox.value;

      label.appendChild(input);
      label.appendChild(labelSpan);

      const modalCount = modalCheckbox.closest('label')?.querySelector('.facet-count');
      if (modalCount) {
        const countSpan = document.createElement('span');
        countSpan.className = 'facet-count';
        countSpan.textContent = modalCount.textContent.trim();
        label.appendChild(countSpan);
      }

      li.appendChild(label);
      ul.insertBefore(li, ul.firstChild);
    }
  } else if (!modalCheckbox.checked) {
    const dynamicLi = sidebarForm.querySelector(`li.dynamically-synced-facet-option[data-synced-value="${CSS.escape(modalCheckbox.value)}"]`);
    if (dynamicLi) {
      dynamicLi.remove();
    }
  }
}

function syncSingleCheckboxToModal(sidebarCheckbox) {
  if (!sidebarCheckbox || !sidebarCheckbox.name) return;

  const modalCheckboxes = Array.from(document.querySelectorAll('.modal form.checkbox-facet-form input[type="checkbox"][name^="f_inclusive["]'));
  const modalCheckbox = modalCheckboxes.find((cb) => cb.name === sidebarCheckbox.name && cb.value === sidebarCheckbox.value);
  if (modalCheckbox) {
    modalCheckbox.checked = sidebarCheckbox.checked;
  }
}

function handleCheckboxFacetChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox' || !target.name.startsWith('f_inclusive[')) {
    return;
  }

  if (target.closest('.modal')) {
    syncSingleCheckboxToSidebar(target);
  } else {
    syncSingleCheckboxToModal(target);
  }
}

function syncAllSidebarToCheckboxesInModal(modalContainer) {
  const container = modalContainer || document.querySelector('.modal');
  if (!container) return;

  const sidebarCheckboxes = Array.from(document.querySelectorAll('form.checkbox-facet-form:not(.modal form) input[type="checkbox"][name^="f_inclusive["]'));
  const modalCheckboxes = Array.from(container.querySelectorAll('form.checkbox-facet-form input[type="checkbox"][name^="f_inclusive["]'));

  sidebarCheckboxes.forEach((sidebarCb) => {
    const matchingModalCb = modalCheckboxes.find((mCb) => mCb.name === sidebarCb.name && mCb.value === sidebarCb.value);
    if (matchingModalCb) {
      matchingModalCb.checked = sidebarCb.checked;
    }
  });
}

function syncAllModalToCheckboxesInSidebar(modalContainer) {
  const container = modalContainer || document.querySelector('.modal');
  if (!container) return;

  const modalCheckboxes = Array.from(container.querySelectorAll('form.checkbox-facet-form input[type="checkbox"][name^="f_inclusive["]'));
  modalCheckboxes.forEach((modalCb) => {
    syncSingleCheckboxToSidebar(modalCb);
  });
}

function handleCheckboxFacetMoreActivation(event) {
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest('a[data-checkbox-facet-more]');
  if (!link) return;

  if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;

  syncCheckboxFacetMoreLink(link);
}

function observeModalDomChanges() {
  const modal = document.querySelector('#blacklight-modal, .modal');
  if (!modal) return;

  const observer = new MutationObserver((mutations) => {
    let hasAddedNodes = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        hasAddedNodes = true;
        break;
      }
    }
    if (hasAddedNodes) {
      syncAllSidebarToCheckboxesInModal(modal);
    }
  });

  observer.observe(modal, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', moveCatalogAppliedParams);
document.addEventListener('turbo:load', moveCatalogAppliedParams);
document.addEventListener('DOMContentLoaded', adjustCatalogShowBreadcrumbActions);
document.addEventListener('turbo:load', adjustCatalogShowBreadcrumbActions);
document.addEventListener('DOMContentLoaded', observeModalDomChanges);
document.addEventListener('turbo:load', observeModalDomChanges);
document.addEventListener('pointerdown', handleCheckboxFacetMoreActivation, true);
document.addEventListener('mousedown', handleCheckboxFacetMoreActivation, true);
document.addEventListener('click', handleCheckboxFacetMoreActivation, true);
document.addEventListener('keydown', handleCheckboxFacetMoreActivation, true);
document.addEventListener('change', handleCheckboxFacetChange, true);
document.addEventListener('shown.bs.modal', (e) => syncAllSidebarToCheckboxesInModal(e.target));
document.addEventListener('loaded.blacklight.blacklight-modal', (e) => syncAllSidebarToCheckboxesInModal(e.target));
document.addEventListener('hidden.bs.modal', (e) => syncAllModalToCheckboxesInSidebar(e.target));
document.addEventListener('hide.bs.modal', (e) => syncAllModalToCheckboxesInSidebar(e.target));
