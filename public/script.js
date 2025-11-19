// Global state
let state = {
    data: [],
    encryptedData: [],
    encryptionKey: '',
    isEncrypted: false,
    stats: null
};

// Charts
let charts = {
    companySize: null,
    experience: null,
    topJobs: null,
    remote: null
};

// DOM Elements
const elements = {
    fileInput: document.getElementById('file-input'),
    uploadSuccess: document.getElementById('upload-success'),
    recordsCount: document.getElementById('records-count'),
    continueEncrypt: document.getElementById('continue-encrypt'),
    encryptionKeyInput: document.getElementById('encryption-key'),
    toggleKeyBtn: document.getElementById('toggle-key'),
    generateKeyBtn: document.getElementById('generate-key'),
    encryptBtn: document.getElementById('encrypt-button'),
    viewDashboard: document.getElementById('view-dashboard'),
    decryptionKeyInput: document.getElementById('decryption-key'),
    toggleDecryptKeyBtn: document.getElementById('toggle-decrypt-key'),
    decryptBtn: document.getElementById('decrypt-button'),
    decryptView: document.getElementById('decrypt-view'),
    analyticsView: document.getElementById('analytics-view'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notification-text')
};

// Utility Functions
const showNotification = (message, type = 'info') => {
    elements.notification.className = `notification ${type}`;
    elements.notificationText.textContent = message;
    elements.notification.classList.remove('hidden');
    
    setTimeout(() => {
        elements.notification.classList.add('hidden');
    }, 3000);
};

const switchTab = (tabName) => {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
};

// Encryption Functions
const generateKey = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const encrypt = async (text, key) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
    
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
};

const decrypt = async (encryptedText, key) => {
    try {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(key.padEnd(32, '0').slice(0, 32));
        
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
        
        const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            encrypted
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (error) {
        throw new Error('Decryption failed - Invalid key');
    }
};

// File Upload Handler
elements.fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split('\n').filter(row => row.trim());
        const headers = rows[0].split(',').map(h => h.trim());
        
        const parsedData = rows.slice(1).map(row => {
            const values = row.split(',');
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index]?.trim() || '';
            });
            return obj;
        }).filter(row => row.work_year);

        state.data = parsedData;
        elements.recordsCount.textContent = `${parsedData.length}`;
        elements.uploadSuccess.classList.remove('hidden');
        showNotification(`Successfully loaded ${parsedData.length} records`, 'success');
    };
    reader.readAsText(file);
});

// Continue to Encrypt
elements.continueEncrypt.addEventListener('click', () => {
    switchTab('encrypt');
});

// Toggle Key Visibility
elements.toggleKeyBtn.addEventListener('click', () => {
    const input = elements.encryptionKeyInput;
    input.type = input.type === 'password' ? 'text' : 'password';
});

elements.toggleDecryptKeyBtn.addEventListener('click', () => {
    const input = elements.decryptionKeyInput;
    input.type = input.type === 'password' ? 'text' : 'password';
});

// Generate Key
elements.generateKeyBtn.addEventListener('click', () => {
    state.encryptionKey = generateKey();
    elements.encryptionKeyInput.value = state.encryptionKey;
    elements.encryptBtn.disabled = false;
});

// Encryption Key Input
elements.encryptionKeyInput.addEventListener('input', (e) => {
    state.encryptionKey = e.target.value;
    elements.encryptBtn.disabled = !state.encryptionKey || state.data.length === 0;
});

// Encrypt Data
elements.encryptBtn.addEventListener('click', async () => {
    if (!state.encryptionKey) {
        showNotification('Please enter an encryption key', 'error');
        return;
    }

    if (state.data.length === 0) {
        showNotification('Please upload data first', 'error');
        return;
    }

    try {
        elements.encryptBtn.disabled = true;
        elements.encryptBtn.textContent = 'Encrypting...';
        
        const encrypted = await Promise.all(state.data.map(async (row) => {
            return {
                ...row,
                salary: await encrypt(row.salary || '0', state.encryptionKey),
                salary_in_usd: await encrypt(row.salary_in_usd || '0', state.encryptionKey),
                job_title: await encrypt(row.job_title || 'Unknown', state.encryptionKey)
            };
        }));

        state.encryptedData = encrypted;
        state.isEncrypted = true;
        elements.encryptBtn.textContent = '✓ Data Encrypted';
        elements.viewDashboard.classList.remove('hidden');
        showNotification('Data encrypted successfully!', 'success');
    } catch (error) {
        showNotification('Encryption failed: ' + error.message, 'error');
        elements.encryptBtn.disabled = false;
        elements.encryptBtn.textContent = 'Encrypt Data';
    }
});

// View Dashboard
elements.viewDashboard.addEventListener('click', () => {
    switchTab('dashboard');
});

// Decryption Key Input
elements.decryptionKeyInput.addEventListener('input', (e) => {
    elements.decryptBtn.disabled = !e.target.value || !state.isEncrypted;
});

// Decrypt Data
elements.decryptBtn.addEventListener('click', async () => {
    const key = elements.decryptionKeyInput.value;
    
    if (!key) {
        showNotification('Please enter decryption key', 'error');
        return;
    }

    try {
        elements.decryptBtn.disabled = true;
        elements.decryptBtn.textContent = 'Decrypting...';
        
        const decrypted = await Promise.all(state.encryptedData.map(async (row) => {
            return {
                ...row,
                salary: await decrypt(row.salary, key),
                salary_in_usd: await decrypt(row.salary_in_usd, key),
                job_title: await decrypt(row.job_title, key)
            };
        }));

        calculateStats(decrypted);
        renderCharts();
        
        elements.decryptView.classList.add('hidden');
        elements.analyticsView.classList.remove('hidden');
        
        showNotification('Data decrypted successfully!', 'success');
    } catch (error) {
        showNotification('Decryption failed - Wrong key!', 'error');
        elements.decryptBtn.disabled = false;
        elements.decryptBtn.textContent = 'Decrypt & View Analytics';
    }
});

// Calculate Statistics
const calculateStats = (decryptedData) => {
    const avgByCompanySize = {};
    const countByExperience = {};
    const avgByJobTitle = {};
    const remoteDistribution = { '0': 0, '50': 0, '100': 0 };

    decryptedData.forEach(row => {
        const salary = parseFloat(row.salary_in_usd) || 0;
        
        if (!avgByCompanySize[row.company_size]) {
            avgByCompanySize[row.company_size] = { total: 0, count: 0 };
        }
        avgByCompanySize[row.company_size].total += salary;
        avgByCompanySize[row.company_size].count += 1;

        countByExperience[row.experience_level] = (countByExperience[row.experience_level] || 0) + 1;

        if (!avgByJobTitle[row.job_title]) {
            avgByJobTitle[row.job_title] = { total: 0, count: 0 };
        }
        avgByJobTitle[row.job_title].total += salary;
        avgByJobTitle[row.job_title].count += 1;

        remoteDistribution[row.remote_ratio] = (remoteDistribution[row.remote_ratio] || 0) + 1;
    });

    const companySizeData = Object.entries(avgByCompanySize).map(([size, data]) => ({
        size: size === 'S' ? 'Small' : size === 'M' ? 'Medium' : 'Large',
        avgSalary: Math.round(data.total / data.count)
    }));

    const experienceData = Object.entries(countByExperience).map(([level, count]) => ({
        level: level === 'EN' ? 'Entry' : level === 'MI' ? 'Mid' : level === 'SE' ? 'Senior' : 'Executive',
        count
    }));

    const topJobs = Object.entries(avgByJobTitle)
        .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))
        .slice(0, 10)
        .map(([title, data]) => ({
            title: title.length > 25 ? title.substring(0, 25) + '...' : title,
            avgSalary: Math.round(data.total / data.count)
        }));

    const remoteData = Object.entries(remoteDistribution).map(([ratio, count]) => ({
        name: ratio === '0' ? 'On-site' : ratio === '50' ? 'Hybrid' : 'Remote',
        value: count
    }));

    state.stats = {
        companySizeData,
        experienceData,
        topJobs,
        remoteData,
        totalRecords: decryptedData.length,
        avgSalary: Math.round(decryptedData.reduce((sum, row) => sum + (parseFloat(row.salary_in_usd) || 0), 0) / decryptedData.length)
    };

    // Update stat cards
    document.getElementById('total-records').textContent = state.stats.totalRecords.toLocaleString();
    document.getElementById('avg-salary').textContent = `$${(state.stats.avgSalary / 1000).toFixed(0)}K`;
};

// Render Charts
const renderCharts = () => {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    color: '#cbd5e1'
                }
            }
        },
        scales: {
            x: {
                ticks: { color: '#94a3b8' },
                grid: { color: '#334155' }
            },
            y: {
                ticks: { color: '#94a3b8' },
                grid: { color: '#334155' }
            }
        }
    };

    // Company Size Chart
    if (charts.companySize) charts.companySize.destroy();
    charts.companySize = new Chart(document.getElementById('company-size-chart'), {
        type: 'bar',
        data: {
            labels: state.stats.companySizeData.map(d => d.size),
            datasets: [{
                label: 'Average Salary',
                data: state.stats.companySizeData.map(d => d.avgSalary),
                backgroundColor: '#3b82f6',
                borderRadius: 8
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: (context) => `$${(context.parsed.y / 1000).toFixed(0)}K`
                    }
                }
            }
        }
    });

    // Experience Chart
    if (charts.experience) charts.experience.destroy();
    charts.experience = new Chart(document.getElementById('experience-chart'), {
        type: 'bar',
        data: {
            labels: state.stats.experienceData.map(d => d.level),
            datasets: [{
                label: 'Count',
                data: state.stats.experienceData.map(d => d.count),
                backgroundColor: '#10b981',
                borderRadius: 8
            }]
        },
        options: chartOptions
    });

    // Top Jobs Chart
    if (charts.topJobs) charts.topJobs.destroy();
    charts.topJobs = new Chart(document.getElementById('top-jobs-chart'), {
        type: 'bar',
        data: {
            labels: state.stats.topJobs.map(d => d.title),
            datasets: [{
                label: 'Average Salary',
                data: state.stats.topJobs.map(d => d.avgSalary),
                backgroundColor: '#f59e0b',
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#cbd5e1' }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `$${(context.parsed.x / 1000).toFixed(0)}K`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                },
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' }
                }
            }
        }
    });

    // Remote Distribution Chart
    if (charts.remote) charts.remote.destroy();
    charts.remote = new Chart(document.getElementById('remote-chart'), {
        type: 'pie',
        data: {
            labels: state.stats.remoteData.map(d => d.name),
            datasets: [{
                data: state.stats.remoteData.map(d => d.value),
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1' }
                }
            }
        }
    });
};

// Tab Navigation
document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
    });
});