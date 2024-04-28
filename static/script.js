function postRequest(url, params) {
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params).toString()
    })
    .then(response => response.text())
    .then(html => {document.getElementById('table').innerHTML = html;})
    .catch(error => console.error('Error:', error));
}

document.querySelectorAll('.filter').forEach(filter => {
    const options = filter.querySelectorAll('.option');
    // Setup option listeners within each dropdown
    options.forEach(option => {
        option.addEventListener('click', (event) => {
            event.stopPropagation(); // Stop click propagation
            if (option.getAttribute('data-state') === 'available') {
                postRequest('/add_filter', {column: filter.getAttribute('data-column'), value: option.textContent});
                option.setAttribute('data-state', 'selected');
            }
            else {
                postRequest('/remove_filter', {column: filter.getAttribute('data-column'), value: option.textContent});
                option.setAttribute('data-state', 'available');
            }
        });
    });
});
