(function() {
  const container = document.getElementById('charts-container');
  let globalConfidenceVisible = false;
  const allConfidenceToggles = [];
  const allChartSections = [];

  const datasetByTerm = {};
  const multiTermDatasets = [];

  for (const ds of DATASETS) {
    if (ds.multiTerm) {
      multiTermDatasets.push(ds);
    } else {
      datasetByTerm[ds.term] = ds;
    }
  }

  function findMultiTermDataset(terms) {
    const ds = multiTermDatasets.find(d => terms.every(t => d.terms.includes(t)));
    if (!ds) return null;
    if (ds.terms.length === terms.length) return ds;
    return {
      terms: terms,
      multiTerm: true,
      data: ds.data.map(row => {
        const filtered = { date: row.date };
        for (const t of terms) filtered[t] = row[t];
        return filtered;
      })
    };
  }

  for (const category of CATEGORIES) {
    const divider = document.createElement('section');
    divider.className = 'category-divider';
    divider.innerHTML = `<h2 class="category-name">${category.name}</h2>`;
    container.appendChild(divider);

    for (const term of category.terms) {
      const dataset = datasetByTerm[term];
      if (!dataset) continue;
      appendGraphSection(container, dataset, term);
    }

    const multiTermSets = MULTI_TERM_CATEGORY_MAP[category.name];
    if (multiTermSets) {
      for (const termSet of multiTermSets) {
        const dataset = findMultiTermDataset(termSet);
        if (!dataset) continue;
        const label = termSet.join(' / ');
        appendGraphSection(container, dataset, label);
      }
    }
  }

  function appendGraphSection(parent, dataset, label) {
    const section = document.createElement('section');
    section.className = 'graph-section';

    const commentary = COMMENTARY[label] || '';
    const commentaryHtml = commentary
      ? `<p class="graph-commentary">${commentary}</p>`
      : '';

    section.innerHTML = `
      <div class="graph-wrapper">
        <div class="graph-header">
          <h3 class="graph-term">${dataset.multiTerm ? dataset.terms.join(' / ') : dataset.term}</h3>
          ${commentaryHtml}
        </div>
        <div class="chart-container"></div>
        <div class="indicator-panel"></div>
        <div class="share-button-container">
          <button class="share-button" aria-label="שיתוף">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            שיתוף
          </button>
        </div>
      </div>
    `;

    parent.appendChild(section);

    let initialized = false;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !initialized) {
        initialized = true;
        observer.disconnect();
        initChart(section, dataset, label);
      }
    }, { rootMargin: '200px' });

    observer.observe(section);
  }

  function syncAllConfidenceToggles() {
    allChartSections.forEach(({ chartContainer, confidenceToggle }) => {
      const bandEls = chartContainer.querySelectorAll('.confidence-band');
      bandEls.forEach(el => el.style.display = globalConfidenceVisible ? '' : 'none');
    });
    allConfidenceToggles.forEach(btn => {
      btn.classList.toggle('active', globalConfidenceVisible);
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 12h4l3-9 4 18 3-9h6"/>
        </svg>
        ${globalConfidenceVisible ? 'הסתר רווח סמך' : 'הצג רווח סמך'}
      `;
    });
  }

  function initChart(section, dataset, label) {
    const chartContainer = section.querySelector('.chart-container');
    const indicatorPanel = section.querySelector('.indicator-panel');
    const shareBtn = section.querySelector('.share-button');

    const chartResult = createChart(chartContainer, dataset);

    if (dataset.multiTerm && chartResult.allIndicators) {
      indicatorPanel.innerHTML = renderMultiTermIndicator(
        chartResult.allIndicators, dataset.terms, MULTI_TERM_COLORS
      );
    } else {
      indicatorPanel.innerHTML = renderIndicator(chartResult.indicator);
    }

    const confidenceToggle = document.createElement('button');
    confidenceToggle.className = 'confidence-toggle' + (globalConfidenceVisible ? ' active' : '');
    confidenceToggle.setAttribute('aria-label', 'רווח סמך');
    confidenceToggle.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2 12h4l3-9 4 18 3-9h6"/>
      </svg>
      ${globalConfidenceVisible ? 'הסתר רווח סמך' : 'הצג רווח סמך'}
    `;
    indicatorPanel.appendChild(confidenceToggle);

    allConfidenceToggles.push(confidenceToggle);
    allChartSections.push({ chartContainer, confidenceToggle });

    if (globalConfidenceVisible) {
      chartContainer.querySelectorAll('.confidence-band').forEach(el => el.style.display = '');
    }

    confidenceToggle.addEventListener('click', () => {
      globalConfidenceVisible = !globalConfidenceVisible;
      syncAllConfidenceToggles();
    });

    if (dataset.multiTerm) {
      const legendDiv = document.createElement('div');
      legendDiv.className = 'chart-legend';
      dataset.terms.forEach((t, i) => {
        const color = MULTI_TERM_COLORS[i % MULTI_TERM_COLORS.length];
        legendDiv.innerHTML += `
          <span class="chart-legend-item">
            <span class="chart-legend-color" style="background:${color}"></span>
            ${t}
          </span>
        `;
      });
      chartContainer.appendChild(legendDiv);
    }

    animateGraphSection(section, chartResult);

    const termName = dataset.multiTerm ? dataset.terms.join('-') : dataset.term;
    shareBtn.addEventListener('click', () => shareChart(section, termName));
  }

  document.querySelectorAll('.category-divider').forEach(animateCategoryDivider);

  animateHero();
})();
