// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC5hgm74A2thl6euF3DPRVnjo3b34uGsN0",
    authDomain: "tunisia-tourism-7e7f1.firebaseapp.com",
    projectId: "tunisia-tourism-7e7f1",
    storageBucket: "tunisia-tourism-7e7f1.firebasestorage.app",
    messagingSenderId: "130283399539",
    appId: "1:130283399539:web:da8c809a866518a9a3fd06",
    measurementId: "G-G6Y5ZPCWLB"
};

// Variables globales
let db;
let auth;
let currentAuthUser = null;

let userEmail = '';
let userFullName = '';
let userId = '';
let destinations = [];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        db = firebase.firestore();
        auth = firebase.auth();

        auth.onAuthStateChanged((user) => {
            if (!user) {
                currentAuthUser = null;

                localStorage.removeItem('userData');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                localStorage.removeItem('userFullName');
                localStorage.removeItem('userId');

                alert('Session expirée. Veuillez vous reconnecter.');
                window.location.href = 'login.html';
                return;
            }

            currentAuthUser = user;
            userId = user.uid;
            userEmail = user.email || '';

            setupEventListeners();
            loadDestinations();
            loadUserProfile();
        });

    } catch (error) {
        console.error("Erreur d'initialisation Firebase:", error);
        showAlert('Erreur de connexion à la base de données', 'danger');
    }
}

function setupEventListeners() {
    const reservationForm = document.getElementById('reservationForm');
    const profileForm = document.getElementById('profileForm');
    const editReservationForm = document.getElementById('editReservationForm');
    const experienceSelect = document.getElementById('experience');
    const editExperienceSelect = document.getElementById('editExperience');
    const autreExperienceGroup = document.getElementById('autreExperienceGroup');
    const editAutreExperienceGroup = document.getElementById('editAutreExperienceGroup');
    
    // Afficher/masquer le champ "autre expérience" - formulaire principal
    experienceSelect.addEventListener('change', function() {
        if (this.value === 'autre') {
            autreExperienceGroup.style.display = 'block';
            document.getElementById('autreExperience').required = true;
        } else {
            autreExperienceGroup.style.display = 'none';
            document.getElementById('autreExperience').required = false;
        }
    });
    
    // Afficher/masquer le champ "autre expérience" - formulaire d'édition
    editExperienceSelect.addEventListener('change', function() {
        if (this.value === 'autre') {
            editAutreExperienceGroup.style.display = 'block';
        } else {
            editAutreExperienceGroup.style.display = 'none';
        }
    });
    
    // Soumission du formulaire de réservation
    reservationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitReservation();
    });
    
    // Soumission du formulaire de profil
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        updateProfile();
    });
    
    // Soumission du formulaire d'édition de réservation
    editReservationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        updateReservation();
    });
    
    // Définir la date minimum (aujourd'hui)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateDepart').min = today;
    document.getElementById('editDateDepart').min = today;
}

function switchTab(tabName) {
    // Masquer tous les contenus
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Désactiver tous les boutons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activer le contenu et bouton sélectionnés
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Charger le contenu selon l'onglet
    if (tabName === 'mes-reservations') {
        loadUserReservations();
    } else if (tabName === 'destinations') {
        displayDestinations();
    } else if (tabName === 'mon-profil') {
        loadUserProfile();
    }
}

// Gestion des destinations
function loadDestinations() {
    db.collection('destinations')
        .get()
        .then((querySnapshot) => {
            destinations = [];
            querySnapshot.forEach((doc) => {
                destinations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            populateDestinationSelects();
            displayDestinations();
        })
        .catch((error) => {
            console.error("Erreur lors du chargement des destinations: ", error);
        });
}

function populateDestinationSelects() {
    const destinationSelect = document.getElementById('destination');
    const editDestinationSelect = document.getElementById('editDestination');
    
    // Vider les options existantes (sauf la première)
    destinationSelect.innerHTML = '<option value="" disabled selected>Sélectionnez une destination</option>';
    editDestinationSelect.innerHTML = '';
    
    destinations.forEach(destination => {
        const option1 = new Option(destination.name, destination.id);
        const option2 = new Option(destination.name, destination.id);
        
        destinationSelect.appendChild(option1);
        editDestinationSelect.appendChild(option2);
    });
}

function displayDestinations() {
    const destinationsList = document.getElementById('destinationsList');
    
    if (destinations.length === 0) {
        destinationsList.innerHTML = '<div class="alert alert-info">Aucune destination disponible pour le moment.</div>';
        return;
    }
    
    let html = '<div class="destinations-grid">';
    
    destinations.forEach(destination => {
        const createdDate = destination.createdAt ? 
            (destination.createdAt.toDate ? destination.createdAt.toDate() : new Date(destination.createdAt)).toLocaleDateString('fr-FR') : 
            'Date inconnue';
        
        html += `
            <div class="destination-card">
                <h3 style="color: #2c3e50; margin-bottom: 10px;">${destination.name}</h3>
                <p style="color: #666; margin-bottom: 10px;">${destination.description}</p>
                <div style="color: #999; font-size: 0.9em;">
                    Ajoutée le ${createdDate}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    destinationsList.innerHTML = html;
}

// Gestion du profil
function loadUserProfile() {
    if (!currentAuthUser) {
        return;
    }

    db.collection('users')
        .doc(currentAuthUser.uid)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                throw new Error('User profile not found');
            }

            const userData = doc.data();

            userId = currentAuthUser.uid;
            userEmail = currentAuthUser.email || userData.email || '';
            userFullName = userData.fullName || currentAuthUser.displayName || userEmail;

            document.getElementById('profileFullName').value = userFullName;
            document.getElementById('profileEmail').value = userEmail;
            document.getElementById('userFullName').textContent = userFullName;

            localStorage.setItem('userFullName', userFullName);
            localStorage.setItem('userId', userId);
        })
        .catch((error) => {
            console.error("Erreur lors du chargement du profil:", error);
            showAlert('Erreur lors du chargement du profil', 'danger');
        });
}

function updateProfile() {
    const updateBtn = document.getElementById('updateProfileBtn');
    updateBtn.disabled = true;
    updateBtn.innerHTML = '<span class="loading"></span><span>Mise à jour...</span>';
    
    const fullName = document.getElementById('profileFullName').value;
    
    if (!userId) {
        showAlert('Erreur: ID utilisateur non trouvé', 'danger');
        updateBtn.disabled = false;
        updateBtn.innerHTML = '<span>Mettre à jour le profil</span>';
        return;
    }
    
    db.collection('users').doc(userId)
        .update({
            fullName: fullName
        })
        .then(() => {
            userFullName = fullName;
            document.getElementById('userFullName').textContent = userFullName;
            localStorage.setItem('userFullName', userFullName);
            
            showAlert('Profil mis à jour avec succès!', 'success');
        })
        .catch((error) => {
            console.error("Erreur lors de la mise à jour du profil: ", error);
            showAlert('Erreur lors de la mise à jour du profil', 'danger');
        })
        .finally(() => {
            updateBtn.disabled = false;
            updateBtn.innerHTML = '<span>Mettre à jour le profil</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M15.728 9.686l-1.414-1.414L5 17.586V19h1.414l9.314-9.314zm1.414-1.414l1.414-1.414-1.414-1.414-1.414 1.414 1.414 1.414zM7.242 21H3v-4.243L16.435 3.322a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414L7.243 21z" fill="currentColor"/></svg>';
        });
}

// Gestion des réservations
function submitReservation() {
    const submitBtn = document.getElementById('submitReservation');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span><span>Traitement en cours...</span>';
    
    const formData = {
        nom: userFullName,
        email: userEmail,
        destination: document.getElementById('destination').value,
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
            
            // Réinitialiser le formulaire
            document.getElementById('reservationForm').reset();
            document.getElementById('autreExperienceGroup').style.display = 'none';
            
            showAlert('Réservation confirmée! Nous vous contacterons sous 24h.', 'success');
            
            // Recharger les réservations si on est sur cet onglet
            if (document.getElementById('mes-reservations').classList.contains('active')) {
                loadUserReservations();
            }
        })
        .catch((error) => {
            console.error("Erreur lors de l'ajout de la réservation: ", error);
            showAlert('Erreur lors de la réservation. Veuillez réessayer.', 'danger');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>Confirmer la réservation</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="none" d="M0 0h24v24H0z"/><path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" fill="currentColor"/></svg>';
        });
}

function loadUserReservations() {
    const reservationsList = document.getElementById('reservationsList');
    reservationsList.innerHTML = '<div class="alert alert-info">Chargement de vos réservations...</div>';
    
    db.collection('reservations')
        .where('email', '==', userEmail)
        .orderBy('dateReservation', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                reservationsList.innerHTML = `
                    <div class="no-reservations">
                        <h3>Aucune réservation trouvée</h3>
                        <p>Vous n'avez pas encore effectué de réservation.</p>
                    </div>
                `;
                return;
            }
            
            let reservationsHtml = '<div class="reservations-grid">';
            
            querySnapshot.forEach((doc) => {
                reservationsHtml += createReservationCard(doc.id, doc.data());
            });
            
            reservationsHtml += '</div>';
            reservationsList.innerHTML = reservationsHtml;
        })
        .catch((error) => {
            console.error("Erreur lors du chargement des réservations: ", error);
            reservationsList.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des réservations.</div>';
        });
}

function createReservationCard(id, reservation) {
    const statusClass = reservation.statut.toLowerCase().replace(' ', '-');
    const experienceNames = {
        'randonnee': '🥾 Randonnée au Djebel Zaghouan',
        'dromadaire': '🐪 Balade en dromadaire',
        'cuisine': '👨‍🍳 Atelier culinaire',
        'festival': '🎭 Festival International de Carthage',
        'circuit': '🏛️ Circuit culturel complet',
        'autre': '✨ ' + (reservation.autreExperience || 'Expérience personnalisée')
    };
    
    const experienceName = experienceNames[reservation.experience] || reservation.experience;
    const dateReservation = reservation.dateReservation.toDate ? 
        reservation.dateReservation.toDate().toLocaleDateString('fr-FR') : 
        new Date(reservation.dateReservation).toLocaleDateString('fr-FR');
    
    // Récupérer le nom de la destination
    const destinationName = destinations.find(d => d.id === reservation.destination)?.name || 'Destination inconnue';
    
    const canEdit = reservation.statut === 'En attente';
    
    return `
        <div class="reservation-card" onclick="openEditModal('${id}')">
            <div class="reservation-header">
                <div class="reservation-id">Réservation #${id.substring(0, 8)}</div>
                <div class="status-badge status-${statusClass}">${reservation.statut}</div>
            </div>
            
            <h3 style="color: #2c3e50; margin-bottom: 15px;">${experienceName}</h3>
            
            <div class="reservation-details">
                <div class="detail-item">
                    <div class="detail-label">Destination</div>
                    <div class="detail-value">${destinationName}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Date de départ</div>
                    <div class="detail-value">${new Date(reservation.dateDepart).toLocaleDateString('fr-FR')}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Participants</div>
                    <div class="detail-value">${reservation.adultes} adulte(s), ${reservation.enfants} enfant(s)</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Téléphone</div>
                    <div class="detail-value">${reservation.telephone}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Date de réservation</div>
                    <div class="detail-value">${dateReservation}</div>
                </div>
            </div>
            
            ${reservation.commentaires ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e6ed;">
                    <div class="detail-label">Demandes spéciales</div>
                    <div class="detail-value">${reservation.commentaires}</div>
                </div>
            ` : ''}
            
            ${canEdit ? `
                <div class="reservation-actions" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e6ed;">
                    <button class="btn-edit" onclick="openEditModal('${id}')">
                        Modifier
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// Gestion de la modal d'édition
function openEditModal(reservationId) {
    console.log("Ouverture de la modal d'édition pour la réservation ID:", reservationId);
    // Récupérer les données de la réservation
    db.collection('reservations').doc(reservationId)
        .get()
        .then((doc) => {
            if (doc.exists) {
                const reservation = doc.data();
                
                // Remplir le formulaire d'édition
                document.getElementById('editReservationId').value = reservationId;
                document.getElementById('editDestination').value = reservation.destination || '';
                document.getElementById('editTelephone').value = reservation.telephone;
                document.getElementById('editDateDepart').value = reservation.dateDepart;
                document.getElementById('editAdultes').value = reservation.adultes;
                document.getElementById('editEnfants').value = reservation.enfants;
                document.getElementById('editExperience').value = reservation.experience;
                document.getElementById('editCommentaires').value = reservation.commentaires || '';
                
                // Gérer le champ "autre expérience"
                if (reservation.experience === 'autre') {
                    document.getElementById('editAutreExperienceGroup').style.display = 'block';
                    document.getElementById('editAutreExperience').value = reservation.autreExperience || '';
                } else {
                    document.getElementById('editAutreExperienceGroup').style.display = 'none';
                }
                
                // Afficher la modal
                document.getElementById('editReservationModal').style.display = 'block';
            }
        })
        .catch((error) => {
            console.error("Erreur lors du chargement de la réservation: ", error);
            showAlert('Erreur lors du chargement de la réservation', 'danger');
        });
}

function closeEditModal() {
    document.getElementById('editReservationModal').style.display = 'none';
}

function updateReservation() {
    const reservationId = document.getElementById('editReservationId').value;
    
    const updateData = {
        destination: document.getElementById('editDestination').value,
        telephone: document.getElementById('editTelephone').value,
        dateDepart: document.getElementById('editDateDepart').value,
        adultes: document.getElementById('editAdultes').value,
        enfants: document.getElementById('editEnfants').value,
        experience: document.getElementById('editExperience').value,
        commentaires: document.getElementById('editCommentaires').value
    };
    
    if (updateData.experience === 'autre') {
        updateData.autreExperience = document.getElementById('editAutreExperience').value;
    } else {
        // Supprimer le champ autreExperience s'il n'est plus nécessaire
        updateData.autreExperience = firebase.firestore.FieldValue.delete();
    }
    
    db.collection('reservations').doc(reservationId)
        .update(updateData)
        .then(() => {
            showAlert('Réservation mise à jour avec succès!', 'success');
            closeEditModal();
            loadUserReservations();
        })
        .catch((error) => {
            console.error("Erreur lors de la mise à jour: ", error);
            showAlert('Erreur lors de la mise à jour de la réservation', 'danger');
        });
}

// Fonction utilitaire pour afficher les alertes
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insérer l'alerte en haut de la page
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Faire défiler vers l'alerte
    alertDiv.scrollIntoView({ behavior: 'smooth' });
    
    // Supprimer l'alerte après 5 secondes
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 500);
    }, 5000);
}

// Fonction de déconnexion
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        firebase.auth().signOut()
            .then(() => {
                localStorage.removeItem('userData');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                localStorage.removeItem('userFullName');
                localStorage.removeItem('userId');

                window.location.href = 'login.html';
            })
            .catch((error) => {
                console.error('Erreur lors de la déconnexion:', error);
                showAlert('Erreur lors de la déconnexion', 'danger');
            });
    }
}

// Fermer la modal en cliquant à l'extérieur
window.onclick = function(event) {
    const modal = document.getElementById('editReservationModal');
    if (event.target === modal) {
        closeEditModal();
    }
}