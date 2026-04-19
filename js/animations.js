gsap.registerPlugin(ScrollTrigger);

function animateGraphSection(section, chartResult) {
  const header = section.querySelector('.graph-header');
  const indicatorPanel = section.querySelector('.indicator-panel');
  const isMulti = chartResult.multiTerm;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
      end: 'bottom 20%',
      toggleActions: 'play none none reverse',
    }
  });

  tl.fromTo(header,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
  );

  if (isMulti) {
    chartResult.paths.forEach(({ path, totalLength }, i) => {
      tl.to(path.node(), {
        strokeDashoffset: 0,
        duration: 0.3,
        ease: 'power1.inOut'
      }, i === 0 ? '-=0.1' : '<');
    });
  } else {
    tl.to(chartResult.path.node(), {
      strokeDashoffset: 0,
      duration: 0.4,
      ease: 'power1.inOut'
    }, '-=0.1');
  }

  const oct7Pos = chartResult.x(chartResult.oct7);
  const drawDuration = isMulti ? 0.3 : 0.4;
  const totalWidth = chartResult.x.range()[1];
  const oct7Fraction = oct7Pos / totalWidth;

  tl.to(chartResult.oct7Line.node(), {
    opacity: 1,
    duration: 0.1,
    ease: 'power2.in'
  }, `-=${drawDuration * (1 - oct7Fraction)}`);

  tl.to(chartResult.oct7Label.node(), {
    opacity: 1,
    duration: 0.1,
  }, '<');

  tl.fromTo(chartResult.oct7Line.node(),
    { filter: 'drop-shadow(0 0 8px var(--accent-red))' },
    { filter: 'drop-shadow(0 0 0px var(--accent-red))', duration: 0.2, ease: 'power2.out' }
  );

  if (isMulti) {
    chartResult.trendLines.forEach(line => {
      tl.to(line.node(), { opacity: 0.7, duration: 0.15 }, '-=0.15');
    });
  } else {
    tl.to(chartResult.preTrendLine.node(), { opacity: 0.7, duration: 0.15 }, '-=0.1');
    tl.to(chartResult.postTrendLine.node(), { opacity: 0.7, duration: 0.15 }, '-=0.1');
  }

  tl.fromTo(indicatorPanel,
    { opacity: 0, x: -10 },
    { opacity: 1, x: 0, duration: 0.08, ease: 'power2.out' },
    '-=0.1'
  );

  gsap.to(section, {
    opacity: 0,
    scrollTrigger: {
      trigger: section,
      start: 'bottom 30%',
      end: 'bottom top',
      scrub: true,
    }
  });
}

function animateCategoryDivider(section) {
  const name = section.querySelector('.category-name');

  gsap.fromTo(name,
    { opacity: 0, scale: 0.9 },
    {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        toggleActions: 'play none none reverse',
      }
    }
  );
}

function animateHero() {
  const hero = document.getElementById('hero');
  const content = hero.querySelector('.hero-content');

  gsap.to(content, {
    y: -50,
    opacity: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }
  });
}
