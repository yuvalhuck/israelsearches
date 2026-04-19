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
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denom = n * sumX2 - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    predict: (x) => slope * x + intercept
  };
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
    rmse,
    upperBand: (x) => pre.predict(x) + 2 * rmse,
    lowerBand: (x) => pre.predict(x) - 2 * rmse
  };
}
