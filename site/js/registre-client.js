// registre-client.js
async function loadRegistre() {
  const grid = document.getElementById('registreMembersGrid');
  const loading = document.getElementById('registreLoading');
  try {
    const res = await fetch('/api/registre-attaques');
    if (!res.ok) throw new Error('Impossible de charger /api/registre-attaques');
    const json = await res.json();
    const members = json.memberCards || [];
    grid.innerHTML = '';

    members.forEach(m => {
      const div = document.createElement('div');
      div.className = 'member-card';
      div.setAttribute('data-name', m.name);
      div.setAttribute('data-attack1', m.attack1 ? (m.attack1.result || JSON.stringify(m.attack1)) : 'Non effectuée');
      div.setAttribute('data-attack2', m.attack2 ? (m.attack2.result || JSON.stringify(m.attack2)) : 'Non effectuée');
      div.onclick = () => openAttackModal(div);
      div.innerHTML = `<h3>🧍 ${m.name}</h3>`;
      grid.appendChild(div);
    });
  } catch (err) {
    console.error('Erreur registre-client:', err);
    if (loading) loading.innerText = 'Erreur lors du chargement du registre.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadRegistre();
});
