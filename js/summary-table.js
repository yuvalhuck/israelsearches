(function () {
  const tableContainer = document.getElementById('ai-summary-table');
  if (!tableContainer) return;

  const datasetByTerm = {};
  for (const ds of DATASETS) {
    if (!ds.multiTerm) datasetByTerm[ds.term] = ds;
  }

  const rows = [];

  for (const category of CATEGORIES) {
    for (const term of category.terms) {
      const dataset = datasetByTerm[term];
      if (!dataset) continue;

      const trends = computeTrendLines(dataset.data);
      const indicator = computeChangeIndicator(trends, trends.prePoints, trends.postPoints);

      const noChange = indicator.direction === 'neutral' || indicator.significance === 'none';

      rows.push({
        term,
        direction: noChange ? 'neutral' : indicator.direction,
        percent: noChange ? null : indicator.percent,
        significance: noChange ? 'none' : indicator.significance
      });
    }
  }

  const dirLabel = { up: 'עלייה', down: 'ירידה', neutral: '—' };
  const dirClass = { up: 'stat-up', down: 'stat-down', neutral: '' };
  const sigLabel = {
    significant: 'מובהק',
    near: 'כמעט מובהק',
    none: 'אין שינוי משמעותי'
  };
  const sigClass = {
    significant: 'sig-badge sig-significant',
    near: 'sig-badge sig-near',
    none: 'sig-badge sig-none'
  };

  let html = `<table class="summary-table">
    <thead>
      <tr>
        <th>מילת חיפוש</th>
        <th>מגמה</th>
        <th>מובהקות</th>
      </tr>
    </thead>
    <tbody>`;

  for (const r of rows) {
    const sign = r.percent > 0 ? '+' : '';
    const pctText = r.percent !== null ? `<span dir="ltr">${sign}${r.percent}%</span>` : '';
    html += `
      <tr>
        <td class="term-cell">${r.term}</td>
        <td class="${dirClass[r.direction]}">${dirLabel[r.direction]} ${pctText}</td>
        <td><span class="${sigClass[r.significance]}">${sigLabel[r.significance]}</span></td>
      </tr>`;
  }

  html += '</tbody></table>';
  tableContainer.innerHTML = html;
})();
