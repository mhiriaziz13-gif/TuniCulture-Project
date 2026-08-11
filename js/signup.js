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

const signupForm = document.getElementById('signupForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const signupButton = document.getElementById('signupButton');
const loginLink = document.getElementById('loginLink');
const alertContainer = document.getElementById('alertContainer');

const auth = firebase.auth();
const db = firebase.firestore();

signupForm.addEventListener('submit', handleSignup);

function handleSignup(e) {
    e.preventDefault();
    
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    // Validation
    if (password !== confirmPassword) {
        showAlert('Passwords do not match.', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters.', 'error');
        return;
    }
    
    setLoading(true);
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Create user document in Firestore
            return db.collection('users').doc(userCredential.user.uid).set({
                fullName: fullName,
                email: email,
                createdAt: new Date(),
                role: 'user'
            });
        })
        .then(() => {
            // Update user profile
            return auth.currentUser.updateProfile({
                displayName: fullName
            });
        })
        .then(() => {
            // Sign out the user after successful registration
            return auth.signOut();
        })
        .then(() => {
            showAlert('Account created successfully! Redirecting to login...', 'success');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        })
        .catch((error) => {
            let errorMessage;
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please enter a valid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please use a stronger password.';
                    break;
                default:
                    errorMessage = 'Signup failed. Please try again.';
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
        signupButton.disabled = true;
        signupButton.textContent = 'Creating account...';
    } else {
        signupButton.disabled = false;
        signupButton.textContent = 'Sign Up';
    }
}
