export class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.toggleBtn = document.getElementById('sidebarToggle');
        this.overlay = document.getElementById('sidebarOverlay');
        this.isOpen = false;

        this.init();
    }

    init() {
        this.loadSidebarState();
        this.bindEvents();
    }

    bindEvents() {
        this.toggleBtn.addEventListener('click', () => this.toggle());
        this.overlay.addEventListener('click', () => this.close());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 992 && this.isOpen) {
                this.close();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.isOpen = true;
        this.sidebar.classList.add('active');
        this.toggleBtn.classList.add('active');
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.saveSidebarState();
    }

    close() {
        this.isOpen = false;
        this.sidebar.classList.remove('active');
        this.toggleBtn.classList.remove('active');
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        this.saveSidebarState();
    }

    saveSidebarState() {
        if (window.innerWidth < 992) {
            localStorage.setItem('sidebarOpen', this.isOpen);
        }
    }

    loadSidebarState() {
        if (window.innerWidth < 992) {
            const savedState = localStorage.getItem('sidebarOpen');
            if (savedState === 'true') {
                this.open();
            }
        }
    }
}
