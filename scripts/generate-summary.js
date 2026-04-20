const fs = require('fs');
const path = require('path');

const POST_EVENT_START = "2024-01-01";

// --- Regression logic (same as js/regression.js) ---

function trimOutliers(points, trimPercent = 0.05) {
  if (points.length < 4) return points;
  const sorted = [...points].sort((a, b) => a.y - b.y);
  const trimCount = Math.floor(sorted.length * trimPercent);
  if (trimCount === 0) return points;
  return sorted.slice(trimCount, sorted.length - trimCount);
}

function linearRegression(points) {
  const n = points.length;
  if (n === 0) return { slope: 0, intercept: 0, predict: () => 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const { x, y } of points) {
    sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
  }
  const denom = n * sumX2 - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept, predict: (x) => slope * x + intercept };
}

function dateToMonthIndex(dateStr, baseDate) {
  const d = new Date(dateStr);
  const b = new Date(baseDate);
  return (d.getFullYear() - b.getFullYear()) * 12 + (d.getMonth() - b.getMonth());
}

function computeRMSE(regression, points) {
  if (points.length === 0) return 0;
  const sumSqErr = points.reduce((s, p) => {
    const residual = p.y - regression.predict(p.x);
    return s + residual * residual;
  }, 0);
  return Math.sqrt(sumSqErr / points.length);
}

function computeTrendLines(data) {
  const baseDate = data[0].date;
  const prePoints = [];
  const postPoints = [];
  for (const d of data) {
    const x = dateToMonthIndex(d.date, baseDate);
    if (d.date <= "2023-09-01") {
      prePoints.push({ x, y: d.value });
    }
    if (d.date >= POST_EVENT_START) {
      postPoints.push({ x, y: d.value });
    }
  }
  const pre = linearRegression(trimOutliers(prePoints));
  const rmse = computeRMSE(pre, prePoints);
  return {
    pre,
    post: linearRegression(trimOutliers(postPoints)),
    prePoints,
    postPoints,
    rmse
  };
}

// --- Indicator logic (same as js/indicators.js) ---

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

// --- Categories (same as js/config.js) ---

const CATEGORIES = [
  { name: "השבר והמלחמה", terms: ["מילואים", "איראן", "חדשות"] },
  { name: "הנפש וההתמודדות", terms: ["סטרס", "מרגיע", "מתח", "בדידות", "דיכאון", "חרדה", "אובדנות", "פוסט טראומה", "פסיכולוג", "פסיכיאטר", "כדורים"] },
  { name: "אובדן, זיכרון ורוח", terms: ["נופלים", "הנצחה", "קשישים", "משיח", 'חב"ד', "תהילים", "יהדות"] },
  { name: "המשפחה והבית", terms: ["ייעוץ זוגי", "משכנתא", "גירושין", "הריון", "אימוץ", "הלוואה"] },
  { name: "המחאה", terms: ["דמוקרטיה", "קפלן"] },
  { name: "מחשבות על עזיבה", terms: ["רילוקיישן", "ברלין", "דרכון"] },
  { name: "אסקפיזם ושגרה", terms: ["עיסוי", "הופעות", "סרטים", "טיסה", "תאילנד", "בדיחות", "כדורגל", "אלכוהול"] },
  { name: "תעסוקה וכלכלה", terms: ["משרות", "פיטורים"] }
];

// --- Load data ---

const dataDir = path.join(__dirname, '..', 'data');
const csvFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  if (lines.length < 2) return null;

  const rawHeader = lines[0];
  const headerParts = rawHeader.split(',');
  const rawTerm = headerParts.slice(1).join(',').trim();
  const term = rawTerm.replace(/""/g, '"').replace(/^"|"$/g, '').trim() || null;
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].replace(/"/g, '').split(',');
    const date = parts[0].trim();
    const val = parseInt(parts[1], 10);
    if (date && !isNaN(val)) {
      data.push({ date, value: val });
    }
  }
  return { term, data };
}

const allData = {};
for (const file of csvFiles) {
  const parsed = parseCSV(path.join(dataDir, file));
  if (parsed && parsed.term && parsed.data.length > 0) {
    allData[parsed.term] = parsed.data;
  }
}

// --- Generate summary ---

function formatSlope(slope) {
  const sign = slope >= 0 ? '+' : '';
  return `${sign}${slope.toFixed(2)}`;
}

const rows = [];

for (const cat of CATEGORIES) {
  for (const term of cat.terms) {
    const data = allData[term];
    if (!data) {
      console.error(`Missing data for term: ${term}`);
      continue;
    }

    const trends = computeTrendLines(data);
    const indicator = computeChangeIndicator(trends, trends.prePoints, trends.postPoints);

    const noChange = indicator.direction === 'neutral' || indicator.significance === 'none';

    let changeStr = '';
    let sigStr = '';
    let dirStr = '';

    if (noChange) {
      changeStr = '';
      sigStr = 'המגמה נשמרה ללא שינוי משמעותי';
      dirStr = 'ללא שינוי';
    } else {
      const sign = indicator.percent > 0 ? '+' : '';
      changeStr = `${sign}${indicator.percent}%`;
      sigStr = indicator.significance === 'significant' ? 'מובהק' : 'כמעט מובהק';
      dirStr = indicator.direction === 'up' ? 'עלייה' : 'ירידה';
    }

    const preSlope = formatSlope(trends.pre.slope);
    const postSlope = formatSlope(trends.post.slope);

    rows.push(`| ${cat.name} | ${term} | ${changeStr} | ${sigStr} | ${dirStr} | ${preSlope} | ${postSlope} |`);
  }
}

const today = new Date().toISOString().slice(0, 10);
const lastDataDate = Object.values(allData)[0]?.slice(-1)[0]?.date || 'לא ידוע';

const md = `# סיכום מגמות חיפוש בגוגל - לפני ואחרי 7 באוקטובר 2023

נתונים מ-Google Trends, ישראל. השוואת מגמה צפויה (לפי רגרסיה לינארית על התקופה שלפני 7.10) מול ממוצע בפועל אחרי 1.1.2024.

עודכן: ${today} | נתונים עד: ${lastDataDate}

| קטגוריה | מונח חיפוש | שינוי (%) | מובהקות | כיוון | שיפוע לפני 7.10 | שיפוע אחרי 7.10 |
|---------|-----------|----------|--------|-------|----------------|-----------------|
${rows.join('\n')}

---

**הסבר:**
- **שינוי (%):** ההפרש באחוזים בין הערך הצפוי (לפי מגמת לפני 7.10) לבין הממוצע בפועל אחרי ינואר 2024. ריק כשאין מובהקות.
- **מובהקות:** מובהק = הפרש מעל 2 סטיות תקן (RMSE), כמעט מובהק = בין 1.5 ל-2 סטיות תקן, המגמה נשמרה ללא שינוי משמעותי = כיוון ניטרלי או הפרש מתחת ל-1.5.
- **כיוון:** עלייה (מעל 5%), ירידה (מתחת ל-5%-), או ללא שינוי.
- **שיפוע לפני/אחרי 7.10:** שיפוע קו הרגרסיה הלינארית (יחידות Google Trends לחודש). ערך חיובי = מגמת עלייה, שלילי = מגמת ירידה.
`;

const outPath = path.join(__dirname, '..', 'trends-summary.md');
fs.writeFileSync(outPath, md, 'utf-8');
console.log(`Written to ${outPath}`);
console.log(`Total terms processed: ${rows.length}`);
