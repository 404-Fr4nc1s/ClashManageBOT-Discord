let selectedPlan = null;
let membersCache = []; // Cache pour stocker les membres

// Charger les membres dès le chargement de la page
function loadMembers() {
  return fetch("/api/members")
    .then(res => res.json())
    .then(data => {
      membersCache = data.members;
      populateSelect();
      return data.members;
    })
    .catch(err => {
      console.error("Erreur lors du chargement des membres:", err);
      return [];
    });
}

// Remplir le select avec les membres en cache
function populateSelect() {
  const select = document.getElementById("gdcManagerSelect");
  if (!select) return;
  
  select.innerHTML = "";
  
  // Option par défaut (non sélectionnable)
  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Sélectionnez un gérant...";
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  select.appendChild(defaultOpt);
  
  membersCache.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.username;
    select.appendChild(opt);
  });
}

function openGdcModal(plan) {
  selectedPlan = plan;
  const modal = document.getElementById("gdcModal");
  modal.classList.add("active");
  
  // Si les membres ne sont pas encore chargés, les charger
  if (membersCache.length === 0) {
    loadMembers();
  }
}

document.getElementById("cancelGdcBtn").onclick = () => {
  document.getElementById("gdcModal").classList.remove("active");
};

document.getElementById("confirmGdcBtn").onclick = () => {
  const managerId = document.getElementById("gdcManagerSelect").value;
  if (!managerId) return alert("Veuillez choisir un gérant.");

  fetch("/api/send-gdc-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan: selectedPlan, manager: managerId })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      document.getElementById("gdcModal").classList.remove("active");
    })
    .catch(err => {
      console.error("Erreur:", err);
      alert("Une erreur est survenue lors de l'envoi du plan.");
    });
};

// Charger les membres au chargement de la page
document.addEventListener("DOMContentLoaded", () => {
  loadMembers();
});