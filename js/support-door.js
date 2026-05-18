(() => {
  const FRAMES = ["doors/1.svg", "doors/2.svg", "doors/3.svg", "doors/4.svg"];
  const FRAME_MS = 520;

  const trigger = document.getElementById("support-door-trigger");
  const triggerFrame = document.getElementById("support-door-frame");
  const entry = document.getElementById("support-door-entry");
  const anim = document.getElementById("support-door-anim");
  const animFrame = document.getElementById("support-door-anim-frame");
  const portal = document.getElementById("support-door-portal");
  const closeBtn = document.getElementById("support-door-close");
  const form = document.getElementById("support-door-signup-form");
  const title = document.getElementById("support-door-title");
  const lede = entry?.querySelector(".support-door-entry__lede");
  const success = document.getElementById("support-door-signup-success");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!trigger || !entry || !anim || !animFrame || !portal) {
    return;
  }

  let isAnimating = false;

  FRAMES.forEach((src) => {
    const image = new Image();
    image.src = src;
  });

  const delay = (ms) =>
    new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });

  const showFormState = () => {
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

  const resetEntry = () => {
    entry.classList.remove("is-active", "is-centering", "is-form-visible");
    portal.classList.remove("is-visible");
    portal.setAttribute("hidden", "");
    closeBtn?.classList.remove("is-visible");
    animFrame.src = FRAMES[0];
    if (triggerFrame) {
      triggerFrame.src = FRAMES[0];
    }
    anim.style.opacity = "";
    entry.setAttribute("hidden", "");
    entry.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-door-entry-open");
    trigger.hidden = false;
    isAnimating = false;

    if (window.localStorage.getItem("rr-coaching-signup") === "1") {
      showSuccessState();
    } else {
      showFormState();
    }
  };

  const closeEntry = () => {
    if (isAnimating) {
      return;
    }
    resetEntry();
  };

  const revealPortal = async () => {
    entry.classList.add("is-centering");
    await delay(reducedMotionQuery.matches ? 0 : 700);
    entry.classList.add("is-form-visible");
    portal.removeAttribute("hidden");
    await delay(reducedMotionQuery.matches ? 0 : 120);
    portal.classList.add("is-visible");
    closeBtn?.classList.add("is-visible");
    closeBtn?.focus();
  };

  const playDoorFrames = async () => {
    for (let index = 0; index < FRAMES.length; index += 1) {
      animFrame.src = FRAMES[index];
      if (index < FRAMES.length - 1) {
        await delay(reducedMotionQuery.matches ? 0 : FRAME_MS);
      } else {
        await delay(reducedMotionQuery.matches ? 0 : FRAME_MS + 80);
      }
    }
  };

  const openEntry = async () => {
    if (isAnimating) {
      return;
    }

    isAnimating = true;
    trigger.hidden = true;

    if (window.localStorage.getItem("rr-coaching-signup") === "1") {
      showSuccessState();
    } else {
      showFormState();
    }

    entry.removeAttribute("hidden");
    entry.setAttribute("aria-hidden", "false");
    entry.classList.add("is-active");
    document.body.classList.add("is-door-entry-open");
    animFrame.src = FRAMES[0];

    if (reducedMotionQuery.matches) {
      await revealPortal();
      isAnimating = false;
      return;
    }

    await playDoorFrames();
    await revealPortal();
    isAnimating = false;
  };

  if (window.localStorage.getItem("rr-coaching-signup") === "1") {
    showSuccessState();
  }

  trigger.addEventListener("click", openEntry);
  closeBtn?.addEventListener("click", closeEntry);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && entry.classList.contains("is-active") && !isAnimating) {
      closeEntry();
    }
  });

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitBtn = form.querySelector(".support-door-entry__submit");
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
