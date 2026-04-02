import { getCategories, getRepositories } from './supabaseClient.js';

let allRepositories = [];
let filteredRepositories = [];
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

async function loadRepositories() {
  try {
    allRepositories = await getRepositories();
    applyFilters();
  } catch (error) {
    console.error('Error loading repositories:', error);
    document.getElementById('repositoriesGrid').innerHTML = '<p class="error">Failed to load repositories.</p>';
  }
}

function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const languageFilter = document.getElementById('languageFilter').value;
  const categoryFilter = document.getElementById('categoryFilter').value;

  filteredRepositories = allRepositories.filter(repo => {
    const matchesSearch = !searchTerm ||
      repo.name.toLowerCase().includes(searchTerm) ||
      repo.description.toLowerCase().includes(searchTerm) ||
      (repo.use_case && repo.use_case.toLowerCase().includes(searchTerm));

    const matchesLanguage = !languageFilter || repo.language === languageFilter;
    const matchesCategory = !categoryFilter || repo.category_id === categoryFilter;

    return matchesSearch && matchesLanguage && matchesCategory;
  });

  displayRepositories();
  updateResultsCount();
}

function displayRepositories() {
  const container = document.getElementById('repositoriesGrid');

  if (filteredRepositories.length === 0) {
    container.innerHTML = '<p class="no-results">No repositories found matching your filters.</p>';
    return;
  }

  container.innerHTML = filteredRepositories.map(repo => `
    <div class="repo-card">
      <div class="repo-header">
        <div class="repo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </div>
        <div class="language-badge ${repo.language.toLowerCase().replace(/[^a-z]/g, '')}">${repo.language}</div>
      </div>
      <h3>${repo.name}</h3>
      <p class="repo-description">${repo.description}</p>
      ${repo.use_case ? `<div class="use-case"><strong>Use Case:</strong> ${repo.use_case}</div>` : ''}
      ${repo.prerequisites ? `
        <details class="prerequisites">
          <summary>Prerequisites</summary>
          <p>${repo.prerequisites}</p>
        </details>
      ` : ''}
      ${repo.quick_start ? `
        <details class="quick-start">
          <summary>Quick Start</summary>
          <p>${repo.quick_start}</p>
        </details>
      ` : ''}
      <div class="repo-meta">
        ${repo.category?.name ? `<span class="category">${repo.category.name}</span>` : ''}
        ${repo.stars > 0 ? `<span class="stars">⭐ ${repo.stars}</span>` : ''}
        ${repo.last_updated ? `<span class="updated">Updated ${formatDate(repo.last_updated)}</span>` : ''}
      </div>
      <div class="repo-actions">
        <a href="${repo.github_url}" target="_blank" rel="noopener noreferrer" class="btn-primary">
          View on GitHub
        </a>
      </div>
    </div>
  `).join('');
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function updateResultsCount() {
  const count = filteredRepositories.length;
  const total = allRepositories.length;
  const resultsText = count === total
    ? `Showing all ${total} repositor${total !== 1 ? 'ies' : 'y'}`
    : `Showing ${count} of ${total} repositor${total !== 1 ? 'ies' : 'y'}`;

  document.getElementById('resultsCount').textContent = resultsText;
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('languageFilter').value = '';
  document.getElementById('categoryFilter').value = '';
  applyFilters();
}

function setupEventListeners() {
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('languageFilter').addEventListener('change', applyFilters);
  document.getElementById('categoryFilter').addEventListener('change', applyFilters);
  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadRepositories();
  setupEventListeners();
});
