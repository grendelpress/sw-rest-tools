// UI state management and view transitions
export class UIManager {
    constructor() {
        this.currentView = 'credentials';
        this.elements = this.initializeElements();
    }
    
    initializeElements() {
        return {
            credentialsForm: document.getElementById('credentialsForm'),
            apiLinks: document.getElementById('apiLinks'),
            status: document.getElementById('status'),
            dataDisplay: document.getElementById('dataDisplay'),
            dateRangeSection: document.getElementById('dateRangeSection'),
            dataTitle: document.getElementById('dataTitle')
        };
    }
    
    showCredentialsForm() {
        this.hideAllSections();
        this.elements.credentialsForm.style.display = 'block';
        this.currentView = 'credentials';
    }
    
    showApiLinks() {
        this.hideAllSections();
        this.elements.apiLinks.style.display = 'block';
        // Also show the credentials form if no credentials are saved
        if (!document.querySelector('#credentialsForm').style.display || 
            document.querySelector('#credentialsForm').style.display === 'none') {
            this.elements.credentialsForm.style.display = 'block';
        }
        this.currentView = 'apiLinks';
    }
    
    showDateRangeSection() {
        this.elements.dateRangeSection.classList.remove('hidden');
    }
    
    hideDateRangeSection() {
        this.elements.dateRangeSection.classList.add('hidden');
    }
    
    showStatus() {
        this.elements.status.classList.remove('hidden');
        this.elements.apiLinks.style.display = 'none';
    }
    
    hideStatus() {
        this.elements.status.classList.add('hidden');
    }
    
    showDataDisplay(title) {
        this.elements.dataTitle.textContent = title;
        this.elements.dataDisplay.classList.remove('hidden');
        this.hideDateRangeSection();
        this.currentView = 'dataDisplay';
    }
    
    hideDataDisplay() {
        this.elements.dataDisplay.classList.add('hidden');
        this.currentView = 'apiLinks';
    }
    
    hideAllSections() {
        this.elements.status.classList.add('hidden');
        this.elements.dataDisplay.classList.add('hidden');
        this.elements.dateRangeSection.classList.add('hidden');
        this.elements.apiLinks.style.display = 'none';
    }
    
    resetToApiLinks() {
        this.hideDataDisplay();
        this.showApiLinks();
        this.hideDateRangeSection();
    }
    
    getCurrentView() {
        return this.currentView;
    }
}