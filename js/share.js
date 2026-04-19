async function shareChart(sectionEl, termName) {
  const wrapper = sectionEl.querySelector('.graph-wrapper');

  try {
    const elementsToReveal = wrapper.querySelectorAll('.graph-header, .indicator-panel');
    const originalStyles = [];
    elementsToReveal.forEach(el => {
      originalStyles.push(el.style.opacity);
      el.style.opacity = '1';
    });

    const canvas = await html2canvas(wrapper, {
      backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-primary').trim(),
      scale: 2,
      useCORS: true,
      logging: false,
    });

    elementsToReveal.forEach((el, i) => {
      el.style.opacity = originalStyles[i];
    });

    const creditCanvas = document.createElement('canvas');
    const creditH = 50;
    creditCanvas.width = canvas.width;
    creditCanvas.height = canvas.height + creditH;
    const ctx = creditCanvas.getContext('2d');
    ctx.fillStyle = '#0f1724';
    ctx.fillRect(0, 0, creditCanvas.width, creditCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    ctx.fillStyle = '#5a6d8a';
    ctx.font = '20px Heebo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${window.location.hostname} | מקור: Google Trends`,
      creditCanvas.width / 2,
      canvas.height + 32
    );

    const blob = await new Promise(resolve => creditCanvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], `trend-${termName}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `טרנד חיפוש: ${termName}`,
        url: window.location.href,
      });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trend-${termName}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (err) {
    console.error('Share failed:', err);
  }
}
