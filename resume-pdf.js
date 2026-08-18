(function() {
  var wrap = document.querySelector('.resume-pdf-wrap');
  if (!wrap) return;

  var pdfUrl = wrap.getAttribute('data-pdf') || 'owencorrell_resume.pdf';
  var ver = '4.4.168';
  var base = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + ver + '/build/';

  function fail() {
    wrap.innerHTML = '<p class="resume-pdf-fallback">Preview unavailable. <a href="' + pdfUrl + '">Open PDF</a></p>';
  }

  import(base + 'pdf.min.mjs')
    .then(function(mod) {
      var pdfjsLib = mod.default || mod;
      pdfjsLib.GlobalWorkerOptions.workerSrc = base + 'pdf.worker.min.mjs';
      return pdfjsLib.getDocument({ url: pdfUrl }).promise;
    })
    .then(function(pdf) {
      return new Promise(function(resolve) {
        requestAnimationFrame(resolve);
      }).then(function() {
        wrap.innerHTML = '';
        var maxW = Math.max(wrap.clientWidth, Math.min(880, window.innerWidth - 80));
        var n = 1;

        function next() {
          if (n > pdf.numPages) return Promise.resolve();
          return pdf.getPage(n).then(function(page) {
            var vp1 = page.getViewport({ scale: 1 });
            var scale = Math.min(2.25, maxW / vp1.width);
            var viewport = page.getViewport({ scale: scale });
            var canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.className = 'resume-img resume-canvas';
            var row = document.createElement('div');
            row.className = 'resume-pdf-page';
            row.appendChild(canvas);
            wrap.appendChild(row);
            n++;
            return page.render({
              canvasContext: canvas.getContext('2d'),
              viewport: viewport
            }).promise.then(next);
          });
        }

        return next();
      });
    })
    .catch(fail);
})();
