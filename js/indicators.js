function computeChangeIndicator(trends, prePoints, postPoints) {
  if (prePoints.length === 0 || postPoints.length === 0) {
    return { direction: 'neutral', percent: 0, significance: 'none' };
  }

  const expectedAvg = postPoints.reduce((s, p) => s + trends.pre.predict(p.x), 0) / postPoints.length;
  const actualAvg = postPoints.reduce((s, p) => s + p.y, 0) / postPoints.length;

  if (expectedAvg === 0) return { direction: actualAvg > 0 ? 'up' : 'neutral', percent: 0, significance: 'none' };

  const percent = ((actualAvg - expectedAvg) / Math.abs(expectedAvg)) * 100;
  const THRESHOLD = 5;

  let direction;
  if (percent > THRESHOLD) direction = 'up';
  else if (percent < -THRESHOLD) direction = 'down';
  else direction = 'neutral';

  const rmse = trends.rmse || 0;
  const gap = Math.abs(actualAvg - expectedAvg);
  let significance;
  if (gap > 2 * rmse) significance = 'significant';
  else if (gap > 1.5 * rmse) significance = 'near';
  else significance = 'none';

  return { direction, percent: Math.round(percent), significance };
}

function renderSingleIndicatorBlock(indicator, termLabel, termColor) {
  const config = {
    up:      { arrow: '↑', label: 'עלייה במגמה', color: 'var(--indicator-up)' },
    down:    { arrow: '↓', label: 'ירידה במגמה', color: 'var(--indicator-down)' },
    neutral: { arrow: '—', label: 'ללא שינוי משמעותי', color: 'var(--indicator-neutral)' }
  };

  const noChange = indicator.direction === 'neutral' || indicator.significance === 'none';

  const termHeader = termLabel
    ? `<div class="indicator-term-label" style="color: ${termColor}">${termLabel}</div>`
    : '';

  if (noChange) {
    return `
      ${termHeader}
      <div class="indicator-arrow" style="color: var(--indicator-neutral)">—</div>
      <div class="significance-badge">המגמה נשמרה ללא שינוי משמעותי</div>
    `;
  }

  const c = config[indicator.direction];
  const sign = indicator.percent > 0 ? '+' : '';
  const badgeClass = indicator.significance === 'significant'
    ? 'significance-badge significant'
    : 'significance-badge near-significant';
  const badgeText = indicator.significance === 'significant'
    ? 'שינוי משמעותי ויציב - מובהק סטטיסטית'
    : 'שינוי ניכר - כמעט מובהק סטטיסטית';

  return `
    ${termHeader}
    <div class="indicator-arrow" style="color: ${c.color}">${c.arrow}</div>
    <div class="indicator-label" style="color: ${c.color}">${c.label}</div>
    <div class="indicator-percent" style="color: ${c.color}"><span dir="ltr">${sign}${indicator.percent}%</span></div>
    <div class="${badgeClass}">${badgeText}</div>
  `;
}

function renderIndicator(indicator) {
  return renderSingleIndicatorBlock(indicator, null, null);
}

function renderMultiTermIndicator(allIndicators, terms, colors) {
  return allIndicators.map((ind, i) => {
    const color = colors[i % colors.length];
    return `<div class="multi-indicator-block">${renderSingleIndicatorBlock(ind, terms[i], color)}</div>`;
  }).join('');
}
