(function () {
  var modal      = document.getElementById('videoModal');
  var modalVideo = document.getElementById('modalVideo');
  var openBtn    = document.getElementById('openModal');
  var closeBtn   = document.getElementById('closeModal');
  if (!modal || !openBtn) return;

  openBtn.addEventListener('click', function () {
    modal.classList.add('open');
    modalVideo.currentTime = 0;
    modalVideo.muted = false;
    modalVideo.play();
  });

  function closeModal() {
    modal.classList.remove('open');
    modalVideo.pause();
    modalVideo.muted = true;
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
})();
