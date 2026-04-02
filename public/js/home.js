import { supabase, getCategories, getResources } from './supabaseClient.js';

async function loadStats() {
  try {
    const [resourcesCount, reposCount, categoriesCount] = await Promise.all([
      supabase.from('resources').select('*', { count: 'exact', head: true }),
      supabase.from('repositories').select('*', { count: 'exact', head: true }),
      supabase.from('categories').select('*', { count: 'exact', head: true })
    ]);

    document.getElementById('totalResources').textContent = resourcesCount.count || 0;
    document.getElementById('totalRepos').textContent = reposCount.count || 0;
    document.getElementById('totalCategories').textContent = categoriesCount.count || 0;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadFeaturedResources() {
  const container = document.getElementById('featuredGrid');

  try {
    const resources = await getResources({ featured: true });

    if (resources.length === 0) {
      container.innerHTML = '<p class="no-results">No featured resources yet. Check back soon!</p>';
      return;
    }

    container.innerHTML = resources.map(resource => `
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
        </div>
        <div class="resource-actions">
          ${resource.url ? `<a href="${resource.url}" class="btn-primary">Open Tool</a>` : ''}
          ${resource.github_url ? `<a href="${resource.github_url}" target="_blank" class="btn-secondary">GitHub</a>` : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading featured resources:', error);
    container.innerHTML = '<p class="error">Failed to load featured resources.</p>';
  }
}

async function loadCategories() {
  const container = document.getElementById('categoriesGrid');

  try {
    const categories = await getCategories();

    container.innerHTML = categories.map(category => `
      <a href="/resources.html?category=${category.slug}" class="category-card">
        <div class="category-icon">${category.icon}</div>
        <h4>${category.name}</h4>
        <p>${category.description}</p>
      </a>
    `).join('');
  } catch (error) {
    console.error('Error loading categories:', error);
    container.innerHTML = '<p class="error">Failed to load categories.</p>';
  }
}

async function loadRecentAdditions() {
  const container = document.getElementById('recentGrid');

  try {
    const { data: resources, error } = await supabase
      .from('resources')
      .select(`
        *,
        category:categories(name, icon)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (resources.length === 0) {
      container.innerHTML = '<p class="no-results">No resources yet. Check back soon!</p>';
      return;
    }

    container.innerHTML = resources.map(resource => `
      <div class="resource-list-item">
        <div class="list-item-icon">${resource.category?.icon || '📁'}</div>
        <div class="list-item-content">
          <h4>${resource.title}</h4>
          <p>${resource.description.substring(0, 150)}${resource.description.length > 150 ? '...' : ''}</p>
          <div class="list-item-meta">
            <span class="type-badge">${resource.type}</span>
            <span class="category">${resource.category?.name || 'Uncategorized'}</span>
          </div>
        </div>
        <div class="list-item-actions">
          ${resource.url ? `<a href="${resource.url}" class="btn-small">View</a>` : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading recent additions:', error);
    container.innerHTML = '<p class="error">Failed to load recent additions.</p>';
  }
}

function setupSearch() {
  const searchInput = document.getElementById('heroSearch');
  const searchBtn = document.getElementById('heroSearchBtn');

  const performSearch = () => {
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `/resources.html?search=${encodeURIComponent(query)}`;
    }
  };

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadFeaturedResources();
  loadCategories();
  loadRecentAdditions();
  setupSearch();
});
