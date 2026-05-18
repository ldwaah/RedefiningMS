(() => {
  const FRAME_MS = 380;

  const trigger = document.getElementById("support-door-trigger");
  const entry = document.getElementById("support-door-entry");
  const stage = document.getElementById("support-door-stage");
  const stageFrames = stage ? [...stage.querySelectorAll("img")] : [];
  const portal = document.getElementById("support-door-portal");
  const closeBtn = document.getElementById("support-door-close");
  const form = document.getElementById("support-door-signup-form");
  const title = document.getElementById("support-door-title");
  const lede = entry?.querySelector(".support-door-entry__lede");
  const success = document.getElementById("support-door-signup-success");
  const introVideo = document.getElementById("support-intro-video");
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!trigger || !entry || !stage || !portal || stageFrames.length === 0) {
    return;
  }

  let isAnimating = false;

  const delay = (ms) =>
    new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });

  const stopIntroVideo = () => {
    if (!introVideo) {
      return;
    }

    introVideo.pause();
    introVideo.currentTime = 0;
    introVideo.muted = true;
    introVideo.removeAttribute("autoplay");
  };

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

  const setStageFrame = (index) => {
    stageFrames.forEach((frame, frameIndex) => {
      frame.classList.toggle("is-current", frameIndex === index);
    });
  };

  const resetStage = () => {
    setStageFrame(0);
  };

  const hideEntry = () => {
    entry.classList.remove("is-active", "is-form-visible");
    portal.classList.remove("is-visible");
    portal.setAttribute("aria-hidden", "true");
    closeBtn?.classList.remove("is-visible");
    stage.setAttribute("aria-hidden", "true");
    entry.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-door-entry-open");
    trigger.hidden = false;
    resetStage();
    isAnimating = false;

    if (window.localStorage.getItem("rr-coaching-signup") === "1") {
      showSuccessState();
    } else {
      showFormState();
    }
  };

  const showPortal = async () => {
    entry.classList.add("is-form-visible");
    stage.setAttribute("aria-hidden", "true");
    portal.setAttribute("aria-hidden", "false");
    await delay(reducedMotionQuery.matches ? 0 : 80);
    portal.classList.add("is-visible");
    closeBtn?.classList.add("is-visible");

    const firstField = form?.querySelector("input[name='name']");
    if (firstField && success?.hidden) {
      firstField.focus();
    } else {
      success?.focus({ preventScroll: true });
    }
  };

  const playDoorFrames = async () => {
    stage.setAttribute("aria-hidden", "false");

    for (let index = 0; index < stageFrames.length; index += 1) {
      setStageFrame(index);
      await delay(reducedMotionQuery.matches ? 0 : FRAME_MS);
    }

    await delay(reducedMotionQuery.matches ? 0 : 200);
  };

  const openEntry = async () => {
    if (isAnimating || entry.classList.contains("is-active")) {
      return;
    }

    isAnimating = true;
    stopIntroVideo();
    trigger.hidden = true;

    if (window.localStorage.getItem("rr-coaching-signup") === "1") {
      showSuccessState();
    } else {
      showFormState();
    }

    entry.setAttribute("aria-hidden", "false");
    entry.classList.add("is-active");
    document.body.classList.add("is-door-entry-open");

    if (reducedMotionQuery.matches) {
      await showPortal();
      isAnimating = false;
      return;
    }

    await playDoorFrames();
    await showPortal();
    isAnimating = false;
  };

  if (window.localStorage.getItem("rr-coaching-signup") === "1") {
    showSuccessState();
  }

  trigger.addEventListener("click", openEntry);
  closeBtn?.addEventListener("click", hideEntry);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && entry.classList.contains("is-active") && !isAnimating) {
      hideEntry();
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
