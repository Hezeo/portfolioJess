const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const progress = document.querySelector('.progress-bar');
const orb = document.querySelector('.cursor-orb');
const video = document.querySelector('.hero-video');

// If the local loop ever fails, the poster/background image remains visible.
video?.addEventListener('error', () => { video.style.display = 'none'; });

function updateScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

/* ---------------------------------------------------------
   FONT-SAFE TIMING
   Every typewriter freezes its element at its final size before
   typing. That measurement is only correct once the web fonts
   (Press Start 2P etc.) are loaded — measuring against fallback
   fonts is what let the HUD cards / profile card slide around.
--------------------------------------------------------- */
const whenFontsReady = (callback) => {
  const run = () => requestAnimationFrame(() => callback());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run).catch(run);
  } else {
    run();
  }
};

// Stable, non-layout-shifting typewriter intro.
const lead = document.querySelector('.hero-lead');
if (lead) {
  const phrase = lead.textContent.trim();
  whenFontsReady(() => {
    lead.style.minHeight = `${lead.getBoundingClientRect().height}px`;
    lead.textContent = '';
    let index = 0;
    const typeNext = () => {
      if (index < phrase.length) {
        lead.textContent += phrase[index++];
        window.setTimeout(typeNext, phrase[index - 1] === ',' || phrase[index - 1] === '.' ? 70 : 22);
      } else {
        lead.style.minHeight = '';
      }
    };
    window.setTimeout(typeNext, 450);
  });
}

/* ---------------------------------------------------------
   TYPEWRITER-ON-REVEAL FOR HEADINGS — ZERO LAYOUT SHIFT
   Walks a heading's existing child nodes (text / <br> / <em>)
   and types them back in, preserving the <em> highlight.
   The heading's final box (height AND width) is frozen first,
   so the HUD cards, profile card and side paragraphs keep
   their exact position while the characters appear.
--------------------------------------------------------- */
function typewriteHeading(el, speed = 32) {
  const rect = el.getBoundingClientRect();
  el.style.minHeight = `${rect.height}px`;
  el.style.minWidth = `${rect.width}px`;

  const segments = Array.from(el.childNodes).map((node) => {
    if (node.nodeName === 'BR') return { type: 'br' };
    if (node.nodeName === 'EM') return { type: 'em', value: node.textContent };
    return { type: 'text', value: node.textContent };
  });
  el.textContent = '';
  el.classList.add('is-typing');

  let segIndex = 0;
  function nextSegment() {
    if (segIndex >= segments.length) {
      el.classList.remove('is-typing');
      el.style.minHeight = '';
      el.style.minWidth = '';
      return;
    }
    const seg = segments[segIndex++];
    if (seg.type === 'br') {
      el.appendChild(document.createElement('br'));
      nextSegment();
      return;
    }
    const node = seg.type === 'em' ? document.createElement('em') : document.createTextNode('');
    el.appendChild(node);
    let charIndex = 0;
    const typeChar = () => {
      if (charIndex < seg.value.length) {
        if (seg.type === 'em') node.textContent += seg.value[charIndex];
        else node.nodeValue += seg.value[charIndex];
        charIndex++;
        window.setTimeout(typeChar, speed);
      } else {
        nextSegment();
      }
    };
    typeChar();
  }
  nextSegment();
}

function initTypeHeading(el) {
  if (!el || el.dataset.typed) return;
  el.dataset.typed = '1';
  whenFontsReady(() => typewriteHeading(el));
}

// Hero heading types right after fonts are ready (it's visible on load).
window.setTimeout(() => {
  initTypeHeading(document.querySelector('.landing-copy h1.type-heading'));
}, 150);

// Scroll-reveal sections: transform + opacity only, never scale the whole page.
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      entry.target.querySelectorAll('.type-heading').forEach(initTypeHeading);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });
document.querySelectorAll('.reveal-section').forEach((section) => revealObserver.observe(section));

// Cursor-driven depth for the hero layers.
const hero = document.querySelector('[data-depth-container]');
if (!reduceMotion && hero && window.innerWidth > 850) {
  hero.addEventListener('pointermove', (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    hero.querySelectorAll('[data-depth]').forEach((layer) => {
      const depth = Number(layer.dataset.depth) || 0.2;
      layer.style.transform = `translate3d(${x * depth * -22}px, ${y * depth * -16}px, 0)`;
    });
  });
  hero.addEventListener('pointerleave', () => {
    hero.querySelectorAll('[data-depth]').forEach((layer) => { layer.style.transform = ''; });
  });
}

// Premium-feeling 3D tilt on interactive cards.
if (!reduceMotion && window.innerWidth > 850) {
  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.transform = `perspective(1000px) rotateX(${y * -3.5}deg) rotateY(${x * 3.5}deg) translateY(-6px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

// Ambient cursor light on desktop.
window.addEventListener('pointermove', (event) => {
  if (reduceMotion || window.innerWidth <= 850) return;
  orb.style.left = `${event.clientX}px`;
  orb.style.top = `${event.clientY}px`;
  orb.style.opacity = '1';
}, { passive: true });

const toast = document.querySelector('.toast');
let toastTimer;
document.querySelectorAll('.project-card').forEach((card) => {
  card.addEventListener('click', (event) => {
    if (event.target.closest('a')) return;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  });
});

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });
});

// Lightweight scroll-depth choreography: child layers drift a few pixels, never scale the page.
function updateSectionDepth() {
  if (reduceMotion) return;
  document.querySelectorAll('.reveal-section.visible').forEach((section) => {
    const rect = section.getBoundingClientRect();
    const centerOffset = (window.innerHeight * 0.5 - (rect.top + rect.height * 0.5)) * 0.035;
    const clamped = Math.max(-10, Math.min(10, centerOffset));
    section.style.setProperty('--scroll-drift', `${clamped}px`);
  });
}
window.addEventListener('scroll', updateSectionDepth, { passive: true });
window.addEventListener('resize', updateSectionDepth, { passive: true });
updateSectionDepth();

// A second typewriter moment in the contact terminal.
const statusTyping = document.querySelector('.status-typing');
if (statusTyping) {
  const statusText = statusTyping.dataset.typing || statusTyping.textContent.trim();
  statusTyping.textContent = '';
  let statusIndex = 0;
  const typeStatus = () => {
    if (statusIndex < statusText.length) {
      statusTyping.textContent += statusText[statusIndex++];
      window.setTimeout(typeStatus, 55);
    }
  };
  window.setTimeout(typeStatus, 900);
}

/* CONTACT MODAL — unchanged from your version */
const contactModal = document.querySelector('#contactModal');
const contactTriggers = document.querySelectorAll('.contact-trigger');
const closeModalButtons = document.querySelectorAll('[data-close-modal]');
let lastFocusedElement = null;
let lockedScrollY = 0;

function lockPageScroll() {
  lockedScrollY = window.scrollY || window.pageYOffset;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
}

function unlockPageScroll() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.paddingRight = '';
  window.scrollTo(0, lockedScrollY);
}

function closeContactModal() {
  if (!contactModal) return;
  contactModal.classList.remove('is-open');
  contactModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  unlockPageScroll();
  lastFocusedElement?.focus();
}
function openContactModal() {
  if (!contactModal) return;
  lastFocusedElement = document.activeElement;
  lockPageScroll();
  contactModal.classList.add('is-open');
  contactModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  contactModal.querySelector('.modal-close')?.focus({ preventScroll: true });
}
contactTriggers.forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    openContactModal();
  });
});
closeModalButtons.forEach((button) => button.addEventListener('click', closeContactModal));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeContactModal();
});