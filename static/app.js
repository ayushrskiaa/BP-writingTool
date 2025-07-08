const input = document.getElementById('hinglish-input');
const output = document.getElementById('devnagri-output');
// const suggestionsDiv = document.getElementById('suggestions');
const printBtn = document.getElementById('print-btn');

// input.addEventListener('keydown', async function(e) {
//     if (e.key === ' ') {
//         e.preventDefault();
//         const value = input.value;
//         const cursor = input.selectionStart;
//         // Find the last word before the cursor
//         const before = value.slice(0, cursor);
//         const after = value.slice(cursor);
//         const words = before.trim().split(/\s+/);
//         const lastWord = words[words.length - 1] || '';
//         if (lastWord) {
//             const resp = await fetch('/api/transliterate', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ word: lastWord })
//             });
//             const data = await resp.json();
//             const top = data.suggestions[0] || lastWord;
//             // Replace last word with Devanagari and add a space
//             words[words.length - 1] = top;
//             const newValue = words.join(' ') + ' ' + after;
//             input.value = newValue;
//             // Move cursor to after the inserted space
//             input.selectionStart = input.selectionEnd = (words.join(' ') + ' ').length;
//             updateOutput();
//         }
//     }
// });

// input.addEventListener('input', updateOutput);

// function updateOutput() {
//     fetch('/api/transliterate_text', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ text: input.value })
//     })
//     .then(resp => resp.json())
//     .then(data => {
//         output.value = data.result;
//     });
// }

printBtn.onclick = function() {
    window.print();
};
