/* ── Custom Cursor ── */
(function () {
  const dot  = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', function (e) {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll('a, button, .drama-card, .char-card').forEach(function (el) {
    el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
    el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
  });
})();

/* ── Expanding Card Accordion ── */
(function () {
  var section = document.querySelector('.cards-section');
  if (!section) return;
  var cards = section.querySelectorAll('.drama-card');

  cards.forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      cards.forEach(function (c) { c.classList.remove('is-active'); });
      card.classList.add('is-active');
    });
  });

  section.addEventListener('mouseleave', function () {
    cards.forEach(function (c) { c.classList.remove('is-active'); });
    cards[0].classList.add('is-active');
  });

  /* Intro: auto-select first card after page load */
  setTimeout(function () {
    cards[0].classList.add('is-active');
  }, 400);

  /* Touch: first tap expands, second tap follows link */
  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (!window.matchMedia('(pointer: fine)').matches) {
        if (!card.classList.contains('is-active')) {
          e.preventDefault();
          cards.forEach(function (c) { c.classList.remove('is-active'); });
          card.classList.add('is-active');
        }
      }
    });
  });
})();
