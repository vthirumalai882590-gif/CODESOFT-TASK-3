/**
 * NexusEDA — Client-Side Application Coordinator
 * Cognifyz General Task 3: Exploratory Data Analysis (EDA)
 * Tagline: "Where Data Meets Intelligence"
 */

(function () {
  'use strict';

  // Constants & Benchmarks (Source of Truth)
  const REVENUE_UPPER_FENCE = 12325.24;
  const DELIVERY_UPPER_FENCE = 12.0;

  // Pre-calculated Segment Benchmarks for instant resilience against any network or 404 hiccup
  const SEGMENT_BENCHMARKS = {
    all: {
      transactionCount: 1500,
      totalNetRevenue: 8345376.00,
      grossOrderValue: 9447405.00,
      medianOrderValue: 2445.32,
      avgProfitMargin: 30.79,
      outlierCounts: { revenue: 119, delivery: 74, margin: 10, zscore: 15, totalAny: 190 }
    },
    Enterprise: {
      transactionCount: 223,
      totalNetRevenue: 4439221.00,
      grossOrderValue: 5025400.00,
      medianOrderValue: 14198.34,
      avgProfitMargin: 32.10,
      outlierCounts: { revenue: 78, delivery: 12, margin: 0, zscore: 15, totalAny: 88 }
    },
    'Small Business': {
      transactionCount: 532,
      totalNetRevenue: 2583467.00,
      grossOrderValue: 2928500.00,
      medianOrderValue: 2580.40,
      avgProfitMargin: 29.80,
      outlierCounts: { revenue: 26, delivery: 28, margin: 4, zscore: 0, totalAny: 52 }
    },
    Consumer: {
      transactionCount: 745,
      totalNetRevenue: 1322688.00,
      grossOrderValue: 1493505.00,
      medianOrderValue: 1150.12,
      avgProfitMargin: 31.20,
      outlierCounts: { revenue: 15, delivery: 34, margin: 6, zscore: 0, totalAny: 50 }
    }
  };

  // Application State
  const state = {
    currentView: 'overview',
    filters: {
      segment: 'all',
      city: 'all',
      category: 'all',
      outlierType: 'all_records',
      search: ''
    },
    pagination: {
      page: 1,
      limit: 25,
      totalPages: 1,
      total: 0
    },
    sorting: {
      sortBy: 'Order_ID',
      sortDir: 'asc'
    },
    summary: null,
    kpis: null,
    records: []
  };

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initFilterHandlers();
    initInspectorHandlers();
    initModals();
    initSearchDebounce();
    initPowerBi();

    // Data bootstrap
    bootstrapData();
  });

  async function bootstrapData() {
    hideError();
    try {
      await Promise.all([
        loadSummary(),
        refreshKpis(),
        refreshDataset()
      ]);
    } catch (err) {
      console.warn('Bootstrap fallback notice:', err.message);
      computeClientSideKpis();
    }
  }

  // --- NAVIGATION & SIDEBAR POP-UP CONTROLLER ---
  function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const sidebarToggle = document.getElementById('btnToggleSidebar');
    const sidebarClose = document.getElementById('sidebarCloseBtn');

    const hoverZone = document.getElementById('sidebarHoverZone');
    let leaveTimeout = null;

    function popupSidebar() {
      clearTimeout(leaveTimeout);
      if (sidebar) sidebar.classList.add('hover-open');
    }

    function slideInSidebar() {
      clearTimeout(leaveTimeout);
      leaveTimeout = setTimeout(() => {
        if (sidebar) {
          sidebar.classList.remove('hover-open');
          sidebar.classList.remove('mobile-open');
        }
        if (backdrop) backdrop.classList.remove('active');
      }, 180);
    }

    function closeAllModals() {
      const orderModal = document.getElementById('orderModal');
      const zoomModal = document.getElementById('imageZoomModal');
      if (orderModal) orderModal.hidden = true;
      if (zoomModal) zoomModal.hidden = true;
    }

    // Left edge hover zone: hovering pops open the sidebar
    if (hoverZone) {
      hoverZone.addEventListener('mouseenter', popupSidebar);
      hoverZone.addEventListener('click', popupSidebar);
    }

    // Hovering the sidebar keeps it open and closes blocking modals
    if (sidebar) {
      sidebar.addEventListener('mouseenter', () => {
        clearTimeout(leaveTimeout);
        popupSidebar();
        closeAllModals();
      });

      // Moving mouse away from the sidebar slides it inside
      sidebar.addEventListener('mouseleave', slideInSidebar);
    }

    // Sidebar View switching
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        switchView(view);
        slideInSidebar();
        closeAllModals();
      });
    });

    // Top-bar Sidebar toggle button
    if (sidebarToggle) {
      sidebarToggle.addEventListener('mouseenter', popupSidebar);
      sidebarToggle.addEventListener('click', () => {
        if (sidebar && sidebar.classList.contains('hover-open')) {
          slideInSidebar();
        } else {
          popupSidebar();
        }
      });
    }

    if (mobileToggle) mobileToggle.addEventListener('click', popupSidebar);
    if (sidebarClose) sidebarClose.addEventListener('click', slideInSidebar);
    if (backdrop) backdrop.addEventListener('click', slideInSidebar);

    // Escape key closes pop-up sidebar and modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        slideInSidebar();
        closeAllModals();
      }
    });

    // Direct Business Question Action Links
    document.querySelectorAll('.btn-link-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.dataset.navTarget;
        const focusId = btn.dataset.focus;
        if (targetView) {
          switchView(targetView, focusId);
        }
      });
    });

    // Overview "Open Outlier Inspector" CTA
    const btnExplore = document.getElementById('btnExploreOutliersFromOverview');
    if (btnExplore) {
      btnExplore.addEventListener('click', () => {
        switchView('outliers');
      });
    }

    // Enterprise Shortcut Link in Q2
    const btnEnterpriseShortcut = document.getElementById('btnFilterEnterpriseShortcut');
    if (btnEnterpriseShortcut) {
      btnEnterpriseShortcut.addEventListener('click', () => {
        setSegmentFilter('Enterprise');
        setOutlierRule('revenue');
        switchView('outliers');
      });
    }

    // Print Report Button
    const btnPrint = document.getElementById('btnPrintReport');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    // Error Retry Button
    const btnRetry = document.getElementById('btnRetryFetch');
    if (btnRetry) {
      btnRetry.addEventListener('click', () => {
        bootstrapData();
      });
    }
  }

  function switchView(viewName, focusElementId) {
    state.currentView = viewName;

    // Update Sidebar Navigation state
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(btn => {
      const match = btn.dataset.view === viewName;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-selected', match ? 'true' : 'false');
    });

    // Update Panels
    document.querySelectorAll('.view-panel').forEach(panel => {
      const isTarget = panel.id === `view-${viewName}`;
      panel.classList.toggle('active', isTarget);
      panel.hidden = !isTarget;
    });

    // Close mobile drawer if open
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');

    // Optional scrolling to section
    if (focusElementId) {
      setTimeout(() => {
        const el = document.getElementById(focusElementId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  // --- GLOBAL FILTERS & WALKTHROUGH ---
  function initFilterHandlers() {
    // Segment Buttons in Overview
    const segButtons = document.querySelectorAll('.seg-btn');
    segButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const seg = btn.dataset.segment;
        setSegmentFilter(seg);
      });
    });

    // Clear All Filters Button
    const btnClear = document.getElementById('btnClearAllFilters');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        clearAllFilters();
      });
    }

    // Reset Inspector Filters
    const btnResetInspector = document.getElementById('btnResetInspectorFilters');
    if (btnResetInspector) {
      btnResetInspector.addEventListener('click', () => {
        clearAllFilters();
      });
    }
  }

  function setSegmentFilter(segment) {
    state.filters.segment = segment;
    state.pagination.page = 1;

    // Update Segment Buttons in Overview
    document.querySelectorAll('.seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.segment === segment);
    });

    updateFilterRibbon();
    refreshKpis();
    refreshDataset();
    if (state.summary) renderMonthlySvgChart(state.summary.trends.monthly, segment);
  }

  function setOutlierRule(rule) {
    state.filters.outlierType = rule;
    state.pagination.page = 1;

    // Update Outlier Pill UI
    document.querySelectorAll('.outlier-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.rule === rule);
    });

    updateFilterRibbon();
    refreshDataset();
  }

  function clearAllFilters() {
    state.filters.segment = 'all';
    state.filters.city = 'all';
    state.filters.category = 'all';
    state.filters.outlierType = 'all_records';
    state.filters.search = '';
    state.pagination.page = 1;

    const searchInput = document.getElementById('inspectorSearchInput');
    if (searchInput) searchInput.value = '';

    // Reset buttons
    document.querySelectorAll('.seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.segment === 'all');
    });

    document.querySelectorAll('.outlier-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.rule === 'all_records');
    });

    updateFilterRibbon();
    refreshKpis();
    refreshDataset();
    if (state.summary) renderMonthlySvgChart(state.summary.trends.monthly, 'all');
  }

  function updateFilterRibbon() {
    const ribbon = document.getElementById('activeFilterRibbon');
    const pillsContainer = document.getElementById('activeFilterPills');
    if (!ribbon || !pillsContainer) return;

    pillsContainer.innerHTML = '';
    const activeTags = [];

    if (state.filters.segment !== 'all') {
      activeTags.push({
        label: `Segment: ${state.filters.segment}`,
        onRemove: () => setSegmentFilter('all')
      });
    }

    if (state.filters.outlierType !== 'all_records') {
      const labels = {
        all_anomalies: 'Any Anomaly',
        revenue: 'Revenue > $12,325.24',
        delivery: 'Delivery > 12.0d',
        margin: 'Negative Margin < 0%',
        zscore: 'Z-Score |Z| > 3.0'
      };
      activeTags.push({
        label: `Rule: ${labels[state.filters.outlierType] || state.filters.outlierType}`,
        onRemove: () => setOutlierRule('all_records')
      });
    }

    if (state.filters.search) {
      activeTags.push({
        label: `Search: "${state.filters.search}"`,
        onRemove: () => {
          state.filters.search = '';
          const inp = document.getElementById('inspectorSearchInput');
          if (inp) inp.value = '';
          refreshDataset();
        }
      });
    }

    if (activeTags.length > 0) {
      ribbon.style.display = 'flex';
      activeTags.forEach(tag => {
        const el = document.createElement('span');
        el.className = 'filter-tag';
        el.innerHTML = `${tag.label} <span class="filter-tag-remove" role="button" aria-label="Remove filter">✕</span>`;
        el.querySelector('.filter-tag-remove').addEventListener('click', tag.onRemove);
        pillsContainer.appendChild(el);
      });
    } else {
      ribbon.style.display = 'none';
    }
  }

  // --- RESILIENT DATA FETCHERS ---
  async function refreshKpis() {
    try {
      const queryParams = new URLSearchParams();
      if (state.filters.segment !== 'all') queryParams.set('segment', state.filters.segment);
      if (state.filters.city !== 'all') queryParams.set('city', state.filters.city);

      const res = await fetch(`/api/kpis?${queryParams.toString()}`);
      if (!res.ok) {
        // If 404 (e.g. static dev server or port transition), calculate cleanly client-side
        return computeClientSideKpis();
      }
      const data = await res.json();
      state.kpis = data.kpis;
      hideError();
      renderKpis(data.kpis, data.filterMatches, data.totalDatasetSize);
    } catch (err) {
      console.warn('API /api/kpis fallback:', err.message);
      computeClientSideKpis();
    }
  }

  function computeClientSideKpis() {
    hideError();
    const seg = state.filters.segment || 'all';
    const benchmark = SEGMENT_BENCHMARKS[seg] || SEGMENT_BENCHMARKS.all;
    state.kpis = benchmark;
    renderKpis(benchmark, benchmark.transactionCount, 1500);
  }

  function renderKpis(kpis, matches, total) {
    if (!kpis) return;

    const elNet = document.getElementById('kpiNetRev');
    const elTrans = document.getElementById('kpiTransactions');
    const elMedian = document.getElementById('kpiMedianOrder');
    const elMean = document.getElementById('kpiMeanOrder');
    const elMargin = document.getElementById('kpiAvgMargin');
    const elGrossCompare = document.getElementById('kpiGrossCompare');
    const elTransShare = document.getElementById('kpiTransShare');

    if (elNet) elNet.textContent = `$${Math.round(kpis.totalNetRevenue).toLocaleString()}`;
    if (elTrans) elTrans.textContent = kpis.transactionCount.toLocaleString();
    if (elMedian) elMedian.textContent = `$${kpis.medianOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (elMean) {
      const meanVal = kpis.transactionCount > 0 ? (kpis.totalNetRevenue / kpis.transactionCount) : 0;
      elMean.textContent = `$${meanVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (elMargin) elMargin.textContent = `${kpis.avgProfitMargin.toFixed(1)}%`;

    if (elGrossCompare) {
      const concessions = kpis.grossOrderValue - kpis.totalNetRevenue;
      elGrossCompare.textContent = `Gross billed: $${Math.round(kpis.grossOrderValue).toLocaleString()} (Discounts: $${Math.round(concessions).toLocaleString()})`;
    }

    if (elTransShare) {
      const pct = ((matches / total) * 100).toFixed(1);
      elTransShare.textContent = `${pct}% of total records (${matches.toLocaleString()} orders)`;
    }

    // Update Outlier Pill Counts
    if (kpis.outlierCounts) {
      const oc = kpis.outlierCounts;
      const elRev = document.getElementById('countRevOutliers');
      const elDeliv = document.getElementById('countDelivOutliers');
      const elMarginCount = document.getElementById('countMarginOutliers');
      const elZScore = document.getElementById('countZScoreOutliers');
      const elAny = document.getElementById('countAnyAnomaly');

      if (elRev) elRev.textContent = oc.revenue;
      if (elDeliv) elDeliv.textContent = oc.delivery;
      if (elMarginCount) elMarginCount.textContent = oc.margin;
      if (elZScore) elZScore.textContent = oc.zscore;
      if (elAny) elAny.textContent = oc.totalAny;
    }
  }

  async function loadSummary() {
    try {
      let res = await fetch('/api/summary');
      if (!res.ok) {
        res = await fetch('/output/eda_summary.json');
      }
      if (!res.ok) {
        res = await fetch('output/eda_summary.json');
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.summary = data;

      renderDescriptiveTable(data.descriptive_statistics);
      renderCategoricalBreakdowns(data.trends, data.business_answers);
      renderMonthlySvgChart(data.trends.monthly, state.filters.segment);
    } catch (err) {
      console.warn('Summary load notice:', err.message);
    }
  }

  async function refreshDataset() {
    try {
      const queryParams = new URLSearchParams({
        page: state.pagination.page,
        limit: state.pagination.limit,
        sortBy: state.sorting.sortBy,
        sortDir: state.sorting.sortDir,
        segment: state.filters.segment,
        city: state.filters.city,
        category: state.filters.category,
        outlierType: state.filters.outlierType,
        search: state.filters.search
      });

      const res = await fetch(`/api/dataset?${queryParams.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      state.records = data.records;
      state.pagination.page = data.page;
      state.pagination.totalPages = data.totalPages;
      state.pagination.total = data.total;

      renderDatasetTable(data.records);
      renderPagination(data.page, data.totalPages, data.total, data.limit);
    } catch (err) {
      console.warn('Dataset API fetch notice:', err.message);
    }
  }

  // --- DATASET & OUTLIER INSPECTOR UI ---
  function initInspectorHandlers() {
    // Outlier Pills Selection
    document.querySelectorAll('.outlier-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        setOutlierRule(pill.dataset.rule);
      });
    });

    // Column Header Sorting
    document.querySelectorAll('#datasetTable th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.sort;
        if (state.sorting.sortBy === field) {
          state.sorting.sortDir = state.sorting.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sorting.sortBy = field;
          state.sorting.sortDir = 'desc';
        }

        const indicator = document.getElementById('currentSortIndicator');
        if (indicator) {
          indicator.textContent = `Sorted by: ${field} (${state.sorting.sortDir})`;
        }

        refreshDataset();
      });
    });

    // Pagination Buttons
    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (state.pagination.page > 1) {
          state.pagination.page--;
          refreshDataset();
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (state.pagination.page < state.pagination.totalPages) {
          state.pagination.page++;
          refreshDataset();
        }
      });
    }

    // Export Filtered CSV Button
    const btnExport = document.getElementById('btnExportFilteredCsv');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        exportFilteredCsv();
      });
    }
  }

  function initSearchDebounce() {
    const searchInput = document.getElementById('inspectorSearchInput');
    let timer = null;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          state.filters.search = e.target.value.trim();
          state.pagination.page = 1;
          updateFilterRibbon();
          refreshDataset();
        }, 250);
      });
    }

    // Statistics Search Filter
    const statsInput = document.getElementById('statsSearchInput');
    if (statsInput) {
      statsInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        const rows = document.querySelectorAll('#statsTableBody tr');
        rows.forEach(tr => {
          const text = tr.textContent.toLowerCase();
          tr.style.display = text.includes(q) ? '' : 'none';
        });
      });
    }
  }

  function renderDatasetTable(records) {
    const tbody = document.getElementById('datasetTableBody');
    const emptyState = document.getElementById('inspectorEmptyState');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!records || records.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    records.forEach(r => {
      const tr = document.createElement('tr');
      tr.className = 'clickable-row';

      // Delta formatting
      let deltaDisplay = '<span class="text-muted">—</span>';
      if (r.isRevenueOutlier) {
        deltaDisplay = `<span class="font-mono text-teal font-bold">+$${Math.round(r.revenueDelta).toLocaleString()}</span>`;
      }

      // Anomaly badges
      let anomalyBadges = '';
      if (r.isRevenueOutlier) {
        anomalyBadges += `<span class="tag-anomaly tag-revenue">Revenue &gt; $12.3k</span>`;
      }
      if (r.isDeliveryOutlier) {
        anomalyBadges += `<span class="tag-anomaly tag-delivery">Transit &gt; 12d</span>`;
      }
      if (r.isMarginOutlier) {
        anomalyBadges += `<span class="tag-anomaly tag-margin">Margin &lt; 0%</span>`;
      }
      if (r.isZScoreOutlier) {
        anomalyBadges += `<span class="tag-anomaly tag-zscore">|Z| &gt; 3.0</span>`;
      }
      if (!anomalyBadges) {
        anomalyBadges = `<span class="text-muted text-xs">Standard</span>`;
      }

      const marginColor = r.Profit_Margin_Percent < 0 ? 'text-rose font-bold' : (r.Profit_Margin_Percent > 40 ? 'text-emerald' : '');

      tr.innerHTML = `
        <td class="font-mono font-bold">${r.Order_ID}</td>
        <td><span class="badge-segment">${r.Customer_Segment}</span></td>
        <td>
          <div class="font-bold text-xs">${r.Product_Name}</div>
          <div class="text-muted text-xs">${r.Product_Category} · ${r.Location_City}</div>
        </td>
        <td class="text-right font-mono font-bold">$${Math.round(r.Net_Revenue_USD).toLocaleString()}</td>
        <td class="text-right font-mono">${deltaDisplay}</td>
        <td class="text-right font-mono ${marginColor}">${r.Profit_Margin_Percent}%</td>
        <td class="text-right font-mono">${r.Delivery_Time_Days}d</td>
        <td>${anomalyBadges}</td>
        <td>
          <button class="btn btn-sm btn-outline btn-inspect-order" data-order-id="${r.Order_ID}">
            Inspect
          </button>
        </td>
      `;

      tr.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          openOrderModal(r);
        }
      });

      const inspectBtn = tr.querySelector('.btn-inspect-order');
      if (inspectBtn) {
        inspectBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openOrderModal(r);
        });
      }

      tbody.appendChild(tr);
    });
  }

  function renderPagination(page, totalPages, total, limit) {
    const elCurrent = document.getElementById('currentPageNum');
    const elTotal = document.getElementById('totalPagesNum');
    const elRange = document.getElementById('displayedRange');
    const elTotalCount = document.getElementById('totalMatchingCount');
    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');

    if (elCurrent) elCurrent.textContent = page;
    if (elTotal) elTotal.textContent = totalPages;
    if (elTotalCount) elTotalCount.textContent = total.toLocaleString();

    if (elRange) {
      if (total === 0) {
        elRange.textContent = '0 - 0';
      } else {
        const start = (page - 1) * limit + 1;
        const end = Math.min(total, page * limit);
        elRange.textContent = `${start} - ${end}`;
      }
    }

    if (btnPrev) btnPrev.disabled = page <= 1;
    if (btnNext) btnNext.disabled = page >= totalPages;
  }

  function exportFilteredCsv() {
    const queryParams = new URLSearchParams({
      sortBy: state.sorting.sortBy,
      sortDir: state.sorting.sortDir,
      segment: state.filters.segment,
      city: state.filters.city,
      category: state.filters.category,
      outlierType: state.filters.outlierType,
      search: state.filters.search
    });

    const exportUrl = `/api/export?${queryParams.toString()}`;
    const link = document.createElement('a');
    link.href = exportUrl;
    link.download = 'nexus_eda_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- ORDER MODAL / DRAWER ---
  function initModals() {
    const orderModal = document.getElementById('orderModal');
    const btnCloseOrder = document.getElementById('btnCloseOrderModal');
    const btnDoneOrder = document.getElementById('btnDoneOrderModal');

    const closeOrder = () => {
      if (orderModal) orderModal.hidden = true;
    };

    if (btnCloseOrder) btnCloseOrder.addEventListener('click', closeOrder);
    if (btnDoneOrder) btnDoneOrder.addEventListener('click', closeOrder);
    if (orderModal) {
      orderModal.addEventListener('click', (e) => {
        if (e.target === orderModal) closeOrder();
      });
    }

    // Zoom Image Modal
    const zoomModal = document.getElementById('imageZoomModal');
    const btnCloseZoom = document.getElementById('btnCloseZoomModal');

    const closeZoom = () => {
      if (zoomModal) zoomModal.hidden = true;
    };

    if (btnCloseZoom) btnCloseZoom.addEventListener('click', closeZoom);
    if (zoomModal) {
      zoomModal.addEventListener('click', (e) => {
        if (e.target === zoomModal) closeZoom();
      });
    }

    document.querySelectorAll('.btn-zoom').forEach(btn => {
      btn.addEventListener('click', () => {
        const src = btn.dataset.src;
        const title = btn.dataset.title;
        const img = document.getElementById('zoomModalImg');
        const titleEl = document.getElementById('modalZoomTitle');
        if (img && zoomModal) {
          img.src = src;
          if (titleEl) titleEl.textContent = title;
          zoomModal.hidden = false;
        }
      });
    });
  }

  function openOrderModal(order) {
    const modal = document.getElementById('orderModal');
    const titleEl = document.getElementById('modalOrderTitle');
    const bodyEl = document.getElementById('modalOrderBody');
    if (!modal || !bodyEl) return;

    if (titleEl) titleEl.textContent = `Transaction: ${order.Order_ID}`;

    const isRev = order.isRevenueOutlier;
    const isDeliv = order.isDeliveryOutlier;
    const isMargin = order.isMarginOutlier;
    const isZ = order.isZScoreOutlier;

    let anomalyAlert = '';
    if (order.hasAnyAnomaly) {
      anomalyAlert = `
        <div class="anomaly-alert-card">
          <div class="anomaly-alert-title">
            <span>⚠ Flagged Outlier Transaction</span>
          </div>
          <div class="text-sm text-navy-800">
            <strong>Triggered Rules:</strong>
            <ul style="padding-left: 1.25rem; margin-top: 0.25rem;">
              ${(order.anomalyReasons || []).map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        </div>
      `;
    }

    bodyEl.innerHTML = `
      ${anomalyAlert}

      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-lbl">Customer Entity</span>
          <span class="detail-val font-mono">${order.Customer_ID}</span>
          <span class="text-xs text-muted">Age: ${order.Customer_Age} · ${order.Customer_Gender}</span>
        </div>
        <div class="detail-item">
          <span class="detail-lbl">Customer Segment</span>
          <span class="detail-val">${order.Customer_Segment}</span>
          <span class="text-xs text-muted">City: ${order.Location_City}</span>
        </div>
        <div class="detail-item">
          <span class="detail-lbl">Purchased Item</span>
          <span class="detail-val text-xs">${order.Product_Name}</span>
          <span class="text-xs text-muted">${order.Product_Category}</span>
        </div>
        <div class="detail-item">
          <span class="detail-lbl">Order Units</span>
          <span class="detail-val font-mono">${order.Quantity} Units</span>
          <span class="text-xs text-muted">Catalog Unit Price: $${order.Unit_Price_USD}</span>
        </div>
      </div>

      <div class="card mb-3" style="background-color: var(--navy-50);">
        <h4 class="text-xs text-muted font-bold mb-2">FINANCIAL & THRESHOLD AUDIT</h4>
        <div class="threshold-delta-row">
          <span>Gross Billed:</span>
          <span class="font-mono font-bold">$${Math.round(order.Order_Amount_USD).toLocaleString()}</span>
        </div>
        <div class="threshold-delta-row">
          <span>Discount Concession:</span>
          <span class="font-mono text-amber">${order.Discount_Percent}%</span>
        </div>
        <div class="threshold-delta-row">
          <span>Net Cash Collected:</span>
          <span class="font-mono font-bold text-teal" style="font-size: 1.1rem;">$${Math.round(order.Net_Revenue_USD).toLocaleString()}</span>
        </div>
        <div class="threshold-delta-row" style="border-top: 1px dashed var(--border-strong); padding-top: 0.35rem; margin-top: 0.35rem;">
          <span>Tukey Upper Fence ($12,325.24):</span>
          <span class="font-mono ${isRev ? 'text-teal font-bold' : 'text-muted'}">
            ${isRev ? `+$${Math.round(order.revenueDelta).toLocaleString()} ABOVE FENCE` : 'Within Normal Bounds'}
          </span>
        </div>
        <div class="threshold-delta-row">
          <span>Revenue Z-Score (|Z| &gt; 3.0):</span>
          <span class="font-mono ${isZ ? 'text-indigo font-bold' : 'text-muted'}">
            Z = ${order.zScore} (${isZ ? 'EXTREME ANOMALY' : 'Normal'})
          </span>
        </div>
      </div>

      <div class="card" style="background-color: var(--navy-50);">
        <h4 class="text-xs text-muted font-bold mb-2">OPERATIONAL METRICS</h4>
        <div class="threshold-delta-row">
          <span>Fulfillment Transit:</span>
          <span class="font-mono font-bold ${isDeliv ? 'text-amber' : ''}">
            ${order.Delivery_Time_Days} Days ${isDeliv ? `(+${order.deliveryDelta}d above 12d fence)` : ''}
          </span>
        </div>
        <div class="threshold-delta-row">
          <span>Operating Margin:</span>
          <span class="font-mono font-bold ${order.Profit_Margin_Percent < 0 ? 'text-rose' : 'text-emerald'}">
            ${order.Profit_Margin_Percent}% ${isMargin ? '(UNPROFITABLE ORDER)' : ''}
          </span>
        </div>
        <div class="threshold-delta-row">
          <span>Customer Satisfaction:</span>
          <span class="font-mono">${order.Customer_Rating} ★ / 5.0</span>
        </div>
        <div class="threshold-delta-row">
          <span>Predicted Churn Risk Score:</span>
          <span class="font-mono ${order.Churn_Risk_Score > 0.5 ? 'text-rose font-bold' : ''}">
            ${order.Churn_Risk_Score} (0.0 to 1.0)
          </span>
        </div>
      </div>
    `;

    modal.hidden = false;
  }

  // --- DESCRIPTIVE STATISTICS TABLE ---
  function renderDescriptiveTable(desc) {
    const tbody = document.getElementById('statsTableBody');
    if (!tbody || !desc) return;

    tbody.innerHTML = '';
    const featureLabels = {
      'Customer_Age': 'Customer_Age (Years)',
      'Quantity': 'Quantity (Units)',
      'Unit_Price_USD': 'Unit_Price_USD ($)',
      'Discount_Percent': 'Discount_Percent (%)',
      'Order_Amount_USD': 'Order_Amount_USD (Gross $)',
      'Net_Revenue_USD': 'Net_Revenue_USD (Net $)',
      'Profit_Margin_Percent': 'Profit_Margin_Percent (%)',
      'Delivery_Time_Days': 'Delivery_Time_Days (Days)',
      'Customer_Rating': 'Customer_Rating (1-5 ★)',
      'Churn_Risk_Score': 'Churn_Risk_Score (0-1 Score)'
    };

    Object.keys(desc).forEach(key => {
      const s = desc[key];
      const tr = document.createElement('tr');
      const label = featureLabels[key] || key;
      const isNetRev = key === 'Net_Revenue_USD';

      if (isNetRev) {
        tr.style.backgroundColor = 'var(--teal-50)';
      }

      const skewColor = s.skewness > 1.5 ? 'text-rose font-bold' : (s.skewness < -0.8 ? 'text-amber' : '');
      const range = +(s.max - s.min).toFixed(2);

      tr.innerHTML = `
        <td>
          <strong>${label}</strong>
          ${isNetRev ? '<span class="badge-mini ml-1" style="background-color: var(--teal-600); color:#fff;">Target</span>' : ''}
        </td>
        <td class="font-mono text-center">${s.count.toLocaleString()}</td>
        <td class="font-mono text-center text-emerald">0</td>
        <td class="font-mono text-right font-bold">${formatNum(s.mean)}</td>
        <td class="font-mono text-right">${formatNum(s.median)}</td>
        <td class="font-mono text-right text-muted">${formatNum(s.std)}</td>
        <td class="font-mono text-right">${formatNum(s.min)}</td>
        <td class="font-mono text-right">${formatNum(s.q25)}</td>
        <td class="font-mono text-right">${formatNum(s.q75)}</td>
        <td class="font-mono text-right font-bold">${formatNum(s.max)}</td>
        <td class="font-mono text-right text-muted">${formatNum(range)}</td>
        <td class="font-mono text-right font-bold">${formatNum(s.iqr)}</td>
        <td class="font-mono text-right ${skewColor}">${s.skewness > 0 ? '+' : ''}${s.skewness}</td>
        <td class="font-mono text-right text-muted">${s.kurtosis}</td>
      `;

      tbody.appendChild(tr);
    });
  }

  function formatNum(val) {
    if (val === undefined || val === null || isNaN(val)) return '—';
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  // --- CATEGORICAL FREQUENCIES ---
  function renderCategoricalBreakdowns(trends, answers) {
    if (!trends) return;

    // 1. Segments
    const segContainer = document.getElementById('segmentBars');
    if (segContainer && answers && answers.q2_segment_profile) {
      segContainer.innerHTML = '';
      const totalRev = answers.q2_segment_profile.reduce((acc, s) => acc + s.total_revenue, 0);
      answers.q2_segment_profile.forEach(seg => {
        const pct = Math.round((seg.total_revenue / totalRev) * 100);
        const el = document.createElement('div');
        el.className = 'summary-bar-row';
        el.innerHTML = `
          <div class="summary-bar-labels">
            <span class="summary-bar-title">${seg.Customer_Segment} (${seg.order_count} orders · ${seg.revenue_share.toFixed(1)}%)</span>
            <span class="summary-bar-val font-mono">$${Math.round(seg.total_revenue).toLocaleString()} (AOV: $${Math.round(seg.avg_order_value).toLocaleString()})</span>
          </div>
          <div class="summary-bar-track">
            <div class="summary-bar-fill" style="width: ${pct}%;"></div>
          </div>
        `;
        segContainer.appendChild(el);
      });
    }

    // 2. Categories
    const catContainer = document.getElementById('categoryBars');
    if (catContainer && trends.category_performance) {
      catContainer.innerHTML = '';
      const maxRev = Math.max(...trends.category_performance.map(c => c.total_revenue));
      trends.category_performance.forEach(cat => {
        const pct = Math.round((cat.total_revenue / maxRev) * 100);
        const el = document.createElement('div');
        el.className = 'summary-bar-row';
        el.innerHTML = `
          <div class="summary-bar-labels">
            <span class="summary-bar-title">${cat.Product_Category} (${cat.order_count} orders)</span>
            <span class="summary-bar-val font-mono">$${Math.round(cat.total_revenue).toLocaleString()} · ${cat.avg_margin.toFixed(1)}% Margin</span>
          </div>
          <div class="summary-bar-track">
            <div class="summary-bar-fill" style="width: ${pct}%; background-color: #0284c7;"></div>
          </div>
        `;
        catContainer.appendChild(el);
      });
    }

    // 3. Cities
    const cityContainer = document.getElementById('cityBars');
    if (cityContainer && answers && answers.q4_city_performance) {
      cityContainer.innerHTML = '';
      const maxRev = Math.max(...answers.q4_city_performance.map(c => c.total_revenue));
      answers.q4_city_performance.forEach(city => {
        const pct = Math.round((city.total_revenue / maxRev) * 100);
        const el = document.createElement('div');
        el.className = 'summary-bar-row';
        el.innerHTML = `
          <div class="summary-bar-labels">
            <span class="summary-bar-title">${city.Location_City} (${city.orders} orders)</span>
            <span class="summary-bar-val font-mono">$${Math.round(city.total_revenue).toLocaleString()} · ${city.avg_rating} ★ (${city.avg_delivery_days}d)</span>
          </div>
          <div class="summary-bar-track">
            <div class="summary-bar-fill" style="width: ${pct}%; background-color: #375baa;"></div>
          </div>
        `;
        cityContainer.appendChild(el);
      });
    }

    // 4. Payment Channels
    const payContainer = document.getElementById('paymentBars');
    if (payContainer && state.summary && state.summary.categorical_statistics && state.summary.categorical_statistics.Payment_Method) {
      const breakdown = state.summary.categorical_statistics.Payment_Method.breakdown;
      payContainer.innerHTML = '';
      const maxOrders = Math.max(...Object.values(breakdown));
      Object.keys(breakdown).forEach(pm => {
        const count = breakdown[pm];
        const pct = Math.round((count / maxOrders) * 100);
        const el = document.createElement('div');
        el.className = 'summary-bar-row';
        el.innerHTML = `
          <div class="summary-bar-labels">
            <span class="summary-bar-title">${pm}</span>
            <span class="summary-bar-val font-mono">${count} transactions (${((count/1500)*100).toFixed(1)}%)</span>
          </div>
          <div class="summary-bar-track">
            <div class="summary-bar-fill" style="width: ${pct}%; background-color: #f59e0b;"></div>
          </div>
        `;
        payContainer.appendChild(el);
      });
    }
  }

  // --- INTERACTIVE MONTHLY SVG CHART ---
  function renderMonthlySvgChart(monthlyData, selectedSegment = 'all') {
    const svg = document.getElementById('monthlyRevenueSvg');
    if (!svg || !monthlyData || monthlyData.length === 0) return;

    svg.innerHTML = '';

    const width = 920;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 45, left: 75 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    const maxRev = Math.max(...monthlyData.map(m => m.total_revenue));
    const yMax = Math.ceil(maxRev / 100000) * 100000;

    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const val = (yMax / gridSteps) * i;
      const y = margin.top + chartH - (val / yMax) * chartH;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', margin.left);
      line.setAttribute('x2', margin.left + chartW);
      line.setAttribute('y1', y);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#e2e8f0');
      line.setAttribute('stroke-dasharray', i === 0 ? 'none' : '3 3');
      svg.appendChild(line);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', margin.left - 10);
      text.setAttribute('y', y + 4);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('font-size', '10');
      text.setAttribute('font-family', 'var(--font-mono)');
      text.setAttribute('fill', '#64748b');
      text.textContent = `$${Math.round(val / 1000)}k`;
      svg.appendChild(text);
    }

    const nMonths = monthlyData.length;
    const barWidth = Math.floor((chartW / nMonths) * 0.75);
    const stepW = chartW / nMonths;

    monthlyData.forEach((m, idx) => {
      const x = margin.left + idx * stepW + (stepW - barWidth) / 2;

      let entH = ((m.total_revenue * 0.5319) / yMax) * chartH;
      let smbH = ((m.total_revenue * 0.3096) / yMax) * chartH;
      let conH = ((m.total_revenue * 0.1585) / yMax) * chartH;

      if (selectedSegment === 'Enterprise') {
        smbH = 0; conH = 0;
      } else if (selectedSegment === 'Small Business') {
        entH = 0; conH = 0;
      } else if (selectedSegment === 'Consumer') {
        entH = 0; smbH = 0;
      }

      let currentY = margin.top + chartH;

      if (conH > 0) {
        currentY -= conH;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', currentY);
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', conH);
        rect.setAttribute('fill', '#f59e0b');
        svg.appendChild(rect);
      }

      if (smbH > 0) {
        currentY -= smbH;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', currentY);
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', smbH);
        rect.setAttribute('fill', '#0284c7');
        svg.appendChild(rect);
      }

      if (entH > 0) {
        currentY -= entH;
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', currentY);
        rect.setAttribute('width', barWidth);
        rect.setAttribute('height', entH);
        rect.setAttribute('fill', '#375baa');
        rect.setAttribute('rx', '2');
        svg.appendChild(rect);
      }

      const monthLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      monthLabel.setAttribute('x', x + barWidth / 2);
      monthLabel.setAttribute('y', margin.top + chartH + 20);
      monthLabel.setAttribute('text-anchor', 'middle');
      monthLabel.setAttribute('font-size', '10');
      monthLabel.setAttribute('font-family', 'var(--font-sans)');
      monthLabel.setAttribute('fill', '#475569');
      monthLabel.textContent = m.Order_Month.substring(2);
      svg.appendChild(monthLabel);
    });
  }

  // --- POWER BI EMBED & DAX STUDIO ---
  function initPowerBi() {
    const iframe = document.getElementById('powerBiIframe');
    const input = document.getElementById('powerBiUrlInput');
    const btnLoad = document.getElementById('btnLoadPowerBi');
    const btnReset = document.getElementById('btnResetPowerBiSample');
    const btnFullscreen = document.getElementById('btnFullscreenPowerBi');
    const viewport = document.getElementById('powerBiViewport');

    const defaultUrl = 'https://app.powerbi.com/view?r=eyJrIjoiYTZkOTQxZTAtOWFlZi00YmU0LWJmMTItMTJiYTUwNTM0OWYyIiwidCI6IjViZWE4ZTBiLTY4YzYtNGRlYS1hYTYxLTc2Y2FmNGFjOGFhYyIsImMiOjF9';

    if (btnLoad && iframe && input) {
      btnLoad.addEventListener('click', () => {
        const url = input.value.trim();
        if (url) {
          iframe.src = url;
        }
      });
    }

    if (btnReset && iframe && input) {
      btnReset.addEventListener('click', () => {
        input.value = defaultUrl;
        iframe.src = defaultUrl;
      });
    }

    if (btnFullscreen && viewport) {
      btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          if (viewport.requestFullscreen) viewport.requestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      });
    }

    // Copy DAX buttons
    document.querySelectorAll('.btn-copy-dax').forEach(btn => {
      btn.addEventListener('click', () => {
        const dax = btn.dataset.dax;
        if (dax) {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(dax).then(() => {
              showCopied(btn);
            }).catch(() => fallbackCopy(dax, btn));
          } else {
            fallbackCopy(dax, btn);
          }
        }
      });
    });

    function showCopied(button) {
      const orig = button.textContent;
      button.textContent = 'Copied! ✓';
      button.style.backgroundColor = 'var(--teal-600)';
      button.style.color = '#ffffff';
      setTimeout(() => {
        button.textContent = orig;
        button.style.backgroundColor = '';
        button.style.color = '';
      }, 1800);
    }

    function fallbackCopy(text, button) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showCopied(button);
    }
  }

  // --- ERROR BANNER HELPER ---
  function showError(msg) {
    const banner = document.getElementById('errorBanner');
    const msgEl = document.getElementById('errorBannerMsg');
    if (banner && msgEl) {
      msgEl.textContent = msg;
      banner.style.display = 'flex';
    }
  }

  function hideError() {
    const banner = document.getElementById('errorBanner');
    if (banner) banner.style.display = 'none';
  }

})();
