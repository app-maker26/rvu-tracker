/*
 * RVU Tracker client-side logic
 *
 * This script dynamically populates the exam table from the built‑in
 * exam data, handles user input events to recalculate totals, and
 * displays the results (total RVUs, threshold percentage, and status).
 */

(function () {
    'use strict';

    // Predefined exam types and their RVUs per exam. You can extend or modify
    // this array to support additional exam categories.
    const examData = [
        { type: 'MRI Abdomen/Pelvis (wow)', rvu: 2.21 },
        { type: 'CT Abdomen/Pelvis (w)', rvu: 1.82 },
        { type: 'Ultrasound (US)', rvu: 0.80 },
        { type: 'X‑ray (per view)', rvu: 0.18 }
    ];

    // Create table rows for each exam type
    const tableBody = document.querySelector('#examTable tbody');
    examData.forEach((exam, index) => {
        const row = document.createElement('tr');

        // Exam name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = exam.type;
        row.appendChild(nameCell);

        // RVU per exam cell
        const rvuCell = document.createElement('td');
        rvuCell.textContent = exam.rvu.toFixed(2);
        row.appendChild(rvuCell);

        // Input cell for number of exams
        const inputCell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.step = '1';
        input.value = '0';
        input.setAttribute('data-index', index.toString());
        input.addEventListener('input', calculateTotals);
        inputCell.appendChild(input);
        row.appendChild(inputCell);

        tableBody.appendChild(row);
    });

    // DOM elements for results
    const thresholdInput = document.getElementById('thresholdInput');
    const totalRvusEl = document.getElementById('totalRvus');
    const percentageEl = document.getElementById('percentage');
    const statusEl = document.getElementById('status');
    const suggestionContainer = document.getElementById('suggestions');
    const suggestionList = document.getElementById('suggestionList');

    // Listen for changes to threshold to recalculate
    thresholdInput.addEventListener('input', calculateTotals);

    /**
     * Calculate total RVUs, percentage of threshold met, and update status.
     */
    function calculateTotals() {
        // Retrieve threshold value and ensure it is numeric and > 0
        const thresholdVal = parseFloat(thresholdInput.value);
        const threshold = isNaN(thresholdVal) || thresholdVal <= 0 ? 0 : thresholdVal;

        // Sum total RVUs across all exam inputs
        let totalRvus = 0;
        // For each input, multiply by the RVU value
        const inputs = tableBody.querySelectorAll('input');
        inputs.forEach((input) => {
            const count = parseFloat(input.value) || 0;
            const idx = parseInt(input.getAttribute('data-index'), 10);
            const rvuPerExam = examData[idx].rvu;
            totalRvus += count * rvuPerExam;
        });

        // Update total RVUs display
        totalRvusEl.textContent = totalRvus.toFixed(2);

        // If threshold is zero, we cannot compute a percentage
        let percentage = 0;
        if (threshold > 0) {
            percentage = totalRvus / threshold;
        }
        // Convert to percentage with two decimals
        const percentageDisplay = (percentage * 100).toFixed(2) + '%';
        percentageEl.textContent = percentageDisplay;

        // Determine summary message and suggestions based on whether threshold is met
        if (threshold === 0) {
            // Invalid threshold: prompt user to enter a threshold
            statusEl.textContent = 'Please enter a valid threshold.';
            statusEl.style.color = '#333';
            suggestionContainer.style.display = 'none';
        } else if (totalRvus >= threshold) {
            // User exceeded or met threshold
            const pctStr = (percentage * 100).toFixed(2);
            statusEl.textContent = `Great job! You achieved ${pctStr}% of your daily RVU target and exceeded your threshold.`;
            statusEl.style.color = '#2b8a3e'; // green tone
            // Hide suggestions when threshold met
            suggestionContainer.style.display = 'none';
        } else {
            // User is below threshold; compute additional counts needed for each exam type
            const pctStr = (percentage * 100).toFixed(2);
            const remaining = threshold - totalRvus;
            statusEl.textContent = `You are at ${pctStr}% of your daily RVU target. You need ${remaining.toFixed(2)} more RVUs to reach 100%.`;
            statusEl.style.color = '#c92a2a'; // red tone

            // Generate suggestions list: how many more of each exam type to reach threshold
            suggestionList.innerHTML = '';
            examData.forEach((exam) => {
                const needed = Math.ceil(remaining / exam.rvu);
                const li = document.createElement('li');
                li.textContent = `${needed} additional ${exam.type} exam(s)`;
                suggestionList.appendChild(li);
            });
            suggestionContainer.style.display = 'block';
        }
    }

    // Perform an initial calculation to set default values
    calculateTotals();
})();