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
    if (activeIndex >= 0 && activeIndex < buttons.length) buttons[activeIndex].classList.remove('active');
    aiBtn.classList.remove('active');
    activeIndex = index;
    if (index === buttons.length) {
      aiBtn.classList.add('active');
    } else if (index >= 0) {
      buttons[index].classList.add('active');
    }

    const btn = index === buttons.length ? aiBtn : buttons[index];
    if (btn && window.innerWidth <= 768) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  const aiSummary = document.getElementById('ai-summary');
  const threshold = window.innerHeight * 0.35;

  function updateActive() {
    if (aiSummary) {
      const aiRect = aiSummary.getBoundingClientRect();
      if (aiRect.top < threshold && aiRect.bottom > threshold) {
        setActive(buttons.length);
        return;
      }
    }

    let best = -1;
    for (let i = dividers.length - 1; i >= 0; i--) {
      if (dividers[i].getBoundingClientRect().top < threshold) {
        best = i;
        break;
      }
    }
    if (best >= 0) setActive(best);
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActive();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

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
