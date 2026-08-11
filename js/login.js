// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC5hgm74A2thl6euF3DPRVnjo3b34uGsN0",
    authDomain: "tunisia-tourism-7e7f1.firebaseapp.com",
    projectId: "tunisia-tourism-7e7f1",
    storageBucket: "tunisia-tourism-7e7f1.firebasestorage.app",
    messagingSenderId: "130283399539",
    appId: "1:130283399539:web:da8c809a866518a9a3fd06",
    measurementId: "G-G6Y5ZPCWLB"
};

firebase.initializeApp(firebaseConfig);

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const alertContainer = document.getElementById('alertContainer');

const auth = firebase.auth();
const db = firebase.firestore();

loginForm.addEventListener('submit', handleLogin);

function handleLogin(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    setLoading(true);
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            showAlert('Login successful! Checking permissions...', 'success');
            
            return db.collection('users').doc(userCredential.user.uid).get();
        })
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const userRole = userData.role;
                
                if (userRole === 'admin') {
                    showAlert('Welcome Admin! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = 'admin.html';
                    }, 1500);
                } else if (userRole === 'user') {
                    localStorage.setItem('userData', JSON.stringify(userData));
                    localStorage.setItem('userEmail', userData.email);
                    localStorage.setItem('userName', userData.fullName);
                    
                    showAlert('Welcome! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = 'client.html';
                    }, 1500);
                } else {
                    showAlert('Invalid user role. Please contact administrator.', 'error');
                    setLoading(false);
                }
            } else {
                showAlert('User data not found. Please contact administrator.', 'error');
                setLoading(false);
            }
        })
        .catch((error) => {
            let errorMessage;
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed login attempts. Please try again later.';
                    break;
                default:
                    errorMessage = 'Login failed. Please try again.';
            }
            
            showAlert(errorMessage, 'error');
            setLoading(false);
        });
}

function handleRegisterClick(e) {
    e.preventDefault();
    alert('Register functionality is not implemented in this demo.');
}

function handleForgotPasswordClick(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showAlert('Please enter your email address first.', 'error');
        emailInput.focus();
        return;
    }
    
    setLoading(true);
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showAlert('Password reset email sent. Please check your inbox.', 'success');
            setLoading(false);
        })
        .catch((error) => {
            let errorMessage;
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                default:
                    errorMessage = 'Failed to send reset email. Please try again.';
            }
            
            showAlert(errorMessage, 'error');
            setLoading(false);
        });
}

function showAlert(message, type) {
    alertContainer.innerHTML = '';
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    if (type === 'success') {
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

function setLoading(isLoading) {
    if (isLoading) {
        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';
    } else {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
}
