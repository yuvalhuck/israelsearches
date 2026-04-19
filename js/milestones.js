const MILESTONES = [
  { date: "2021-04-01", label: "השבעת הכנסת ה-24" },
  { date: "2021-04-01", label: "3 מיליון מתים מקורונה בעולם" },
  { date: "2021-04-01", label: "אסון הר מירון (45 הרוגים בדוחק)" },
  { date: "2021-05-01", label: 'פרוץ מבצע "שומר החומות" בעזה' },
  { date: "2021-06-01", label: "השבעת ממשלת בנט-לפיד (הממשלה ה-36)" },
  { date: "2021-11-01", label: "גל הדלתא, 5 מיליון מתים מקורונה בעולם" },
  { date: "2022-02-01", label: "פרוץ מלחמת רוסיה-אוקראינה" },
  { date: "2022-03-01", label: 'גל טרור ברחבי הארץ ומבצע "שובר גלים" באיו"ש' },
  { date: "2022-08-01", label: 'מבצע "עלות השחר" מול הג\'יהאד האסלאמי בעזה' },
  { date: "2022-12-01", label: "השבעת ממשלת נתניהו (הממשלה ה-37)" },
  { date: "2023-01-01", label: "מחאת ענק נגד הרפורמה המשפטית" },
  { date: "2023-03-01", label: "פיטורי שר הביטחון יואב גלנט" },
  { date: "2023-05-01", label: 'מבצע "מגן וחץ" בעזה' },
  { date: "2023-07-01", label: 'מבצע "בית וגן" בג\'נין' },
  { date: "2023-10-01", label: "מתקפת הפתע של חמאס ופרוץ מלחמה" },
  { date: "2023-10-01", label: "תחילת התמרון הקרקעי של צה\"ל בעזה" },
  { date: "2023-11-01", label: "עסקת שחרור החטופים הראשונה" },
  { date: "2024-01-01", label: "השלמת כיבוש העיר עזה" },
  { date: "2024-02-01", label: 'חילוץ 2 חטופים בחיים (מבצע "יד הזהב")' },
  { date: "2024-04-01", label: "מתקפת כטב\"מים איראנית ותגובה ישראלית" },
  { date: "2024-06-01", label: 'חילוץ 4 חטופים בחיים (מבצע "ארנון")' },
  { date: "2024-07-01", label: "חיסול איסמעיל הנייה באיראן" },
  { date: "2024-09-01", label: "מתקפת הביפרים, לחימה בלבנון וחיסול נסראללה" },
  { date: "2024-10-01", label: "מתקפת טילים בליסטיים מאיראן" },
  { date: "2024-10-01", label: "חיסול יחיא סינוואר ברפיח" },
  { date: "2024-10-01", label: 'תקיפה ישראלית באיראן (מבצע "ימי תשובה")' },
  { date: "2024-11-01", label: "בחירת דונלד טראמפ לנשיאות ארה\"ב" },
  { date: "2025-01-01", label: "תקיפה ישראלית-אמריקאית נגד החות'ים בתימן" },
  { date: "2025-01-01", label: "הפסקת אש והסכם עם חמאס" },
  { date: "2025-03-01", label: 'מבצע "עוז וחרב" בעזה' },
  { date: "2025-03-01", label: "פיטורי ראש השב\"כ רונן בר" },
  { date: "2025-05-01", label: 'מבצע "מרכבות גדעון" בעזה' },
  { date: "2025-06-01", label: "תחילת מתקפה ישראלית נגד תוכנית הגרעין האיראנית" },
  { date: "2025-10-01", label: "חתימה על הסכם לסיום המלחמה מול חמאס" },
  { date: "2025-10-01", label: "שחרור 20 החטופים החיים האחרונים מעזה" },
  { date: "2026-01-01", label: 'חילוץ גופת החטוף האחרון (מבצע "לב אמיץ")' },
  { date: "2026-02-01", label: 'תקיפה ישראלית-אמריקאית באיראן (מבצע "שאגת הארי")' },
];

function addMilestones(g, x, innerH, parseDate) {
  const xDomain = x.domain();
  const visible = MILESTONES.filter(m => {
    const d = parseDate(m.date);
    return d >= xDomain[0] && d <= xDomain[1];
  });

  if (visible.length === 0) return null;

  const grouped = {};
  for (const m of visible) {
    if (!grouped[m.date]) grouped[m.date] = [];
    grouped[m.date].push(m.label);
  }

  const markerY = -30;
  const milestoneGroup = g.append('g').attr('class', 'milestones-group');

  milestoneGroup.append('text')
    .attr('x', -8)
    .attr('y', markerY - 8)
    .attr('text-anchor', 'end')
    .attr('fill', 'var(--accent-orange)')
    .attr('font-size', '11px')
    .attr('font-family', 'var(--font-family)')
    .attr('opacity', 0.7)
    .text('אירועים מרכזיים');

  const containerEl = g.node().closest('svg').parentNode;
  let tooltipDiv = containerEl.querySelector('.milestone-tooltip-div');
  if (!tooltipDiv) {
    tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'milestone-tooltip-div';
    containerEl.appendChild(tooltipDiv);
  }

  for (const [date, labels] of Object.entries(grouped)) {
    const cx = x(parseDate(date));

    const mg = milestoneGroup.append('g')
      .attr('class', 'milestone-marker')
      .attr('transform', `translate(${cx}, ${markerY})`);

    mg.append('line')
      .attr('x1', 0).attr('x2', 0)
      .attr('y1', 6).attr('y2', -markerY)
      .attr('stroke', 'var(--accent-orange)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.3);

    mg.append('circle')
      .attr('class', 'milestone-dot')
      .attr('r', 4)
      .attr('fill', 'var(--accent-orange)')
      .attr('stroke', 'var(--bg-primary)')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.85);

    mg.append('circle')
      .attr('r', 14)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer');

    const htmlContent = labels.map(l => `<div>${l}</div>`).join('');

    mg.on('mouseenter', function() {
      const dotScreenX = cx + CHART_MARGIN.left;
      const dotScreenY = markerY + CHART_MARGIN.top;
      tooltipDiv.innerHTML = htmlContent;
      tooltipDiv.style.opacity = '1';
      tooltipDiv.style.display = 'block';
      const tipRect = tooltipDiv.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      const scale = containerRect.width / (containerEl.querySelector('svg').viewBox.baseVal.width || containerRect.width);
      let left = dotScreenX * scale - tipRect.width / 2;
      if (left < 4) left = 4;
      if (left + tipRect.width > containerRect.width - 4) left = containerRect.width - tipRect.width - 4;
      const top = dotScreenY * scale - tipRect.height - 12;
      tooltipDiv.style.left = left + 'px';
      tooltipDiv.style.top = top + 'px';
      d3.select(this).select('.milestone-dot').transition().duration(150).attr('r', 6).attr('opacity', 1);
    })
    .on('mouseleave', function() {
      tooltipDiv.style.opacity = '0';
      tooltipDiv.style.display = 'none';
      d3.select(this).select('.milestone-dot').transition().duration(150).attr('r', 4).attr('opacity', 0.85);
    });
  }

  return milestoneGroup;
}
