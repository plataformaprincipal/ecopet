/**
 * ECOPET Petshop Web — JavaScript dinâmico
 * Carrossel, relógio, validação de formulários e interações
 */
(function () {
  "use strict";

  /* ── Relógio e data em tempo real ── */
  function initClock() {
    var el = document.getElementById("petshop-clock");
    if (!el) return;

    function tick() {
      var now = new Date();
      var options = {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      };
      el.textContent = now.toLocaleDateString("pt-BR", options);
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ── Carrossel Bootstrap — auto-play e indicadores ── */
  function initCarousel() {
    var carouselEl = document.getElementById("petshopHeroCarousel");
    if (!carouselEl || typeof bootstrap === "undefined") return;

    var carousel = new bootstrap.Carousel(carouselEl, {
      interval: 5000,
      ride: "carousel",
      wrap: true,
      pause: "hover",
    });

    /* Botões customizados */
    var prevBtn = document.getElementById("carouselPrev");
    var nextBtn = document.getElementById("carouselNext");
    if (prevBtn) prevBtn.addEventListener("click", function () { carousel.prev(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { carousel.next(); });
  }

  /* ── Destaque do menu ativo ── */
  function initActiveNav() {
    var path = window.location.pathname;
    document.querySelectorAll(".petshop-navbar .nav-link").forEach(function (link) {
      var href = link.getAttribute("href");
      if (href && path === href) {
        link.classList.add("active");
      }
    });
  }

  /* ── Validação genérica de formulários ── */
  function validateForm(form) {
    var valid = true;
    var firstInvalid = null;

    form.querySelectorAll("[required]").forEach(function (field) {
      field.classList.remove("is-invalid");
      var empty = false;

      if (field.type === "checkbox" || field.type === "radio") {
        var name = field.name;
        var group = form.querySelectorAll('[name="' + name + '"]');
        var checked = Array.from(group).some(function (f) { return f.checked; });
        if (!checked) {
          empty = true;
          group.forEach(function (f) { f.classList.add("is-invalid"); });
        }
      } else if (!field.value.trim()) {
        empty = true;
        field.classList.add("is-invalid");
      }

      if (empty) {
        valid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    /* E-mail */
    var emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(function (field) {
      if (field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        field.classList.add("is-invalid");
        valid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (firstInvalid) firstInvalid.focus();
    return valid;
  }

  function showFeedback(form, success, message) {
    var fb = form.querySelector(".petshop-form-feedback");
    if (!fb) return;
    fb.classList.remove("success", "error", "show");
    fb.classList.add(success ? "success" : "error", "show");
    fb.textContent = message;
  }

  function bindForm(formId, successMessage) {
    var form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateForm(form)) {
        showFeedback(form, false, "Preencha todos os campos obrigatórios corretamente.");
        return;
      }
      showFeedback(form, true, successMessage);
      form.reset();
      form.querySelectorAll(".is-invalid").forEach(function (f) { f.classList.remove("is-invalid"); });
    });

    /* Remove erro ao digitar */
    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      field.addEventListener("input", function () { field.classList.remove("is-invalid"); });
      field.addEventListener("change", function () { field.classList.remove("is-invalid"); });
    });
  }

  /* ── Agendamento: mostrar/ocultar endereço ── */
  function initSchedulingToggle() {
    var form = document.getElementById("formAgendamento");
    if (!form) return;

    var addressBlock = document.getElementById("enderecoEntregaBlock");
    var radios = form.querySelectorAll('input[name="tipoServico"]');

    function update() {
      var selected = form.querySelector('input[name="tipoServico"]:checked');
      if (!addressBlock || !selected) return;
      if (selected.value === "entrega") {
        addressBlock.style.display = "block";
        addressBlock.querySelectorAll("[data-entrega-required]").forEach(function (f) {
          f.setAttribute("required", "required");
        });
      } else {
        addressBlock.style.display = "none";
        addressBlock.querySelectorAll("[data-entrega-required]").forEach(function (f) {
          f.removeAttribute("required");
          f.classList.remove("is-invalid");
        });
      }
    }

    radios.forEach(function (r) { r.addEventListener("change", update); });
    update();
  }

  /* ── Contador animado nos cards ── */
  function initCounters() {
    document.querySelectorAll("[data-counter]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-counter"), 10);
      var current = 0;
      var step = Math.ceil(target / 40);
      var timer = setInterval(function () {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = current.toLocaleString("pt-BR");
      }, 30);
    });
  }

  /* ── Inicialização ── */
  function init() {
    initClock();
    initActiveNav();
    initSchedulingToggle();
    initCounters();

    bindForm("formCadastroCliente", "Cadastro realizado com sucesso! Em breve entraremos em contato.");
    bindForm("formCadastroPet", "Pet cadastrado com sucesso! Vinculado ao perfil do tutor.");
    bindForm("formAgendamento", "Agendamento confirmado! Você receberá confirmação por e-mail/SMS.");

    /* Bootstrap carousel após bundle carregar */
    if (typeof bootstrap !== "undefined") {
      initCarousel();
    } else {
      window.addEventListener("load", initCarousel);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
