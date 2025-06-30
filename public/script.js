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
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.classList.add('hidden');
    }
});

document.querySelectorAll('.api-link').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!credentials) {
            alert('Please save your credentials first');
            return;
        }

        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.classList.remove('hidden');
        }
        
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

            // Get filename from Content-Disposition header
            const contentDisposition = csvResponse.headers.get('Content-Disposition');
            let filename = 'Numbers.csv'; // default fallback
            
            console.log('Content-Disposition header:', contentDisposition); // Debug log
            
            if (contentDisposition) {
                // Try different patterns to extract filename
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch) {
                    filename = filenameMatch[1].replace(/['"]/g, ''); // remove quotes if present
                    console.log('Extracted filename:', filename); // Debug log
                }
            }

            // Create blob from CSV response
            const blob = await csvResponse.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Create temporary link and trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = filename; // Use the filename from server
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            if (statusElement) {
                statusElement.classList.add('hidden');
            }
        } catch (error) {
            alert('Error: ' + error.message);
            if (statusElement) {
                statusElement.classList.add('hidden');
            }
        }
    });
});