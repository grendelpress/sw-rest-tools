import { supabase, getCategories, getResources } from './supabaseClient.js';

let allResources = [];
let filteredResources = [];
let categories = [];

async function loadCategories() {
  categories = await getCategories();
  const categoryFilter = document.getElementById('categoryFilter');

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categoryFilter.appendChild(option);
  });
}

async function loadResources() {
  try {
    allResources = await getResources();
    applyFilters();
  } catch (error) {
    console.error('Error loading resources:', error);
    document.getElementById('resourcesGrid').innerHTML = '<p class="error">Failed to load resources.</p>';
  }
}

function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const typeFilter = document.getElementById('typeFilter').value;
  const categoryFilter = document.getElementById('categoryFilter').value;
  const difficultyFilter = document.getElementById('difficultyFilter').value;

  filteredResources = allResources.filter(resource => {
    const matchesSearch = !searchTerm ||
      resource.title.toLowerCase().includes(searchTerm) ||
      resource.description.toLowerCase().includes(searchTerm);

    const matchesType = !typeFilter || resource.type === typeFilter;
    const matchesCategory = !categoryFilter || resource.category_id === categoryFilter;
    const matchesDifficulty = !difficultyFilter || resource.difficulty_level === difficultyFilter;

    return matchesSearch && matchesType && matchesCategory && matchesDifficulty;
  });

  displayResources();
  updateResultsCount();
}

function displayResources() {
  const container = document.getElementById('resourcesGrid');

  if (filteredResources.length === 0) {
    container.innerHTML = '<p class="no-results">No resources found matching your filters.</p>';
    return;
  }

  container.innerHTML = filteredResources.map(resource => `
    <div class="resource-card">
      <div class="resource-header">
        <span class="resource-icon">${resource.category?.icon || '📁'}</span>
        <span class="resource-type">${resource.type}</span>
      </div>
      <h4>${resource.title}</h4>
      <p>${resource.description}</p>
      <div class="resource-meta">
        <span class="difficulty ${resource.difficulty_level}">${resource.difficulty_level}</span>
        <span class="category">${resource.category?.name || 'Uncategorized'}</span>
        ${resource.view_count > 0 ? `<span class="views">${resource.view_count} views</span>` : ''}
      </div>
      <div class="resource-tags">
        ${(resource.resource_tags || []).map(rt =>
          `<span class="tag">${rt.tag.name}</span>`
        ).join('')}
      </div>
      <div class="resource-actions">
        ${resource.url ? `<a href="${resource.url}" class="btn-primary">Open</a>` : ''}
        ${resource.github_url ? `<a href="${resource.github_url}" target="_blank" class="btn-secondary">GitHub</a>` : ''}
      </div>
    </div>
  `).join('');
}

function updateResultsCount() {
  const count = filteredResources.length;
  const total = allResources.length;
  const resultsText = count === total
    ? `Showing all ${total} resource${total !== 1 ? 's' : ''}`
    : `Showing ${count} of ${total} resource${total !== 1 ? 's' : ''}`;

  document.getElementById('resultsCount').textContent = resultsText;
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('typeFilter').value = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('difficultyFilter').value = '';
  applyFilters();
}

function parseURLParams() {
  const params = new URLSearchParams(window.location.search);

  const search = params.get('search');
  const type = params.get('type');
  const category = params.get('category');

  if (search) document.getElementById('searchInput').value = search;
  if (type) document.getElementById('typeFilter').value = type;

  if (category) {
    const categoryObj = categories.find(c => c.slug === category);
    if (categoryObj) {
      document.getElementById('categoryFilter').value = categoryObj.id;
    }
  }
}

function setupEventListeners() {
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('typeFilter').addEventListener('change', applyFilters);
  document.getElementById('categoryFilter').addEventListener('change', applyFilters);
  document.getElementById('difficultyFilter').addEventListener('change', applyFilters);
  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  parseURLParams();
  await loadResources();
  setupEventListeners();
});
