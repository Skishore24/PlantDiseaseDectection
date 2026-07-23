const API = "http://127.0.0.1:8000/api/v1";

function switchTab(tab) {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
    } else {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

async function handleAuth(event, type) {
    event.preventDefault();
    const btn = event.target.querySelector('.auth-btn');
    const originalText = btn.textContent;
    btn.textContent = "Processing...";
    btn.disabled = true;

    try {
        if (type === 'login') {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            const formData = new FormData();
            formData.append("username", email);
            formData.append("password", password);

            const res = await fetch(`${API}/auth/login`, {
                method: "POST",
                body: formData
            });

            if (!res.ok) throw new Error("Invalid email or password");

            const data = await res.json();
            localStorage.setItem("plant_token", data.access_token);
            window.location.href = "index.html";
        } else {
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            const res = await fetch(`${API}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ full_name: name, email, password })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Signup failed");
            }

            alert("Account created successfully! Please login.");
            switchTab('login');
        }
    } catch (err) {
        alert(err.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
