// Data Manager - Handles form data operations
export class DataManager {
    constructor() {
        this.input = document.getElementById('hinglish-input');
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
        return this.input.value.trim();
    }

    // Set letter content
    setLetterContent(content) {
        this.input.value = content;
    }

    // Clear all form data
    clearFormData(template) {
        if (template === 'letter') {
            this.input.value = '';
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