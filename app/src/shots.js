// Neon Coast Cover Studio — screenshot scenes.
//
// ?shot=cover   renders the cover alone, filling the viewport: the dossier
//               frame. The viewport size is the shot size (1280x720,
//               1024x1280 or 1080x1080), so one render is the screenshot.
// ?shot=editor  opens the editor with the sample photos loaded.
// No query     opens the editor normally.
//
// When the frame is ready, window.__shotReady is set so the screenshot
// driver knows it can capture.

(function () {
  'use strict';

  function param(name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function fontsReady() {
    if (document.fonts && document.fonts.load) {
      return Promise.all([
        document.fonts.load('16px Anton'),
        document.fonts.load('16px Pacifico'),
        document.fonts.ready,
      ]).catch(function () {});
    }
    return Promise.resolve();
  }

  function loadSamples() {
    var loaders = window.NC.faces.SAMPLES.map(function (s) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () {
          resolve({ id: s.id, img: img });
        };
        img.onerror = reject;
        img.src = s.src;
      });
    });
    return Promise.all(loaders).then(function (list) {
      var map = {};
      list.forEach(function (entry) {
        map[entry.id] = entry.img;
      });
      return map;
    });
  }

  function shotCover() {
    document.body.classList.add('shot-cover');
    var canvas = document.getElementById('stage');
    var W = window.innerWidth;
    var H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    return Promise.all([loadSamples(), fontsReady()]).then(function (results) {
      var images = results[0];
      var ctx = canvas.getContext('2d');
      window.NC.cover.renderCover(ctx, W, H, {
        layout: 'hero',
        grade: 'sunset',
        title: 'NEON COAST',
        subtitle: 'Paid in Sunsets',
        images: images,
      });
      window.__shotReady = true;
    });
  }

  function shotEditor() {
    document.body.classList.add('shot-editor');
    return window.NC.editor.init().then(function () {
      window.__shotReady = true;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var shot = param('shot');
    if (shot === 'cover') {
      shotCover();
    } else if (shot === 'editor') {
      shotEditor();
    } else {
      window.NC.editor.init();
    }
  });
})();
