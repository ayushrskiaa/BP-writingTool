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
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async function() {
            try {
                // Get the Devanagari translation
                const resp = await fetch('/api/transliterate_text', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: input.value })
                });
                const data = await resp.json();
                const devanagariText = data.result;

                // Create a temporary iframe for printing
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                document.body.appendChild(iframe);
                
                // Write content to the iframe with improved formatting
                iframe.contentDocument.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Bihar Police Document</title>
                        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;700&display=swap" rel="stylesheet">
                        <style>
                            @page {
                                size: A4;
                                margin: 2.54cm; /* Standard 1-inch margin */
                            }
                            body {
                                font-family: 'Noto Sans Devanagari', sans-serif;
                                margin: 0;
                                padding: 0;
                                font-size: 14pt;
                                line-height: 1.6;
                                color: #000;
                            }
                            .content {
                                white-space: pre-wrap;
                                word-wrap: break-word;
                                padding: 0;
                                margin: 0;
                            }
                            /* Preserve spaces and newlines */
                            .content p {
                                margin: 0;
                                padding: 0;
                                min-height: 1.6em;
                            }
                            /* Preserve multiple spaces */
                            .content span {
                                white-space: pre;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="content">
                            ${devanagariText.split('\n').map(line => 
                                `<p><span>${line}</span></p>`
                            ).join('')}
                        </div>
                    </body>
                    </html>
                `);
                
                iframe.contentDocument.close();

                // Wait for resources to load then print
                setTimeout(() => {
                    iframe.contentWindow.focus();
                    iframe.contentWindow.print();
                    
                    // Cleanup
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                    }, 1000);
                }, 500);

            } catch (error) {
                console.error('Export error:', error);
                alert('An error occurred while preparing the document for printing.');
            }
        });
    }

    // Restore saved content
    restoreSavedContent();
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
            showRestoreMessage(message);
        }
    } catch (error) {
        console.error('Error restoring saved content:', error);
    }
}

// Show restore message
function showRestoreMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'restore-message';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.classList.add('fade-out');
        setTimeout(() => document.body.removeChild(messageDiv), 500);
    }, 3000);
}
