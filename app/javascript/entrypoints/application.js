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

let pageViewer = document.getElementById("my-mirador")
if(pageViewer) {
    let language = document.documentElement.lang || "en";
    const documentId = pageViewer.getAttribute("data-docid")
    let contentSearch = {}
    //let canvasIndex = 0
    const params = new URLSearchParams(window.location.search)
    //if(params.has("pageNum")) canvasIndex = parseInt(params.get("pageNum")-1)
    if(params.has("q")) contentSearch = {  query: params.get("q") }
    const manifestBase = document.querySelector('meta[name="iiif-manifest-base"]')?.content || "https://crkn-iiif-api.azurewebsites.net/manifest";
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

document.addEventListener('DOMContentLoaded', () => {
  enhanceSearchBar('.navbar-search');
  enhanceSearchBar('.home-search');
});

// Page search: fetch IIIF search + manifest on the client so the Rails render doesn't block
function getMetaContent(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim();
}

function trimTrailingSlash(str = '') {
  if (!str) return '';
  return str.endsWith('/') ? str.slice(0, -1) : str;
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
    `/catalog/${encodeURIComponent(docId)}?pageNum=${pageNum}&q=${encodeURIComponent(term)}`;

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
    'https://crkn-iiif-content-search.azurewebsites.net/search';
  const manifestBase =
    trimTrailingSlash(getMetaContent('iiif-manifest-base')) ||
    'https://crkn-iiif-api.azurewebsites.net/manifest';

  const searchUrl = `${contentBase}/${encodeURIComponent(arkPath)}?q=${encodeURIComponent(term)}`;
  const manifestUrl = `${manifestBase}/${arkPath}`;

  try {
    const [searchJson, manifestJson] = await Promise.all([
      fetchJsonWithTimeout(searchUrl, 6000),
      fetchJsonWithTimeout(manifestUrl, 6000),
    ]);
    const items = parseSearchItems(searchJson);
    const canvasMap = buildCanvasIndexMap(manifestJson);
    const pages = collectPageNumbers(items, canvasMap);
    if (!pages.length) {
      renderPageSearchEmpty(container);
      return;
    }
    renderPageSearchResults(container, pages, term, container.dataset.docId);
  } catch (err) {
    console.warn('Page search fetch failed', err);
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
document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.members-section');
  if (!section) return;

  const tabs = section.querySelectorAll('[data-members-tab]');
  const grids = section.querySelectorAll('.members-grid');
  const filterChips = section.querySelectorAll('.chip-filter');
  const input = section.querySelector('#members-filter-input');
  const clearBtn = section.querySelector('.btn-clear-members');

  let activeGroup = 'institutional';
  let activeProvince = 'all';
  let text = '';

  function applyFilters() {
    grids.forEach(grid => {
      grid.classList.toggle('d-none', grid.dataset.membersGroup !== activeGroup);
      if (grid.dataset.membersGroup === activeGroup) {
        grid.querySelectorAll('.member-card').forEach(card => {
          const prov = card.dataset.province || '';
          const name = card.querySelector('.member-name')?.textContent?.toLowerCase() || '';
          const provOk = activeProvince === 'all' || prov === activeProvince;
          const textOk = text === '' || name.includes(text);
          card.style.display = (provOk && textOk) ? '' : 'none';
        });
      }
    });
  }

  tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeGroup = btn.dataset.membersTab;
    applyFilters();
  }));

  filterChips.forEach(chip => chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeProvince = chip.dataset.province;
    applyFilters();
  }));

  if (input) {
    // initialize clear visibility
    if (clearBtn) clearBtn.hidden = input.value.length === 0;
    input.addEventListener('input', () => {
      text = input.value.trim().toLowerCase();
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

  applyFilters();
});
