/* ============================================================
   CONFANI — Frontend JS
   Client-side routing, scroll reveal, hero canvas, interactions
   ============================================================ */

(() => {
  'use strict';

  // ---- Client-side routing ----
  const pages = document.querySelectorAll('.page');
  const nav = document.getElementById('nav');

  function showPage(routeName) {
    let found = false;
    pages.forEach(p => {
      const isMatch = p.dataset.page === routeName;
      p.classList.toggle('active', isMatch);
      if (isMatch) found = true;
    });
    if (!found) {
      // fallback to home
      document.querySelector('[data-page="home"]').classList.add('active');
      routeName = 'home';
    }

    // Nav appearance: dark on hero pages, light on others
    const isHeroPage = ['home', 'for-organizations', 'for-attendees', 'product', 'company'].includes(routeName);
    nav.classList.toggle('nav-dark', isHeroPage);

    // Reset scroll
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Re-init reveals for new page
    initReveals();

    // Update URL hash
    history.replaceState(null, '', routeName === 'home' ? '#' : `#${routeName}`);
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-route]');
    if (trigger) {
      e.preventDefault();
      showPage(trigger.dataset.route);
      // close mobile drawer
      document.getElementById('mobileDrawer').classList.remove('open');
    }
  });

  // Initial route from URL hash
  const initialRoute = (window.location.hash.replace('#', '') || 'home');
  showPage(initialRoute);

  // ---- Mobile drawer ----
  document.getElementById('navToggle').addEventListener('click', () => {
    document.getElementById('mobileDrawer').classList.add('open');
  });
  document.getElementById('drawerClose').addEventListener('click', () => {
    document.getElementById('mobileDrawer').classList.remove('open');
  });

  // ---- Language switcher ----
  const langSwitch = document.getElementById('langSwitch');
  const langCurrent = document.getElementById('langCurrent');
  langSwitch.addEventListener('click', (e) => {
    e.stopPropagation();
    langSwitch.classList.toggle('open');
  });
  document.addEventListener('click', () => langSwitch.classList.remove('open'));
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      langCurrent.textContent = opt.dataset.lang.toUpperCase();
      langSwitch.classList.remove('open');
      // In production: trigger Next.js i18n route change here
    });
  });

  // ---- Auth tab toggle ----
  document.querySelectorAll('.tab-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-authtab]');
      if (!btn) return;
      const tab = btn.dataset.authtab;
      const parent = toggle.parentElement;
      toggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      parent.querySelectorAll('.tab-content').forEach(c => {
        c.classList.toggle('active', c.dataset.tabcontent === tab);
      });
    });
  });


    // ---- Pricing toggle ----
    function initPricingToggle() {
      const pricingToggle = document.getElementById('pricingToggle');
      if (!pricingToggle) return;
      const buttons = pricingToggle.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const billing = btn.getAttribute('data-billing');
          document.querySelectorAll('.price-amount').forEach(el => {
            const newVal = el.getAttribute('data-' + billing);
            if (newVal) el.textContent = newVal;
          });
        });
      });
    }
    initPricingToggle();

  // ---- Scroll reveal ----
  let revealObserver = null;
  function initReveals() {
    if (revealObserver) revealObserver.disconnect();
    const reveals = document.querySelectorAll('.page.active .reveal');
    if (!('IntersectionObserver' in window) || reveals.length === 0) {
      // Fallback: just show everything
      reveals.forEach(el => el.classList.add('in'));
      return;
    }
    document.documentElement.classList.add('js-reveal-enabled');
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => {
      // If already in viewport (above the fold), reveal immediately
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('in');
      } else {
        revealObserver.observe(el);
      }
    });
  }

  // ---- Hero spotlight follows mouse ----
  const heroSpotlights = document.querySelectorAll('.hero-spotlight');
  document.addEventListener('mousemove', (e) => {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    heroSpotlights.forEach(spot => {
      const x = (e.clientX / winW - 0.5) * 100;
      const y = (e.clientY / winH - 0.5) * 80;
      spot.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    });
  });

  // ---- Hero network background ----
  const heroCanvases = document.querySelectorAll('.hero-network');
  heroCanvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    let nodes = [];
    let mouse = { x: -1000, y: -1000 };
    let animationId = null;

    function resize() {
      canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }

    function initNodes() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const count = Math.min(45, Math.floor((w * h) / 22000));
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.6 + 0.6
        });
      }
    }

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Move nodes
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // Mouse attraction (very subtle)
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 200) {
          n.x += (dx / d) * 0.4;
          n.y += (dy / d) * 0.4;
        }
      });

      // Draw connections
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 160) {
            const opacity = (1 - d / 160) * 0.18;
            const grad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            grad.addColorStop(0, `rgba(36, 192, 252, ${opacity})`);
            grad.addColorStop(1, `rgba(196, 32, 168, ${opacity})`);
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
        grad.addColorStop(0, 'rgba(36, 192, 252, 0.6)');
        grad.addColorStop(1, 'rgba(36, 192, 252, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    function start() {
      resize();
      initNodes();
      if (animationId) cancelAnimationFrame(animationId);
      draw();
    }

    window.addEventListener('resize', start);
    start();
  });

  // ---- Animated number counter ----
  const counters = document.querySelectorAll('.hero-stat-num');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        // Just keep static — these are mixed text/numbers
      }
    });
  }, { threshold: 0.4 });
  counters.forEach(c => counterObserver.observe(c));

  // ---- Smooth nav background switch on scroll for home ----
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentPage = document.querySelector('.page.active');
    if (!currentPage) return;
    const pageName = currentPage.dataset.page;
    const isHeroPage = ['home', 'for-organizations', 'for-attendees', 'product', 'company'].includes(pageName);

    if (isHeroPage) {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight * 0.6;
      nav.classList.toggle('nav-dark', scrollY < heroHeight);
    }
    lastScroll = window.scrollY;
  }, { passive: true });

})();
function togglePricing(btn) {
  const toggle = btn.parentElement;
  toggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const billing = btn.getAttribute('data-billing');
  document.querySelectorAll('.price-amount').forEach(el => {
    const newVal = el.getAttribute('data-' + billing);
    if (newVal) el.textContent = newVal;
  });
}

function switchAuthTab(btn) {
  const toggle = btn.parentElement;
  const authForm = toggle.parentElement;
  const targetTab = btn.getAttribute('data-authtab');

  // Update button active state
  toggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Show the matching tab content, hide the others
  authForm.querySelectorAll('.tab-content').forEach(c => {
    if (c.getAttribute('data-tabcontent') === targetTab) {
      c.classList.add('active');
    } else {
      c.classList.remove('active');
    }
  });
}
