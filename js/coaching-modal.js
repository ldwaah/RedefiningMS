(() => {
  const modal = document.getElementById("coaching-modal");
  const openBtn = document.getElementById("course-signup-open");
  const closeBtn = document.getElementById("coaching-modal-close");
  const backdrop = document.getElementById("coaching-modal-backdrop");
  const dialog = modal?.querySelector(".coaching-modal__dialog");
  const form = document.getElementById("coaching-signup-form");
  const title = document.getElementById("coaching-modal-title");
  const lede = modal?.querySelector(".coaching-modal__lede");
  const success = document.getElementById("coaching-signup-success");
  const siteNav = document.getElementById("site-nav");
  const navMenu = document.getElementById("site-nav-menu");
  const navToggle = document.querySelector(".site-nav__toggle");
  const navToggleLabel = document.getElementById("site-nav-toggle-label");

  if (!modal || !openBtn || !dialog) {
    return;
  }

  let lastFocused = null;

  const closeNav = () => {
    if (!siteNav) {
      return;
    }

    siteNav.classList.remove("is-menu-open");
    document.body.classList.remove("is-nav-open");
    navMenu?.setAttribute("aria-hidden", "true");
    navToggle?.setAttribute("aria-expanded", "false");

    if (navToggleLabel) {
      navToggleLabel.textContent = "Menu";
    }
  };

  const showFormState = () => {
    dialog.classList.remove("is-success");

    if (form) {
      form.hidden = false;
    }
    if (title) {
      title.hidden = false;
    }
    if (lede) {
      lede.hidden = false;
    }
    if (success) {
      success.hidden = true;
    }
  };

  const showSuccessState = () => {
    dialog.classList.add("is-success");

    if (form) {
      form.hidden = true;
    }
    if (title) {
      title.hidden = true;
    }
    if (lede) {
      lede.hidden = true;
    }
    if (success) {
      success.hidden = false;
    }

    window.localStorage.setItem("rr-coaching-signup", "1");
  };

  const openModal = () => {
    if (window.localStorage.getItem("rr-coaching-signup") === "1") {
      showSuccessState();
    } else {
      showFormState();
    }

    lastFocused = document.activeElement;
    closeNav();
    modal.removeAttribute("hidden");
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("is-open");
    document.body.classList.add("is-coaching-open");

    if (success && !success.hidden) {
      success.focus({ preventScroll: true });
    } else {
      closeBtn?.focus();
    }
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-coaching-open");

    window.setTimeout(() => {
      if (!modal.classList.contains("is-open")) {
        modal.setAttribute("hidden", "");
      }
    }, 360);

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  };

  if (window.localStorage.getItem("rr-coaching-signup") === "1") {
    showSuccessState();
  }

  openBtn.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitBtn = form.querySelector(".coaching-modal__submit");
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      const payload = new URLSearchParams(new FormData(form)).toString();

      try {
        await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: payload,
        });
        showSuccessState();
        success?.focus({ preventScroll: true });
      } catch (error) {
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      }
    });
  }
})();
