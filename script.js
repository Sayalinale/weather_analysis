
// Data feteching and filtering first section
document.addEventListener('DOMContentLoaded', function () {
    const yearDropdown = document.getElementById('year-dropdown');

    // Fetch data from the URL
    fetch('https://raw.githubusercontent.com/Sayalinale/weather_analysis/main/SET09123_IDV_CW_dataset.csv')
        .then(response => response.text())
        .then(data => {
            // Parse CSV data into an array of objects
            const parsedData = parseCSV(data);

            // Extract unique years from the dataset
            const years = [...new Set(parsedData.map(entry => entry.year))];

            // Populate the year dropdown
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.text = year;
                yearDropdown.add(option);
            });

            // Update chart when a year is selected from the dropdown
            yearDropdown.addEventListener('change', function () {
                updateChart(parsedData);
            });

            // Initial chart rendering
            updateChart(parsedData);
        });
});

function parseCSV(csv) {
    // Split the CSV into rows and extract headers
    const rows = csv.split('\n');
    const headers = rows[0].split(',');

    // Parse the remaining rows into objects
    const data = [];
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(',');
        const entry = {};
        for (let j = 0; j < headers.length; j++) {
            entry[headers[j]] = values[j];
        }
        data.push(entry);
    }

    return data;
}

function updateChart(data) {
    const selectedYear = document.getElementById('year-dropdown').value;

    // Filter data for the selected year
    const filteredData = data.filter(entry => entry.year === selectedYear);

    // Extract unique months, min_temp, and max_temp from the filtered data
    const uniqueMonths = [...new Set(filteredData.map(entry => entry.month))];
    const minTemps = uniqueMonths.map(month => {
        const temp = filteredData.find(entry => entry.month === month).min_temp;
        return parseFloat(temp);
    });
    const maxTemps = uniqueMonths.map(month => {
        const temp = filteredData.find(entry => entry.month === month).max_temp;
        return parseFloat(temp);
    });

    // Create a bar chart using Chart.js
    const barCtx = document.getElementById('temperature-chart').getContext('2d');
    if (window.barChart) {
        window.barChart.destroy();
    }
    window.barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: uniqueMonths,
            datasets: [
                {
                    label: 'Min Temperature',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    data: minTemps
                },
                {
                    label: 'Max Temperature',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    data: maxTemps
                }
            ]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    },
                    beginAtZero: true
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperatures'
                    },
                    stacked: false
                }
            }
        }
    });

    // Extract unique values and counts from the af_days column
    const afDaysCounts = countUniqueValues(filteredData.map(entry => entry.af_days));

    // Create a pie chart using Chart.js for af_days
    const pieCtx = document.getElementById('af-days-pie-chart').getContext('2d');
    if (window.pieChart) {
        window.pieChart.destroy();
    }
    window.pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: Object.keys(afDaysCounts),
            datasets: [
                {
                    data: Object.values(afDaysCounts),
                    backgroundColor: generateRandomColors(Object.keys(afDaysCounts).length)
                }
            ]
        },
        options: {
            title: {
                display: true,
                text: 'Distribution of temperatures for Air Frost Days'
            }
        }
    });
}

// Function to count unique values and their occurrences
function countUniqueValues(array) {
    return array.reduce((counts, value) => {
        counts[value] = (counts[value] || 0) + 1;
        return counts;
    }, {});
}

// Function to generate random colors for the pie chart
function generateRandomColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(getRandomColor());
    }
    return colors;
}

// Function to generate a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
} 
//////////////////////////////////////////////////////////////////

// Data Feteching and filtering for the geographical location and filtering

document.addEventListener('DOMContentLoaded', function () {
    // Initialize the map with a focus on the UK
    var map = L.map('map').setView([54.5, -3.2], 6); // Set the center to the UK and adjust the zoom level

    // Add a tile layer to the map (choose a different tile layer if needed)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Fetch data from the provided URL
    fetch('https://raw.githubusercontent.com/Sayalinale/weather_analysis/main/SET09123_IDV_CW_dataset.csv')
        .then(response => response.text())
        .then(data => {
            // Parse CSV data into an array of objects
            const parsedData = parseCSV(data);

            // Calculate average max_temp and avg_min_temp for each unique name
            const averages = calculateAverages(parsedData);

            // Loop through the data and add markers with popups to the map
            averages.forEach(function (entry) {
                var marker = L.marker([entry.lat, entry.lon]).addTo(map);

                // Create a popup for the marker with information
                marker.bindPopup(
                    `<b>${entry.name}</b><br>Avg Max Temp: ${entry.avg_max_temp.toFixed(2)}°C<br>Avg Min Temp: ${entry.avg_min_temp.toFixed(2)}°C`
                );
            });
        });

    // Function to parse CSV data
    function parseCSV(csv) {
        const rows = csv.split('\n');
        const headers = rows[0].split(',');
        const data = [];

        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',');
            const entry = {};

            for (let j = 0; j < headers.length; j++) {
                entry[headers[j]] = values[j];
            }

            data.push(entry);
        }

        return data;
    }

    // Function to calculate average max_temp and avg_min_temp for each unique name
    function calculateAverages(data) {
        const averages = {};
        const counts = {};

        data.forEach(entry => {
            if (!averages[entry.name]) {
                averages[entry.name] = { name: entry.name, lat: entry.lat, lon: entry.lon, avg_max_temp: 0, avg_min_temp: 0 };
                counts[entry.name] = 0;
            }

            averages[entry.name].avg_max_temp += parseFloat(entry.max_temp);
            averages[entry.name].avg_min_temp += parseFloat(entry.min_temp);
            counts[entry.name]++;
        });

        // Calculate averages
        for (const name in averages) {
            averages[name].avg_max_temp /= counts[name];
            averages[name].avg_min_temp /= counts[name];
        }

        return Object.values(averages);
    }
}); 



//// line chart

// Fetch the data from the provided URL
fetch('https://raw.githubusercontent.com/Sayalinale/weather_analysis/main/SET09123_IDV_CW_dataset.csv')
.then(response => response.text())
.then(data => {
  // Parse the CSV data using D3.js
  const parsedData = d3.csvParse(data);

  // Extract unique regions
  const regions = Array.from(new Set(parsedData.map(d => d.region)));

  // Calculate average max temperature for each region
  const avgMaxTempByRegion = regions.map(region => {
    const regionData = parsedData.filter(d => d.region === region);
    const avgMaxTemp = d3.mean(regionData, d => +d.max_temp);
    return { region, avgMaxTemp };
  });

  // Create the region chart
  const regionChart = document.getElementById('region-chart');
  const regionChartLayout = {
    title: 'Average Max Temperature by Region',
    xaxis: { title: 'Region' },
    yaxis: { title: 'Average Max Temperature' }
  };
  const regionChartData = [{
    x: avgMaxTempByRegion.map(d => d.region),
    y: avgMaxTempByRegion.map(d => d.avgMaxTemp),
    type: 'line'
  }];
  Plotly.newPlot(regionChart, regionChartData, regionChartLayout);

  // Add click event to the region chart
  regionChart.on('plotly_click', event => {
    const regionName = event.points[0].x;
    const yearlyData = parsedData.filter(d => d.region === regionName);
    const years = Array.from(new Set(yearlyData.map(d => d.year)));
    const avgMaxTempByYear = years.map(year => {
      const yearData = yearlyData.filter(d => d.year === year);
      const avgMaxTemp = d3.mean(yearData, d => +d.max_temp);
      return { year, avgMaxTemp };
    });

    // Create the yearly chart
    const yearlyChart = document.getElementById('yearly-chart');
    const yearlyChartLayout = {
      title: `Average Max Temperature for ${regionName} by Year`,
      xaxis: { title: 'Year' },
      yaxis: { title: 'Average Max Temperature' }
    };
    const yearlyChartData = [{
      x: avgMaxTempByYear.map(d => d.year),
      y: avgMaxTempByYear.map(d => d.avgMaxTemp),
      type: 'line'
    }];
    Plotly.newPlot(yearlyChart, yearlyChartData, yearlyChartLayout);
  });
});


