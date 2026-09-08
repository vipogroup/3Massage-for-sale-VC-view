/**
 * Hero Lab — carousel, lightbox, scroll reveal, countdown, video
 */
(function () {
    var SLIDES = [
        { img: 'assets/images/chair-cream-hires.png', hex: '#efe9df', label: 'שמנת' },
        { img: 'assets/images/chair-gray-hires.png', hex: '#7d7d80', label: 'אפור' },
        { img: 'assets/images/chair-black-hires.png', hex: '#1c1c1e', label: 'שחור' }
    ];
    var ROTATE_MS = 3800;
    var FADE_MS = 650;
    var RESUME_MS = 120000;

    function initGallery() {
        var media = document.querySelector('.vp-stage-media');
        var slideEls = media ? media.querySelectorAll('.vp-slide') : [];
        var dotsEl = document.getElementById('vpDots');
        var swEl = document.getElementById('vpSwatches');
        if (!media || slideEls.length < 2 || !dotsEl || !swEl) return;

        var idx = 0;
        var front = 0;
        var locked = false;
        var animating = false;
        var timer = null;
        var resumeTimer = null;

        SLIDES.forEach(function (s) {
            var preload = new Image();
            preload.src = s.img;
        });

        SLIDES.forEach(function (s, i) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'vp-dot';
            dot.setAttribute('aria-label', s.label);
            dot.addEventListener('click', function () { lockTo(i); });
            dotsEl.appendChild(dot);

            var sw = document.createElement('button');
            sw.type = 'button';
            sw.className = 'vp-swatch';
            sw.style.background = s.hex;
            sw.setAttribute('title', s.label);
            sw.addEventListener('click', function () { lockTo(i); });
            swEl.appendChild(sw);
        });

        function updateIndicators() {
            Array.prototype.forEach.call(dotsEl.children, function (d, di) {
                d.classList.toggle('is-on', di === idx);
            });
            Array.prototype.forEach.call(swEl.children, function (s, si) {
                s.classList.toggle('is-on', si === idx);
            });
        }

        function setSlideSrc(el, src) {
            if (el.getAttribute('src') === src) return Promise.resolve();
            return new Promise(function (resolve) {
                function done() { resolve(); }
                el.onload = done;
                el.onerror = done;
                el.src = src;
                if (el.complete) {
                    el.onload = null;
                    if (el.decode) {
                        el.decode().then(done).catch(done);
                    } else {
                        done();
                    }
                }
            });
        }

        function go(i) {
            var nextIdx = (i + SLIDES.length) % SLIDES.length;
            if (animating || nextIdx === idx) return;

            var currentEl = slideEls[front];
            var nextEl = slideEls[1 - front];
            animating = true;

            setSlideSrc(nextEl, SLIDES[nextIdx].img).then(function () {
                nextEl.classList.add('is-active');
                currentEl.classList.remove('is-active');
                front = 1 - front;
                idx = nextIdx;
                updateIndicators();
                setTimeout(function () { animating = false; }, FADE_MS);
            });
        }

        function lockTo(i) {
            locked = true;
            clearInterval(timer);
            timer = null;
            clearTimeout(resumeTimer);
            go(i);
            if (RESUME_MS > 0) {
                resumeTimer = setTimeout(function () {
                    locked = false;
                    startAuto();
                }, RESUME_MS);
            }
        }

        function startAuto() {
            clearInterval(timer);
            timer = setInterval(function () {
                if (!locked && !animating) go(idx + 1);
            }, ROTATE_MS);
        }

        updateIndicators();
        startAuto();
    }

    function initLightbox() {
        var lb = document.getElementById('s6Lb');
        var lbImg = document.getElementById('s6LbImg');
        var grid = document.getElementById('s6Grid');
        var closeBtn = document.getElementById('s6LbClose');
        if (!lb || !lbImg || !grid) return;

        grid.addEventListener('click', function (e) {
            e.preventDefault();
            var a = e.target.closest('.s6-thumb');
            if (!a) return;
            lbImg.src = a.dataset.img;
            lb.classList.add('is-open');
        });
        if (closeBtn) {
            closeBtn.addEventListener('click', function () {
                lb.classList.remove('is-open');
            });
        }
        lb.addEventListener('click', function (e) {
            if (e.target === lb) lb.classList.remove('is-open');
        });
    }

    function initReveal() {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var reveals = document.querySelectorAll('.reveal');
        if (!reveals.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        reveals.forEach(function (el) { observer.observe(el); });

        function countUp(el, target, dur, dec) {
            var start = performance.now();
            function step(now) {
                var p = Math.min((now - start) / dur, 1);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = dec ? (target * eased).toFixed(dec) : Math.round(target * eased);
                if (p < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }

        var counted = new WeakSet();
        var numObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting && !counted.has(entry.target)) {
                    counted.add(entry.target);
                    var raw = entry.target.textContent.trim();
                    var dec = raw.indexOf('.') > -1 ? 1 : 0;
                    var target = parseFloat(raw);
                    if (!isNaN(target)) {
                        if (reduce) {
                            entry.target.textContent = raw;
                        } else {
                            countUp(entry.target, target, 1200, dec);
                        }
                    }
                    numObs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });
        document.querySelectorAll('.s2-stat-num:not(.stock-sold-count):not(.stock-total-count):not(.stock-left-count), .s4-avg').forEach(function (el) {
            numObs.observe(el);
        });
    }

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    var countdownInterval = null;

    function startCountdown(endDate) {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }

        var end;
        if (endDate) {
            end = new Date(endDate).getTime();
        } else {
            var d = new Date();
            d.setDate(d.getDate() + 45);
            d.setHours(23, 59, 59, 0);
            end = d.getTime();
        }

        function tick() {
            var distance = end - Date.now();
            var dEl = document.getElementById('s2d');
            var hEl = document.getElementById('s2h');
            var mEl = document.getElementById('s2m');
            var sEl = document.getElementById('s2s');
            if (distance < 0) {
                if (dEl) dEl.textContent = '0';
                if (hEl) hEl.textContent = '00';
                if (mEl) mEl.textContent = '00';
                if (sEl) sEl.textContent = '00';
                return;
            }
            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);
            if (dEl) dEl.textContent = String(days);
            if (hEl) hEl.textContent = pad(hours);
            if (mEl) mEl.textContent = pad(minutes);
            if (sEl) sEl.textContent = pad(seconds);
        }

        tick();
        countdownInterval = setInterval(tick, 1000);
    }

    function initStickyHide() {
        var sticky = document.querySelector('.vp-sticky');
        var footer = document.querySelector('.vp-footer');
        if (!sticky || !footer) return;
        var fObs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                sticky.classList.toggle('is-hidden', entry.isIntersecting);
            });
        }, { threshold: 0.06 });
        fObs.observe(footer);
    }

    function initDemoVideo() {
        var demoPaths = { preview: 'assets/1.mp4', full: 'assets/d2.mp4' };
        var demoVideo = document.getElementById('demoVideo');
        var demoWrap = document.getElementById('demoVideoWrap');
        var demoSwitch = document.getElementById('demoVideoSwitch');
        if (!demoVideo || !demoWrap) return;

        function startPreview() {
            demoVideo.src = demoPaths.preview;
            demoVideo.muted = true;
            demoVideo.loop = true;
            demoVideo.removeAttribute('controls');
            demoVideo.playsInline = true;
            demoWrap.classList.add('is-preview');
            demoWrap.classList.remove('is-full');
            demoVideo.play().catch(function () {});
        }

        function switchToFullVideo() {
            if (demoWrap.classList.contains('is-full')) return;
            demoVideo.pause();
            demoVideo.src = demoPaths.full;
            demoVideo.muted = false;
            demoVideo.loop = true;
            demoVideo.setAttribute('controls', '');
            demoVideo.load();
            demoWrap.classList.remove('is-preview');
            demoWrap.classList.add('is-full');
            demoVideo.play().catch(function () {});
        }

        fetch('config.json?_=' + Date.now())
            .then(function (r) { return r.json(); })
            .then(function (cfg) {
                if (cfg.demoVideo) {
                    if (cfg.demoVideo.preview) demoPaths.preview = cfg.demoVideo.preview;
                    if (cfg.demoVideo.full) demoPaths.full = cfg.demoVideo.full;
                }
                startPreview();
            })
            .catch(function () { startPreview(); });

        if (demoSwitch) {
            demoSwitch.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                switchToFullVideo();
            });
        }
        demoWrap.addEventListener('click', function (e) {
            if (demoWrap.classList.contains('is-full')) return;
            if (e.target === demoSwitch || (demoSwitch && demoSwitch.contains(e.target))) return;
            switchToFullVideo();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        initGallery();
        initLightbox();
        initReveal();
        initStickyHide();
        initDemoVideo();
        startCountdown();
    });

    document.addEventListener('vipo:config-loaded', function (e) {
        var cfg = e.detail || {};
        startCountdown(cfg.endDate);
    });
})();
