import { supabase, getCategories, getTags, getResources, getRepositories } from './supabaseClient.js';

let currentUser = null;
let categories = [];
let tags = [];
let currentEditItem = null;
let currentTab = 'resources';

async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    currentUser = session.user;
    showAdminSection();
  } else {
    showLoginSection();
  }
}

function showLoginSection() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('adminSection').classList.add('hidden');
}

function showAdminSection() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('adminSection').classList.remove('hidden');
  loadAllData();
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('loginError');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    currentUser = data.user;
    showAdminSection();
  } catch (error) {
    errorEl.textContent = error.message;
    errorEl.classList.remove('hidden');
  }
}

async function handleLogout() {
  await supabase.auth.signOut();
  currentUser = null;
  showLoginSection();
}

async function loadAllData() {
  categories = await getCategories();
  tags = await getTags();
  loadResourcesList();
}

async function loadResourcesList() {
  const container = document.getElementById('resourcesList');
  try {
    const resources = await getResources();

    if (resources.length === 0) {
      container.innerHTML = '<p class="no-results">No resources yet. Add your first one!</p>';
      return;
    }

    container.innerHTML = resources.map(resource => `
      <div class="admin-item">
        <div class="item-content">
          <h4>${resource.title}</h4>
          <p>${resource.description.substring(0, 150)}${resource.description.length > 150 ? '...' : ''}</p>
          <div class="item-meta">
            <span>Type: ${resource.type}</span>
            <span>Category: ${resource.category?.name || 'None'}</span>
            <span>Difficulty: ${resource.difficulty_level}</span>
            ${resource.featured ? '<span>⭐ Featured</span>' : ''}
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="window.editResource('${resource.id}')">Edit</button>
          <button class="btn-delete" onclick="window.deleteResource('${resource.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading resources:', error);
    container.innerHTML = '<p class="error">Failed to load resources.</p>';
  }
}

async function loadReposList() {
  const container = document.getElementById('reposList');
  try {
    const repos = await getRepositories();

    if (repos.length === 0) {
      container.innerHTML = '<p class="no-results">No repositories yet. Add your first one!</p>';
      return;
    }

    container.innerHTML = repos.map(repo => `
      <div class="admin-item">
        <div class="item-content">
          <h4>${repo.name}</h4>
          <p>${repo.description}</p>
          <div class="item-meta">
            <span>Language: ${repo.language}</span>
            <span>Category: ${repo.category?.name || 'None'}</span>
            ${repo.stars > 0 ? `<span>⭐ ${repo.stars}</span>` : ''}
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="window.editRepo('${repo.id}')">Edit</button>
          <button class="btn-delete" onclick="window.deleteRepo('${repo.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading repositories:', error);
    container.innerHTML = '<p class="error">Failed to load repositories.</p>';
  }
}

async function loadCategoriesList() {
  const container = document.getElementById('categoriesList');
  try {
    if (categories.length === 0) {
      container.innerHTML = '<p class="no-results">No categories yet.</p>';
      return;
    }

    container.innerHTML = categories.map(category => `
      <div class="admin-item">
        <div class="item-content">
          <h4>${category.icon} ${category.name}</h4>
          <p>${category.description}</p>
          <div class="item-meta">
            <span>Slug: ${category.slug}</span>
            <span>Order: ${category.sort_order}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="window.editCategory('${category.id}')">Edit</button>
          <button class="btn-delete" onclick="window.deleteCategory('${category.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading categories:', error);
    container.innerHTML = '<p class="error">Failed to load categories.</p>';
  }
}

async function loadTagsList() {
  const container = document.getElementById('tagsList');
  try {
    if (tags.length === 0) {
      container.innerHTML = '<p class="no-results">No tags yet.</p>';
      return;
    }

    container.innerHTML = tags.map(tag => `
      <div class="admin-item">
        <div class="item-content">
          <h4>${tag.name}</h4>
          <div class="item-meta">
            <span>Slug: ${tag.slug}</span>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="window.editTag('${tag.id}')">Edit</button>
          <button class="btn-delete" onclick="window.deleteTag('${tag.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading tags:', error);
    container.innerHTML = '<p class="error">Failed to load tags.</p>';
  }
}

function openModal(title, fields, onSave) {
  document.getElementById('modalTitle').textContent = title;

  const formFields = document.getElementById('formFields');
  formFields.innerHTML = fields.map(field => {
    if (field.type === 'textarea') {
      return `
        <div class="form-group">
          <label for="${field.name}">${field.label}:</label>
          <textarea id="${field.name}" ${field.required ? 'required' : ''}>${field.value || ''}</textarea>
        </div>
      `;
    } else if (field.type === 'select') {
      return `
        <div class="form-group">
          <label for="${field.name}">${field.label}:</label>
          <select id="${field.name}" ${field.required ? 'required' : ''}>
            ${field.options.map(opt => `
              <option value="${opt.value}" ${opt.value === field.value ? 'selected' : ''}>${opt.label}</option>
            `).join('')}
          </select>
        </div>
      `;
    } else if (field.type === 'checkbox') {
      return `
        <div class="form-group">
          <label>
            <input type="checkbox" id="${field.name}" ${field.value ? 'checked' : ''}>
            ${field.label}
          </label>
        </div>
      `;
    } else {
      return `
        <div class="form-group">
          <label for="${field.name}">${field.label}:</label>
          <input type="${field.type || 'text'}" id="${field.name}" value="${field.value || ''}" ${field.required ? 'required' : ''}>
        </div>
      `;
    }
  }).join('');

  const form = document.getElementById('modalForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = {};
    fields.forEach(field => {
      const el = document.getElementById(field.name);
      formData[field.name] = field.type === 'checkbox' ? el.checked : el.value;
    });
    await onSave(formData);
    closeModal();
  };

  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  currentEditItem = null;
}

window.editResource = async (id) => {
  const { data: resource } = await supabase.from('resources').select('*').eq('id', id).single();
  currentEditItem = resource;

  openModal('Edit Resource', [
    { name: 'title', label: 'Title', value: resource.title, required: true },
    { name: 'description', label: 'Description', type: 'textarea', value: resource.description },
    {
      name: 'category_id', label: 'Category', type: 'select',
      options: [{ value: '', label: 'None' }, ...categories.map(c => ({ value: c.id, label: c.name }))],
      value: resource.category_id
    },
    {
      name: 'type', label: 'Type', type: 'select',
      options: [
        { value: 'tool', label: 'Tool' },
        { value: 'guide', label: 'Guide' },
        { value: 'utility', label: 'Utility' },
        { value: 'example', label: 'Example' }
      ],
      value: resource.type
    },
    { name: 'url', label: 'URL', value: resource.url },
    { name: 'github_url', label: 'GitHub URL', value: resource.github_url },
    { name: 'featured', label: 'Featured', type: 'checkbox', value: resource.featured },
    {
      name: 'difficulty_level', label: 'Difficulty', type: 'select',
      options: [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
      ],
      value: resource.difficulty_level
    }
  ], async (data) => {
    await supabase.from('resources').update(data).eq('id', id);
    loadResourcesList();
  });
};

window.deleteResource = async (id) => {
  if (confirm('Are you sure you want to delete this resource?')) {
    await supabase.from('resources').delete().eq('id', id);
    loadResourcesList();
  }
};

window.editRepo = async (id) => {
  const { data: repo } = await supabase.from('repositories').select('*').eq('id', id).single();
  currentEditItem = repo;

  openModal('Edit Repository', [
    { name: 'name', label: 'Name', value: repo.name, required: true },
    { name: 'description', label: 'Description', type: 'textarea', value: repo.description },
    { name: 'github_url', label: 'GitHub URL', value: repo.github_url, required: true },
    { name: 'language', label: 'Language', value: repo.language },
    { name: 'stars', label: 'Stars', type: 'number', value: repo.stars },
    {
      name: 'category_id', label: 'Category', type: 'select',
      options: [{ value: '', label: 'None' }, ...categories.map(c => ({ value: c.id, label: c.name }))],
      value: repo.category_id
    },
    { name: 'use_case', label: 'Use Case', value: repo.use_case },
    { name: 'prerequisites', label: 'Prerequisites', type: 'textarea', value: repo.prerequisites },
    { name: 'quick_start', label: 'Quick Start', type: 'textarea', value: repo.quick_start }
  ], async (data) => {
    await supabase.from('repositories').update(data).eq('id', id);
    loadReposList();
  });
};

window.deleteRepo = async (id) => {
  if (confirm('Are you sure you want to delete this repository?')) {
    await supabase.from('repositories').delete().eq('id', id);
    loadReposList();
  }
};

window.editCategory = async (id) => {
  const category = categories.find(c => c.id === id);
  currentEditItem = category;

  openModal('Edit Category', [
    { name: 'name', label: 'Name', value: category.name, required: true },
    { name: 'slug', label: 'Slug', value: category.slug, required: true },
    { name: 'description', label: 'Description', type: 'textarea', value: category.description },
    { name: 'icon', label: 'Icon (emoji)', value: category.icon },
    { name: 'sort_order', label: 'Sort Order', type: 'number', value: category.sort_order }
  ], async (data) => {
    await supabase.from('categories').update(data).eq('id', id);
    categories = await getCategories();
    loadCategoriesList();
  });
};

window.deleteCategory = async (id) => {
  if (confirm('Are you sure you want to delete this category?')) {
    await supabase.from('categories').delete().eq('id', id);
    categories = await getCategories();
    loadCategoriesList();
  }
};

window.editTag = async (id) => {
  const tag = tags.find(t => t.id === id);
  currentEditItem = tag;

  openModal('Edit Tag', [
    { name: 'name', label: 'Name', value: tag.name, required: true },
    { name: 'slug', label: 'Slug', value: tag.slug, required: true }
  ], async (data) => {
    await supabase.from('tags').update(data).eq('id', id);
    tags = await getTags();
    loadTagsList();
  });
};

window.deleteTag = async (id) => {
  if (confirm('Are you sure you want to delete this tag?')) {
    await supabase.from('tags').delete().eq('id', id);
    tags = await getTags();
    loadTagsList();
  }
};

async function loadUsersList() {
  const container = document.getElementById('usersList');
  try {
    const { data: invitations, error } = await supabase
      .from('user_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (invitations.length === 0) {
      container.innerHTML = '<p class="no-results">No user invitations yet. Invite your first user!</p>';
      return;
    }

    container.innerHTML = invitations.map(invitation => {
      const statusBadge = invitation.accepted_at
        ? '<span style="color: #38a169; font-weight: 600;">Accepted</span>'
        : invitation.expires_at && new Date(invitation.expires_at) < new Date()
        ? '<span style="color: #e53e3e; font-weight: 600;">Expired</span>'
        : '<span style="color: #d69e2e; font-weight: 600;">Pending</span>';

      return `
        <div class="admin-item">
          <div class="item-content">
            <h4>${invitation.email}</h4>
            <div class="item-meta">
              <span>Status: ${statusBadge}</span>
              <span>Invited: ${new Date(invitation.created_at).toLocaleDateString()}</span>
              ${invitation.accepted_at ? `<span>Accepted: ${new Date(invitation.accepted_at).toLocaleDateString()}</span>` : ''}
            </div>
          </div>
          <div class="item-actions">
            ${!invitation.accepted_at ? `<button class="btn-delete" onclick="window.revokeInvitation('${invitation.id}')">Revoke</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading users:', error);
    container.innerHTML = '<p class="error">Failed to load users.</p>';
  }
}

window.revokeInvitation = async (id) => {
  if (confirm('Are you sure you want to revoke this invitation?')) {
    await supabase.from('user_invitations').delete().eq('id', id);
    loadUsersList();
  }
};

function setupEventListeners() {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      e.target.classList.add('active');
      const tab = e.target.dataset.tab;
      currentTab = tab;
      document.getElementById(`${tab}Tab`).classList.add('active');

      if (tab === 'resources') loadResourcesList();
      else if (tab === 'repositories') loadReposList();
      else if (tab === 'categories') loadCategoriesList();
      else if (tab === 'tags') loadTagsList();
      else if (tab === 'users') loadUsersList();
    });
  });

  document.getElementById('addResourceBtn').addEventListener('click', () => {
    openModal('Add Resource', [
      { name: 'title', label: 'Title', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      {
        name: 'category_id', label: 'Category', type: 'select',
        options: [{ value: '', label: 'None' }, ...categories.map(c => ({ value: c.id, label: c.name }))]
      },
      {
        name: 'type', label: 'Type', type: 'select',
        options: [
          { value: 'tool', label: 'Tool' },
          { value: 'guide', label: 'Guide' },
          { value: 'utility', label: 'Utility' },
          { value: 'example', label: 'Example' }
        ]
      },
      { name: 'url', label: 'URL' },
      { name: 'github_url', label: 'GitHub URL' },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
      {
        name: 'difficulty_level', label: 'Difficulty', type: 'select',
        options: [
          { value: 'beginner', label: 'Beginner' },
          { value: 'intermediate', label: 'Intermediate' },
          { value: 'advanced', label: 'Advanced' }
        ]
      }
    ], async (data) => {
      await supabase.from('resources').insert(data);
      loadResourcesList();
    });
  });

  document.getElementById('addRepoBtn').addEventListener('click', () => {
    openModal('Add Repository', [
      { name: 'name', label: 'Name', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'github_url', label: 'GitHub URL', required: true },
      { name: 'language', label: 'Language' },
      { name: 'stars', label: 'Stars', type: 'number' },
      {
        name: 'category_id', label: 'Category', type: 'select',
        options: [{ value: '', label: 'None' }, ...categories.map(c => ({ value: c.id, label: c.name }))]
      },
      { name: 'use_case', label: 'Use Case' },
      { name: 'prerequisites', label: 'Prerequisites', type: 'textarea' },
      { name: 'quick_start', label: 'Quick Start', type: 'textarea' }
    ], async (data) => {
      await supabase.from('repositories').insert(data);
      loadReposList();
    });
  });

  document.getElementById('addCategoryBtn').addEventListener('click', () => {
    openModal('Add Category', [
      { name: 'name', label: 'Name', required: true },
      { name: 'slug', label: 'Slug', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'icon', label: 'Icon (emoji)' },
      { name: 'sort_order', label: 'Sort Order', type: 'number' }
    ], async (data) => {
      await supabase.from('categories').insert(data);
      categories = await getCategories();
      loadCategoriesList();
    });
  });

  document.getElementById('addTagBtn').addEventListener('click', () => {
    openModal('Add Tag', [
      { name: 'name', label: 'Name', required: true },
      { name: 'slug', label: 'Slug', required: true }
    ], async (data) => {
      await supabase.from('tags').insert(data);
      tags = await getTags();
      loadTagsList();
    });
  });

  document.getElementById('inviteUserBtn').addEventListener('click', () => {
    openModal('Invite User', [
      { name: 'email', label: 'Email', type: 'email', required: true }
    ], async (data) => {
      try {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitationToken = crypto.randomUUID();

        const { error } = await supabase.from('user_invitations').insert({
          email: data.email,
          invitation_token: invitationToken,
          expires_at: expiresAt.toISOString()
        });

        if (error) throw error;

        const inviteUrl = `${window.location.origin}/accept-invite.html?token=${invitationToken}`;

        alert(`Invitation created! Share this link with the user:\n\n${inviteUrl}\n\nThis link will expire in 7 days.`);

        loadUsersList();
      } catch (error) {
        alert('Failed to create invitation: ' + error.message);
      }
    });
  });

  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
}

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkAuth();
});
