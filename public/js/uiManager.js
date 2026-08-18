// UI state management and view transitions
export class UIManager {
    constructor() {
        this.currentView = 'overview';
        this.currentCategory = 'overview';
        this.activeTarget = null;
        this.elements = this.initializeElements();
        this.bindWorkspaceEvents();
    }

    initializeElements() {
        return {
            credentialsForm: document.getElementById('credentialsForm'),
            viewsContainer: document.getElementById('viewsContainer'),
            status: document.getElementById('status'),
            dataDisplay: document.getElementById('dataDisplay'),
            dateRangeSection: document.getElementById('dateRangeSection'),
            dataTitle: document.getElementById('dataTitle'),
            sidebar: document.getElementById('workspaceSidebar'),
            sidebarNav: document.getElementById('sidebarNav'),
            sidebarOverlay: document.getElementById('sidebarOverlay'),
            sidebarCloseBtn: document.getElementById('sidebarCloseBtn'),
            sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
            topBarBackBtn: document.getElementById('topBarBackBtn'),
            connectionPanel: document.getElementById('connectionPanel'),
            connectionHeader: document.getElementById('connectionHeader'),
            connectionBody: document.getElementById('connectionBody'),
            connectionToggleBtn: document.getElementById('connectionToggleBtn'),
            connectionToggleLabel: document.getElementById('connectionToggleLabel'),
            connectionChevron: document.querySelector('.connection-chevron'),
            connectionDot: document.getElementById('connectionDot'),
            connectionStatusText: document.getElementById('connectionStatusText')
        };
    }

    bindWorkspaceEvents() {
        this.elements.sidebarNav.addEventListener('click', (e) => {
            // Group toggle (expand/collapse)
            const groupToggle = e.target.closest('.nav-group-toggle');
            if (groupToggle) {
                e.preventDefault();
                this.toggleGroup(groupToggle.parentElement);
                return;
            }

            // Top-level nav item (Overview, Messaging, etc.)
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                this.switchCategory(navItem.dataset.view);
                this.clearActiveSubitem();
                this.closeSidebarMobile();
                return;
            }

            // Subitem (individual API action)
            const subitem = e.target.closest('.nav-subitem');
            if (subitem) {
                e.preventDefault();
                this.selectSubitem(subitem);
                this.closeSidebarMobile();
                return;
            }
        });

        // Mobile sidebar toggle
        this.elements.sidebarToggleBtn.addEventListener('click', () => this.openSidebarMobile());
        this.elements.sidebarCloseBtn.addEventListener('click', () => this.closeSidebarMobile());
        this.elements.sidebarOverlay.addEventListener('click', () => this.closeSidebarMobile());

        // Connection panel toggle
        this.elements.connectionToggleBtn.addEventListener('click', () => this.toggleConnectionPanel());
        this.elements.connectionHeader.addEventListener('click', (e) => {
            if (e.target.closest('.connection-toggle-btn')) return;
            this.toggleConnectionPanel();
        });
    }

    toggleGroup(group) {
        const isExpanded = group.classList.contains('expanded');
        group.classList.toggle('expanded', !isExpanded);
        const toggle = group.querySelector('.nav-group-toggle');
        const chevron = group.querySelector('.nav-group-chevron');
        if (toggle) toggle.setAttribute('aria-expanded', String(!isExpanded));
        if (chevron) chevron.textContent = !isExpanded ? '⌃' : '⌄';
    }

    selectSubitem(subitem) {
        const view = subitem.dataset.view;
        const target = subitem.dataset.target;

        // Mark this subitem as active
        this.clearActiveSubitem();
        subitem.classList.add('active');
        this.activeTarget = target;

        // Ensure the parent group is expanded
        const parentGroup = subitem.closest('.nav-group');
        if (parentGroup && !parentGroup.classList.contains('expanded')) {
            this.toggleGroup(parentGroup);
        }

        // Hide all category views and show the endpoint page
        this.hideAllCategoryViews();
        this.hideResultSections();

        // Dispatch event so app.js can render the endpoint page content
        document.dispatchEvent(new CustomEvent('endpoint-selected', {
            detail: { target, view }
        }));
    }

    hideAllCategoryViews() {
        this.elements.viewsContainer.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('active');
        });
    }

    showEndpointPage() {
        const endpointPage = document.getElementById('endpointPageView');
        if (endpointPage) {
            endpointPage.classList.remove('hidden');
            endpointPage.classList.add('active');
        }
    }

    clearActiveSubitem() {
        this.elements.sidebarNav.querySelectorAll('.nav-subitem.active').forEach(el => {
            el.classList.remove('active');
        });
        this.activeTarget = null;
    }

    switchCategory(category) {
        this.currentCategory = category;

        // Update top-level nav active state
        this.elements.sidebarNav.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === category);
        });

        // Show the matching view
        this.elements.viewsContainer.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('hidden', view.dataset.view !== category);
            view.classList.toggle('active', view.dataset.view === category);
        });

        // Hide the endpoint page when switching to a category
        const endpointPage = document.getElementById('endpointPageView');
        if (endpointPage && category !== 'endpoint') {
            endpointPage.classList.add('hidden');
            endpointPage.classList.remove('active');
        }

        // Auto-expand the group containing this category's subitems
        const matchingSubitem = this.elements.sidebarNav.querySelector(
            `.nav-subitem[data-view="${category}"]`
        );
        if (matchingSubitem) {
            const parentGroup = matchingSubitem.closest('.nav-group');
            if (parentGroup && !parentGroup.classList.contains('expanded')) {
                this.toggleGroup(parentGroup);
            }
        }

        // Hide any active result/overlay sections when switching categories
        this.hideResultSections();

        this.currentView = category;
    }

    openSidebarMobile() {
        this.elements.sidebar.classList.add('open');
        this.elements.sidebarOverlay.classList.add('visible');
    }

    closeSidebarMobile() {
        this.elements.sidebar.classList.remove('open');
        this.elements.sidebarOverlay.classList.remove('visible');
    }

    toggleConnectionPanel() {
        const isHidden = this.elements.connectionBody.classList.contains('hidden');
        if (isHidden) {
            this.elements.connectionBody.classList.remove('hidden');
            this.elements.connectionToggleLabel.textContent = 'Hide Settings';
            this.elements.connectionChevron?.classList.add('expanded');
        } else {
            this.elements.connectionBody.classList.add('hidden');
            this.elements.connectionToggleLabel.textContent = 'Show Settings';
            this.elements.connectionChevron?.classList.remove('expanded');
        }
    }

    updateConnectionStatus(hasCredentials) {
        if (hasCredentials) {
            this.elements.connectionDot.classList.add('connected');
            this.elements.connectionStatusText.textContent = 'Connected';
        } else {
            this.elements.connectionDot.classList.remove('connected');
            this.elements.connectionStatusText.textContent = 'Not Connected';
        }
    }

    // Legacy compatibility — these are still called by app.js
    showCredentialsForm() {
        this.toggleConnectionPanel();
    }

    showApiLinks() {
        this.switchCategory(this.currentCategory);
    }

    showDateRangeSection() {
        this.elements.dateRangeSection.classList.remove('hidden');
    }

    hideDateRangeSection() {
        this.elements.dateRangeSection.classList.add('hidden');
    }

    showStatus() {
        this.elements.status.classList.remove('hidden');
    }

    hideStatus() {
        this.elements.status.classList.add('hidden');
    }

    showDataDisplay(title) {
        this.elements.dataTitle.textContent = title;
        this.elements.dataDisplay.classList.remove('hidden');
        this.hideDateRangeSection();
        this.currentView = 'dataDisplay';
        this.showTopBarBack();
    }

    hideDataDisplay() {
        this.elements.dataDisplay.classList.add('hidden');
    }

    hideAllSections() {
        this.elements.status.classList.add('hidden');
        this.elements.dataDisplay.classList.add('hidden');
        this.elements.dateRangeSection.classList.add('hidden');
    }

    hideResultSections() {
        this.hideStatus();
        this.elements.dataDisplay.classList.add('hidden');
        this.elements.dateRangeSection.classList.add('hidden');
        const messagingAnalyticsView = document.getElementById('messagingAnalyticsView');
        if (messagingAnalyticsView) messagingAnalyticsView.classList.add('hidden');
        const highVolumeView = document.getElementById('highVolumeMessagesView');
        if (highVolumeView) highVolumeView.classList.add('hidden');
        this.hideTopBarBack();
    }

    showTopBarBack() {
        this.elements.topBarBackBtn?.classList.remove('hidden');
    }

    hideTopBarBack() {
        this.elements.topBarBackBtn?.classList.add('hidden');
    }

    resetToApiLinks() {
        this.hideDataDisplay();
        this.hideDateRangeSection();
        this.hideTopBarBack();
        // Show the endpoint page if there's an active subitem, otherwise switch to category
        if (this.activeTarget) {
            this.showEndpointPage();
        } else {
            this.switchCategory(this.currentCategory);
        }
    }

    getCurrentView() {
        return this.currentView;
    }
}
