const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

function toast(msg = 'Action effectuée ✅') {
  let t = $('#toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    Object.assign(t.style, {
      position:'fixed', left:'50%', bottom:'24px', transform:'translateX(-50%)',
      padding:'12px 16px', borderRadius:'10px', background:'rgba(0,0,0,.8)',
      color:'#fff', fontSize:'14px', zIndex:9999, boxShadow:'0 10px 24px rgba(0,0,0,.25)',
      opacity:'0', transition:'opacity .15s ease'
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(() => { t.style.opacity = '1'; });
  setTimeout(() => { t.style.opacity = '0'; }, 2000);
}

function setFieldError(input, msg) {
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  let err = input.nextElementSibling?.classList?.contains('field-error')
    ? input.nextElementSibling : null;
  if (!err && msg) {
    err = document.createElement('div');
    err.className = 'field-error';
    Object.assign(err.style, { color:'crimson', fontSize:'12px', marginTop:'4px' });
    input.insertAdjacentElement('afterend', err);
  }
  if (err) {
    err.textContent = msg || '';
    if (!msg) err.remove();
  }
}

const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
(() => {
  const form = $('#contact-form') || $('form[action], form');
  if (!form) return;

  const emailInput = form.elements?.email;
  const nameInput  = form.elements?.nom || form.elements?.name;
  const msgInput   = form.elements?.message;
  const msgZone    = $('#form-message') || (() => {
    const d = document.createElement('div');
    d.id = 'form-message';
    d.setAttribute('aria-live', 'polite');
    d.style.textAlign = 'center';
    d.style.marginTop = '1rem';
    form.insertAdjacentElement('afterend', d);
    return d;
  })();
  if (msgInput) {
    let counter = msgInput.nextElementSibling?.classList?.contains('char-counter') ? msgInput.nextElementSibling : null;
    if (!counter) {
      counter = document.createElement('div');
      counter.className = 'char-counter';
      Object.assign(counter.style, { fontSize:'12px', color:'var(--muted)', textAlign:'right', marginTop:'4px' });
      msgInput.insertAdjacentElement('afterend', counter);
    }
    const updateCount = () => { counter.textContent = `${msgInput.value.length} caractères`; };
    msgInput.addEventListener('input', updateCount);
    updateCount();
  }
  nameInput?.addEventListener('blur', () => {
    const ok = (nameInput.value || '').trim().length >= 2;
    setFieldError(nameInput, ok ? '' : 'Veuillez saisir votre nom (2 caractères minimum).');
  });
  emailInput?.addEventListener('blur', () => {
    const ok = validateEmail(emailInput.value);
    setFieldError(emailInput, ok ? '' : 'Veuillez entrer une adresse e-mail valide.');
  });
  msgInput?.addEventListener('blur', () => {
    const ok = (msgInput.value || '').trim().length >= 5;
    setFieldError(msgInput, ok ? '' : 'Votre message doit contenir au moins 5 caractères.');
  });
  form.addEventListener('submit', async (e) => {
    const errs = [];
    if (nameInput && (nameInput.value || '').trim().length < 2) errs.push(setFieldError(nameInput, 'Veuillez saisir votre nom (2 caractères minimum).'));
    if (emailInput && !validateEmail(emailInput.value)) errs.push(setFieldError(emailInput, 'Veuillez entrer une adresse e-mail valide.'));
    if (msgInput && (msgInput.value || '').trim().length < 5) errs.push(setFieldError(msgInput, 'Votre message doit contenir au moins 5 caractères.'));
    if (errs.length) {
      e.preventDefault();
      toast('Merci de corriger les champs en rouge.');
      return;
    }
    const submitBtn = form.querySelector('[type="submit"]');
    const original  = submitBtn?.innerHTML;
    submitBtn && (submitBtn.disabled = true, submitBtn.innerHTML = 'Envoi…');
    e.preventDefault();
    try {
      const res  = await fetch(form.action || 'contact.php', { method: form.method || 'POST', body: new FormData(form) });
      const text = await res.text();
      const ok   = res.ok || /merci|envoy/i.test(text);

      msgZone.innerHTML = ok ? `<span style="color:seagreen">✅ ${text}</span>`
                             : `<span style="color:crimson">❌ ${text || "Une erreur s'est produite."}</span>`;
      if (ok) {
        form.reset();
        toast('Message envoyé ✅');
      } else {
        toast("Échec de l'envoi");
      }
    } catch (err) {
      console.error(err);
      msgZone.innerHTML = `<span style="color:crimson">❌ Impossible d'envoyer pour le moment.</span>`;
      toast("Impossible d'envoyer pour le moment.");
    } finally {
      submitBtn && (submitBtn.disabled = false, submitBtn.innerHTML = original);
    }
  });
})();

(() => {
  const links = $$('a[href^="#"]');
  links.forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id && id.length > 1 ? $(id) : null;
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block:'start' });
      history.replaceState(null, '', id);
    });
  });
  const sections = $$('section[id]');
  if (!sections.length) return;
  const navLinks = new Map(links.map(l => [l.getAttribute('href')?.slice(1), l]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      const link = navLinks.get(target.id);
      if (!link) return;
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  }, { rootMargin:'-40% 0px -50% 0px', threshold:0.01 });
  sections.forEach(s => io.observe(s));
})();
(() => {
  const bars = $$('.meter .bar');
  if (!bars.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      const val = getComputedStyle(target).getPropertyValue('--val')?.trim() || '80%';
      requestAnimationFrame(() => { target.style.width = val; });
      const holder = target.closest('.meter')?.querySelector('.value');
      if (holder) {
        const goal = parseInt(val, 10) || 80;
        let n = 0;
        const step = () => {
          n += Math.max(1, Math.round(goal / 30));
          if (n >= goal) n = goal;
          holder.textContent = n + '%';
          if (n < goal && !prefersReduced) requestAnimationFrame(step);
        };
        step();
      }
      io.unobserve(target);
    });
  }, { threshold: 0.35 });
  bars.forEach(b => { b.style.width = '0'; io.observe(b); });
})();
(() => {
  const wrap = $('#testimonials');
  if (!wrap) return;
  const track = $('.track', wrap);
  const prev  = $('.prev', wrap);
  const next  = $('.next', wrap);
  if (!track) return;
  const step = 320;
  prev?.addEventListener('click', () => track.scrollBy({ left: -step, behavior: prefersReduced ? 'auto' : 'smooth' }));
  next?.addEventListener('click', () => track.scrollBy({ left:  step, behavior: prefersReduced ? 'auto' : 'smooth' }));
  let isDown = false, startX = 0, scrollL = 0;
  track.addEventListener('pointerdown', (e) => { isDown = true; startX = e.pageX; scrollL = track.scrollLeft; track.setPointerCapture(e.pointerId); });
  track.addEventListener('pointermove', (e) => { if(!isDown) return; const dx = e.pageX - startX; track.scrollLeft = scrollL - dx; });
  track.addEventListener('pointerup',   () => { isDown = false; });
  wrap.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') prev?.click(); if (e.key === 'ArrowRight') next?.click(); });
  wrap.tabIndex = 0;
  let timer;
  const start = () => { if (prefersReduced) return; timer = setInterval(() => next?.click(), 4000); };
  const stop  = () => { clearInterval(timer); };
  wrap.addEventListener('mouseenter', stop);
  wrap.addEventListener('mouseleave', start);
  start();
})();
(() => {
  const root = document.documentElement;
  const btn  = $('#themeToggle');

  const saved = localStorage.getItem('theme'); 
  if (saved === 'dark') root.classList.add('dark');
  else if (saved === 'light') root.classList.remove('dark');
  else root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
  const setPressed = () => btn?.setAttribute('aria-pressed', root.classList.contains('dark') ? 'true' : 'false');
  setPressed();
  btn?.addEventListener('click', () => {
    const isDark = root.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    setPressed();
    toast(isDark ? 'Thème sombre activé 🌙' : 'Thème clair activé ☀️');
  });
  if (!saved) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', (e) => {
      root.classList.toggle('dark', e.matches);
      setPressed();
    });
  }
})();
