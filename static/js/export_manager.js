import { pagedExportTemplates } from './export_templates.js';
import { DataManager } from './data_manager.js';

// Export Manager - Handles all export functionality
export class ExportManager {
    constructor() {
        this.dataManager = new DataManager();
    }

    // Main export handler
    async handleExport(template) {
        if (template === 'letter') {
            this.exportLetter();
        } else {
            this.exportDiary();
        }
    }

    // Export letter with CSS Paged Media
    exportLetter() {
        const content = this.dataManager.getLetterContent();
        if (!content) {
            alert('Cannot export empty document!');
            return;
        }

        const letterContent = pagedExportTemplates.letterContent({ letter_content: content });
        const documentHtml = pagedExportTemplates.createDocument(letterContent, 'Letter Export');
        
        this.openPrintWindow(documentHtml);
    }

    // Export diary with CSS Paged Media
    exportDiary() {
        const container = document.getElementById('diaryExportLayout');
        const get = field => container.querySelector(`[data-field="${field}"]`)?.value || '';
        
        const leftContent = get('left_box');
        const rightContent = get('right_box');
        
        if (!leftContent && !rightContent) {
            alert('Cannot export empty document!');
            return;
        }

        // Create diary content with proper structure
        const diaryData = {
            case_diary_no: get('case_diary_no'),
            rule_no: get('rule_no'),
            special_report_no: get('special_report_no'),
            thana: get('thana'),
            district: get('district'),
            against_1: get('against_1'),
            against_2: get('against_2'),
            fir_number: get('fir_number'),
            fir_date: get('fir_date'),
            event_date_place: get('event_date_place'),
            sections: get('sections'),
            left_box: leftContent,
            right_box: rightContent
        };

        // Build content with header and table - let CSS handle pagination
        const diaryContent = pagedExportTemplates.diaryHeader(diaryData) + 
                           pagedExportTemplates.diaryTable({
                               showHeader: true,
                               left_box: leftContent,
                               right_box: rightContent
                           });

        const documentHtml = pagedExportTemplates.createDocument(diaryContent, 'Diary Export');
        
        this.openPrintWindow(documentHtml);
    }

    // Open print window with formatted content
    openPrintWindow(htmlContent) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        printWindow.onload = function () {
            printWindow.print();
            printWindow.onafterprint = function () {
                printWindow.close();
            };
        };
    }


} 