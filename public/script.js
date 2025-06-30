// Store credentials in session storage
let credentials = JSON.parse(sessionStorage.getItem('signalwireCredentials')) || null;

const credentialsForm = document.getElementById('credentialsForm');
const apiLinks = document.getElementById('apiLinks');
const status = document.getElementById('status');
const clearBtn = document.getElementById('clearBtn');

// Initialize form with stored credentials
if (credentials) {
    document.getElementById('projectId').value = credentials.projectId;
    document.getElementById('authToken').value = credentials.authToken;
    document.getElementById('spaceUrl').value = credentials.spaceUrl;
}

credentialsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    credentials = {
        projectId: document.getElementById('projectId').value,
        authToken: document.getElementById('authToken').value,
        spaceUrl: document.getElementById('spaceUrl').value
    };
    
    sessionStorage.setItem('signalwireCredentials', JSON.stringify(credentials));
});

clearBtn.addEventListener('click', () => {
    sessionStorage.removeItem('signalwireCredentials');
    credentials = null;
    credentialsForm.reset();
    status.classList.add('hidden');
});

document.querySelectorAll('.api-link').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!credentials) {
            alert('Please save your credentials first');
            return;
        }

        status.classList.remove('hidden');
        
        try {
            const csvResponse = await fetch(link.dataset.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            if (!csvResponse.ok) {
                const error = await csvResponse.json();
                throw new Error(error.error || 'Failed to generate CSV');
            }

            // Create blob from CSV response
            const blob = await csvResponse.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Create temporary link and trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Numbers.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            status.classList.add('hidden');
        } catch (error) {
            alert('Error: ' + error.message);
            status.classList.add('hidden');
        }
    });
});