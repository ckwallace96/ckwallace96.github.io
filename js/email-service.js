(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const status = document.getElementById("formStatus");
  const submitBtn = document.getElementById("contactSubmit");
  const fields = Array.from(form.querySelectorAll('input, textarea'))
    .filter(el => el.name && el.type !== 'hidden');

  let lockedSuccess = false;

  const resetSuccess = () => {
    if (!lockedSuccess) return;
    lockedSuccess = false;
    submitBtn.classList.remove("is-success");
    if (status) {
      status.className = "form-status idle";
      status.textContent = "";
    }
  };

  const setState = (state, msg) => {
    if (status) {
      status.textContent = msg || "";
      status.className = "form-status " + state;
    }
    submitBtn.classList.toggle("is-sending", state === "sending");
    if (state !== "success") submitBtn.classList.remove("is-success");
  };

  // As soon as the user starts editing again, return button to normal
  fields.forEach(el => {
    el.addEventListener("input", resetSuccess, { passive: true });
    el.addEventListener("focus", resetSuccess, { passive: true });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // disable while sending
    submitBtn.disabled = true;
    lockedSuccess = false;
    submitBtn.classList.remove("is-success");
    setState("sending", "Sending…");

    const data = new FormData(form);

    try {
      const res = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) throw new Error();

      // success UI
      form.reset();
      lockedSuccess = true;

      if (status) {
        status.textContent = "Message sent! I'll be in touch soon.";
        status.className = "form-status success";
      }

      submitBtn.classList.remove("is-sending");
      submitBtn.classList.add("is-success");
      submitBtn.disabled = false; // re-enable, but keep the checkmark state
    } catch {
      submitBtn.disabled = false;
      setState("error", "Something went wrong. Try again.");
    }
  });
})();