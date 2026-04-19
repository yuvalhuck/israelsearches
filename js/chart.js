const CHART_MARGIN = { top: 55, right: 30, bottom: 40, left: 50 };
const MULTI_TERM_COLORS = ['#4fc3f7', '#ff9f43', '#66d9a0', '#ff6b5a', '#b39ddb'];

function createChart(container, dataset) {
  if (dataset.multiTerm) {
    return createMultiTermChart(container, dataset);
  }
  return createSingleTermChart(container, dataset);
}

function createSingleTermChart(container, dataset) {
  const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
  const rect = containerEl.getBoundingClientRect();
  const width = rect.width || 900;
  const height = rect.height || width * 0.5;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;

  const svg = d3.select(containerEl)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${CHART_MARGIN.left},${CHART_MARGIN.top})`);

  const data = dataset.data;
  const parseDate = d3.timeParse('%Y-%m-%d');
  const dates = data.map(d => parseDate(d.date));
  const values = data.map(d => d.value);

  const x = d3.scaleTime().domain(d3.extent(dates)).range([0, innerW]);
  const y = d3.scaleLinear().domain([0, d3.max(values) * 1.1 || 100]).range([innerH, 0]);

  g.append('g')
    .attr('class', 'axis-x')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat('%Y')))
    .selectAll('text').attr('fill', 'var(--text-muted)').attr('font-size', '11px');

  g.append('g')
    .attr('class', 'axis-y')
    .call(d3.axisLeft(y).ticks(5))
    .selectAll('text').attr('fill', 'var(--text-muted)').attr('font-size', '11px');

  g.selectAll('.domain, .tick line').attr('stroke', 'rgba(255,255,255,0.1)');

  g.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(y.ticks(5))
    .enter().append('line')
    .attr('x1', 0).attr('x2', innerW)
    .attr('y1', d => y(d)).attr('y2', d => y(d))
    .attr('stroke', 'rgba(255,255,255,0.05)');

  const exStart = parseDate(EXCLUSION_START);
  const exEnd = parseDate('2024-01-01');
  g.append('rect')
    .attr('class', 'exclusion-zone')
    .attr('x', x(exStart))
    .attr('y', 0)
    .attr('width', x(exEnd) - x(exStart))
    .attr('height', innerH)
    .attr('fill', 'rgba(255,255,255,0.05)');

  const oct7 = parseDate(EVENT_DATE);
  const oct7Line = g.append('line')
    .attr('class', 'oct7-line')
    .attr('x1', x(oct7)).attr('x2', x(oct7))
    .attr('y1', 0).attr('y2', innerH)
    .attr('stroke', 'var(--accent-red)')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '6,4')
    .attr('opacity', 0);

  g.append('text')
    .attr('class', 'oct7-label')
    .attr('x', x(oct7))
    .attr('y', -8)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--accent-red)')
    .attr('font-size', '12px')
    .attr('font-weight', '500')
    .attr('opacity', 0)
    .text('7.10.23');

  const line = d3.line()
    .x((d, i) => x(dates[i]))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  const path = g.append('path')
    .datum(data)
    .attr('class', 'data-line')
    .attr('fill', 'none')
    .attr('stroke', 'var(--line-data)')
    .attr('stroke-width', 2.5)
    .attr('d', line);

  const totalLength = path.node().getTotalLength();
  path
    .attr('stroke-dasharray', totalLength)
    .attr('stroke-dashoffset', totalLength);

  const trends = computeTrendLines(data);
  const baseDate = data[0].date;

  const monthToX = (monthIdx) => {
    const d = new Date(baseDate);
    d.setMonth(d.getMonth() + monthIdx);
    return x(d);
  };

  const preStartX = 0;
  const preEndX = trends.prePoints.length > 0 ? trends.prePoints[trends.prePoints.length - 1].x : 0;
  const preTrendLine = g.append('line')
    .attr('class', 'trend-line-pre')
    .attr('x1', monthToX(preStartX))
    .attr('y1', y(trends.pre.predict(preStartX)))
    .attr('x2', monthToX(preEndX))
    .attr('y2', y(trends.pre.predict(preEndX)))
    .attr('stroke', 'var(--line-pre)')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '8,4')
    .attr('opacity', 0);

  const postStartX = trends.postPoints.length > 0 ? trends.postPoints[0].x : 0;
  const postEndX = trends.postPoints.length > 0 ? trends.postPoints[trends.postPoints.length - 1].x : 0;
  const postTrendLine = g.append('line')
    .attr('class', 'trend-line-post')
    .attr('x1', monthToX(postStartX))
    .attr('y1', y(trends.post.predict(postStartX)))
    .attr('x2', monthToX(postEndX))
    .attr('y2', y(trends.post.predict(postEndX)))
    .attr('stroke', 'var(--line-post)')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '8,4')
    .attr('opacity', 0);

  const bandPoints = [];
  for (let mx = postStartX; mx <= postEndX; mx++) {
    bandPoints.push(mx);
  }
  const bandPath = d3.area()
    .x(mx => monthToX(mx))
    .y0(mx => y(Math.max(0, trends.lowerBand(mx))))
    .y1(mx => y(trends.upperBand(mx)));

  const confidenceBand = g.append('path')
    .datum(bandPoints)
    .attr('class', 'confidence-band')
    .attr('d', bandPath)
    .attr('fill', 'var(--line-pre)')
    .attr('opacity', 0.12)
    .style('display', 'none');

  const projectionLine = g.append('line')
    .attr('class', 'confidence-band')
    .attr('x1', monthToX(postStartX))
    .attr('y1', y(trends.pre.predict(postStartX)))
    .attr('x2', monthToX(postEndX))
    .attr('y2', y(trends.pre.predict(postEndX)))
    .attr('stroke', 'var(--line-pre)')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '4,4')
    .attr('opacity', 0.5)
    .style('display', 'none');

  const tooltipGroup = g.append('g').attr('class', 'tooltip-group').style('display', 'none');
  tooltipGroup.append('line')
    .attr('y1', 0).attr('y2', innerH)
    .attr('stroke', 'rgba(255,255,255,0.3)').attr('stroke-width', 1);
  tooltipGroup.append('circle')
    .attr('r', 5).attr('fill', 'var(--line-data)').attr('stroke', 'var(--bg-primary)').attr('stroke-width', 2);

  const tooltipDiv = d3.select(containerEl).append('div').attr('class', 'chart-tooltip');

  g.append('rect')
    .attr('class', 'hover-area')
    .attr('width', innerW).attr('height', innerH)
    .attr('fill', 'transparent')
    .on('mousemove touchmove', function(event) {
      event.preventDefault();
      const [mx] = d3.pointer(event, this);
      const hoveredDate = x.invert(mx);
      let idx = d3.bisector(d => parseDate(d.date)).left(data, hoveredDate, 1);
      idx = Math.min(idx, data.length - 1);
      if (idx > 0) {
        const d0 = parseDate(data[idx - 1].date);
        const d1 = parseDate(data[idx].date);
        if (hoveredDate - d0 < d1 - hoveredDate) idx = idx - 1;
      }
      const d = data[idx];
      const cx = x(parseDate(d.date));
      const cy = y(d.value);

      tooltipGroup.style('display', null);
      tooltipGroup.select('line').attr('x1', cx).attr('x2', cx);
      tooltipGroup.select('circle').attr('cx', cx).attr('cy', cy);

      const formatDate = d3.timeFormat('%m/%Y');
      tooltipDiv
        .style('opacity', 1)
        .style('left', `${cx + CHART_MARGIN.left + 10}px`)
        .style('top', `${cy + CHART_MARGIN.top - 20}px`)
        .html(`<div class="tooltip-date">${formatDate(parseDate(d.date))}</div><div class="tooltip-value">${d.value}</div>`);
    })
    .on('mouseleave touchend', function() {
      tooltipGroup.style('display', 'none');
      tooltipDiv.style('opacity', 0);
    });

  addMilestones(g, x, innerH, parseDate);

  const indicator = computeChangeIndicator(trends, trends.prePoints, trends.postPoints);

  return {
    svg, path, totalLength, oct7Line,
    oct7Label: g.select('.oct7-label'),
    preTrendLine, postTrendLine,
    confidenceBand: g.selectAll('.confidence-band'),
    indicator,
    x, oct7
  };
}

function createMultiTermChart(container, dataset) {
  const containerEl = typeof container === 'string' ? document.querySelector(container) : container;
  const rect = containerEl.getBoundingClientRect();
  const width = rect.width || 900;
  const height = rect.height || width * 0.5;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;

  const svg = d3.select(containerEl)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g')
    .attr('transform', `translate(${CHART_MARGIN.left},${CHART_MARGIN.top})`);

  const data = dataset.data;
  const terms = dataset.terms;
  const parseDate = d3.timeParse('%Y-%m-%d');
  const dates = data.map(d => parseDate(d.date));

  let maxVal = 0;
  for (const t of terms) {
    for (const d of data) {
      if (d[t] > maxVal) maxVal = d[t];
    }
  }

  const x = d3.scaleTime().domain(d3.extent(dates)).range([0, innerW]);
  const y = d3.scaleLinear().domain([0, maxVal * 1.1 || 100]).range([innerH, 0]);

  g.append('g')
    .attr('transform', `translate(0,${innerH})`)
    .call(d3.axisBottom(x).ticks(d3.timeYear.every(1)).tickFormat(d3.timeFormat('%Y')))
    .selectAll('text').attr('fill', 'var(--text-muted)').attr('font-size', '11px');
  g.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .selectAll('text').attr('fill', 'var(--text-muted)').attr('font-size', '11px');
  g.selectAll('.domain, .tick line').attr('stroke', 'rgba(255,255,255,0.1)');

  g.append('g').selectAll('line').data(y.ticks(5)).enter().append('line')
    .attr('x1', 0).attr('x2', innerW)
    .attr('y1', d => y(d)).attr('y2', d => y(d))
    .attr('stroke', 'rgba(255,255,255,0.05)');

  const exStart = parseDate(EXCLUSION_START);
  const exEnd = parseDate('2024-01-01');
  g.append('rect')
    .attr('x', x(exStart)).attr('y', 0)
    .attr('width', x(exEnd) - x(exStart)).attr('height', innerH)
    .attr('fill', 'rgba(255,255,255,0.05)');

  const oct7 = parseDate(EVENT_DATE);
  const oct7Line = g.append('line')
    .attr('x1', x(oct7)).attr('x2', x(oct7))
    .attr('y1', 0).attr('y2', innerH)
    .attr('stroke', 'var(--accent-red)')
    .attr('stroke-width', 2).attr('stroke-dasharray', '6,4')
    .attr('opacity', 0);
  g.append('text')
    .attr('class', 'oct7-label')
    .attr('x', x(oct7)).attr('y', -8)
    .attr('text-anchor', 'middle')
    .attr('fill', 'var(--accent-red)')
    .attr('font-size', '12px').attr('font-weight', '500')
    .attr('opacity', 0)
    .text('7.10.23');

  const paths = [];
  const allIndicators = [];
  const trendLineSelections = [];

  terms.forEach((term, ti) => {
    const color = MULTI_TERM_COLORS[ti % MULTI_TERM_COLORS.length];
    const termData = data.map(d => ({ date: d.date, value: d[term] }));

    const lineGen = d3.line()
      .x((d, i) => x(dates[i]))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    const path = g.append('path')
      .datum(termData)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', lineGen);

    const totalLength = path.node().getTotalLength();
    path.attr('stroke-dasharray', totalLength).attr('stroke-dashoffset', totalLength);
    paths.push({ path, totalLength, color });

    const trends = computeTrendLines(termData);
    const baseDate = termData[0].date;
    const monthToX = (idx) => { const d = new Date(baseDate); d.setMonth(d.getMonth() + idx); return x(d); };

    const preEndX = trends.prePoints.length > 0 ? trends.prePoints[trends.prePoints.length - 1].x : 0;
    const preLine = g.append('line').attr('class', `trend-pre-${ti}`)
      .attr('x1', monthToX(0)).attr('y1', y(trends.pre.predict(0)))
      .attr('x2', monthToX(preEndX)).attr('y2', y(trends.pre.predict(preEndX)))
      .attr('stroke', color).attr('stroke-width', 1).attr('stroke-dasharray', '6,3').attr('opacity', 0);

    const postStartX = trends.postPoints.length > 0 ? trends.postPoints[0].x : 0;
    const postEndX = trends.postPoints.length > 0 ? trends.postPoints[trends.postPoints.length - 1].x : 0;
    const postLine = g.append('line').attr('class', `trend-post-${ti}`)
      .attr('x1', monthToX(postStartX)).attr('y1', y(trends.post.predict(postStartX)))
      .attr('x2', monthToX(postEndX)).attr('y2', y(trends.post.predict(postEndX)))
      .attr('stroke', color).attr('stroke-width', 1).attr('stroke-dasharray', '6,3').attr('opacity', 0);

    trendLineSelections.push(preLine, postLine);
    allIndicators.push(computeChangeIndicator(trends, trends.prePoints, trends.postPoints));

    const bandPoints = [];
    for (let mx = postStartX; mx <= postEndX; mx++) {
      bandPoints.push(mx);
    }
    const bandPath = d3.area()
      .x(mx => monthToX(mx))
      .y0(mx => y(Math.max(0, trends.lowerBand(mx))))
      .y1(mx => y(trends.upperBand(mx)));

    g.append('path')
      .datum(bandPoints)
      .attr('class', 'confidence-band')
      .attr('d', bandPath)
      .attr('fill', color)
      .attr('opacity', 0.1)
      .style('display', 'none');

    g.append('line')
      .attr('class', 'confidence-band')
      .attr('x1', monthToX(postStartX))
      .attr('y1', y(trends.pre.predict(postStartX)))
      .attr('x2', monthToX(postEndX))
      .attr('y2', y(trends.pre.predict(postEndX)))
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.4)
      .style('display', 'none');
  });

  const tooltipGroup = g.append('g').style('display', 'none');
  tooltipGroup.append('line').attr('y1', 0).attr('y2', innerH)
    .attr('stroke', 'rgba(255,255,255,0.3)').attr('stroke-width', 1);
  const tooltipDiv = d3.select(containerEl).append('div').attr('class', 'chart-tooltip');

  g.append('rect')
    .attr('width', innerW).attr('height', innerH).attr('fill', 'transparent')
    .on('mousemove touchmove', function(event) {
      event.preventDefault();
      const [mx] = d3.pointer(event, this);
      const hoveredDate = x.invert(mx);
      let idx = d3.bisector(d => parseDate(d.date)).left(data, hoveredDate, 1);
      idx = Math.min(idx, data.length - 1);
      if (idx > 0) {
        const d0 = parseDate(data[idx - 1].date);
        const d1 = parseDate(data[idx].date);
        if (hoveredDate - d0 < d1 - hoveredDate) idx = idx - 1;
      }
      const d = data[idx];
      const cx = x(parseDate(d.date));
      tooltipGroup.style('display', null);
      tooltipGroup.select('line').attr('x1', cx).attr('x2', cx);

      const formatDate = d3.timeFormat('%m/%Y');
      let html = `<div class="tooltip-date">${formatDate(parseDate(d.date))}</div>`;
      terms.forEach((t, ti) => {
        const color = MULTI_TERM_COLORS[ti % MULTI_TERM_COLORS.length];
        html += `<div class="tooltip-value" style="color:${color}">${t}: ${d[t]}</div>`;
      });
      tooltipDiv.style('opacity', 1)
        .style('left', `${cx + CHART_MARGIN.left + 10}px`)
        .style('top', `${CHART_MARGIN.top}px`)
        .html(html);
    })
    .on('mouseleave touchend', function() {
      tooltipGroup.style('display', 'none');
      tooltipDiv.style('opacity', 0);
    });

  addMilestones(g, x, innerH, parseDate);

  const primaryIndicator = allIndicators[0];

  return {
    svg, paths, oct7Line,
    oct7Label: g.select('.oct7-label'),
    trendLines: trendLineSelections,
    confidenceBand: g.selectAll('.confidence-band'),
    indicator: primaryIndicator,
    allIndicators,
    terms,
    x, oct7, multiTerm: true
  };
}
