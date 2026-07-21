const opening = document.querySelector("#opening");
const openButton = document.querySelector("#openInvitation");
const header = document.querySelector("#siteHeader");
const invitation = document.querySelector("#invitation");
const pageFooter = document.querySelector("footer");
const skipLink = document.querySelector("#skipLink");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.body.classList.add("no-scroll");
header.inert = true;
invitation.inert = true;
pageFooter.inert = true;
skipLink.setAttribute("tabindex", "-1");
openButton.focus();

function openInvitation() {
  if (opening.classList.contains("is-revealing") || opening.classList.contains("is-open")) return;
  openButton.disabled = true;
  opening.classList.add("is-revealing");
  const hero = document.querySelector(".hero");
  if (reducedMotion) hero.classList.add("is-entered");
  else window.setTimeout(() => hero.classList.add("is-entered"), 1200);
  window.dispatchEvent(new CustomEvent("invitation:opened"));

  const finishReveal = () => {
    opening.classList.add("is-open");
    opening.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    header.inert = false;
    invitation.inert = false;
    pageFooter.inert = false;
    skipLink.removeAttribute("tabindex");
    header.classList.add("is-visible");
    invitation.focus({ preventScroll: true });
  };

  if (reducedMotion) finishReveal();
  else window.setTimeout(finishReveal, 1550);
}

openButton.addEventListener("click", openInvitation);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !opening.classList.contains("is-open")) openInvitation();
});

window.addEventListener("scroll", () => {
  header.classList.toggle("is-scrolled", window.scrollY > 20);
}, { passive: true });

const revealItems = document.querySelectorAll(".reveal");
if (reducedMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -40px" });
  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 80}ms`;
    observer.observe(item);
  });
}

const weddingDate = new Date("2026-08-07T19:00:00+03:00");
const countdownParts = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};

function updateCountdown() {
  const distance = Math.max(0, weddingDate.getTime() - Date.now());
  const days = Math.floor(distance / 86400000);
  const hours = Math.floor((distance % 86400000) / 3600000);
  const minutes = Math.floor((distance % 3600000) / 60000);
  const seconds = Math.floor((distance % 60000) / 1000);
  countdownParts.days.textContent = String(days).padStart(2, "0");
  countdownParts.hours.textContent = String(hours).padStart(2, "0");
  countdownParts.minutes.textContent = String(minutes).padStart(2, "0");
  countdownParts.seconds.textContent = String(seconds).padStart(2, "0");
}

updateCountdown();
window.setInterval(updateCountdown, 1000);
