// Data Manager - Handles form data operations
export class DataManager {
    constructor() {
        // No longer need the old input reference since we use Quill for letters
    }

    // Get diary content for saving
    getDiaryContent() {
        const container = document.getElementById('diaryExportLayout');
        const inputs = container.querySelectorAll('input[data-field], textarea[data-field]');
        const data = {};
        inputs.forEach(input => {
            data[input.getAttribute('data-field')] = input.value || '';
        });
        return data;
    }

    // Set diary content for loading
    setDiaryContent(data) {
        const container = document.getElementById('diaryExportLayout');
        const inputs = container.querySelectorAll('input[data-field], textarea[data-field]');
        inputs.forEach(input => {
            const key = input.getAttribute('data-field');
            if (data && data.hasOwnProperty(key)) {
                input.value = data[key];
            } else {
                input.value = '';
            }
        });
    }

    // Get letter content
    getLetterContent() {
        // Get the global quillEditor instance
        const quillEditor = window.quillEditor;
        if (quillEditor) {
            // Return HTML content for rich text
            return quillEditor.root.innerHTML.trim();
        }
        return '';
    }

    // Set letter content
    setLetterContent(content) {
        // Get the global quillEditor instance
        const quillEditor = window.quillEditor;
        if (quillEditor) {
            // Check if content is HTML or plain text
            if (content.includes('<') && content.includes('>')) {
                quillEditor.root.innerHTML = content;
            } else {
                quillEditor.setText(content);
            }
        }
    }

    // Clear all form data
    clearFormData(template) {
        if (template === 'letter') {
            const quillEditor = window.quillEditor;
            if (quillEditor) {
                quillEditor.setText('');
            }
        } else {
            const container = document.getElementById('diaryExportLayout');
            container.querySelectorAll('input, textarea').forEach(el => el.value = '');
        }
    }

    // Get form data for a specific template
    getFormData(template) {
        if (template === 'letter') {
            return this.getLetterContent();
        } else {
            return this.getDiaryContent();
        }
    }

    // Set form data for a specific template
    setFormData(template, content) {
        if (template === 'letter') {
            this.setLetterContent(content);
        } else {
            this.setDiaryContent(content);
        }
    }
} 