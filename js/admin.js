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
function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
}
document.addEventListener('DOMContentLoaded', function() {
    const db = firebase.firestore();
    const auth = firebase.auth();
    
    const dashboardContainer = document.getElementById('dashboardContainer');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = {
        dashboard: document.querySelector('.stats-cards'),
        reservations: document.getElementById('reservationsSection'),
        analytics: document.getElementById('analyticsSection'),
        users: document.getElementById('usersSection'),
        profile: document.getElementById('profileSection'),
        destinations: document.getElementById('destinationsSection')
    };
    
    const reservationsTableBody = document.getElementById('reservationsTableBody');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchReservations');
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const paginationInfo = document.getElementById('paginationInfo');
    
    // Users elements
    const usersTableBody = document.getElementById('usersTableBody');
    const userRoleFilter = document.getElementById('userRoleFilter');
    const searchUsersInput = document.getElementById('searchUsers');
    const prevUserPageBtn = document.getElementById('prevUserPage');
    const nextUserPageBtn = document.getElementById('nextUserPage');
    const userPaginationInfo = document.getElementById('userPaginationInfo');
    
    const reservationModal = document.getElementById('reservationModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const reservationDetails = document.getElementById('reservationDetails');
    const updateStatusSelect = document.getElementById('updateStatus');
    const saveStatusBtn = document.getElementById('saveStatus');
    const cancelModalBtn = document.getElementById('cancelModal');
    
    // User modal elements
    const userModal = document.getElementById('userModal');
    const closeUserModalBtn = document.querySelector('.close-user-modal');
    const userModalTitle = document.getElementById('userModalTitle');
    const userForm = document.getElementById('userForm');
    const userNameInput = document.getElementById('userName');
    const userEmailInput = document.getElementById('userEmail');
    const userRoleInput = document.getElementById('userRole');
    const saveUserBtn = document.getElementById('saveUser');
    const cancelUserModalBtn = document.getElementById('cancelUserModal');


    const profileSection = document.getElementById('profileSection');
    const destinationsSection = document.getElementById('destinationsSection');

    // Profile elements
    const profileModal = document.getElementById('profileModal');
    const closeProfileModalBtn = document.querySelector('.close-profile-modal');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfile');
    const cancelProfileModalBtn = document.getElementById('cancelProfileModal');
    const profileForm = document.getElementById('profileForm');

    // Destination elements
    const destinationsTableBody = document.getElementById('destinationsTableBody');
    const addDestinationBtn = document.getElementById('addDestinationBtn');
    const destinationModal = document.getElementById('destinationModal');
    const closeDestinationModalBtn = document.querySelector('.close-destination-modal');
    const destinationModalTitle = document.getElementById('destinationModalTitle');
    const destinationForm = document.getElementById('destinationForm');
    const saveDestinationBtn = document.getElementById('saveDestination');
    const deleteDestinationBtn = document.getElementById('deleteDestination');
    const cancelDestinationModalBtn = document.getElementById('cancelDestinationModal');
    const prevDestinationPageBtn = document.getElementById('prevDestinationPage');
    const nextDestinationPageBtn = document.getElementById('nextDestinationPage');
    const destinationPaginationInfo = document.getElementById('destinationPaginationInfo');
    
    let experienceChart;
    let timeChart;
    
    let allReservations = [];
    let filteredReservations = [];
    let currentPage = 1;
    const pageSize = 10;
    let currentReservationId = null;
    let allDestinations = [];
    let filteredDestinations = [];
    let currentDestinationPage = 1;
    const destinationPageSize = 10;
    let currentDestinationId = null;
    let isEditingDestination = false;

// Current user data
let currentUser = null;
    
    // Users data
    let allUsers = [];
    let filteredUsers = [];
    let currentUserPage = 1;
    const userPageSize = 10;
    let currentUserId = null;
    
auth.onAuthStateChanged(async user => {
    dashboardContainer.classList.add('hidden');

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const userDoc = await db
            .collection('users')
            .doc(user.uid)
            .get();

        if (
            !userDoc.exists ||
            userDoc.data()?.role !== 'admin'
        ) {
            await auth.signOut();
            window.location.href = 'login.html';
            return;
        }
currentUser = {
    id: userDoc.id,
    ...userDoc.data()
};

displayUserProfile(currentUser);
        dashboardContainer.classList.remove('hidden');

        loadDashboardData();
        loadUsersData();
    } catch (error) {
        console.error(
            'Admin authorization check failed:',
            error
        );

        try {
            await auth.signOut();
        } catch (signOutError) {
            console.error(
                'Sign-out failed:',
                signOutError
            );
        }

        window.location.href = 'login.html';
    }
});    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut()
                .then(() => {
                    console.log("User signed out");
                    window.location.href = 'index.html'; 
                })
                .catch(error => {
                    console.error("Logout error:", error);
                });
        });
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            
            navLinks.forEach(link => link.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');
            
            const targetId = link.getAttribute('href').substring(1);
            
            Object.keys(sections).forEach(key => {
                if (sections[key]) {
                    sections[key].style.display = 'none';
                }
            });
            
            if (targetId === 'dashboard') {
                sections.dashboard.style.display = 'flex';
                sections.reservations.style.display = 'block';
                sections.analytics.style.display = 'flex';
            } else if (targetId === 'users') {
                sections.users.style.display = 'block';
                loadUsersData();
            } else if (sections[targetId]) {
                sections[targetId].style.display = targetId === 'analytics' ? 'flex' : 'block';
            }
        });
    });
    
    // Reservation modal events
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', closeModal);
    }
    
    if (saveStatusBtn) {
        saveStatusBtn.addEventListener('click', updateReservationStatus);
    }
    
    // User modal events
    if (closeUserModalBtn) {
        closeUserModalBtn.addEventListener('click', closeUserModal);
    }
    
    if (cancelUserModalBtn) {
        cancelUserModalBtn.addEventListener('click', closeUserModal);
    }
    
    
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', saveUser);
    }
    
    // Filters and search
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
    
    if (userRoleFilter) {
        userRoleFilter.addEventListener('change', applyUserFilters);
    }
    
    if (searchUsersInput) {
        searchUsersInput.addEventListener('input', applyUserFilters);
    }
    
    if (dateRangeFilter) {
        dateRangeFilter.addEventListener('change', loadDashboardData);
    }
    
    // Pagination
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            const maxPage = Math.ceil(filteredReservations.length / pageSize);
            if (currentPage < maxPage) {
                currentPage++;
                renderTable();
            }
        });
    }
    
    // User pagination
    if (prevUserPageBtn) {
        prevUserPageBtn.addEventListener('click', () => {
            if (currentUserPage > 1) {
                currentUserPage--;
                renderUsersTable();
            }
        });
    }
    
    if (nextUserPageBtn) {
        nextUserPageBtn.addEventListener('click', () => {
            const maxPage = Math.ceil(filteredUsers.length / userPageSize);
            if (currentUserPage < maxPage) {
                currentUserPage++;
                renderUsersTable();
            }
        });
    }

    if (closeProfileModalBtn) {
        closeProfileModalBtn.addEventListener('click', closeProfileModal);
    }

    if (cancelProfileModalBtn) {
        cancelProfileModalBtn.addEventListener('click', closeProfileModal);
    }

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openProfileModal);
    }

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }

    // Destination modal events
    if (closeDestinationModalBtn) {
        closeDestinationModalBtn.addEventListener('click', closeDestinationModal);
    }

    if (cancelDestinationModalBtn) {
        cancelDestinationModalBtn.addEventListener('click', closeDestinationModal);
    }

    if (addDestinationBtn) {
        addDestinationBtn.addEventListener('click', () => {
            openDestinationModal();
        });
    }

    if (saveDestinationBtn) {
        saveDestinationBtn.addEventListener('click', saveDestination);
    }

    if (deleteDestinationBtn) {
        deleteDestinationBtn.addEventListener('click', deleteDestination);
    }

    // Destination pagination
    if (prevDestinationPageBtn) {
        prevDestinationPageBtn.addEventListener('click', () => {
            if (currentDestinationPage > 1) {
                currentDestinationPage--;
                renderDestinationsTable();
            }
        });
    }

    if (nextDestinationPageBtn) {
        nextDestinationPageBtn.addEventListener('click', () => {
            const maxPage = Math.ceil(filteredDestinations.length / destinationPageSize);
            if (currentDestinationPage < maxPage) {
                currentDestinationPage++;
                renderDestinationsTable();
            }
        });
    }
    
    function loadDashboardData() {
        fetchReservations().then(() => {
            updateStats();
            renderTable();
            renderCharts();
        });
    }
    
    function loadUsersData() {
        fetchUsers().then(() => {
            renderUsersTable();
        });
    }
    
    function fetchUsers() {
        return new Promise((resolve) => {
            db.collection('users').orderBy('createdAt', 'desc').get()
                .then(snapshot => {
                    allUsers = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        allUsers.push({
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
                        });
                    });
                    
                    filteredUsers = [...allUsers];
                    resolve();
                })
                .catch(error => {
                    console.error("Error fetching users:", error);
                    resolve();
                });
        });
    }
    
    function applyUserFilters() {
        const roleValue = userRoleFilter.value;
        const searchValue = searchUsersInput.value.toLowerCase();
        
        filteredUsers = allUsers.filter(user => {
            if (roleValue !== 'all' && user.role !== roleValue) {
                return false;
            }
            
            if (searchValue) {
                const searchableFields = [
                    user.fullName,
                    user.email
                ];
                
                return searchableFields.some(field => {
                    return field && field.toString().toLowerCase().includes(searchValue);
                });
            }
            
            return true;
        });
        
        currentUserPage = 1;
        renderUsersTable();
    }
    
function renderUsersTable() {
    usersTableBody.innerHTML = '';

    const startIndex = (currentUserPage - 1) * userPageSize;
    const endIndex = startIndex + userPageSize;
    const pageData = filteredUsers.slice(startIndex, endIndex);

    if (pageData.length === 0) {
        const emptyRow = document.createElement('tr');

        emptyRow.innerHTML =
            '<td colspan="6" class="empty-table">Aucun utilisateur trouvé</td>';

        usersTableBody.appendChild(emptyRow);
    } else {
        pageData.forEach(user => {
            const row = document.createElement('tr');

            const createdDate = new Date(user.createdAt);

            const formattedCreatedDate =
                createdDate.toLocaleDateString('fr-FR');

            row.innerHTML = `
                <td>${escapeHtml(user.id.substring(0, 8))}...</td>

                <td>
                    ${escapeHtml(user.fullName || 'Non renseigné')}
                </td>

                <td>${escapeHtml(user.email)}</td>

                <td>
                    <span class="role-badge role-${escapeHtml(user.role)}">
                        ${escapeHtml(user.role)}
                    </span>
                </td>

                <td>${escapeHtml(formattedCreatedDate)}</td>

                <td>
                    <button
                        class="edit-user-btn"
                        data-id="${user.id}"
                        title="Modifier"
                    >
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;

            usersTableBody.appendChild(row);

            row
                .querySelector('.edit-user-btn')
                .addEventListener('click', () => {
                    openUserModal(user);
                });
        });
    }

    const totalPages =
        Math.ceil(filteredUsers.length / userPageSize);

    userPaginationInfo.textContent =
        `Page ${currentUserPage} sur ${totalPages || 1}`;

    prevUserPageBtn.disabled = currentUserPage <= 1;
    nextUserPageBtn.disabled = currentUserPage >= totalPages;
}
    
    function openUserModal(user) {
    if (!user) {
        return;
    }

    currentUserId = user.id;

    userModalTitle.textContent = "Modifier l'utilisateur";

    userNameInput.value = user.fullName || '';
    userEmailInput.value = user.email || '';
    userRoleInput.value = user.role || 'user';

    userModal.style.display = 'block';
}

function closeUserModal() {
    userModal.style.display = 'none';
    currentUserId = null;
    userForm.reset();
}

function saveUser() {
    if (!currentUserId) {
        return;
    }

    const fullName = userNameInput.value.trim();
    const role = userRoleInput.value;

    if (!fullName || !role) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }

    if (
        currentUserId === auth.currentUser?.uid &&
        role !== 'admin'
    ) {
        alert(
            "Vous ne pouvez pas retirer votre propre rôle administrateur."
        );
        return;
    }

    const userData = {
        fullName,
        role
    };

    db.collection('users')
        .doc(currentUserId)
        .update(userData)
        .then(() => {
            const userIndex =
                allUsers.findIndex(
                    user => user.id === currentUserId
                );

            if (userIndex !== -1) {
                allUsers[userIndex] = {
                    ...allUsers[userIndex],
                    ...userData
                };
            }

            const filteredIndex =
                filteredUsers.findIndex(
                    user => user.id === currentUserId
                );

            if (filteredIndex !== -1) {
                filteredUsers[filteredIndex] = {
                    ...filteredUsers[filteredIndex],
                    ...userData
                };
            }

            renderUsersTable();
            closeUserModal();

            alert('Utilisateur mis à jour avec succès!');
        })
        .catch(error => {
            console.error(
                "Error updating user:",
                error
            );

            alert(
                "Erreur lors de la mise à jour de l'utilisateur."
            );
        });
} 
    function fetchReservations() {
        return new Promise((resolve) => {
            const daysFilter = parseInt(dateRangeFilter.value);
            let query = db.collection('reservations').orderBy('dateReservation', 'desc');
            
            if (daysFilter && daysFilter !== 'all') {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - daysFilter);
                query = query.where('dateReservation', '>=', startDate);
            }
            
            query.get()
                .then(snapshot => {
                    allReservations = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        allReservations.push({
                            id: doc.id,
                            ...data,
                            dateReservation: data.dateReservation.toDate()
                        });
                    });
                    
                    filteredReservations = [...allReservations];
                    resolve();
                })
                .catch(error => {
                    console.error("Error fetching reservations:", error);
                    resolve();
                });
        });
    }
    
    function updateStats() {
        const totalReservations = allReservations.length;
        const pendingReservations = allReservations.filter(r => r.statut === 'En attente').length;
        const confirmedReservations = allReservations.filter(r => r.statut === 'Confirmée').length;
        
        let totalParticipants = 0;
        allReservations.forEach(r => {
            const adultes = parseInt(r.adultes) || 0;
            const enfants = parseInt(r.enfants) || 0;
            totalParticipants += adultes + enfants;
        });
        
        document.getElementById('totalReservations').textContent = totalReservations;
        document.getElementById('pendingReservations').textContent = pendingReservations;
        document.getElementById('confirmedReservations').textContent = confirmedReservations;
        document.getElementById('totalParticipants').textContent = totalParticipants;
    }
    
    function applyFilters() {
        const statusValue = statusFilter.value;
        const searchValue = searchInput.value.toLowerCase();
        
        filteredReservations = allReservations.filter(reservation => {
            if (statusValue !== 'all' && reservation.statut !== statusValue) {
                return false;
            }
            
            if (searchValue) {
                const searchableFields = [
                    reservation.id,
                    reservation.nom,
                    reservation.email,
                    reservation.telephone,
                    reservation.experience
                ];
                
                return searchableFields.some(field => {
                    return field && field.toString().toLowerCase().includes(searchValue);
                });
            }
            
            return true;
        });
        
        currentPage = 1;
        renderTable();
    }
    
    function renderTable() {
        reservationsTableBody.innerHTML = '';
        
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageData = filteredReservations.slice(startIndex, endIndex);
        
        if (pageData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="10" class="empty-table">Aucune réservation trouvée</td>`;
            reservationsTableBody.appendChild(emptyRow);
        } else {
            pageData.forEach(reservation => {
                const row = document.createElement('tr');
                
                const reservationDate = new Date(reservation.dateReservation);
                const formattedDate = reservationDate.toLocaleDateString('fr-FR') + ' ' + 
                                    reservationDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
                
                let statusClass = '';
                if (reservation.statut === 'Confirmée') statusClass = 'status-confirmed';
                if (reservation.statut === 'En attente') statusClass = 'status-pending';
                if (reservation.statut === 'Annulée') statusClass = 'status-canceled';
                
row.innerHTML = `
    <td>${escapeHtml(reservation.id.substring(0, 8))}...</td>
    <td>${escapeHtml(reservation.nom)}</td>
    <td>${escapeHtml(reservation.email)}</td>
    <td>${escapeHtml(reservation.telephone)}</td>
    <td>${escapeHtml(reservation.dateDepart)}</td>
    <td>${escapeHtml(reservation.adultes)} adultes, ${escapeHtml(reservation.enfants)} enfants</td>
    <td>${escapeHtml(
        reservation.experience === 'autre'
            ? reservation.autreExperience
            : reservation.experience
    )}</td>
    <td>${escapeHtml(formattedDate)}</td>
    <td>
        <span class="status-badge ${statusClass}">
            ${escapeHtml(reservation.statut)}
        </span>
    </td>
    <td>
        <button class="view-btn" data-id="${reservation.id}">
            <i class="fas fa-eye"></i>
        </button>
    </td>
`;
                
                reservationsTableBody.appendChild(row);
                
                const viewBtn = row.querySelector('.view-btn');
                viewBtn.addEventListener('click', () => {
                    openReservationModal(reservation);
                });
            });
        }
        
        const totalPages = Math.ceil(filteredReservations.length / pageSize);
        paginationInfo.textContent = `Page ${currentPage} sur ${totalPages || 1}`;
        
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    function renderCharts() {
        renderExperienceChart();
        renderTimeChart();
    }
    
    function renderExperienceChart() {
        const experienceCanvas = document.getElementById('experienceChart');
        
        if (!experienceCanvas) return;
        
        const experienceCounts = {};
        
        allReservations.forEach(reservation => {
            const experience = reservation.experience === 'autre' ? reservation.autreExperience : reservation.experience;
            experienceCounts[experience] = (experienceCounts[experience] || 0) + 1;
        });
        
        const labels = Object.keys(experienceCounts);
        const data = Object.values(experienceCounts);
        
        const backgroundColors = [
            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
            '#6f42c1', '#5a5c69', '#858796', '#f8f9fc', '#3a3b45'
        ];
        
        if (experienceChart) {
            experienceChart.data.labels = labels;
            experienceChart.data.datasets[0].data = data;
            experienceChart.update();
        } else {
            experienceChart = new Chart(experienceCanvas, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors.slice(0, labels.length),
                        hoverBackgroundColor: backgroundColors.slice(0, labels.length),
                        hoverBorderColor: "rgba(234, 236, 244, 1)",
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            titleFontSize: 16,
                            bodyFontSize: 14
                        }
                    }
                }
            });
        }
    }
    
    function renderTimeChart() {
        const timeChartCanvas = document.getElementById('reservationsTimeChart');
        
        if (!timeChartCanvas) return;
        
        const daysFilter = parseInt(dateRangeFilter.value) || 30;
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - daysFilter);
        
        const dateRange = {};
        const statusCounts = {
            'En attente': {},
            'Confirmée': {},
            'Annulée': {}
        };
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dateRange[dateStr] = true;
            statusCounts['En attente'][dateStr] = 0;
            statusCounts['Confirmée'][dateStr] = 0;
            statusCounts['Annulée'][dateStr] = 0;
        }
        
        allReservations.forEach(reservation => {
            const dateStr = reservation.dateReservation.toISOString().split('T')[0];
            
            if (dateRange[dateStr]) {
                const status = reservation.statut || 'En attente';
                statusCounts[status][dateStr] = (statusCounts[status][dateStr] || 0) + 1;
            }
        });
        
        const labels = Object.keys(dateRange).sort();
        
        const datasets = [
            {
                label: 'Confirmées',
                data: labels.map(date => statusCounts['Confirmée'][date] || 0),
                backgroundColor: 'rgba(28, 200, 138, 0.2)',
                borderColor: 'rgba(28, 200, 138, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(28, 200, 138, 1)',
                pointRadius: 3,
                fill: true,
                tension: 0.4
            },
            {
                label: 'En attente',
                data: labels.map(date => statusCounts['En attente'][date] || 0),
                backgroundColor: 'rgba(246, 194, 62, 0.2)',
                borderColor: 'rgba(246, 194, 62, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(246, 194, 62, 1)',
                pointRadius: 3,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Annulées',
                data: labels.map(date => statusCounts['Annulée'][date] || 0),
                backgroundColor: 'rgba(231, 74, 59, 0.2)',
                borderColor: 'rgba(231, 74, 59, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(231, 74, 59, 1)',
                pointRadius: 3,
                fill: true,
                tension: 0.4
            }
        ];
        
        const formattedLabels = labels.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
        });
        
        if (timeChart) {
            timeChart.data.labels = formattedLabels;
            timeChart.data.datasets = datasets;
            timeChart.update();
        } else {
            timeChart = new Chart(timeChartCanvas, {
                type: 'line',
                data: {
                    labels: formattedLabels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            precision: 0,
                            stepSize: 1
                        }
                    },
                    plugins: {
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    }
                }
            });
        }
    }

    function openReservationModal(reservation) {
    currentReservationId = reservation.id;
    
    const modalBody = document.getElementById('reservationDetails');
    const reservationDate = new Date(reservation.dateReservation);
    const formattedDate = reservationDate.toLocaleDateString('fr-FR') + ' ' + 
                        reservationDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
    
modalBody.innerHTML = `
    <div class="reservation-info">
        <div class="info-row">
            <strong>ID:</strong> ${escapeHtml(reservation.id)}
        </div>
        <div class="info-row">
            <strong>Nom:</strong> ${escapeHtml(reservation.nom)}
        </div>
        <div class="info-row">
            <strong>Email:</strong> ${escapeHtml(reservation.email)}
        </div>
        <div class="info-row">
            <strong>Téléphone:</strong> ${escapeHtml(reservation.telephone)}
        </div>
        <div class="info-row">
            <strong>Date de départ:</strong> ${escapeHtml(reservation.dateDepart)}
        </div>
        <div class="info-row">
            <strong>Adultes:</strong> ${escapeHtml(reservation.adultes)}
        </div>
        <div class="info-row">
            <strong>Enfants:</strong> ${escapeHtml(reservation.enfants)}
        </div>
        <div class="info-row">
            <strong>Expérience:</strong>
            ${escapeHtml(
                reservation.experience === 'autre'
                    ? reservation.autreExperience
                    : reservation.experience
            )}
        </div>
        <div class="info-row">
            <strong>Date de réservation:</strong> ${escapeHtml(formattedDate)}
        </div>
        <div class="info-row">
            <strong>Statut actuel:</strong>
            <span class="status-badge">${escapeHtml(reservation.statut)}</span>
        </div>
    </div>
`;
    
    document.getElementById('updateStatus').value = reservation.statut;
    reservationModal.style.display = 'block';
}

function closeModal() {
    reservationModal.style.display = 'none';
    currentReservationId = null;
}

 function updateReservationStatus() {
        if (!currentReservationId) return;
        
        const newStatus = updateStatusSelect.value;
        
        // Get the current reservation data for email
        const currentReservation = allReservations.find(r => r.id === currentReservationId);
        
        db.collection('reservations').doc(currentReservationId).update({
            statut: newStatus
        })
        .then(() => {
            const reservationIndex = allReservations.findIndex(r => r.id === currentReservationId);
            if (reservationIndex !== -1) {
                allReservations[reservationIndex].statut = newStatus;
                
                const filteredIndex = filteredReservations.findIndex(r => r.id === currentReservationId);
                if (filteredIndex !== -1) {
                    filteredReservations[filteredIndex].statut = newStatus;
                }
                
                updateStats();
                renderTable();
                renderCharts();
                
                sendStatusUpdateEmail(currentReservation, newStatus);
                
                closeModal();
            }
        })
        .catch(error => {
            console.error("Error updating status:", error);
            alert("Erreur lors de la mise à jour du statut. Veuillez réessayer.");
        });
    }

    // Add this new function for sending emails
    function sendStatusUpdateEmail(reservation, newStatus) {
        const serviceID = 'service_7c8j1b9';
        const templateID = 'template_57if6vg';
        const publicKey = 'iQPAvdMoj37X1rb-t';
        const templateParams = {
            to_name: reservation.nom,
            message: `Votre réservation (ID: ${reservation.id}) a été mise à jour. 
                    Nouveau statut: ${newStatus}
                    Expérience: ${reservation.experience === 'autre' ? reservation.autreExperience : reservation.experience}
                    Date de départ: ${reservation.dateDepart}
                    Participants: ${reservation.adultes} adulte(s), ${reservation.enfants} enfant(s)`,
            destination: reservation.email
        };
        
        emailjs.send(serviceID, templateID, templateParams, publicKey)
            .then((response) => {
                alert('Email de notification envoyé avec succès!');
                console.log('Email sent successfully:', response.status, response.text);
                
            })
            .catch((error) => {
                alert('Email de notification envoyé avec succès!');
                console.error('Failed to send email:', error);
                
            });
    }
    
    function getStatusClass(status) {
        switch (status) {
            case 'Confirmée': return 'status-confirmed';
            case 'En attente': return 'status-pending';
            case 'Annulée': return 'status-canceled';
            default: return '';
        }
    }
    function displayUserProfile(user) {
        document.getElementById('profileFullName').textContent = user.fullName || 'Non renseigné';
        document.getElementById('profileRole').textContent = user.role || 'user';
        document.getElementById('profileEmail').textContent = user.email || 'Non renseigné';
        document.getElementById('profileFullNameDetail').textContent = user.fullName || 'Non renseigné';
        document.getElementById('profileRoleDetail').textContent = user.role || 'user';
        
        const createdDate = user.createdAt ? (user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt)) : new Date();
        document.getElementById('profileCreatedAt').textContent = createdDate.toLocaleDateString('fr-FR') + ' à ' + createdDate.toLocaleTimeString('fr-FR');
    }

function openProfileModal() {
    if (!currentUser) {
        return;
    }

    document.getElementById('profileEditFullName').value =
        currentUser.fullName || '';

    document.getElementById('profileEditEmail').value =
        currentUser.email || auth.currentUser?.email || '';

    profileModal.style.display = 'block';
}

    function closeProfileModal() {
        profileModal.style.display = 'none';
        profileForm.reset();
    }

function saveProfile() {
    if (!currentUser) {
        return;
    }

    const fullName =
        document
            .getElementById('profileEditFullName')
            .value
            .trim();

    if (!fullName) {
        alert('Veuillez renseigner votre nom complet.');
        return;
    }

    db.collection('users')
        .doc(currentUser.id)
        .update({
            fullName
        })
        .then(() => {
            currentUser = {
                ...currentUser,
                fullName
            };

            displayUserProfile(currentUser);
            closeProfileModal();

            const userIndex =
                allUsers.findIndex(
                    user => user.id === currentUser.id
                );

            if (userIndex !== -1) {
                allUsers[userIndex] = {
                    ...allUsers[userIndex],
                    fullName
                };

                filteredUsers = filteredUsers.map(user =>
                    user.id === currentUser.id
                        ? { ...user, fullName }
                        : user
                );

                renderUsersTable();
            }

            alert('Profil mis à jour avec succès!');
        })
        .catch(error => {
            console.error(
                'Error updating admin profile:',
                error
            );

            alert(
                "Erreur lors de la mise à jour du profil."
            );
        });
}

    // Destinations functions
    function loadDestinationsData() {
        fetchDestinations().then(() => {
            renderDestinationsTable();
        });
    }

    function fetchDestinations() {
        return new Promise((resolve) => {
            db.collection('destinations').orderBy('createdAt', 'desc').get()
                .then(snapshot => {
                    allDestinations = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        allDestinations.push({
                            id: doc.id,
                            ...data,
                            createdAt: data.createdAt ? data.createdAt.toDate() : new Date()
                        });
                    });
                    
                    filteredDestinations = [...allDestinations];
                    resolve();
                })
                .catch(error => {
                    console.error("Error fetching destinations:", error);
                    resolve();
                });
        });
    }

    function renderDestinationsTable() {
        destinationsTableBody.innerHTML = '';
        
        const startIndex = (currentDestinationPage - 1) * destinationPageSize;
        const endIndex = startIndex + destinationPageSize;
        const pageData = filteredDestinations.slice(startIndex, endIndex);
        
        if (pageData.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="5" class="empty-table">Aucune destination trouvée</td>`;
            destinationsTableBody.appendChild(emptyRow);
        } else {
            pageData.forEach(destination => {
                const row = document.createElement('tr');
                
                const createdDate = new Date(destination.createdAt);
                const formattedCreatedDate = createdDate.toLocaleDateString('fr-FR');
                
                const shortDescription =
    destination.description.length > 50
        ? destination.description.substring(0, 50) + '...'
        : destination.description;

row.innerHTML = `
    <td>${escapeHtml(destination.id.substring(0, 8))}...</td>
    <td>${escapeHtml(destination.name)}</td>
    <td>${escapeHtml(shortDescription)}</td>
    <td>${escapeHtml(formattedCreatedDate)}</td>
    <td>
        <button
            class="edit-destination-btn"
            data-id="${destination.id}"
            title="Modifier"
        >
            <i class="fas fa-edit"></i>
        </button>
        <button
            class="delete-destination-btn"
            data-id="${destination.id}"
            title="Supprimer"
        >
            <i class="fas fa-trash"></i>
        </button>
    </td>
`;
                
                destinationsTableBody.appendChild(row);
                
                const editBtn = row.querySelector('.edit-destination-btn');
                const deleteBtn = row.querySelector('.delete-destination-btn');
                
                editBtn.addEventListener('click', () => {
                    openDestinationModal(destination);
                });
                
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer cette destination ?')) {
                        deleteDestinationById(destination.id);
                    }
                });
            });
        }
        
        const totalPages = Math.ceil(filteredDestinations.length / destinationPageSize);
        destinationPaginationInfo.textContent = `Page ${currentDestinationPage} sur ${totalPages || 1}`;
        
        prevDestinationPageBtn.disabled = currentDestinationPage <= 1;
        nextDestinationPageBtn.disabled = currentDestinationPage >= totalPages;
    }

    function openDestinationModal(destination = null) {
        isEditingDestination = !!destination;
        currentDestinationId = destination ? destination.id : null;
        
        if (isEditingDestination) {
            destinationModalTitle.textContent = 'Modifier la destination';
            document.getElementById('destinationName').value = destination.name || '';
            document.getElementById('destinationDescription').value = destination.description || '';
            
            deleteDestinationBtn.style.display = 'inline-block';
        } else {
            destinationModalTitle.textContent = 'Ajouter une destination';
            destinationForm.reset();
            deleteDestinationBtn.style.display = 'none';
        }
        
        destinationModal.style.display = 'block';
    }

    function closeDestinationModal() {
        destinationModal.style.display = 'none';
        currentDestinationId = null;
        isEditingDestination = false;
        destinationForm.reset();
    }

    function saveDestination() {
        const name = document.getElementById('destinationName').value.trim();
        const description = document.getElementById('destinationDescription').value.trim();
        
        if (!name || !description) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }
        
        const destinationData = {
            name: name,
            description: description
        };
        
        if (isEditingDestination) {
            // Update existing destination
            db.collection('destinations').doc(currentDestinationId).update(destinationData)
                .then(() => {
                    const destinationIndex = allDestinations.findIndex(d => d.id === currentDestinationId);
                    if (destinationIndex !== -1) {
                        allDestinations[destinationIndex] = { ...allDestinations[destinationIndex], ...destinationData };
                        
                        const filteredIndex = filteredDestinations.findIndex(d => d.id === currentDestinationId);
                        if (filteredIndex !== -1) {
                            filteredDestinations[filteredIndex] = { ...filteredDestinations[filteredIndex], ...destinationData };
                        }
                    }
                    
                    renderDestinationsTable();
                    closeDestinationModal();
                    alert('Destination mise à jour avec succès!');
                })
                .catch(error => {
                    console.error("Error updating destination:", error);
                    alert("Erreur lors de la mise à jour de la destination.");
                });
        } else {
            // Create new destination
            destinationData.createdAt = new Date();
            
            db.collection('destinations').add(destinationData)
                .then((docRef) => {
                    const newDestination = {
                        id: docRef.id,
                        ...destinationData
                    };
                    
                    allDestinations.unshift(newDestination);
                    filteredDestinations.unshift(newDestination);
                    
                    renderDestinationsTable();
                    closeDestinationModal();
                    alert('Destination créée avec succès!');
                })
                .catch(error => {
                    console.error("Error creating destination:", error);
                    alert("Erreur lors de la création de la destination.");
                });
        }
    }

    function deleteDestination() {
        if (!currentDestinationId) return;
        
        if (confirm('Êtes-vous vraiment sûr de vouloir supprimer cette destination ? Cette action est irréversible.')) {
            deleteDestinationById(currentDestinationId);
            closeDestinationModal();
        }
    }

    function deleteDestinationById(destinationId) {
        db.collection('destinations').doc(destinationId).delete()
            .then(() => {
                allDestinations = allDestinations.filter(d => d.id !== destinationId);
                filteredDestinations = filteredDestinations.filter(d => d.id !== destinationId);
                
                renderDestinationsTable();
                alert('Destination supprimée avec succès!');
            })
            .catch(error => {
                console.error("Error deleting destination:", error);
                alert("Erreur lors de la suppression de la destination.");
            });
    }

window.addEventListener('click', function(event) {
    if (event.target === reservationModal) {
        closeModal();
    }
    if (event.target === userModal) {
        closeUserModal();
    }
    if (event.target === profileModal) {
        closeProfileModal();
    }
    if (event.target === destinationModal) {
        closeDestinationModal();
    }
});


navLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        
        navLinks.forEach(link => link.parentElement.classList.remove('active'));
        link.parentElement.classList.add('active');
        
        const targetId = link.getAttribute('href').substring(1);
        
        // Hide all sections first
        Object.keys(sections).forEach(key => {
            if (sections[key]) {
                sections[key].style.display = 'none';
            }
        });
        
        // Show appropriate sections based on navigation
        if (targetId === 'dashboard') {
            sections.dashboard.style.display = 'flex';
            sections.reservations.style.display = 'block';
            sections.analytics.style.display = 'flex';
        } else if (targetId === 'users') {
            sections.users.style.display = 'block';
            loadUsersData();
        } else if (targetId === 'reservations') {
            sections.reservations.style.display = 'block';
        } else if (targetId === 'analytics') {
            sections.analytics.style.display = 'flex';
        } else if (targetId === 'profile') {
            sections.profile.style.display = 'block';
            loadCurrentUserProfile();
        } else if (targetId === 'destinations') {
            sections.destinations.style.display = 'block';
            loadDestinationsData();
        }
    });
});


function createUserAccount(userData, password) {
   
    return db.collection('users').add({
        ...userData,
        createdAt: new Date()
    });
}

})