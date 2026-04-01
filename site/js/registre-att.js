// scripts/registre-att.js (static copy)

let selectedMemberRA = null;
let attack1 = null;
let attack2 = null;

// 🧍 Ouvre la modale avec les infos du joueur
function openAttackModal(card) {
  selectedMemberRA = card.getAttribute("data-name");
  attack1 = card.getAttribute("data-attack1");
  attack2 = card.getAttribute("data-attack2");

  const nameEl = document.getElementById("modalName");
  if (nameEl) nameEl.innerText = selectedMemberRA;
  const modal = document.getElementById("attackModal");
  if (modal) modal.style.display = "flex";

  // Réinitialise la zone de texte
  const attackEl = document.getElementById("modalAttack");
  if (attackEl) attackEl.innerText = "Aucune attaque sélectionnée.";
}

// ❌ Ferme la modale
function closeAttackModal() {
  const modal = document.getElementById("attackModal");
  if (modal) modal.style.display = "none";
}

// 📜 Affiche les infos de l’attaque 1 ou 2
function showAttack(num) {
  const detail = num === 1 ? attack1 : attack2;
  const el = document.getElementById("modalAttack");
  if (el) el.innerText = detail;
}

// 🎯 Ajout des écouteurs
document.addEventListener("DOMContentLoaded", () => {
  const v1 = document.getElementById("viewAttack1Btn");
  const v2 = document.getElementById("viewAttack2Btn");
  if (v1) v1.addEventListener("click", () => showAttack(1));
  if (v2) v2.addEventListener("click", () => showAttack(2));
});

// Ferme la modale si on clique à l’extérieur
window.addEventListener("click", (e) => {
  const modal = document.getElementById("attackModal");
  if (e.target === modal) closeAttackModal();
});
