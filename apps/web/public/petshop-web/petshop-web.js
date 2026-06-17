/**
 * ECOPET Petshop Web — JavaScript dinâmico (Fase 2)
 * -------------------------------------------------
 * Módulos: relógio, carrossel Bootstrap, validação de formulários,
 * CEP, serviços (banho/tosa), agendamento e contadores animados.
 */
(function () {
  "use strict";

  /* ── Relógio e data em tempo real ── */
  function initClock() {
    var el = document.getElementById("petshop-clock");
    if (!el) return;

    function tick() {
      var now = new Date();
      el.textContent = now.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ── Carrossel Bootstrap — auto-play e controles customizados ── */
  function initCarousel() {
    var carouselEl = document.getElementById("petshopHeroCarousel");
    if (!carouselEl || typeof bootstrap === "undefined") return;

    var carousel = new bootstrap.Carousel(carouselEl, {
      interval: 5000,
      ride: "carousel",
      wrap: true,
      pause: "hover",
    });

    var prevBtn = document.getElementById("carouselPrev");
    var nextBtn = document.getElementById("carouselNext");
    if (prevBtn) prevBtn.addEventListener("click", function () { carousel.prev(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { carousel.next(); });
  }

  /* ── Destaque do menu ativo conforme URL ── */
  function initActiveNav() {
    var path = window.location.pathname;
    document.querySelectorAll(".petshop-navbar .nav-link").forEach(function (link) {
      var href = link.getAttribute("href");
      if (href && path === href) link.classList.add("active");
    });
  }

  /* ── Valida CEP (8 dígitos) nos formulários com endereço ── */
  function validateCepFields(form) {
    var valid = true;
    form.querySelectorAll('[id$="-zipCode"]').forEach(function (cepInput) {
      cepInput.classList.remove("is-invalid");
      var digits = cepInput.value.replace(/\D/g, "");
      if (digits.length !== 8) {
        cepInput.classList.add("is-invalid");
        valid = false;
      }
    });
    return valid;
  }

  /* ── Valida seleção de serviços Banho/Tosa no agendamento ── */
  function validateServicos(form) {
    var checkboxes = form.querySelectorAll('input[name="servico"]:checked');
    var errorEl = document.getElementById("servicoError");
    if (!form.querySelector('input[name="servico"]')) return true;

    if (checkboxes.length === 0) {
      if (errorEl) errorEl.style.display = "block";
      return false;
    }
    if (errorEl) errorEl.style.display = "none";
    return true;
  }

  /* ── Validação genérica de campos obrigatórios ── */
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

    form.querySelectorAll('input[type="email"]').forEach(function (field) {
      if (field.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        field.classList.add("is-invalid");
        valid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (!validateCepFields(form)) valid = false;
    if (!validateServicos(form)) valid = false;

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
      var servicoErr = document.getElementById("servicoError");
      if (servicoErr) servicoErr.style.display = "none";
      initSchedulingToggle();
    });

    form.querySelectorAll("input, select, textarea").forEach(function (field) {
      field.addEventListener("input", function () { field.classList.remove("is-invalid"); });
      field.addEventListener("change", function () { field.classList.remove("is-invalid"); });
    });

    form.querySelectorAll('input[name="servico"]').forEach(function (cb) {
      cb.addEventListener("change", function () {
        var errorEl = document.getElementById("servicoError");
        if (errorEl) errorEl.style.display = "none";
      });
    });
  }

  /* ── Agendamento: data mínima = hoje; endereço só em tele-busca ── */
  function initSchedulingDate() {
    var dateInput = document.getElementById("dataAgendamento");
    if (!dateInput) return;
    var today = new Date();
    var iso = today.toISOString().slice(0, 10);
    dateInput.setAttribute("min", iso);
  }

  function initSchedulingToggle() {
    var form = document.getElementById("formAgendamento");
    if (!form) return;

    var addressBlock = document.getElementById("enderecoEntregaBlock");
    var radios = form.querySelectorAll('input[name="tipoServico"]');

    function update() {
      var selected = form.querySelector('input[name="tipoServico"]:checked');
      if (!addressBlock || !selected) return;
      if (selected.value === "tele-busca") {
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

  /* ── Contador animado nos cards da home ── */
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

  /* ── Inicialização geral ── */
  function init() {
    initClock();
    initActiveNav();
    initSchedulingDate();
    initSchedulingToggle();
    initCounters();

    bindForm("formCadastroCliente", "Cadastro do tutor realizado com sucesso! Em breve entraremos em contato.");
    bindForm("formCadastroPet", "Pet cadastrado com sucesso! Vinculado ao perfil do tutor.");
    bindForm("formPerfilTutorPet", "Perfil do tutor e do pet atualizado com sucesso!");
    bindForm(
      "formAgendamento",
      "Agendamento confirmado! Você receberá confirmação por e-mail/SMS com data, horário e serviço escolhido."
    );

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
