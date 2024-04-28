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
                const cellA = rowA.children[index].textContent.toLowerCase();  // case-insensitive comparison
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
            // Toggle sort direction for the next click
            if (sortDirections[index] == 1) {
                header.classList.add('asc');
            }
            else
            {
                header.classList.add('desc');
            }
            sortDirections[index] *= -1;

        });
    });
}

//Add tabe sorting listners when the page is loaded
document.addEventListener("DOMContentLoaded", function() {
    setupTableSorting()
    document.querySelectorAll('.filter').forEach(filter => {
        let options = filter.querySelector('.options');
        options.style.maxHeight = 'none'; // Temporarily remove max-height restriction
        let height = options.scrollHeight; // measure the scrollHeight
        options.style.setProperty('--max-height', height + 'px'); // Set the custom property
        options.style.maxHeight = ''; // Reapply the original max-height
    });
});

function postRequest(url, params) {
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params).toString()
    })
    .then(response => response.text())
    .then(html => {document.getElementById('table').innerHTML = html;
    setupTableSorting() // Re-add sorting listeners after table is updated
    })
    .catch(error => console.error('Error:', error));
}

//Filtration
document.querySelectorAll('.filter').forEach(filter => {
    //Fetch all options for current filter
    const options = filter.querySelectorAll('.option');
    filter.querySelector('input').addEventListener('click', (event) => {
        event.stopPropagation(); // Stop click propagation
        filter.classList.toggle('opened');
    });
    
    function update_placeholder(){
        count = 0;
        options.forEach((i) => {
            if (i.dataset.state == 'selected') {
                count += 1;
            }
        });
        column_name = filter.dataset.column;
        if (count > 0) {
            filter.querySelector('input').placeholder = column_name+'s: '+count + ' Active';
            filter.classList.add('active');
        }
        else {
            filter.querySelector('input').placeholder = column_name+'s';
            filter.classList.remove('active');
        }
    }

    filter.querySelector('.clear_button').addEventListener('click', (event) => {
        event.stopPropagation(); 
        postRequest('/clear_filter', {column: filter.getAttribute('data-column')});
        options.forEach((i) => {i.dataset.state = 'available';}); 
        update_placeholder();
    });

    //Loop through each option adding a click event listener
    options.forEach(option => {
        option.addEventListener('click', (event) => {
            event.stopPropagation(); // Stop click propagation
            //If option available, add filter, else remove filter
            if (option.getAttribute('data-state') === 'available') {
                postRequest('/add_filter', {column: filter.getAttribute('data-column'), value: option.textContent});
                option.setAttribute('data-state', 'selected');
            }
            else {
                postRequest('/remove_filter', {column: filter.getAttribute('data-column'), value: option.textContent});
                option.setAttribute('data-state', 'available');
            }
            update_placeholder();
        });
    });
});
