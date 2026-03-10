const API_URL = 'https://tpsi.rlarosa.com/api';
let currentUser = null;

async function login() {
    const id = document.getElementById('login-id').value;
    const password = document.getElementById('login-pass').value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            currentUser = data;
            localStorage.setItem('user', JSON.stringify(data));
            toggleViews(true);
            loadData();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error('Login failed:', err);
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    toggleViews(false);
}

function toggleViews(isLoggedIn) {
    document.getElementById('login-view').classList.toggle('hidden', isLoggedIn);
    document.getElementById('store-view').classList.toggle('hidden', !isLoggedIn);
    
    if (isLoggedIn && currentUser.role === 'admin') {
        document.getElementById('admin-link-container').classList.remove('hidden');
    } else {
        document.getElementById('admin-link-container').classList.add('hidden');
    }
}

async function loadData() {
    if (!currentUser) return;

    try {
        const userRes = await fetch(`${API_URL}/user/${currentUser.id}`);
        const user = await userRes.json();
        document.getElementById('balance').innerText = user.balance;

        const prodRes = await fetch(`${API_URL}/products`);
        const products = await prodRes.json();
        
        const list = document.getElementById('product-list');
        list.innerHTML = '';
        products.forEach(p => {
            list.innerHTML += `
                <div class="card">
                    <h3>${p.name}</h3>
                    <p>Price: $${p.price} | Stock: ${p.stock}</p>
                    <button onclick="buy('${p.id}')" ${p.stock === 0 ? 'disabled' : ''}>Buy</button>
                </div>
            `;
        });
    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

async function buy(productId) {
    const res = await fetch(`${API_URL}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, productId })
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    loadData();
}

// Auto-login on page load if session exists
window.onload = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        toggleViews(true);
        loadData();
    }
};