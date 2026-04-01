// members-client.js
async function loadMembers() {
  const grid = document.getElementById('membersGrid');
  const loading = document.getElementById('membersLoading');
  try {
    const res = await fetch('/api/members');
    if (!res.ok) throw new Error('Impossible de charger /api/members');
    const json = await res.json();
    const members = json.memberCards || [];
    grid.innerHTML = '';

    members.forEach(m => {
      const div = document.createElement('div');
      div.className = 'member-card';
      div.setAttribute('data-name', m.name);
      div.setAttribute('data-role', m.role);
      div.setAttribute('data-th', m.townHallLevel);
      div.setAttribute('data-trophies', m.trophies);
      div.setAttribute('data-war', m.warPreference);
      div.setAttribute('data-discord-id', m.discordId || 'Aucun_ID');
      div.onclick = () => openMemberModal(div);
      div.innerHTML = `
        <h3>🧍 ${m.name}</h3>
        <p>🏰 HDV ${m.townHallLevel}</p>
        <p>🏆 ${m.trophies}</p>
        <p>⚔️ ${m.warPreference}</p>
      `;
      grid.appendChild(div);
    });
  } catch (err) {
    console.error('Erreur members-client:', err);
    if (loading) loading.innerText = 'Erreur lors du chargement des membres.';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadMembers();
});
