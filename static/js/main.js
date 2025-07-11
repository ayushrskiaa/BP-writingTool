import { templates } from './templates.js';

const input = document.getElementById('hinglish-input');

const STORAGE_KEY = 'biharPolice_autosave';



input.addEventListener('input', function () {
    // Add auto-save
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(saveToLocalStorage, AUTOSAVE_DELAY);
});



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
        return document.querySelector('.editor-letter').style.display !== 'none' ? 'letter' : 'diary';
    }

    // Save document to localStorage
    saveBtn.addEventListener('click', async function () {
        const filename = filenameInput.value.trim() || 'Untitled';
        let content = '';
        let type = getActiveTemplate();
        if (type === 'letter') {
            content = `<pre style="
                font-family: 'Noto Sans Devanagari', Arial, sans-serif;
                font-size: 16px;
                margin: 0;
                padding: 0;
                background: #fff;
                border: none;
                white-space: pre-wrap;
                word-break: break-word;
            ">${input.value}</pre>`;
        } else {
            content = getDiaryContent();
        }
        if (!content) return alert('Cannot save empty document!');

        try {
            await fetch('/api/save_document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, content, type })
            });
            showNotification('Document saved!');
            await loadHistoryFromServer();
        } catch (err) {
            alert('Failed to save document: ' + err);
        }
    });

    // Render history in sidebar
    function renderHistory(docs = []) {
        // Group by date
        const groups = {};
        docs.forEach(doc => {
            const dateObj = new Date(doc.created_at || doc.timestamp || doc.date || Date.now());
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
                const firstLine = doc.content.split('\n')[0].slice(0, 40);
                const created = new Date(doc.created_at || doc.date || Date.now());
                const updated = doc.updated_at ? new Date(doc.updated_at) : created;
                const createdStr = created.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                const updatedStr = updated.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <i class="fas fa-file-alt"></i>
                    <div class="history-item-details" style="cursor:pointer; padding: 0 10px;">
                        <span class="history-item-name" style="color:#0a225d;font-weight:500;">${doc.filename}</span>
                        <span class="history-item-time">Created: ${createdStr}</span>
                        <span class="history-item-time">Last update: ${updatedStr}</span>
                        <span class="history-item-preview" style="color:#444;">${firstLine}</span>
                    </div>
                    <div class="history-item-actions">
                        <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                // Load document on click (whole item)
                item.querySelector('.history-item-details').onclick = () => {
                    filenameInput.value = doc.filename;
                    if (doc.type === 'diary') {
                        document.querySelector('.editor-letter').style.display = 'none';
                        document.querySelector('.editor-diary').style.display = '';
                        document.querySelector('.template-filter .filter-text').textContent = 'Diary';
                        setDiaryContent(doc.content);
                        // Focus first diary field
                        document.querySelector('.editor-diary textarea, .editor-diary input')?.focus();
                    } else {
                        document.querySelector('.editor-letter').style.display = '';
                        document.querySelector('.editor-diary').style.display = 'none';
                        document.querySelector('.template-filter .filter-text').textContent = 'Letter';
                        // FIX: Only set plain text, not HTML
                        const tempDiv = document.createElement('div');
tempDiv.innerHTML = doc.content;
input.value = tempDiv.textContent || tempDiv.innerText || '';
                        input.focus();
                    }
                };

                // Edit button (same as above for now)
                item.querySelector('.edit-btn').onclick = (e) => {
                    e.stopPropagation();
                    item.querySelector('.history-item-details').onclick();
                };

                // Delete button
                item.querySelector('.delete-btn').onclick = async (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${doc.filename}"?`)) {
                        await fetch('/api/delete_document', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filename: doc.filename })
                        });
                        showNotification('Document deleted.');
                        await loadHistoryFromServer();
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
            const resp = await fetch('/api/get_documents');
            const data = await resp.json();
            renderHistory(data.documents);
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    }

    // Initial render
    loadHistoryFromServer();

    // Close modal handlers
    [closeNewFile, cancelNewFile].forEach(btn => {
        btn.addEventListener('click', function () {
            newFileModal.style.display = 'none';
            newFileName.value = '';
        });
    });

    // Create new file handler
    createNewFile.addEventListener('click', function () {
        const fileName = newFileName.value.trim();
        if (fileName) {
            filenameInput.value = fileName;
            newFileModal.style.display = 'none';
            document.getElementById('hinglish-input').value = ''; // Clear existing content
            document.getElementById('hinglish-input').focus();
        }
    });

    // Update the export button handler
    exportBtn.addEventListener('click', async function () {
        let content = '';
        if (getActiveTemplate() === 'letter') {
            content = `<pre style="
                font-family: 'Noto Sans Devanagari', Arial, sans-serif;
                font-size: 18px;
                margin: 0;
                padding: 0;
                background: #fff;
                border: none;
                white-space: pre-wrap;
                word-break: break-word;
            ">${input.value}</pre>`;
        } else {
            const container = document.getElementById('firExportLayout');
            const get = field => container.querySelector(`[data-field="${field}"]`)?.value || '';

            // --- PAGINATION LOGIC ---
            // Adjust this limit for your print size/font
            const CHARS_PER_PAGE = 500; // First page
            const CHARS_PER_PAGE_SECONDARY = 900; // Subsequent pages

            function paginateColumns(left, right, limitFirst, limitRest) {
                const leftPages = [];
                const rightPages = [];
                let i = 0, j = 0;
                let first = true;
                while (i < left.length || j < right.length) {
                    const limit = first ? limitFirst : limitRest;
                    leftPages.push(left.slice(i, i + limit));
                    rightPages.push(right.slice(j, j + limit));
                    i += limit;
                    j += limit;
                    first = false;
                }
                return [leftPages, rightPages];
            }

            const [leftPages, rightPages] = paginateColumns(
                get('left_box'),
                get('right_box'),
                CHARS_PER_PAGE,
                CHARS_PER_PAGE_SECONDARY
            );
            const maxPages = leftPages.length;

            // Header HTML (repeat on every page)
            function getHeader(get) {
                return templates.diaryHeader({
                    case_diary_no: get('case_diary_no'),
                    rule_no: get('rule_no')
                });
            }

            // Table HTML for each page
            function getTable(left, right, showHeader = false) {
                return templates.diaryTable({ left, right, showHeader });
            }

            // Build all pages
            let pagesHtml = '';
            for (let i = 0; i < maxPages; i++) {
                if (i === 0) {
                    pagesHtml += getHeader(get) + getTable(leftPages[i], rightPages[i], true);
                } else {
                    pagesHtml += getTable(leftPages[i], rightPages[i], false);
                }
            }
            content = pagesHtml;
        }
        if (!content) return alert('Cannot export empty document!');

        // Open print window with the formatted content
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Print Document</title>
                <style>
                    @media print {
                        body { margin: 20mm 15mm 20mm 15mm; }
                    }
                    body {
                        margin: 20mm 15mm 20mm 15mm;
                        background: #fff;
                    }
                    pre {
                        font-family: 'Noto Sans Devanagari', Arial, sans-serif;
                        font-size: 18px;
                        margin: 0;
                        padding: 0;
                        background: #fff;
                        border: none;
                        white-space: pre-wrap;
                        word-break: break-word;
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.onload = function () {
            printWindow.print();
            printWindow.onafterprint = function () {
                printWindow.close();
            };
        };
    });

    // Add New Doc logic (clear the correct editor)
    createNewFile.addEventListener('click', function () {
        const fileName = newFileName.value.trim();
        if (fileName) {
            filenameInput.value = fileName;
            newFileModal.style.display = 'none';
            if (getActiveTemplate() === 'letter') {
                input.value = '';
                input.focus();
            } else {
                // Clear all FIR Diary fields
                const container = document.getElementById('firExportLayout');
                container.querySelectorAll('input, textarea').forEach(el => el.value = '');
            }
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

        // Rotate switch icon when sidebar is open
        const switchIcon = this.querySelector('.switch-icon');
        switchIcon.style.transform = isToggled ? 'rotate(180deg)' : 'rotate(0)';
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
            switchBtn.querySelector('.switch-icon').style.transform = 'rotate(0)';
        }
    });

    // Language toggle functionality
    const langToggleBtn = document.querySelector('.lang-toggle-btn');
    let isHindi = false;

    langToggleBtn.addEventListener('click', function () {
        isHindi = !isHindi;
        this.classList.toggle('active');

        // Toggle the icon
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-toggle-on');
        icon.classList.toggle('fa-toggle-off');

        // Update textarea placeholder based on language
        const textarea = document.getElementById('hinglish-input');
        textarea.placeholder = isHindi ?
            "यहाँ हिंदी में टाइप करें..." :
            "यहाँ Hinglish में टाइप करें...";


    });



    function updateLogoBg() {
        if (input.value.trim() === '') {
            input.classList.add('bg-logo');
        } else {
            input.classList.remove('bg-logo');
        }
    }
    updateLogoBg();
    input.addEventListener('input', updateLogoBg);

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
});

let autoSaveTimer;
const AUTOSAVE_DELAY = 1000; // Save after 1 second of inactivity

// Auto-save functionality
function saveToLocalStorage() {
    const contentToSave = {
        mainInput: input.value,
        timestamp: new Date().getTime()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contentToSave));
}

// Restore saved content
function restoreSavedContent() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const { mainInput, timestamp } = JSON.parse(saved);
            input.value = mainInput;

            // Show restoration message
            const timeDiff = Math.round((new Date().getTime() - timestamp) / 60000);
            const message = `पिछला कार्य पुनर्स्थापित किया गया (${timeDiff} मिनट पहले का)`;
            showNotification(message);
        }
    } catch (error) {
        console.error('Error restoring saved content:', error);
    }
}

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
// Serialize all FIR Diary fields into a string for saving/exporting
function getDiaryContent() {
    const container = document.getElementById('firExportLayout');
    const inputs = container.querySelectorAll('input, textarea');
    let content = '';
    inputs.forEach(input => {
        const label = input.closest('td')?.querySelector('b')?.innerText || input.dataset.field || '';
        content += (label ? label + ': ' : '') + (input.value || '') + '\n';
    });
    return content.trim();
}

// Restore content to the FIR Diary fields (if you want to support editing)
function setDiaryContent(content) {
    const container = document.getElementById('firExportLayout');
    const inputs = container.querySelectorAll('input, textarea');
    // This assumes content is a string with lines in the same order as fields
    const lines = content.split('\n');
    inputs.forEach((input, i) => {
        input.value = lines[i] ? lines[i].replace(/^.*?:\s*/, '') : '';
    });
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
    left.style.height = `${maxHeight}px`;    left.style.height = right.style.height = maxHeight + 'px';
    right.style.height = `${maxHeight}px`;}

