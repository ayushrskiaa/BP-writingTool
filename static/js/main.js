import { getWordBoundaries, getTextPosition } from '/static/js/utils.js';

const input = document.getElementById('hinglish-input');
const suggestionsBox = document.getElementById('suggestions');
let prefetchCache = {};
let lastTranslation = '';

const STORAGE_KEY = 'biharPolice_autosave';

function getCaretPosition(input) {
    // Get the bounding rectangle of the textarea
    const rect = input.getBoundingClientRect();
    
    // Create a temporary div to measure text
    const div = document.createElement('div');
    div.style.cssText = window.getComputedStyle(input, null).cssText;
    div.style.height = 'auto';
    div.style.position = 'absolute';
    div.style.whiteSpace = 'pre-wrap';
    div.style.top = '-9999px';
    div.style.opacity = '0';
    
    // Get the text before the cursor
    const textBeforeCursor = input.value.substring(0, input.selectionStart);
    div.textContent = textBeforeCursor;
    
    // Add a span at the end to measure cursor position
    const span = document.createElement('span');
    span.textContent = '.';
    div.appendChild(span);
    document.body.appendChild(div);
    
    // Calculate position
    const spanRect = span.getBoundingClientRect();
    const position = {
        top: spanRect.top - rect.top + input.scrollTop,
        left: spanRect.left - rect.left + input.scrollLeft
    };
    
    // Clean up
    document.body.removeChild(div);
    
    return position;
}

let typingTimer;
const doneTypingInterval = 50; // Reduced delay to 50ms for faster response

input.addEventListener('input', function() {
    clearTimeout(typingTimer);
    const value = input.value;
    const cursor = input.selectionStart;
    const [start, end] = getWordBoundaries(value, cursor - 1);
    const currentWord = value.slice(start, end);

    if (currentWord.trim()) {
        // Wait for user to stop typing for 200ms before fetching suggestions
        typingTimer = setTimeout(async () => {
            const suggestions = await fetchSuggestions(currentWord);
            if (suggestions && suggestions.length > 0) {
                showSuggestions(suggestions, start, end);
            }
        }, doneTypingInterval);
    } else {
        suggestionsBox.style.display = 'none';
    }

    // Add auto-save
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(saveToLocalStorage, AUTOSAVE_DELAY);
});

input.addEventListener('keydown', async function(e) {
    if (e.key === ' ') {
        e.preventDefault();
        const value = input.value;
        const cursor = input.selectionStart;
        const [start, end] = getWordBoundaries(value, cursor - 1);
        const word = value.slice(start, end);
        
        if (!word.trim()) {
            input.value = value.slice(0, cursor) + ' ' + value.slice(cursor);
            input.selectionStart = input.selectionEnd = cursor + 1;
            return;
        }

        let suggestions = await fetchSuggestions(word);
        if (suggestions && suggestions.length > 0) {
            // Auto-replace with first suggestion
            const suggestion = suggestions[0];
            const newValue = value.slice(0, start) + suggestion + ' ' + value.slice(end);
            input.value = newValue;
            input.selectionStart = input.selectionEnd = start + suggestion.length + 1;
        } else {
            input.value = value.slice(0, cursor) + ' ' + value.slice(cursor);
            input.selectionStart = input.selectionEnd = cursor + 1;
        }
        suggestionsBox.style.display = 'none';
    }
});

// Add click handler for the input field
input.addEventListener('click', async function(e) {
    const value = input.value;
    const cursor = input.selectionStart;
    const [start, end] = getWordBoundaries(value, cursor);
    const word = value.slice(start, end);

    if (word.trim()) {
        const suggestions = await fetchSuggestions(word);
        if (suggestions && suggestions.length > 0) {
            showSuggestions(suggestions, start, end);
        }
    }
});

// Hide suggestions when clicking outside
document.addEventListener('click', function(e) {
    if (!suggestionsBox.contains(e.target) && !input.contains(e.target)) {
        suggestionsBox.style.display = 'none';
    }
});

async function fetchSuggestions(word) {
    if (!word.trim()) return [];
    if (prefetchCache[word]) return prefetchCache[word];
    try {
        const res = await fetch('/api/transliterate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({word})
        });
        const data = await res.json();
        prefetchCache[word] = data.suggestions;
        return data.suggestions;
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
}

// Update the document click handler to not hide suggestions when clicking inside the input
document.addEventListener('click', function(e) {
    if (!suggestionsBox.contains(e.target) && !input.contains(e.target)) {
        suggestionsBox.style.display = 'none';
    }
});

// Update showSuggestions to position the box near the clicked word
function showSuggestions(suggestions, wordStart, wordEnd) {
    suggestionsBox.innerHTML = '';
    if (!suggestions || suggestions.length === 0) {
        suggestionsBox.style.display = 'none';
        return;
    }

    // Get the position of the clicked word
    const textBeforeWord = input.value.substring(0, wordStart);
    const textWidth = getTextWidth(textBeforeWord, input);
    const inputPos = input.getBoundingClientRect();
    const lineHeight = parseInt(window.getComputedStyle(input).lineHeight);
    const lines = textBeforeWord.split('\n').length - 1;

    suggestionsBox.style.position = 'fixed';
    suggestionsBox.style.left = (inputPos.left + Math.min(textWidth, input.offsetWidth - 200)) + 'px';
    suggestionsBox.style.top = (inputPos.top + (lines * lineHeight) + lineHeight + 5) + 'px';
    
    suggestions.forEach((suggestion) => {
        const div = document.createElement('div');
        div.className = 'suggestion';
        div.textContent = suggestion;
        div.onclick = () => {
            const value = input.value;
            input.value = value.slice(0, wordStart) + suggestion + value.slice(wordEnd);
            input.selectionStart = input.selectionEnd = wordStart + suggestion.length;
            suggestionsBox.style.display = 'none';
        };
        suggestionsBox.appendChild(div);
    });
    
    suggestionsBox.style.display = 'block';
}

// Helper function to calculate text width
function getTextWidth(text, element) {
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    const font = window.getComputedStyle(element, null).getPropertyValue('font');
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

// Ensure suggestions don't go off-screen
function adjustSuggestionsPosition() {
    if (suggestionsBox.style.display === 'none') return;
    
    const boxRect = suggestionsBox.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Adjust horizontal position if off-screen
    if (boxRect.right > viewportWidth) {
        suggestionsBox.style.left = (viewportWidth - boxRect.width - 10) + 'px';
    }
    
    // Adjust vertical position if off-screen
    if (boxRect.bottom > viewportHeight) {
        suggestionsBox.style.top = (parseInt(suggestionsBox.style.top) - boxRect.height - 40) + 'px';
    }
}

// Call adjustSuggestionsPosition after showing suggestions
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target === suggestionsBox && 
            mutation.type === 'attributes' && 
            mutation.attributeName === 'style') {
            adjustSuggestionsPosition();
        }
    });
});

observer.observe(suggestionsBox, { attributes: true });

// Wait for DOM to load before adding event listeners
document.addEventListener('DOMContentLoaded', function() {
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

    // Save document to localStorage
    saveBtn.addEventListener('click', async function() {
        const filename = filenameInput.value.trim() || 'Untitled';
        const content = input.value.trim();
        if (!content) return alert('Cannot save empty document!');

        try {
            const resp = await fetch('/api/save_document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, content })
            });
            const data = await resp.json();
            if (data.success) {
                showNotification('Document saved to server!');
                // Optionally refresh history from server
                await loadHistoryFromServer();
            } else {
                alert('Save failed: ' + (data.error || 'Unknown error'));
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
            const dateObj = new Date(doc.created_at || doc.timestamp || doc.date || Date.now());
            const dateKey = getDateString(dateObj);
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push({ ...doc, date: dateObj });
        });

        historyList.innerHTML = '';

        // Sort date keys by latest date first
        const sortedDateKeys = Object.keys(groups).sort((a, b) => {
            // Parse the first doc's date in each group for sorting
            const aDate = groups[a][0].date;
            const bDate = groups[b][0].date;
            return bDate - aDate; // Descending order
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

            // Sort docs in group by created_at descending (latest first)
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
                    <div class="history-item-details">
                        <span class="history-item-name">${doc.filename}</span>
                        <span class="history-item-time">Created: ${createdStr}</span>
                        <span class="history-item-time">Last update: ${updatedStr}</span>
                        <span class="history-item-preview">${firstLine}</span>
                    </div>
                    <div class="history-item-actions">
                        <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                `;

                // Load document on click
                item.querySelector('.history-item-details').onclick = () => {
                    filenameInput.value = doc.filename;
                    input.value = doc.content;
                };

                // Edit button
                item.querySelector('.edit-btn').onclick = (e) => {
                    e.stopPropagation();
                    filenameInput.value = doc.filename;
                    input.value = doc.content;
                    input.focus();
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

            header.addEventListener('click', function() {
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
        btn.addEventListener('click', function() {
            newFileModal.style.display = 'none';
            newFileName.value = '';
        });
    });

    // Create new file handler
    createNewFile.addEventListener('click', function() {
        const fileName = newFileName.value.trim();
        if (fileName) {
            filenameInput.value = fileName;
            newFileModal.style.display = 'none';
            document.getElementById('hinglish-input').value = ''; // Clear existing content
            document.getElementById('hinglish-input').focus();
        }
    });

    // Update the export button handler
    exportBtn.addEventListener('click', async function() {
        try {
            const content = document.getElementById('hinglish-input').value;
            
            // Get the transliterated text
            const resp = await fetch('/api/transliterate_text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: content })
            });
            
            const data = await resp.json();
            if (data.result) {
                // Create a print window
                const printWindow = window.open('', '_blank');
                
                // Add the content with proper styling
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Print Document</title>
                        <style>
                            @page { 
                                size: A4;
                                margin: 2.54cm;
                            }
                            body {
                                font-family: 'Noto Sans Devanagari', sans-serif;
                                font-size: 14px;
                                line-height: 1.5;
                                white-space: pre-wrap;
                            }
                        </style>
                    </head>
                    <body>
                        ${data.result}
                    </body>
                    </html>
                `);
                
                printWindow.document.close();

                // Wait for resources to load then print
                printWindow.onload = function() {
                    printWindow.print();
                    // Close the print window after printing
                    printWindow.onafterprint = function() {
                        printWindow.close();
                    };
                };
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('An error occurred while exporting.');
        }
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === newFileModal) {
            newFileModal.style.display = 'none';
            newFileName.value = '';
        }
    });

    const switchBtn = document.querySelector('.switch-btn');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    let isToggled = false;

    switchBtn.addEventListener('click', function() {
        isToggled = !isToggled;
        this.classList.toggle('active');
        sidebar.classList.toggle('open');
        mainContent.classList.toggle('shifted');
        
        // Rotate switch icon when sidebar is open
        const switchIcon = this.querySelector('.switch-icon');
        switchIcon.style.transform = isToggled ? 'rotate(180deg)' : 'rotate(0)';
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
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

    langToggleBtn.addEventListener('click', function() {
        isHindi = !isHindi;
        this.classList.toggle('active');
        
        // Toggle the icon
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-toggle-on');
        icon.classList.toggle('fa-toggle-off');
        
        // Add your language switch logic here
        console.log('Language switched to:', isHindi ? 'हिंदी' : 'Hinglish');
        
        // Update textarea placeholder based on language
        const textarea = document.getElementById('hinglish-input');
        textarea.placeholder = isHindi ? 
            "यहाँ हिंदी में टाइप करें..." : 
            "यहाँ Hinglish में टाइप करें...";
    });

    addTemplateBtn.addEventListener('click', function() {
        newFileModal.style.display = 'block';
        newFileName.value = '';
        newFileName.focus();
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
