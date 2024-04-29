//Sorting
function setupTableSorting() {
    //Fetch all headers of table 
    const headers = document.querySelectorAll('#table th');
    //Create an array storing sort directions of each column intialised all to ascending sort
    const sortDirections = Array.from(headers).map(() => 1);
    //Add a click event listener to each header
    headers.forEach((header, index) => {
        header.addEventListener('click', () => {
            const tableBody = header.closest('table').querySelector('tbody');
            const rows = Array.from(tableBody.querySelectorAll('tr'));
            headers.forEach(header => {
                header.className = '';
            });
            rows.sort((rowA, rowB) => {
                const cellA = rowA.children[index].textContent.toLowerCase();  // case-insensitive comps
                const cellB = rowB.children[index].textContent.toLowerCase();
                
                // Compare cells as numbers if possible, else as strings
                const valA = isNaN(parseFloat(cellA)) ? cellA : parseFloat(cellA);
                const valB = isNaN(parseFloat(cellB)) ? cellB : parseFloat(cellB);
                // The logic here is: if it can be parses to a float then compare these floats; otherwise compare strings
                
                if (valA < valB) return -1 * sortDirections[index];
                if (valA > valB) return 1 * sortDirections[index];
                return 0; // If values are equal
            });
            // Rearrange sorted rows in the table body
            rows.forEach(row => tableBody.appendChild(row));
            
            //Add class to header to show sort direction
            if (sortDirections[index] == 1) {
                header.classList.add('asc');
            }
            else{
                header.classList.add('desc');
            }

            // Toggle sort direction for the next click
            sortDirections[index] *= -1;

        });
    });
}

//Fetch Filtered table function
function tableRequest(url, params) {
    // Return the fetch promise to make this awaitable
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params).toString()
    })
    .then(response => {return response.text();})
    .then(html => {
        document.getElementById('table').innerHTML = html;
        setupTableSorting();  //Add listners to new table header
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

//This runs intially to caluclate the height of all dropdown boxes to allow for smooth transition
function set_dropdown_heights(){
    document.querySelectorAll('.filter').forEach(filter => {
        const filters = document.querySelectorAll('.filter');
        filters.forEach(filter => {
            const images = filter.querySelectorAll('img');
            const ImagesLoaded = Array.from(images).map(img => {
                if (img.complete && img.naturalHeight !== 0) {
                    return Promise.resolve();  // Image already loaded
                } 
                else {
                    return new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                    });
                }
            });
        // Wait for all images within the filter to load
        Promise.all(ImagesLoaded).then(() => {
            const options = filter.querySelector('.options');
            options.style.maxHeight = 'none'; // Remove max-height restriction
            let height = options.scrollHeight;  // Measure the scrollHeight
            options.style.setProperty('--max-height', height + 'px'); // Set the max-height CSS variable
            options.style.maxHeight = ''; // Reapply the original max-height
            console.log('Height set for filter:', height);
        })
    });
    });
        
}

//This runs to update the distributions after any (non-range) filters have been updated
async function update_distributions() {
    fetch('/update_dists', {
        method: 'POST'
    })
    .then(response => response.blob())
    .then(blob => {
        return JSZip.loadAsync(blob);
    })
    .then(zip => {
        const imagePromises = [];
        zip.forEach((relativePath, zipEntry) => {
            if (zipEntry.name.endsWith('.png')) {
                const imgPromise = zipEntry.async('blob').then(blob => {
                    const dist = document.getElementById(zipEntry.name.replace('.png', '')); // Get the image element by ID
                    const url = URL.createObjectURL(blob); // Create a URL object
                    dist.src = url; // Set the image source to the URL
                    return new Promise((resolve) => {
                        dist.onload = () => {
                            URL.revokeObjectURL(url); // Clean up the URL object
                            resolve();
                        };
                    });
                });
                imagePromises.push(imgPromise);
            }
        });
        return Promise.all(imagePromises); // Wait for all images to be processed
    })
    .then(() => {
        fetchLimitsAndUpdate(); // This function is called only after all images have been processed
        console.log('Limits updated');   });
}

//When the page is loaded; update the distributions, set the dropdown heights and initialise table sorting
document.addEventListener("DOMContentLoaded", function() {
    update_distributions();
    set_dropdown_heights();
    setupTableSorting();
});

//Filtration functions
document.querySelectorAll('.filter').forEach(filter => {
    //Fetch all options for current filter
    const options = filter.querySelectorAll('.option');
    filter.querySelector('input').addEventListener('click', (event) => {
        console.log('click');
        event.stopPropagation(); // Stop click propagation
        filter.classList.toggle('opened'); // Toggle the opened class (to show/hide the dropdown)
    });
    
    //This is repsonsible for updating UI if a filter is active
    function update_placeholder(){
        count = 0; // Count the number of active filters to display
        options.forEach((i) => {
            if (i.dataset.state == 'selected') {
                count += 1;
            }
        });
        column_name = filter.dataset.column;
        // if active adjust placeholder accordingly and add active class 
        if (count > 0) {
            filter.querySelector('input').placeholder = column_name+'s: '+count + ' Active';
            filter.classList.add('active');
        }
        else {
            filter.querySelector('input').placeholder = column_name+'s';
            filter.classList.remove('active');
        }
    }

    //Add event listener to clear button
    filter.querySelector('.clear_button').addEventListener('click', async (event) => {
        event.stopPropagation(); // Prevent the event from bubbling up
        try {
            // Wait for the asynchronous tableRequest to complete
            await tableRequest('/clear_filter', {column: filter.getAttribute('data-column')});
    
            // Now that the request has completed, proceed (this would otherwise conflict with distribution generation)
            options.forEach((option) => {
                option.dataset.state = 'available'; // Reset all options to available
            });
    
            update_placeholder(); 
            update_distributions(); // safely update distributions after the backend has processed
        } catch (error) {
            console.error('Error clearing filters:', error);
        }
    });

    //Loop through each option adding a click event listener
    options.forEach(option => {
        option.addEventListener('click', async (event) => {
            event.stopPropagation(); // Prevents further propagation of the current event.
            try {
                const column = filter.getAttribute('data-column');
                const value = option.textContent;
                const state = option.getAttribute('data-state');
                //This handles adding filters by communcating with python backend
                if (state === 'available') {
                    await tableRequest('/add_filter', {column, value});
                    option.setAttribute('data-state', 'selected');
                } else {
                    await tableRequest('/remove_filter', {column, value});
                    option.setAttribute('data-state', 'available');
                }
                update_placeholder(); // Update UI
                update_distributions(); // Update distributions, dependent on filters 
            }
            catch (error) {
                console.error('Error adding/removing filter:', error);
            }
        });
    });
});


const est_slider = document.querySelector('div[data-column="Estimated quantity (kg)"] .slider_wrapper');
const actual_slider = document.querySelector('div[data-column="Actual quantity (kg)"] .slider_wrapper');

function fetchLimitsAndUpdate() {
    fetch('/get_limits')
    .then(response => {return response.json(); })
    .then(data => {
        console.log("Received data:", data);
        updateSliderLimits(est_slider, data['Estimated quantity (kg)'][0], data['Estimated quantity (kg)'][1]);
        updateSliderLimits(actual_slider, data['Actual quantity (kg)'][0], data['Actual quantity (kg)'][1]);
    })
    .catch(error => console.error('Error fetching limits:', error));
}

function updateSliderLimits(slider, min, max) {
    console.log('Updating slider limits:', min, max);
    const sliderMin = slider.querySelector('.sliderMin');
    const sliderMax = slider.querySelector('.sliderMax');
    const inputMin = slider.querySelector('.inputMin');
    const inputMax = slider.querySelector('.inputMax');
    const lineMin = slider.querySelector('.lineMin');
    const lineMax = slider.querySelector('.lineMax');
    lineMin.style.right = `${sliderMin.offsetWidth}px`;
    lineMax.style.left = `${sliderMin.offsetWidth - parseFloat(window.getComputedStyle(slider).fontSize)}px`;
    sliderMin.min   = min;
    sliderMin.max   = max;
    sliderMin.value = min;
    sliderMax.min   = min;
    sliderMax.max   = max;
    sliderMax.value = max;
    inputMin.min    = min;
    inputMin.max    = max;
    inputMin.value  = min;
    inputMax.min    = min;
    inputMax.max    = max;
    inputMax.value  = max;
}



document.querySelectorAll('.slider_wrapper').forEach(slider => {
    const sliderMin = slider.querySelector('.sliderMin');
    const sliderMax = slider.querySelector('.sliderMax');
    const inputMin = slider.querySelector('.inputMin');
    const inputMax = slider.querySelector('.inputMax');
    const lineMin = slider.querySelector('.lineMin');
    const lineMax = slider.querySelector('.lineMax');
    const column = slider.parentElement.parentElement.getAttribute('data-column');
    const knobWidth = parseFloat(window.getComputedStyle(slider).fontSize);
    const offsetwdith = sliderMin.offsetWidth
    
    updateLinePosition();
    
    function updateLinePosition() {
        max = parseFloat(sliderMax.max);
        min = parseFloat(sliderMin.min);
        percentage_min = (sliderMin.value - min) / (max - min);
        percentage_max = (sliderMax.value - min) / (max - min);
        offset_min = offsetwdith - percentage_min * (offsetwdith-knobWidth);
        lineMin.style.right = `${offset_min}px`;
        offset_max =  percentage_max * (offsetwdith-knobWidth);
        lineMax.style.left = `${offset_max}px`;
    }

    updateLinePosition();

    sliderMin.addEventListener('input', () => {
        let minValue = parseInt(sliderMin.value);
        let maxValue = parseInt(sliderMax.value);
        if (minValue >= maxValue) {
            sliderMin.value = maxValue - 1; // Ensure a minimum gap
            inputMin.value = sliderMin.value;
        }
        inputMin.value = sliderMin.value;
        updateLinePosition()
    });

    sliderMax.addEventListener('input', () => {
        let minValue = parseInt(sliderMin.value);
        let maxValue = parseInt(sliderMax.value);
        if (maxValue <= minValue) {
            sliderMax.value = minValue + 1; // Ensure a minimum gap
            inputMax.value = sliderMax.value;
        }
        inputMax.value = sliderMax.value;
        updateLinePosition()
    });

    inputMin.addEventListener('change', () => {
        if (parseInt(inputMin.value) >= parseInt(inputMax.value)) {
            inputMin.value = parseInt(inputMax.value) - 1;
        }
        sliderMin.value = inputMin.value;
        updateLinePosition()
    });

    inputMax.addEventListener('change', () => {
        if (parseInt(inputMax.value) <= parseInt(inputMin.value)) {
            inputMax.value = parseInt(inputMin.value) + 1;
        }
        sliderMax.value = inputMax.value;
        updateLinePosition()
    });

    sliderMin.addEventListener('input', () => {
        tableRequest('/filter_range', {column: column, min: sliderMin.value, max: sliderMax.value});
    });
    sliderMax.addEventListener('input', () => {
        tableRequest('/filter_range', {column: column, min: sliderMin.value, max: sliderMax.value});
    });
    inputMin.addEventListener('blur', () => {
        tableRequest('/filter_range', {column: column, min: sliderMin.value, max: sliderMax.value});
    });
    inputMax.addEventListener('blur', () => {
        tableRequest('/filter_range', {column: column, min: sliderMin.value, max: sliderMax.value});
    });
});