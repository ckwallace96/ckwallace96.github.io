(function () {
  // Canonical tech terms (controls capitalization + grouping)
  const TAXONOMY = {
    Languages: ["Java", "Kotlin", "Python", "SQL", "JavaScript", "TypeScript"],
    Frontend: ["React", "Angular", "Astro", "HTML", "CSS", "Tailwind CSS", "Bootstrap"],
    Backend: ["Spring Boot", "Spring MVC", "Hibernate", "JPA", "Node.js"],
    Tools: ["Git", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Docker", "Gradle", "Neovim"],
    Cloud: ["Google Cloud", "AWS", "Azure"]
  };

  // Optional: per-job "boost" chips (still derived from resume, but ensures the right emphasis)
  // You can delete these if you want purely text-detected chips.
  const JOB_HINTS = {
    "google": ["Angular", "TypeScript", "Java", "BigQuery", "SQL", "HTML", "CSS", "Figma" , "Jest", "Jasmine"],
    "origin-investments": ["React", "React Native", "Java", "JavaScript", "AWS", "MySQL", "PostgreSQL", "MongoDB", "HTML", "CSS", "Figma"],
    "perficient-facebook": ["React", "JavaScript", "HTML", "CSS", "Hack PHP", "GraphQL"]
  };

  // Keywords to detect that aren’t in taxonomy (role-flavored chips)
  const SOFT_TECH = [
    "On-call",
    "Performance",
    "UX",
    "Cross-functional",
    "Admin Dashboards",
    "End-to-end Ownership",
    "Internal Tools",
    "Production Features",
    "BigQuery",
    "Looker Studio",
    "React Native"
  ];

  const ALL_CANON = [
    ...Object.values(TAXONOMY).flat(),
    ...SOFT_TECH
  ];

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function chipHtml(label) {
    return `<span class="chip">${escapeHtml(label)}</span>`;
  }

  function normalizeForMatch(s) {
    return s.toLowerCase().replace(/\s+/g, " ").trim();
  }

  // Find canonical terms mentioned in text
  function detectTerms(text) {
    const t = normalizeForMatch(text);

    // handle variants (typescript vs TypeScript)
    const variants = new Map([
      ["typescript", "TypeScript"],
      ["javascript", "JavaScript"],
      ["tailwind", "Tailwind CSS"],
      ["gcp", "Google Cloud"]
    ]);

    const detected = [];

    for (const term of ALL_CANON) {
      const key = normalizeForMatch(term);
      if (t.includes(key)) detected.push(term);
    }

    // also check variant hits
    for (const [variant, canon] of variants.entries()) {
      if (t.includes(variant)) detected.push(canon);
    }

    return uniq(detected);
  }

  function renderJobChips() {
    const rows = document.querySelectorAll('.resume-showcase__row[data-role]');
    rows.forEach((row) => {
      const roleKey = row.getAttribute("data-role") || "";
      const desc = row.querySelector(".resume-showcase__desc");
      const mount = row.querySelector(".job-chips");
      if (!mount || !desc) return;

    //   const detected = detectTerms(desc.textContent || "");

      // merge: detected + job hints (hints keep it sharp and resume-accurate)
    //   const chips = uniq([...(JOB_HINTS[roleKey] || []), ...detected]);

      mount.innerHTML = [...(JOB_HINTS[roleKey])].map(chipHtml).join("");
    });
  }

  function renderSkillsBlock() {
    const mount = document.getElementById("resume-skills-mount");
    if (!mount) return;

    // aggregate from all job descriptions (true "from resume" behavior)
    const allDescs = Array.from(document.querySelectorAll(".resume-showcase__desc"))
      .map((el) => el.textContent || "")
      .join(" ");

    const detectedAll = detectTerms(allDescs);

    // build categories by intersection with taxonomy
    const rowsHtml = Object.entries(TAXONOMY).map(([label, items]) => {
      const present = items.filter((x) => detectedAll.includes(x));

      // if something is missing but you still want it included, add it to JOB_HINTS or the resume text
      if (present.length === 0) return ""; // hide empty categories

      return `
        <div class="skills-row">
          <span class="skills-label">${escapeHtml(label)}</span>
          <div class="skills-chips">
            ${present.map(chipHtml).join("")}
          </div>
        </div>
      `;
    }).join("");

    mount.innerHTML = `<div class="resume-skills">${rowsHtml}</div>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderJobChips();
    renderSkillsBlock();
  });
})();
