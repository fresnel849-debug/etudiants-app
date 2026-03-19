/**
 * script.js — Gestionnaire d'étudiants
 */

// ── UTILITAIRES ─────────────────────────────────────────────

function showAlert(message, type = 'success') {
  const zone = document.getElementById('alert-zone');
  if (!zone) return;
  const icon = type === 'success' ? '✓' : '✗';
  zone.innerHTML = `<div class="alert alert-${type}">${icon} ${message}</div>`;
  setTimeout(() => { zone.innerHTML = ''; }, 4000);
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
  document.querySelectorAll('.form-input').forEach(i => i.classList.remove('invalid'));
}

function setError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const err   = document.getElementById('err-' + fieldId);
  if (input) input.classList.add('invalid');
  if (err)   err.textContent = message;
}

function validateFields(nom, prenom, email, telephone, filiere, prefix = '') {
  let valid = true;
  const p = prefix ? prefix + '-' : '';

  if (!nom.trim() || nom.trim().length < 2) {
    setError(p + 'nom', 'Le nom est requis (min. 2 caractères).');
    valid = false;
  }

  if (!prenom.trim() || prenom.trim().length < 2) {
    setError(p + 'prenom', 'Le prénom est requis (min. 2 caractères).');
    valid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) {
    setError(p + 'email', "L'email est requis.");
    valid = false;
  } else if (!emailRegex.test(email.trim())) {
    setError(p + 'email', "Format d'email invalide.");
    valid = false;
  }

  if (!telephone.trim() || telephone.trim().length < 6) {
    setError(p + 'telephone', 'Le téléphone est requis.');
    valid = false;
  }

  if (!filiere.trim()) {
    setError(p + 'filiere', 'La filière est requise.');
    valid = false;
  }

  return valid;
}

// ── PAGE : INDEX.HTML ────────────────────────────────────────
if (document.getElementById('tableBody')) {

  let allData = [];

  async function loadData() {
    try {
      const res  = await fetch('lire_etudiants.php');
      const data = await res.json();
      allData = data;
      renderTable(data);
    } catch {
      document.getElementById('tableBody').innerHTML =
        '<tr><td colspan="7">Erreur de connexion au serveur.</td></tr>';
    }
  }

  function renderTable(items) {
    const tbody = document.getElementById('tableBody');
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="7">Aucun étudiant enregistré.</td></tr>';
      return;
    }
    tbody.innerHTML = items.map((e, i) => `
      <tr data-id="${e.id}">
        <td>${i + 1}</td>
        <td>${escHtml(e.nom)}</td>
        <td>${escHtml(e.prenom)}</td>
        <td>${escHtml(e.email)}</td>
        <td>${escHtml(e.telephone)}</td>
        <td>${escHtml(e.filiere)}</td>
        <td>
          <button class="btn-edit" onclick="openEdit(${e.id},'${escAttr(e.nom)}','${escAttr(e.prenom)}','${escAttr(e.email)}','${escAttr(e.telephone)}','${escAttr(e.filiere)}')">Modifier</button>
          <button class="btn-del"  onclick="openDelete(${e.id})">Supprimer</button>
        </td>
      </tr>
    `).join('');
  }

  // Recherche live (nom, prénom, email, filière)
  document.getElementById('searchInput').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    renderTable(allData.filter(e =>
      e.nom.toLowerCase().includes(q)      ||
      e.prenom.toLowerCase().includes(q)   ||
      e.email.toLowerCase().includes(q)    ||
      e.filiere.toLowerCase().includes(q)  ||
      e.telephone.includes(q)
    ));
  });

  // ── MODAL MODIFIER ──

  function openEdit(id, nom, prenom, email, telephone, filiere) {
    document.getElementById('edit-id').value        = id;
    document.getElementById('edit-nom').value       = nom;
    document.getElementById('edit-prenom').value    = prenom;
    document.getElementById('edit-email').value     = email;
    document.getElementById('edit-telephone').value = telephone;
    document.getElementById('edit-filiere').value   = filiere;
    clearErrors();
    document.getElementById('editModal').classList.add('active');
  }
  window.openEdit = openEdit;

  window.closeModal = function () {
    document.getElementById('editModal').classList.remove('active');
  };

  window.saveEdit = async function () {
    clearErrors();
    const id        = document.getElementById('edit-id').value;
    const nom       = document.getElementById('edit-nom').value;
    const prenom    = document.getElementById('edit-prenom').value;
    const email     = document.getElementById('edit-email').value;
    const telephone = document.getElementById('edit-telephone').value;
    const filiere   = document.getElementById('edit-filiere').value;

    if (!validateFields(nom, prenom, email, telephone, filiere, 'edit')) return;

    try {
      const form = new FormData();
      form.append('id',        id);
      form.append('nom',       nom.trim());
      form.append('prenom',    prenom.trim());
      form.append('email',     email.trim());
      form.append('telephone', telephone.trim());
      form.append('filiere',   filiere.trim());

      const res  = await fetch('modifier_etudiant.php', { method: 'POST', body: form });
      const data = await res.json();

      if (data.success) {
        closeModal();
        showAlert('Étudiant modifié avec succès !');
        loadData();
      } else {
        showAlert(data.message || 'Erreur lors de la modification.', 'error');
      }
    } catch {
      showAlert('Erreur de connexion.', 'error');
    }
  };

  // ── MODAL SUPPRIMER ──

  window.openDelete = function (id) {
    document.getElementById('delete-id').value = id;
    document.getElementById('deleteModal').classList.add('active');
  };

  window.closeDeleteModal = function () {
    document.getElementById('deleteModal').classList.remove('active');
  };

  window.confirmDelete = async function () {
    const id = document.getElementById('delete-id').value;
    try {
      const form = new FormData();
      form.append('id', id);
      const res  = await fetch('supprimer_etudiant.php', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        closeDeleteModal();
        showAlert('Étudiant supprimé.');
        loadData();
      } else {
        showAlert(data.message || 'Erreur lors de la suppression.', 'error');
      }
    } catch {
      showAlert('Erreur de connexion.', 'error');
    }
  };

  // Fermer modal en cliquant l'overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function (e) {
      if (e.target === this) this.classList.remove('active');
    });
  });

  loadData();
}

// ── PAGE : FORM.HTML ─────────────────────────────────────────
if (document.getElementById('mainForm')) {

  document.getElementById('mainForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    clearErrors();

    const nom       = document.getElementById('nom').value;
    const prenom    = document.getElementById('prenom').value;
    const email     = document.getElementById('email').value;
    const telephone = document.getElementById('telephone').value;
    const filiere   = document.getElementById('filiere').value;

    if (!validateFields(nom, prenom, email, telephone, filiere)) return;

    const btn = this.querySelector('button[type="submit"]');
    btn.textContent = 'Enregistrement…';
    btn.disabled = true;

    try {
      const form = new FormData();
      form.append('nom',       nom.trim());
      form.append('prenom',    prenom.trim());
      form.append('email',     email.trim());
      form.append('telephone', telephone.trim());
      form.append('filiere',   filiere.trim());

      const res  = await fetch('ajouter_etudiant.php', { method: 'POST', body: form });
      const data = await res.json();

      if (data.success) {
        showAlert('Étudiant ajouté avec succès !');
        document.getElementById('mainForm').reset();
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
      } else {
        showAlert(data.message || "Erreur lors de l'ajout.", 'error');
        btn.textContent = 'Enregistrer';
        btn.disabled = false;
      }
    } catch {
      showAlert('Erreur de connexion au serveur.', 'error');
      btn.textContent = 'Enregistrer';
      btn.disabled = false;
    }
  });
}

// ── HELPERS ──────────────────────────────────────────────────

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str).replace(/'/g, "\\'");
}
