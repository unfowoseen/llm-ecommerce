const API_URL = 'https://tpsi.rlarosa.com/api/admin';

window.onload = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        const currentUser = JSON.parse(savedUser);
        if (currentUser.role === 'admin') {
            document.getElementById('admin-content').style.display = 'block';
            return;
        }
    }
    
    // Redirect non-admins or unauthenticated users
    alert('Access Denied. Administrator privileges required.');
    window.location.href = 'index.html';
};

// Helper function to handle API requests
async function sendAdminRequest(url, method, bodyData) {
    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Request failed');
        }
        
        alert('Operation successful');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// 1. Add Product
function addProduct() {
    const id = document.getElementById('new-id').value;
    const name = document.getElementById('new-name').value;
    const price = parseFloat(document.getElementById('new-price').value);
    const stock = parseInt(document.getElementById('new-stock').value, 10);

    if (!id || !name || isNaN(price) || isNaN(stock)) {
        return alert('Please fill all fields with valid data.');
    }

    sendAdminRequest(`${API_URL}/products`, 'POST', { id, name, price, stock });
}

// 2. Modify Stock
function modifyStock() {
    const id = document.getElementById('mod-id').value;
    const stock = parseInt(document.getElementById('mod-stock').value, 10);

    if (!id || isNaN(stock)) {
        return alert('Please provide a valid Product ID and Stock amount.');
    }

    sendAdminRequest(`${API_URL}/products/${id}/stock`, 'PUT', { stock });
}

// 3. Modify Balance
function modifyBalance() {
    const id = document.getElementById('user-id').value;
    const balance = parseFloat(document.getElementById('user-balance').value);

    if (!id || isNaN(balance)) {
        return alert('Please provide a valid User ID and Balance amount.');
    }

    sendAdminRequest(`${API_URL}/users/${id}/balance`, 'PUT', { balance });
}