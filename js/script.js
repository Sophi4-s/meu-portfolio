document.addEventListener("DOMContentLoaded", function () {
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ponteiroFino = window.matchMedia("(pointer: fine)").matches;
  var preloader = document.getElementById("preloader");
  var lenis = null;
  var EASE = [0.76, 0, 0.24, 1];

  function bezier(t, p1, p2) {
    var u = 1 - t;
    return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
  }

  function easeInOut(progresso) {
    var inicio = 0;
    var fim = 1;
    for (var i = 0; i < 14; i++) {
      var meio = (inicio + fim) / 2;
      if (bezier(meio, EASE[0], EASE[2]) < progresso) inicio = meio;
      else fim = meio;
    }
    return bezier((inicio + fim) / 2, EASE[1], EASE[3]);
  }

  /* ===== Preloader cinematográfico ===== */
  var preloaderEncerrado = false;
  var contadorParado = false;

  function removerPreloader() {
    document.body.classList.remove("carregando");
    document.body.classList.add("pronto");
    if (preloader && preloader.parentNode) preloader.parentNode.removeChild(preloader);
    if (lenis) lenis.start();
  }

  function sairPreloader() {
    if (preloaderEncerrado) return;
    preloaderEncerrado = true;
    contadorParado = true;
    if (!preloader) {
      removerPreloader();
      return;
    }
    var pct = document.getElementById("preloaderPct");
    var barra = document.getElementById("preloaderBarra");
    if (pct) pct.textContent = "100%";
    if (barra) barra.style.width = "100%";
    document.body.classList.add("pronto");
    preloader.classList.add("saindo");
    preloader.style.pointerEvents = "none";
    window.setTimeout(removerPreloader, reduz ? 0 : 980);
  }

  function animarContador() {
    var pct = document.getElementById("preloaderPct");
    var barra = document.getElementById("preloaderBarra");
    var duracao = 1750;
    var inicio = performance.now();

    function frame(agora) {
      if (contadorParado) return;
      var t = Math.min((agora - inicio) / duracao, 1);
      var valor = Math.round(easeInOut(t) * 100);
      if (pct) pct.textContent = (valor < 10 ? "0" : "") + valor + "%";
      if (barra) barra.style.width = valor + "%";
      if (t < 1) requestAnimationFrame(frame);
      else window.setTimeout(sairPreloader, 280);
    }

    requestAnimationFrame(frame);
  }

  if (reduz || !preloader) {
    removerPreloader();
  } else {
    if (lenis) lenis.stop();
    animarContador();
    preloader.addEventListener("click", sairPreloader);
    var pular = document.getElementById("preloaderPular");
    if (pular) {
      pular.addEventListener("click", function (e) {
        e.stopPropagation();
        sairPreloader();
      });
    }
  }

  /* ===== Lenis + ScrollTrigger ===== */
  if (!reduz && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.95
    });
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
    if (document.body.classList.contains("carregando")) lenis.stop();
  }

  function irPara(destino) {
    if (!destino) return;
    var ajuste = -90;
    if (lenis) lenis.scrollTo(destino, { offset: ajuste, duration: 1.15 });
    else {
      var y = destino.getBoundingClientRect().top + window.pageYOffset + ajuste;
      window.scrollTo({ top: y, behavior: reduz ? "auto" : "smooth" });
    }
  }

  /* ===== Menu ===== */
  var toggle = document.getElementById("menuToggle");
  var menu = document.getElementById("menuLista");

  function fecharMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove("aberto");
    toggle.classList.remove("aberto");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menu");
    document.body.classList.remove("menu-aberto");
    if (lenis) lenis.start();
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var aberto = menu.classList.toggle("aberto");
      toggle.classList.toggle("aberto", aberto);
      toggle.setAttribute("aria-expanded", String(aberto));
      toggle.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
      document.body.classList.toggle("menu-aberto", aberto);
      if (lenis) {
        if (aberto) lenis.stop();
        else lenis.start();
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (!id || id === "#") return;
      var destino = document.querySelector(id);
      if (!destino) return;
      e.preventDefault();
      fecharMenu();
      irPara(destino);
    });
  });

  /* ===== Seção ativa ===== */
  var secoes = document.querySelectorAll("main section[id]");
  var linksMenu = document.querySelectorAll(".menu a, .trilho-nav a");
  var header = document.querySelector(".header");
  var barra = document.getElementById("progressoLeitura");
  var btnTopo = document.getElementById("btnTopo");
  var btnTopoFooter = document.getElementById("btnTopoFooter");
  var tick = false;

  function aoRolar() {
    var scrollAtual = window.pageYOffset || document.documentElement.scrollTop;
    var altura = document.documentElement.scrollHeight - window.innerHeight;
    if (barra) barra.style.transform = "scaleX(" + (altura > 0 ? Math.min(scrollAtual / altura, 1) : 0) + ")";
    if (header) header.classList.toggle("rolando", scrollAtual > 12);
    if (btnTopo) btnTopo.hidden = scrollAtual < 500;

    var posicao = scrollAtual + 140;
    var atual = "";
    secoes.forEach(function (s) {
      if (s.offsetTop <= posicao) atual = s.id;
    });
    linksMenu.forEach(function (a) {
      a.classList.toggle("ativo", a.getAttribute("href") === "#" + atual);
    });
    tick = false;
  }

  function agendarScroll() {
    if (!tick) {
      requestAnimationFrame(aoRolar);
      tick = true;
    }
  }

  window.addEventListener("scroll", agendarScroll, { passive: true });
  if (lenis) lenis.on("scroll", agendarScroll);
  aoRolar();

  function voltarTopo() { irPara(document.getElementById("inicio")); }
  if (btnTopo) btnTopo.addEventListener("click", voltarTopo);
  if (btnTopoFooter) btnTopoFooter.addEventListener("click", voltarTopo);

  /* ===== Filtro dos jogos ===== */
  var botoesFiltro = document.querySelectorAll(".filtro");
  var jogos = document.querySelectorAll(".jogo");
  var filtroTimer = null;

  botoesFiltro.forEach(function (botao) {
    botao.addEventListener("click", function () {
      var filtro = botao.dataset.filtro;
      if (botao.classList.contains("ativo")) return;
      botoesFiltro.forEach(function (b) { b.classList.remove("ativo"); });
      botao.classList.add("ativo");
      if (filtroTimer) clearTimeout(filtroTimer);

      jogos.forEach(function (jogo) {
        var mostrar = filtro === "todos" || jogo.dataset.categoria === filtro;
        jogo.classList.remove("entrando");
        if (!reduz && !mostrar && !jogo.classList.contains("oculto")) jogo.classList.add("saindo");
        if (!mostrar) jogo.setAttribute("tabindex", "-1");
      });

      filtroTimer = setTimeout(function () {
        jogos.forEach(function (jogo) {
          var mostrar = filtro === "todos" || jogo.dataset.categoria === filtro;
          jogo.classList.remove("saindo");
          jogo.classList.toggle("oculto", !mostrar);
          jogo.setAttribute("tabindex", mostrar ? "0" : "-1");
          if (!reduz && mostrar) {
            void jogo.offsetWidth;
            jogo.classList.add("entrando");
          }
        });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }, reduz ? 0 : 220);
    });
  });

  /* ===== FAQ ===== */
  var itensFaq = document.querySelectorAll(".faq-item");

  function definirFaq(item, abrir) {
    var botao = item.querySelector(".faq-pergunta");
    var painel = item.querySelector(".faq-painel");
    item.classList.toggle("aberto", abrir);
    botao.setAttribute("aria-expanded", String(abrir));
    painel.setAttribute("aria-hidden", String(!abrir));
  }

  itensFaq.forEach(function (item) {
    item.querySelector(".faq-pergunta").addEventListener("click", function () {
      var aberto = item.classList.contains("aberto");
      itensFaq.forEach(function (outro) {
        if (outro !== item && outro.classList.contains("aberto")) definirFaq(outro, false);
      });
      definirFaq(item, !aberto);
    });
  });

  /* ===== Scroll reveal ===== */
  var alvos = document.querySelectorAll("[data-reveal], .titulo-secao");
  document.querySelectorAll(".bento, .grid-aprender, .grid-jogos, .grid-recomendacoes, .faq-lista").forEach(function (grupo) {
    grupo.querySelectorAll("[data-reveal]").forEach(function (filho, indice) {
      filho.style.setProperty("--atraso", Math.min(indice * 70, 280) + "ms");
    });
  });

  if (!reduz && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");
    var observador = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("revelado");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    alvos.forEach(function (el) { observador.observe(el); });
  } else {
    alvos.forEach(function (el) { el.classList.add("revelado"); });
  }

  if (!reduz && typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    var retrato = document.querySelector(".retrato img");
    if (retrato) {
      gsap.to(retrato, {
        yPercent: 6,
        ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 }
      });
    }
  }

  /* ===== Modal ===== */
  var modal = document.getElementById("modal");
  var modalImg = document.getElementById("modalImg");
  var modalTitulo = document.getElementById("modalTitulo");
  var modalDetalhe = document.getElementById("modalDetalhe");
  var modalTag = document.getElementById("modalTag");
  var modalResumo = document.getElementById("modalResumo");
  var modalDinamica = document.getElementById("modalDinamica");
  var modalPorque = document.getElementById("modalPorque");
  var fechar = document.getElementById("modalFechar");
  var ultimoFoco = null;

  function abrirModal(jogo) {
    ultimoFoco = jogo;
    modalImg.src = jogo.dataset.img;
    modalImg.alt = "Imagem do jogo " + jogo.dataset.titulo;
    modalTitulo.textContent = jogo.dataset.titulo;
    modalTag.textContent = jogo.dataset.tag || "";
    modalResumo.textContent = jogo.dataset.resumo || "";
    modalDetalhe.textContent = jogo.dataset.detalhe || "";
    modalDinamica.textContent = jogo.dataset.dinamica || "";
    modalPorque.textContent = "Gosto de reunir amigos e família ao redor de um tabuleiro. " + (jogo.dataset.resumo || "");
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add("visivel"); });
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
    fechar.focus();
  }

  function fecharModal() {
    modal.classList.remove("visivel");
    document.body.style.overflow = "";
    if (lenis) lenis.start();
    window.setTimeout(function () {
      modal.hidden = true;
      modalImg.src = "";
    }, reduz ? 0 : 280);
    if (ultimoFoco) ultimoFoco.focus();
  }

  jogos.forEach(function (jogo) {
    jogo.addEventListener("click", function () { abrirModal(jogo); });
    jogo.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        abrirModal(jogo);
      }
    });
  });
  if (fechar) fechar.addEventListener("click", fecharModal);
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) fecharModal();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal && !modal.hidden) fecharModal();
  });

  /* ===== Cursor e botões magnéticos ===== */
  var cursor = document.getElementById("cursor");
  if (!reduz && ponteiroFino && cursor && window.innerWidth >= 1024) {
    document.body.classList.add("cursor-on");
    var tx = 0;
    var ty = 0;
    var cx = 0;
    var cy = 0;

    window.addEventListener("pointermove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      var alvo = e.target.closest("a, button, .jogo, .card-icone, .faq-item");
      cursor.classList.toggle("ativo", Boolean(alvo));
      cursor.classList.toggle("ver", Boolean(alvo && alvo.classList.contains("jogo")));
    }, { passive: true });

    function seguir() {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      cursor.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      requestAnimationFrame(seguir);
    }
    seguir();
  }

  if (!reduz && ponteiroFino) {
    document.querySelectorAll(".magnetico, .menu a, .trilho-nav a, .filtro").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (x * 0.22) + "px," + (y * 0.28) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  var ano = document.getElementById("ano");
  if (ano) ano.textContent = String(new Date().getFullYear());
});
