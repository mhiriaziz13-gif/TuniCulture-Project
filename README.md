# TuniCulture

**Freelance tourism web platform for cultural discovery, reservation management and role-based administration in Tunisia.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?logo=vercel&logoColor=white)](https://tuni-culture-tunisia-excursion-book.vercel.app/)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![Firebase](https://img.shields.io/badge/Firebase-Authentication%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black)
![Security](https://img.shields.io/badge/Security-Role--based%20access-success)

---

## Overview

TuniCulture is a freelance web application designed around tourism and cultural experiences in Tunisia.

The platform combines a public tourism experience with reservation workflows, authenticated customer accounts, and an administrative dashboard for managing operational data.

The project was built with vanilla JavaScript and Firebase, with a particular focus on:

- tourism discovery,
- reservation management,
- customer account management,
- role-based administration,
- operational dashboards,
- reservation analytics,
- authentication and authorization,
- Firestore data security.

**Live application:**  
https://tuni-culture-tunisia-excursion-book.vercel.app/

---

## Business Context

Tourism platforms often need to support two very different user journeys:

1. visitors who want to discover experiences and submit a reservation quickly;
2. authenticated users and administrators who need structured access to reservation and customer data.

TuniCulture addresses both sides through a single web platform.

Public visitors can browse the tourism experience and submit reservation requests, while registered customers gain access to their own account and reservation history.

Administrators use a dedicated dashboard to monitor reservations, manage destinations, review users and update reservation statuses.

---

## Core Features

### Public Experience

- Tourism and cultural discovery interface
- Public reservation form
- Reservation request submission to Firestore
- Destination and experience selection
- Customer contact and travel information capture

### Authentication

- Firebase Authentication
- Email/password account creation
- Email/password sign-in
- Password reset workflow
- Authenticated session handling
- User roles stored in Firestore

### Customer Area

Authenticated customers can:

- access their personal profile,
- update their display name,
- create reservations linked to their Firebase UID,
- view only their own reservations,
- edit eligible pending reservations,
- browse available destinations,
- sign out securely.

Reservation ownership is associated with the authenticated Firebase UID through an `ownerUid` field rather than trusting browser-side identity data.

### Administration Dashboard

Administrators can:

- review reservation activity,
- search and filter reservations,
- update reservation statuses,
- manage tourism destinations,
- review registered users,
- update user names and roles,
- view operational statistics,
- analyse reservations by experience and period.

The dashboard includes reservation visualisations using Chart.js.

### Reservation Notifications

Reservation status changes can trigger customer email notifications through EmailJS.

---

## Security Architecture

Security was treated as a data-access concern rather than relying only on the user interface.

### Firebase Authentication as the Identity Source

Authenticated customer identity is derived from:

```javascript
firebase.auth().currentUser
```

Local storage may support UI state, but it is not trusted as the authorization identity.

### Reservation Ownership

Authenticated reservations store:

```text
ownerUid = Firebase Auth UID
```

Firestore rules enforce that a customer may access only reservation documents whose `ownerUid` matches their authenticated UID.

### Role-Based Access Control

The platform distinguishes between:

```text
user
admin
```

Administrative permissions are enforced at the Firestore security-rule level.

The admin role is resolved from:

```text
/users/{authenticatedUid}
```

rather than being trusted from arbitrary client input.

### Firestore Security Rules

The repository includes the deployed security policy in:

```text
firestore.rules
```

The rules implement:

- authenticated user self-access,
- admin-only privileged operations,
- reservation ownership checks,
- restricted user profile updates,
- restricted reservation updates,
- public destination reads,
- controlled public reservation creation,
- deny-by-default handling for unmatched collections.

### Cross-User Isolation

A normal authenticated user cannot read another user's owned reservation.

Access is enforced by Firestore rather than by hiding data only in the frontend.

### Stored XSS Mitigation

Dynamic values displayed in the administration dashboard are HTML-escaped before being inserted through template rendering.

This protects administrative views from executing HTML or script content submitted through user-controlled fields.

---

## High-Level Architecture

```text
Public Visitor
     |
     | Public reservation
     v
+--------------------+
|     Firestore      |
|                    |
| reservations       |
| destinations       |
| users              |
+--------------------+
        ^       ^
        |       |
        |       |
Customer UI    Admin Dashboard
        |       |
        +---+---+
            |
      Firebase Auth
```

For authenticated reservations:

```text
Firebase Auth UID
       |
       v
reservation.ownerUid
       |
       v
Firestore Security Rules
       |
       +--> Owner access
       |
       +--> Admin access
```

---

## Main Data Collections

### `users`

Stores application profile and authorization information.

Typical structure:

```javascript
{
  fullName: "...",
  email: "...",
  createdAt: Timestamp,
  role: "user"
}
```

For standard authenticated accounts, the Firestore document ID corresponds to the Firebase Authentication UID.

### `reservations`

Stores tourism reservation requests.

Typical authenticated reservation:

```javascript
{
  ownerUid: "...",
  nom: "...",
  email: "...",
  telephone: "...",
  destination: "...",
  dateDepart: "...",
  adultes: "...",
  enfants: "...",
  experience: "...",
  commentaires: "...",
  dateReservation: Timestamp,
  statut: "En attente"
}
```

Anonymous/public reservations may exist without an `ownerUid`. Those records are not exposed as customer-owned reservations.

### `destinations`

Stores destinations available through the tourism and reservation interfaces.

Typical structure:

```javascript
{
  name: "...",
  description: "...",
  createdAt: Timestamp
}
```

---

## Project Structure

```text
TuniCulture-Project/
│
├── index.html
├── client.html
├── admin.html
├── login.html
├── signup.html
├── forgot-password.html
│
├── css/
│
├── js/
│   ├── admin.js
│   ├── client.js
│   ├── forgot-password.js
│   ├── login.js
│   ├── reservation.js
│   ├── script.js
│   └── signup.js
│
├── images/
│
├── firestore.rules
└── README.md
```

---

## Technology Stack

| Area | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Authorization | Firestore Security Rules |
| Analytics UI | Chart.js |
| Email notifications | EmailJS |
| Deployment | Netlify |
| Version control | Git & GitHub |

---

## Key Engineering Decisions

### Use Firebase Auth UID for ownership

Customer data access is based on Firebase's authenticated UID rather than email addresses or browser-managed identity state.

This provides a stable identity boundary between authentication and Firestore authorization.

### Keep authorization in Firestore Rules

Frontend checks improve the user experience, but sensitive permissions are enforced in Firestore Security Rules.

This means bypassing the user interface does not automatically grant database access.

### Support both public and authenticated reservations

The public reservation journey intentionally remains accessible without account creation.

Authenticated reservations add ownership metadata so customers can later access and manage their own records.

### Keep administrative account creation outside the client dashboard

The admin interface does not attempt to create Firebase Authentication accounts directly from browser-side Firestore writes.

Creating privileged authentication accounts requires a trusted administrative environment such as Firebase Admin SDK or another secure backend.

---

## Local Development

Clone the repository:

```bash
git clone https://github.com/ahmedazizmhiri
cd TuniCulture-Project
```

Because the application is based on static HTML, CSS and JavaScript, it can be served with any local static web server.

For example:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

---

## Firebase Configuration

The frontend uses the Firebase Web SDK.

To run the project with another Firebase project, replace the Firebase web application configuration with your own project values and configure:

- Firebase Authentication,
- Cloud Firestore,
- the required Firestore collections,
- Firestore Security Rules.

The Firebase web configuration identifies the Firebase project; database authorization is enforced separately through Firebase Authentication and Firestore Security Rules.

The version-controlled rules are available in:

```text
firestore.rules
```

---

## Deployment

The public version is deployed on Vercel:

**https://tuni-culture-tunisia-excursion-book.vercel.app/**

The application itself is static, while authentication and persistence are handled through Firebase services.

---

## Project Scope

This repository demonstrates an applied tourism workflow combining:

- customer-facing digital experience,
- operational reservation management,
- identity and access management,
- role-based administration,
- operational analytics,
- cloud-hosted data persistence,
- security hardening.

It is presented as a freelance project and as part of a broader portfolio focused on digital transformation, business systems, analytics and automation.

---

## Author

**Ahmed Aziz Mhiri**

Digital Transformation · Marketing & Commercial Analytics · Business Intelligence · Automation · Big Data & Applied AI

Portfolio:  
https://ahmedaziz-portfolio.vercel.app/

LinkedIn:  
https://www.linkedin.com/in/ahmed-aziz-mhiri/

GitHub:  
https://github.com/ahmedazizmhiri
