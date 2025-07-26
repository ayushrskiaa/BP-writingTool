import { ExportManager } from './export_manager.js';
import { DataManager } from './data_manager.js';

const input = document.getElementById('hinglish-input');

// Wait for DOM to load before adding event listeners
document.addEventListener('DOMContentLoaded', function () {
    const addTemplateBtn = document.querySelector('.add-template-btn');
    const newFileModal = document.getElementById('newFileModal');
    const closeNewFile = document.getElementById('closeNewFile');
    const cancelNewFile = document.getElementById('cancelNewFile');
    const createNewFile = document.getElementById('createNewFile');
    const newFileName = document.getElementById('newFileName');
    const exportBtn = document.getElementById('exportBtn');
    const saveBtn = document.getElementById('saveBtn');
    const filenameInput = document.querySelector('.filename-input');
    const historyList = document.querySelector('.history-list');

    // Global variable to track current document ID
    let currentDocumentId = null;

    // Helper to get today's date string
    function getDateString(date) {
        const today = new Date();
        if (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        ) return 'Today';
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        if (
            date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear()
        ) return 'Yesterday';
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function getActiveTemplate() {
        // Use the filter text as the source of truth
        const filterText = document.querySelector('.template-filter .filter-text')?.textContent?.toLowerCase();
        return filterText === 'diary' ? 'diary' : 'letter';
    }

    // Save/Update document
    saveBtn.addEventListener('click', async function () {
        const filename = filenameInput.value.trim() || 'Untitled';
        let content = '';
        let type = getActiveTemplate();
        
        if (type === 'letter') {
            content = dataManager.getLetterContent();
        } else {
            content = dataManager.getDiaryContent();
            console.log("content", content);
        }
        
        if (!content) return alert('Cannot save empty document!');

        try {
            if (currentDocumentId) {
                // Update existing document
                const response = await fetch(`/update_document/${type}/${currentDocumentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename, content })
                });
                
                if (!response.ok) throw new Error('Failed to update document');
                showNotification('Document updated!');
            } else {
                // Create new document if none exists
                const response = await fetch(`/create_document/${type}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename, content })
                });
                
                if (!response.ok) throw new Error('Failed to create document');
                
                const data = await response.json();
                currentDocumentId = data.doc_id;
                showNotification('Document created!');
            }
        } catch (err) {
            alert('Failed to save document: ' + err);
        }
    });

    // Render history in sidebar
    function renderHistory(docs = []) {
        // Group by date
        const groups = {};
        docs.forEach(doc => {
            const dateObj = new Date(doc.created_at);
            const dateKey = getDateString(dateObj);
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push({ ...doc, date: dateObj });
        });

        historyList.innerHTML = '';

        // Sort date keys by latest date first
        const sortedDateKeys = Object.keys(groups).sort((a, b) => {
            const aDate = groups[a][0].date;
            const bDate = groups[b][0].date;
            return bDate - aDate;
        });

        sortedDateKeys.forEach(dateKey => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'history-date-group';

            const header = document.createElement('div');
            header.className = 'date-header collapsible-header';
            header.innerHTML = `<span class="collapse-arrow">&#9660;</span> ${dateKey}`;
            groupDiv.appendChild(header);

            const itemsContainer = document.createElement('div');
            itemsContainer.className = 'history-items-container';

            groups[dateKey].sort((a, b) => b.date - a.date).forEach(doc => {
                const firstLine = doc.content;
                const updated = new Date(doc.updated_at);
                const updatedStr = updated.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div class="history-item-details" style="cursor:pointer; padding: 0 10px; display: flex; flex-direction: column; gap: 2px;">
                        <span class="history-item-name" style="color:#0a225d;font-weight:500;">${doc.filename}</span>
                        <span class="history-item-time">${updatedStr}</span>
                        <span class="history-item-preview" style="color:#444;">${firstLine}</span>
                    </div>
                    <div class="history-item-actions">
                        <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                // Load document on click (whole item)
                item.querySelector('.history-item-details').onclick = () => {
                    filenameInput.value = doc.filename;
                    currentDocumentId = doc._id; // Set current document ID
                    
                    if (getActiveTemplate() === 'diary') {
                        document.querySelector('.editor-letter').style.display = 'none';
                        document.querySelector('.editor-diary').style.display = '';
                        document.querySelector('.template-filter .filter-text').textContent = 'Diary';
                        let diaryData;
                        try {
                            diaryData = typeof doc.content === 'string' ? JSON.parse(doc.content) : doc.content;
                        } catch {
                            diaryData = {};
                        }
                        dataManager.setDiaryContent(diaryData);
                        // Focus first diary field
                        document.querySelector('.editor-diary textarea, .editor-diary input')?.focus();
                    } else {
                        document.querySelector('.editor-letter').style.display = '';
                        document.querySelector('.editor-diary').style.display = 'none';
                        document.querySelector('.template-filter .filter-text').textContent = 'Letter';
                        dataManager.setLetterContent(doc.content);
                        input.focus();
                    }
                };

                // Delete button
                item.querySelector('.delete-btn').onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${doc.filename}"?`)) {
                        await fetch(`/delete_document/${getActiveTemplate()}/${doc._id}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                        });
                        showNotification('Document deleted.');
                        loadHistoryFromServer();
                    }
                };

                itemsContainer.appendChild(item);
            });

            groupDiv.appendChild(itemsContainer);

            header.addEventListener('click', function () {
                itemsContainer.classList.toggle('collapsed');
                const arrow = header.querySelector('.collapse-arrow');
                arrow.innerHTML = itemsContainer.classList.contains('collapsed') ? '&#9654;' : '&#9660;';
            });

            historyList.appendChild(groupDiv);
        });
    }

    // Load history from server
    async function loadHistoryFromServer() {
        try {
            const resp = await fetch(`/get_documents/${getActiveTemplate()}`);
            const data = await resp.json();
            renderHistory(data.documents);
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    }

    // Close modal handlers
    [closeNewFile, cancelNewFile].forEach(btn => {
        btn.addEventListener('click', function () {
            newFileModal.style.display = 'none';
            newFileName.value = '';
        });
    });

    // Initialize Managers
    const exportManager = new ExportManager();
    const dataManager = new DataManager();

    // Export button handler - now much cleaner!
    exportBtn.addEventListener('click', async function () {
        const template = getActiveTemplate();
        await exportManager.handleExport(template);
    });

    // Create new document via API
    createNewFile.addEventListener('click', async function () {
        const fileName = newFileName.value.trim();
        if (!fileName) return;
        
        try {
            // Create empty document via API
            const type = getActiveTemplate();
            const response = await fetch(`/create_document/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    filename: fileName, 
                    content: ''
                })
            });
            
            if (!response.ok) throw new Error('Failed to create document');
            
            const data = await response.json();
            currentDocumentId = data.doc_id; // Store the document ID
            filenameInput.value = fileName;
            newFileModal.style.display = 'none';
            
            // Clear the appropriate editor
            clearCurrentDocument(true);
            
            showNotification('New document created!');
        } catch (err) {
            alert('Failed to create document: ' + err);
        }
    });

    const switchBtn = document.querySelector('.switch-btn');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    let isToggled = false;

    switchBtn.addEventListener('click', function () {
        isToggled = !isToggled;
        this.classList.toggle('active');
        sidebar.classList.toggle('open');
        mainContent.classList.toggle('shifted');
        
        // Load history when sidebar is opened
        if (isToggled) {
            loadHistoryFromServer();
        }
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', function (e) {
        if (isToggled &&
            !sidebar.contains(e.target) &&
            !switchBtn.contains(e.target)) {
            isToggled = false;
            switchBtn.classList.remove('active');
            sidebar.classList.remove('open');
            mainContent.classList.remove('shifted');
        }
    });

    document.querySelectorAll('.template-filter .dropdown-content a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const template = this.getAttribute('data-template');
            
            // Toggle editor visibility
            document.querySelector('.editor-letter').style.display = (template === 'letter') ? '' : 'none';
            document.querySelector('.editor-diary').style.display = (template === 'diary') ? '' : 'none';
            // Optionally update dropdown label
            document.querySelector('.template-filter .filter-text').textContent = this.textContent;
        });
    });

    addTemplateBtn.addEventListener('click', function () {
        newFileModal.style.display = 'flex';
        document.getElementById('newFileName').focus();
    });

    // Sync diary textarea heights
    const leftTextarea = document.querySelector('textarea[data-field="left_box"]');
    const rightTextarea = document.querySelector('textarea[data-field="right_box"]');
    if (leftTextarea && rightTextarea) {
        leftTextarea.addEventListener('input', syncDiaryTextareaHeights);
        rightTextarea.addEventListener('input', syncDiaryTextareaHeights);

        // Initial sync
        syncDiaryTextareaHeights();
    }

    // Clear current document ID when starting fresh
    function clearCurrentDocument(preserveFilename = false) {
        if (!preserveFilename) {
            currentDocumentId = null;
            filenameInput.value = '';
        }
        dataManager.clearFormData(getActiveTemplate());
    }
});

// Show notification message
function showNotification(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'restore-message';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.classList.add('fade-out');
        setTimeout(() => document.body.removeChild(messageDiv), 500);
    }, 2000);
}


// Sync heights of diary textareas
function syncDiaryTextareaHeights() {
    const left = document.querySelector('textarea[data-field="left_box"]');
    const right = document.querySelector('textarea[data-field="right_box"]');
    if (!left || !right) return;

    // Reset heights to auto to get correct scrollHeight
    left.style.height = 'auto';
    right.style.height = 'auto';

    // Find the max height
    const maxHeight = Math.max(left.scrollHeight, right.scrollHeight);

    // Set both to the max height
    left.style.height = `${maxHeight}px`;
    right.style.height = `${maxHeight}px`;
}

