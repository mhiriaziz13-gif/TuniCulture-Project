

const firebaseConfig = {
    apiKey: "AIzaSyC5hgm74A2thl6euF3DPRVnjo3b34uGsN0",
    authDomain: "tunisia-tourism-7e7f1.firebaseapp.com",
    projectId: "tunisia-tourism-7e7f1",
    storageBucket: "tunisia-tourism-7e7f1.firebasestorage.app",
    messagingSenderId: "130283399539",
    appId: "1:130283399539:web:da8c809a866518a9a3fd06",
    measurementId: "G-G6Y5ZPCWLB"
};

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
} catch (error) {
    console.error("Erreur d'initialisation Firebase:", error);
}

document.addEventListener('DOMContentLoaded', function() {
    try {
        if (typeof firebase === 'undefined') {
            console.error("Firebase n'est pas chargé. Assurez-vous d'avoir inclus les scripts Firebase.");
            
            const reservationForm = document.getElementById('reservationForm');
            if (reservationForm) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger';
                errorDiv.style.padding = '10px';
                errorDiv.style.backgroundColor = '#f2dede';
                errorDiv.style.color = '#a94442';
                errorDiv.style.marginBottom = '20px';
                errorDiv.style.borderRadius = '4px';
                errorDiv.innerHTML = '<strong>Erreur!</strong> Impossible de se connecter à la base de données. Veuillez nous contacter par téléphone.';
                reservationForm.prepend(errorDiv);
            }
            return;
        }
        
        const db = firebase.firestore();
        
        const experienceSelect = document.getElementById('experience');
        const autreExperienceGroup = document.getElementById('autreExperienceGroup');
        
        if (experienceSelect && autreExperienceGroup) {
            experienceSelect.addEventListener('change', function() {
                if (this.value === 'autre') {
                    autreExperienceGroup.style.display = 'block';
                } else {
                    autreExperienceGroup.style.display = 'none';
                }
            });
        }
        
        const reservationForm = document.getElementById('reservationForm');
        const submitBtn = document.getElementById('submitReservation');
        
        if (reservationForm && submitBtn) {
            reservationForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading"></span><span>Traitement en cours...</span>';
                
                const formData = {
                    nom: document.getElementById('nom').value,
                    email: document.getElementById('email').value,
                    telephone: document.getElementById('telephone').value,
                    dateDepart: document.getElementById('dateDepart').value,
                    adultes: document.getElementById('adultes').value,
                    enfants: document.getElementById('enfants').value,
                    experience: document.getElementById('experience').value,
                    commentaires: document.getElementById('commentaires').value,
                    dateReservation: new Date(), 
                    statut: 'En attente'
                };
                
                if (formData.experience === 'autre') {
                    formData.autreExperience = document.getElementById('autreExperience').value;
                }
                
                db.collection('reservations').add(formData)
                    .then((docRef) => {
                        console.log("Réservation enregistrée avec ID: ", docRef.id);
                        
                        reservationForm.reset();
                        
                        const confirmationDiv = document.createElement('div');
                        confirmationDiv.className = 'confirmation-message';
                        confirmationDiv.innerHTML = '<strong>Réservation confirmée!</strong> Nous vous avons envoyé un email de confirmation. Notre équipe vous contactera sous 24h.';
                        confirmationDiv.style.backgroundColor = '#dff0d8';
                        confirmationDiv.style.color = '#3c763d';
                        confirmationDiv.style.padding = '15px';
                        confirmationDiv.style.marginBottom = '20px';
                        confirmationDiv.style.borderRadius = '4px';
                        reservationForm.prepend(confirmationDiv);
                        
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<span>Confirmer la réservation</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" fill="currentColor"/></svg>';
                        
                        confirmationDiv.scrollIntoView({ behavior: 'smooth' });
                        
                        setTimeout(() => {
                            confirmationDiv.style.opacity = '0';
                            confirmationDiv.style.transition = 'opacity 0.5s';
                            setTimeout(() => {
                                confirmationDiv.remove();
                            }, 500);
                        }, 5000);
                    })
                    .catch((error) => {
                        console.error("Erreur lors de l'ajout de la réservation: ", error);
                        
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'confirmation-message error';
                        errorDiv.style.backgroundColor = '#f2dede';
                        errorDiv.style.color = '#a94442';
                        errorDiv.style.borderColor = '#ebccd1';
                        errorDiv.style.padding = '15px';
                        errorDiv.style.marginBottom = '20px';
                        errorDiv.style.borderRadius = '4px';
                        errorDiv.innerHTML = '<strong>Erreur!</strong> Impossible de traiter votre réservation. Veuillez réessayer ou nous contacter par téléphone.';
                        reservationForm.prepend(errorDiv);
                        
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<span>Réessayer</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" fill="currentColor"/></svg>';
                    });
            });
        }
    } catch (error) {
        console.error("Erreur dans le script de réservation:", error);
    }
});