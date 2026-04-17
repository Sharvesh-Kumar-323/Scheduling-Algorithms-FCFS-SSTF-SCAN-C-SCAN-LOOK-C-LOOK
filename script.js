document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('simulator-form');
    const resetBtn = document.getElementById('reset-btn');
    const exampleBtn = document.getElementById('example-btn');
    const resultsSection = document.getElementById('results-section');
    
    // Store chart instances to destroy them before re-rendering
    let chartInstances = [];

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        runSimulation();
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        resultsSection.innerHTML = '';
        clearCharts();
    });

    if (exampleBtn) {
        exampleBtn.addEventListener('click', () => {
            document.getElementById('request-sequence').value = "98, 183, 37, 122, 14, 124, 65, 67";
            document.getElementById('initial-head').value = "53";
            document.getElementById('total-tracks').value = "200";
            document.getElementById('direction').value = "towards-higher";
        });
    }

    function clearCharts() {
        chartInstances.forEach(chart => chart.destroy());
        chartInstances = [];
    }

    function runSimulation() {
        const reqString = document.getElementById('request-sequence').value;
        const initialHead = parseInt(document.getElementById('initial-head').value, 10);
        const totalTracks = parseInt(document.getElementById('total-tracks').value, 10);
        const direction = document.getElementById('direction').value; // 'towards-higher' or 'towards-lower'

        // Parse requests
        const requests = reqString.split(',').map(item => parseInt(item.trim(), 10)).filter(item => !isNaN(item));
        
        if (requests.length === 0) {
            alert("Please enter valid comma-separated numbers for requests.");
            return;
        }

        // Clean previous results
        resultsSection.innerHTML = '';
        clearCharts();

        // Run all algorithms
        const results = [
            runFCFS(requests, initialHead),
            runSSTF(requests, initialHead),
            runSCAN(requests, initialHead, totalTracks, direction),
            runCSCAN(requests, initialHead, totalTracks, direction),
            runLOOK(requests, initialHead, direction),
            runCLOOK(requests, initialHead, direction)
        ];

        // Render results
        results.forEach((res, index) => {
            renderAlgorithmCard(res, index, totalTracks);
        });
    }

    // Helper to calculate total seek time given a sequence
    function calculateSeekTime(sequence) {
        let seekTime = 0;
        for (let i = 1; i < sequence.length; i++) {
            seekTime += Math.abs(sequence[i] - sequence[i - 1]);
        }
        return seekTime;
    }

    /* ----------------------------------------------------------------------
       ALGORITHMS
       ---------------------------------------------------------------------- */

    function runFCFS(requests, head) {
        const sequence = [head, ...requests];
        return {
            name: "FCFS (First Come First Serve)",
            sequence,
            seekTime: calculateSeekTime(sequence)
        };
    }

    function runSSTF(requests, head) {
        const sequence = [head];
        let unvisited = [...requests];
        let currentHead = head;

        while (unvisited.length > 0) {
            let closestIndex = -1;
            let minDistance = Infinity;

            for (let i = 0; i < unvisited.length; i++) {
                const dist = Math.abs(currentHead - unvisited[i]);
                if (dist < minDistance) {
                    minDistance = dist;
                    closestIndex = i;
                }
            }

            currentHead = unvisited[closestIndex];
            sequence.push(currentHead);
            unvisited.splice(closestIndex, 1);
        }

        return {
            name: "SSTF (Shortest Seek Time First)",
            sequence,
            seekTime: calculateSeekTime(sequence)
        };
    }

    function runSCAN(requests, head, totalTracks, direction) {
        const sequence = [head];
        const maxTrack = totalTracks - 1;
        
        let left = requests.filter(r => r < head).sort((a, b) => a - b);
        let right = requests.filter(r => r >= head).sort((a, b) => a - b);

        if (direction === 'towards-higher') {
            right.forEach(r => sequence.push(r));
            // Go to end if there are left elements
            if (left.length > 0) sequence.push(maxTrack);
            left.reverse().forEach(r => sequence.push(r));
        } else {
            left.reverse().forEach(r => sequence.push(r));
            // Go to 0 if there are right elements
            if (right.length > 0) sequence.push(0);
            right.forEach(r => sequence.push(r));
        }

        return {
            name: "SCAN",
            sequence,
            seekTime: calculateSeekTime(sequence)
        };
    }

    function runCSCAN(requests, head, totalTracks, direction) {
        const sequence = [head];
        const maxTrack = totalTracks - 1;

        let left = requests.filter(r => r < head).sort((a, b) => a - b);
        let right = requests.filter(r => r >= head).sort((a, b) => a - b);

        if (direction === 'towards-higher') {
            right.forEach(r => sequence.push(r));
            if (left.length > 0) {
                sequence.push(maxTrack);
                sequence.push(0); // Jump to beginning without servicing
                left.forEach(r => sequence.push(r));
            }
        } else {
            left.reverse().forEach(r => sequence.push(r));
            if (right.length > 0) {
                sequence.push(0);
                sequence.push(maxTrack); // Jump to end
                right.reverse().forEach(r => sequence.push(r));
            }
        }

        return {
            name: "C-SCAN (Circular SCAN)",
            sequence,
            seekTime: calculateSeekTime(sequence)
        };
    }

    function runLOOK(requests, head, direction) {
        const sequence = [head];
        
        let left = requests.filter(r => r < head).sort((a, b) => a - b);
        let right = requests.filter(r => r >= head).sort((a, b) => a - b);

        if (direction === 'towards-higher') {
            right.forEach(r => sequence.push(r));
            left.reverse().forEach(r => sequence.push(r));
        } else {
            left.reverse().forEach(r => sequence.push(r));
            right.forEach(r => sequence.push(r));
        }

        return {
            name: "LOOK",
            sequence,
            seekTime: calculateSeekTime(sequence)
        };
    }

    function runCLOOK(requests, head, direction) {
        const sequence = [head];
        
        let left = requests.filter(r => r < head).sort((a, b) => a - b);
        let right = requests.filter(r => r >= head).sort((a, b) => a - b);

        if (direction === 'towards-higher') {
            right.forEach(r => sequence.push(r));
            if (left.length > 0) {
                // Jump directly to the lowest requested track
                left.forEach(r => sequence.push(r));
            }
        } else {
            left.reverse().forEach(r => sequence.push(r));
            if (right.length > 0) {
                // Jump directly to the highest requested track
                right.reverse().forEach(r => sequence.push(r));
            }
        }

        return {
            name: "C-LOOK (Circular LOOK)",
            sequence,
            seekTime: calculateSeekTime(sequence)
        };
    }

    /* ----------------------------------------------------------------------
       UI RENDERING
       ---------------------------------------------------------------------- */

    function renderAlgorithmCard(data, index, totalTracks) {
        const maxTrack = totalTracks - 1;
        const cardIds = `chart-${index}`;

        // Create HTML structure for the card
        const card = document.createElement('div');
        card.className = 'algo-card';
        card.innerHTML = `
            <div class="algo-header">
                <h3>${data.name}</h3>
                <span class="badge">Seek: ${data.seekTime}</span>
            </div>
            <div class="algo-body">
                <div class="metrics">
                    <div class="metric-row">
                        <div class="metric-label">Head Movement</div>
                        <div class="metric-value">${data.sequence.join(' &rarr; ')}</div>
                    </div>
                </div>
                <div class="chart-container">
                    <canvas id="${cardIds}"></canvas>
                </div>
            </div>
        `;
        
        resultsSection.appendChild(card);

        // Render Chart.js
        renderChart(cardIds, data, maxTrack);
    }

    function renderChart(canvasId, ObjectData, maxTrack) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Prepare coordinates: x is Track, y is Step
        const dataPoints = ObjectData.sequence.map((track, step) => ({
            x: track,
            y: step
        }));

        const chartConfig = {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Head Path',
                    data: dataPoints,
                    borderColor: '#ffffff', // White lines
                    borderWidth: 1.5,
                    backgroundColor: '#fff',
                    pointBackgroundColor: '#fde047', // Yellow dots
                    pointBorderColor: '#fde047',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    showLine: true,
                    fill: false,
                    tension: 0 // Straight lines
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: { top: 20, bottom: 20, left: 15, right: 15 }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'top',
                        min: 0,
                        max: maxTrack,
                        title: {
                            display: false
                        },
                        ticks: {
                            color: '#aedbb2', // Light greenish-white for ticks
                            font: { size: 12 },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 15
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                            drawBorder: true,
                            tickLength: 8,
                            drawOnChartArea: true
                        }
                    },
                    y: {
                        type: 'linear',
                        reverse: true, // Steps go downward
                        display: false, // Hide Y axis completely
                        min: 0,
                        max: ObjectData.sequence.length - 1
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1a202c',
                        titleColor: '#ffffff',
                        bodyColor: '#e2e8f0',
                        callbacks: {
                            label: function(context) {
                                return `Step ${context.parsed.y}: Track ${context.parsed.x}`;
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'drawArrows',
                afterDatasetsDraw(chart) {
                    const ctx = chart.ctx;
                    const meta = chart.getDatasetMeta(0);
                    ctx.save();
                    ctx.fillStyle = '#ffffff';
                    
                    for (let i = 0; i < meta.data.length - 1; i++) {
                        const start = meta.data[i];
                        const end = meta.data[i + 1];
                        
                        // Calculate midpoint for the arrow
                        const midX = (start.x + end.x) / 2;
                        const midY = (start.y + end.y) / 2;
                        
                        // Calculate angle
                        const angle = Math.atan2(end.y - start.y, end.x - start.x);
                        const headlen = 7; // Arrow head size
                        
                        // Draw arrow head
                        ctx.beginPath();
                        ctx.moveTo(midX, midY);
                        ctx.lineTo(midX - headlen * Math.cos(angle - Math.PI / 7), midY - headlen * Math.sin(angle - Math.PI / 7));
                        ctx.lineTo(midX - headlen * Math.cos(angle + Math.PI / 7), midY - headlen * Math.sin(angle + Math.PI / 7));
                        ctx.fill();
                    }
                    ctx.restore();
                }
            }]
        };

        const chartInstance = new Chart(ctx, chartConfig);
        chartInstances.push(chartInstance);
    }
});
