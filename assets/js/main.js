/* ==========================================================================
   Jack Experts — interações e motion (JavaScript puro).
   jQuery continua carregado apenas para o formoid (formulário de contato).
   ========================================================================== */
(function () {
    "use strict";

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var $ = function (sel, ctx) {
        return (ctx || document).querySelector(sel);
    };
    var $$ = function (sel, ctx) {
        return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
    };
    var wait = function (ms) {
        return new Promise(function (r) {
            setTimeout(r, ms);
        });
    };

    /* ----------------------------------------------------------------------
       Header: estado ao rolar, barra de progresso e botão de topo
       ---------------------------------------------------------------------- */
    var header = $(".site-header");
    var progress = $(".scroll-progress");
    var backTop = $(".back-to-top");
    var ticking = false;

    function onScroll() {
        var y = window.scrollY;
        var max = document.documentElement.scrollHeight - window.innerHeight;
        if (header) header.classList.toggle("is-scrolled", y > 20);
        if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
        if (backTop) backTop.classList.toggle("is-visible", y > 600);
        ticking = false;
    }

    window.addEventListener(
        "scroll",
        function () {
            if (!ticking) {
                window.requestAnimationFrame(onScroll);
                ticking = true;
            }
        },
        { passive: true }
    );
    onScroll();

    if (backTop) {
        backTop.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        });
    }

    // Home: o logo do header aparece quando o logo do hero sai da tela.
    var heroLogo = $(".hero__logo");
    if (header && heroLogo && "IntersectionObserver" in window) {
        new IntersectionObserver(
            function (entries) {
                header.classList.toggle("show-brand", !entries[0].isIntersecting);
            },
            { rootMargin: "-80px 0px 0px 0px" }
        ).observe(heroLogo);
    } else if (header) {
        header.classList.add("show-brand");
    }

    /* ----------------------------------------------------------------------
       Navegação: menu mobile e submenus
       ---------------------------------------------------------------------- */
    var navToggle = $(".nav-toggle");
    if (navToggle) {
        navToggle.addEventListener("click", function () {
            var open = document.body.classList.toggle("nav-open");
            navToggle.setAttribute("aria-expanded", open ? "true" : "false");
        });
    }

    $$(".sub-toggle").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var li = btn.parentElement;
            var open = !li.classList.contains("is-open");
            // fecha irmãos
            $$(":scope > li.is-open", li.parentElement).forEach(function (s) {
                if (s !== li) s.classList.remove("is-open");
            });
            li.classList.toggle("is-open", open);
            btn.setAttribute("aria-expanded", open ? "true" : "false");
        });
    });

    document.addEventListener("click", function (e) {
        if (!e.target.closest(".nav")) {
            $$(".nav li.is-open").forEach(function (li) {
                li.classList.remove("is-open");
            });
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            $$(".nav li.is-open").forEach(function (li) {
                li.classList.remove("is-open");
            });
            if (document.body.classList.contains("nav-open")) {
                document.body.classList.remove("nav-open");
                if (navToggle) navToggle.setAttribute("aria-expanded", "false");
            }
        }
    });

    $$(".nav a").forEach(function (a) {
        a.addEventListener("click", function () {
            if (a.getAttribute("href").charAt(0) === "#") {
                document.body.classList.remove("nav-open");
                if (navToggle) navToggle.setAttribute("aria-expanded", "false");
            }
        });
    });

    /* ----------------------------------------------------------------------
       Animação de escrita (a mesma ideia do site original, agora com
       digitação, pausa e "backspace")
       ---------------------------------------------------------------------- */
    $$("[data-typewriter]").forEach(function (el) {
        var words = JSON.parse(el.getAttribute("data-typewriter"));
        var out = $(".typed__text", el) || el;
        var i = 0;

        if (reduceMotion) {
            out.textContent = words[0];
            setInterval(function () {
                i = (i + 1) % words.length;
                out.textContent = words[i];
            }, 2200);
            return;
        }

        (async function loop() {
            for (;;) {
                var word = words[i];
                for (var c = 1; c <= word.length; c++) {
                    out.textContent = word.slice(0, c);
                    await wait(70 + Math.random() * 70);
                }
                await wait(1400);
                for (var d = word.length - 1; d >= 0; d--) {
                    out.textContent = word.slice(0, d);
                    await wait(32);
                }
                await wait(260);
                i = (i + 1) % words.length;
            }
        })();
    });

    // Digita o texto de um elemento uma única vez (títulos das páginas internas)
    $$("[data-type-once]").forEach(function (el) {
        var text = el.textContent.trim();
        if (reduceMotion) return;
        el.setAttribute("aria-label", text);
        el.textContent = "";
        var span = document.createElement("span");
        span.setAttribute("aria-hidden", "true");
        var cursor = document.createElement("span");
        cursor.className = "cursor";
        cursor.setAttribute("aria-hidden", "true");
        el.appendChild(span);
        el.appendChild(cursor);
        (async function () {
            await wait(350);
            for (var c = 1; c <= text.length; c++) {
                span.textContent = text.slice(0, c);
                await wait(text.charAt(c - 1) === " " ? 90 : 45 + Math.random() * 45);
            }
        })();
    });

    /* ----------------------------------------------------------------------
       Terminal do hero: linhas digitadas em sequência
       ---------------------------------------------------------------------- */
    var term = $("[data-terminal]");
    if (term) {
        var script = JSON.parse(term.getAttribute("data-terminal"));
        var body = $(".win__body", term);

        var render = function (line) {
            var div = document.createElement("div");
            div.className = "term__line";
            body.appendChild(div);
            return div;
        };

        var escapeHtml = function (s) {
            return s.replace(/[&<>]/g, function (ch) {
                return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch];
            });
        };

        if (reduceMotion) {
            script.forEach(function (l) {
                var div = render();
                div.innerHTML = l.cmd ? '<span class="p">$</span> ' + escapeHtml(l.cmd) : '<span class="' + (l.cls || "") + '">' + escapeHtml(l.out) + "</span>";
            });
        } else {
            (async function run() {
                await wait(900);
                for (;;) {
                    body.innerHTML = "";
                    for (var k = 0; k < script.length; k++) {
                        var l = script[k];
                        var div = render();
                        if (l.cmd) {
                            for (var c = 0; c <= l.cmd.length; c++) {
                                div.innerHTML = '<span class="p">$</span> ' + escapeHtml(l.cmd.slice(0, c)) + '<span class="cursor cursor--block"></span>';
                                await wait(40 + Math.random() * 60);
                            }
                            await wait(350);
                            div.innerHTML = '<span class="p">$</span> ' + escapeHtml(l.cmd);
                        } else {
                            div.innerHTML = '<span class="' + (l.cls || "") + '">' + escapeHtml(l.out) + "</span>";
                            await wait(220);
                        }
                    }
                    var idle = render();
                    idle.innerHTML = '<span class="p">$</span> <span class="cursor cursor--block"></span>';
                    await wait(5200);
                }
            })();
        }
    }

    /* ----------------------------------------------------------------------
       Mascote: leve parallax seguindo o mouse
       ---------------------------------------------------------------------- */
    var art = $(".hero__art");
    if (art && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
        var hero = $(".hero");
        hero.addEventListener("pointermove", function (e) {
            var r = hero.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - 0.5;
            var y = (e.clientY - r.top) / r.height - 0.5;
            art.style.setProperty("--mx", (x * 18).toFixed(1) + "px");
            art.style.setProperty("--my", (y * 14).toFixed(1) + "px");
        });
        hero.addEventListener("pointerleave", function () {
            art.style.setProperty("--mx", "0px");
            art.style.setProperty("--my", "0px");
        });
    }

    /* ----------------------------------------------------------------------
       Títulos: quebra em palavras para animação de entrada
       ---------------------------------------------------------------------- */
    $$("[data-split]").forEach(function (el) {
        var idx = 0;
        var walk = function (node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                if (child.nodeType === 3) {
                    var frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(function (part) {
                        if (!part) return;
                        if (/^\s+$/.test(part)) {
                            frag.appendChild(document.createTextNode(" "));
                        } else {
                            var w = document.createElement("span");
                            w.className = "w";
                            var inner = document.createElement("span");
                            inner.style.setProperty("--i", idx++);
                            inner.textContent = part;
                            w.appendChild(inner);
                            frag.appendChild(w);
                        }
                    });
                    child.parentNode.replaceChild(frag, child);
                } else if (child.nodeType === 1) {
                    walk(child);
                }
            });
        };
        walk(el);
        el.classList.add("split");
    });

    /* ----------------------------------------------------------------------
       Revelar ao rolar + contadores
       ---------------------------------------------------------------------- */
    $$("[data-stagger]").forEach(function (group) {
        var step = parseFloat(group.getAttribute("data-stagger")) || 0.08;
        Array.prototype.slice.call(group.children).forEach(function (child, n) {
            if (!child.hasAttribute("data-reveal")) child.setAttribute("data-reveal", group.getAttribute("data-stagger-type") || "");
            child.style.setProperty("--d", (Math.min(n, 12) * step).toFixed(2) + "s");
        });
    });

    var fmt = new Intl.NumberFormat("pt-BR");

    function countUp(el) {
        var target = parseInt(el.getAttribute("data-count"), 10);
        if (reduceMotion) {
            el.textContent = fmt.format(target);
            return;
        }
        var dur = 1800;
        var start = performance.now();
        (function tick(now) {
            var t = Math.min((now - start) / dur, 1);
            var eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            el.textContent = fmt.format(Math.round(target * eased));
            if (t < 1) requestAnimationFrame(tick);
        })(start);
    }

    var revealables = $$("[data-reveal], .split, [data-count]");
    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    var el = entry.target;
                    if (el.hasAttribute("data-count")) countUp(el);
                    else el.classList.add("is-visible");
                    io.unobserve(el);
                });
            },
            { threshold: 0, rootMargin: "0px 0px -12% 0px" }
        );
        revealables.forEach(function (el) {
            io.observe(el);
        });
    } else {
        revealables.forEach(function (el) {
            if (el.hasAttribute("data-count")) el.textContent = fmt.format(+el.getAttribute("data-count"));
            el.classList.add("is-visible");
        });
    }

    /* ----------------------------------------------------------------------
       Política de privacidade: índice gerado a partir dos títulos numerados
       ---------------------------------------------------------------------- */
    var policy = $(".policy-content");
    var toc = $(".toc ol");
    if (policy && toc) {
        var heads = $$("p > strong, p > span > strong", policy).filter(function (s) {
            var t = s.textContent.replace(/\s+/g, " ").trim();
            return t.length > 3 && /^(ESCOPO|\d+\s*[.\-–])/.test(t);
        });
        var links = [];
        heads.forEach(function (s, n) {
            var p = s.closest("p");
            var id = "secao-" + (n + 1);
            p.id = id;
            p.classList.add("anchor");
            if (n > 0) p.classList.add("policy-h");
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.href = "#" + id;
            a.textContent = s.textContent.replace(/\s+/g, " ").trim().replace(/^(\d+)\s*[.\-–]\s*/, "$1. ").toLowerCase().replace(/(^|\.\s)(\p{L})/gu, function (m) {
                return m.toUpperCase();
            });
            li.appendChild(a);
            toc.appendChild(li);
            links.push({ p: p, a: a });
        });

        if ("IntersectionObserver" in window) {
            var tio = new IntersectionObserver(
                function (entries) {
                    entries.forEach(function (entry) {
                        if (!entry.isIntersecting) return;
                        links.forEach(function (l) {
                            l.a.classList.toggle("is-active", l.p === entry.target);
                        });
                    });
                },
                { rootMargin: "-20% 0px -70% 0px" }
            );
            links.forEach(function (l) {
                tio.observe(l.p);
            });
        }
    }
})();
