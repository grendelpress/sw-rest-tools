// Store credentials in session storage
let credentials = JSON.parse(sessionStorage.getItem('signalwireCredentials')) || null;
let originalData = [];
let currentData = [];
let currentDataType = '';

const credentialsForm = document.getElementById('credentialsForm');
const apiLinks = document.getElementById('apiLinks');
const status = document.getElementById('status');
const clearBtn = document.getElementById('clearBtn');
const dataDisplay = document.getElementById('dataDisplay');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const downloadFilteredBtn = document.getElementById('downloadFilteredBtn');
const backBtn = document.getElementById('backBtn');
const dataTitle = document.getElementById('dataTitle');
const recordCount = document.getElementById('recordCount');
const filteredCount = document.getElementById('filteredCount');
const dataTable = document.getElementById('dataTable');
const dataTableHead = document.getElementById('dataTableHead');
const dataTableBody = document.getElementById('dataTableBody');

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
    dataDisplay.classList.add('hidden');
});

// Parse CSV text into array of objects
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(header => header.replace(/"/g, '').trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            
            if (char === '"') {
                if (insideQuotes && lines[i][j + 1] === '"') {
                    currentValue += '"';
                    j++; // Skip next quote
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim()); // Add last value
        
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            data.push(row);
        }
    }
    
    return data;
}

// Convert array of objects back to CSV
function arrayToCSV(data, headers) {
    if (!data.length) return '';
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Escape quotes and wrap in quotes if contains comma or quote
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
}

// Render data table
function renderDataTable(data) {
    if (!data.length) {
        dataTableHead.innerHTML = '';
        dataTableBody.innerHTML = '<tr><td colspan="100%">No data available</td></tr>';
        return;
    }
    
    const headers = Object.keys(data[0]);
    
    // Create table header
    dataTableHead.innerHTML = '';
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    dataTableHead.appendChild(headerRow);
    
    // Create table body
    dataTableBody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            tr.appendChild(td);
        });
        dataTableBody.appendChild(tr);
    });
    
    // Update record counts
    recordCount.textContent = `${originalData.length} total records`;
    if (data.length !== originalData.length) {
        filteredCount.textContent = `${data.length} filtered results`;
        filteredCount.classList.remove('hidden');
    } else {
        filteredCount.classList.add('hidden');
    }
}

// Filter data based on search term
function filterData(searchTerm) {
    if (!searchTerm.trim()) {
        currentData = [...originalData];
    } else {
        const term = searchTerm.toLowerCase();
        currentData = originalData.filter(row => {
            return Object.values(row).some(value => 
                value.toString().toLowerCase().includes(term)
            );
        });
    }
    renderDataTable(currentData);
}

// Get data type title
function getDataTypeTitle(endpoint) {
    const titles = {
        '/generate-numbers-csv': 'Phone Numbers',
        '/generate-messages-csv': 'Messages',
        '/generate-faxes-csv': 'Faxes',
        '/generate-calls-csv': 'Calls',
        '/generate-recordings-csv': 'Recordings'
    };
    return titles[endpoint] || 'Data';
}

// Search event listeners
searchInput.addEventListener('input', (e) => {
    filterData(e.target.value);
});

searchBtn.addEventListener('click', () => {
    filterData(searchInput.value);
});

// Download filtered CSV
downloadFilteredBtn.addEventListener('click', () => {
    if (!currentData.length) {
        alert('No data to download');
        return;
    }
    
    const headers = Object.keys(currentData[0]);
    const csvContent = arrayToCSV(currentData, headers);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Filtered_${currentDataType}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
});

// Back to menu
backBtn.addEventListener('click', () => {
    dataDisplay.classList.add('hidden');
    apiLinks.style.display = 'block';
    searchInput.value = '';
    originalData = [];
    currentData = [];
    currentDataType = '';
});

document.querySelectorAll('.api-link').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!credentials) {
            alert('Please save your credentials first');
            return;
        }

        status.classList.remove('hidden');
        apiLinks.style.display = 'none';
        currentDataType = getDataTypeTitle(link.dataset.endpoint);
        
        try {
            const csvResponse = await fetch(`/.netlify/functions${link.dataset.endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/csv, application/json'
                },
                body: JSON.stringify(credentials)
            });

            if (!csvResponse.ok) {
                const error = await csvResponse.json();
                throw new Error(error.error || 'Failed to generate CSV');
            }

            // Get CSV content as text
            const csvText = await csvResponse.text();
            
            // Parse and display data
            originalData = parseCSV(csvText);
            currentData = [...originalData];
            
            // Show data display
            dataTitle.textContent = currentDataType;
            renderDataTable(currentData);
            dataDisplay.classList.remove('hidden');
            status.classList.add('hidden');
            
            // Extract filename from Content-Disposition header
            const contentDisposition = csvResponse.headers.get('Content-Disposition');
            let filename = 'Numbers.csv'; // fallback filename
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
        } catch (error) {
            alert('Error: ' + error.message);
            status.classList.add('hidden');
            apiLinks.style.display = 'block';
        }
    });
});