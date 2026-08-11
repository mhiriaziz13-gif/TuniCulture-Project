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

const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const emailInput = document.getElementById('email');
const resetButton = document.getElementById('resetButton');
const loginLink = document.getElementById('loginLink');
const signupLink = document.getElementById('signupLink');
const alertContainer = document.getElementById('alertContainer');

const auth = firebase.auth();

forgotPasswordForm.addEventListener('submit', handleForgotPassword);

function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    // Basic email validation
    if (!email) {
        showAlert('Please enter your email address.', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showAlert('Please enter a valid email address.', 'error');
        return;
    }
    
    setLoading(true);
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showAlert('Password reset email sent! Check your inbox and follow the instructions to reset your password.', 'success');
            
            // Clear the form
            emailInput.value = '';
            
            // Optional: Redirect to login page after a delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        })
        .catch((error) => {
            let errorMessage;
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many requests. Please try again later.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection and try again.';
                    break;
                default:
                    errorMessage = 'Failed to send reset email. Please try again.';
            }
            
            showAlert(errorMessage, 'error');
        })
        .finally(() => {
            setLoading(false);
        });
}

function showAlert(message, type) {
    alertContainer.innerHTML = '';
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);
    
    // Auto-remove success alerts after 8 seconds
    if (type === 'success') {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 8000);
    }
}

function setLoading(isLoading) {
    if (isLoading) {
        resetButton.disabled = true;
        resetButton.textContent = 'Sending...';
    } else {
        resetButton.disabled = false;
        resetButton.textContent = 'Send Reset Link';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}