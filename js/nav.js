(function () {
  const nav = document.getElementById('category-nav');
  if (!nav) return;

  const dividers = Array.from(document.querySelectorAll('.category-divider'));
  if (dividers.length === 0) return;

  const strip = document.createElement('div');
  strip.className = 'nav-strip';

  const buttons = dividers.map((div, i) => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.textContent = CATEGORIES[i].name;
    btn.setAttribute('data-index', i);
    btn.addEventListener('click', () => {
      div.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    strip.appendChild(btn);
    return btn;
  });

  const aiBtn = document.createElement('button');
  aiBtn.className = 'nav-btn nav-btn-ai';
  aiBtn.innerHTML = '<span class="nav-ai-badge">AI</span> סיכום';
  aiBtn.addEventListener('click', () => {
    const target = document.getElementById('ai-summary');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  strip.appendChild(aiBtn);

  nav.appendChild(strip);

  let activeIndex = -1;

  function setActive(index) {
    if (index === activeIndex) return;
    if (activeIndex >= 0) buttons[activeIndex].classList.remove('active');
    aiBtn.classList.remove('active');
    activeIndex = index;
    if (index === buttons.length) {
      aiBtn.classList.add('active');
    } else {
      buttons[index].classList.add('active');
    }

    const btn = index === buttons.length ? aiBtn : buttons[index];
    if (window.innerWidth <= 768) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const idx = dividers.indexOf(entry.target);
          if (idx >= 0) setActive(idx);
        }
      }
    },
    { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
  );

  dividers.forEach((d) => observer.observe(d));

  const aiSummary = document.getElementById('ai-summary');
  if (aiSummary) {
    const aiObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(buttons.length);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    aiObserver.observe(aiSummary);
  }

  const hero = document.getElementById('hero');
  if (hero) {
    const heroObserver = new IntersectionObserver(
      ([entry]) => {
        nav.classList.toggle('hidden', entry.isIntersecting);
      },
      { threshold: 0.3 }
    );
    heroObserver.observe(hero);
  }

  nav.classList.add('hidden');
})();
