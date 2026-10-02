# Khudro Sanchay

**Khudro Sanchay (ক্ষুদ্র সঞ্চয়)** is a mobile-based cooperative savings management system designed to simplify member management, weekly savings collection, advance payments, dues tracking, and account history for a small cooperative society.

The system consists of a **React Native mobile application** and a **Node.js/TypeScript backend**, with Google Sheets used as the primary data storage layer.

---

## Features

### Member Management

* Member account creation and management
* Member profile
* Share-based weekly savings
* Active/Inactive member status
* Member-specific account information

### Authentication & Security

* Member authentication
* Admin authentication
* Gmail verification using OTP
* PIN/password-based authentication
* Change PIN/password functionality
* Profile-based account identification
* Secure backend API communication

### Weekly Savings

* Weekly deposit management
* Automatic weekly calculation
* Support for multiple shares
* Weekly deposit amount based on share count
* Due calculation
* Advance payment support
* FIFO-based advance coverage

### Deposit & Account Management

* Total deposit calculation
* Weekly deposit tracking
* Advance deposit tracking
* Outstanding weekly dues
* Advance-covered weeks
* Account history
* Deposit history

### Admin Features

* Admin dashboard
* Member management
* Create member
* Manage member accounts
* Weekly deposit management
* Weekly deposit request management
* Profile management
* Language switching
* Change password
* Gmail verification

### Member Features

* Member dashboard
* Profile
* Total deposit
* Weekly dues
* Advance balance
* Covered weeks
* Weekly deposit
* Deposit history
* Change Gmail
* Change PIN
* Language selection
* Logout

### Language Support

The application supports:

* বাংলা
* English

The interface can be switched between Bangla and English.

---

## Project Structure

```text
Khudro-Sanchay-mobile
│
├── Backend API
│   ├── src
│   │   ├── config
│   │   │   └── google-sheets.ts
│   │   │
│   │   ├── controllers
│   │   │
│   │   ├── middleware
│   │   │
│   │   ├── routes
│   │   │   └── member-auth.routes.ts
│   │   │
│   │   ├── services
│   │   │   └── member.service.ts
│   │   │
│   │   ├── utils
│   │   │   └── pin.ts
│   │   │
│   │   └── server.ts
│   │
│   ├── .env
│   ├── credentials.json
│   ├── package.json
│   └── tsconfig.json
│
├── mobile-app
│   ├── app
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   │
│   │   ├── admin
│   │   │
│   │   └── member
│   │
│   ├── components
│   ├── lib
│   ├── assets
│   ├── package.json
│   └── ...
│
└── README.md
```

---

## Technology Stack

### Mobile Application

* **React Native**
* **Expo**
* **Expo Router**
* **TypeScript**
* **React Hooks**
* **React Native Safe Area Context**
* **Ionicons**

### Backend

* **Node.js**
* **TypeScript**
* **Express.js**
* REST API

### Data Storage

* **Google Sheets API**
* Google Sheets as the primary database/storage layer

### Authentication

* Member authentication
* Admin authentication
* OTP-based Gmail verification
* PIN/password authentication

---

## Application Architecture

```text
┌──────────────────────────────┐
│       React Native App       │
│                              │
│  ┌────────────┐ ┌─────────┐ │
│  │   Admin    │ │ Member  │ │
│  │   Panel    │ │  Panel  │ │
│  └─────┬──────┘ └────┬────┘ │
└────────┼──────────────┼──────┘
         │              │
         └──────┬───────┘
                │
             REST API
                │
                ▼
┌──────────────────────────────┐
│       Node.js Backend        │
│                              │
│ Routes → Controllers →       │
│ Services → Google Sheets     │
└──────────────┬───────────────┘
               │
               ▼
      ┌──────────────────┐
      │   Google Sheets  │
      │                  │
      │ Members          │
      │ Collections      │
      │ Requests         │
      │ Account Data     │
      └──────────────────┘
```

---

## Savings Calculation

The weekly savings amount is determined by the member's share count.

```text
Weekly Amount = Share Count × ৳50
```

For example:

| Share Count | Weekly Amount |
| ----------: | ------------: |
|           1 |           ৳50 |
|           2 |          ৳100 |
|           3 |          ৳150 |
|           5 |          ৳250 |
|          10 |          ৳500 |
|          15 |          ৳750 |

The system supports up to **15 shares per member**.

---

## Weekly Accounting

The application distinguishes between different types of deposits:

### WEEKLY

A normal weekly deposit assigned to a specific collection week.

### ADVANCE

A deposit made in advance that can cover future weekly obligations.

Advance payments are applied using a **FIFO-style coverage system**, meaning the earliest unpaid eligible weeks are covered first.

The system also distinguishes between:

* Collection Week
* Latest Covered Week
* Weekly Deposit
* Advance Deposit
* Outstanding Due
* Advance Coverage

This allows the member's actual savings and weekly payment status to be calculated separately.

---

## Google Sheets

Google Sheets is used as the primary storage system.

The backend communicates with Google Sheets through the Google Sheets API.

Typical data includes:

```text
Members
Collections
Weekly Deposit Requests
Admin Information
Member Account Information
```

The existing sheet structure is intentionally preserved to maintain compatibility with the application logic.

---

## Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git
* Expo CLI / Expo development environment
* Android Studio or a physical Android device

---

## Clone the Repository

```bash
git clone https://github.com/nullbugg/Khudro-Sanchay-mobile.git
```

Then:

```bash
cd Khudro-Sanchay-mobile
```

---

# Backend Setup

Go to the backend directory:

```bash
cd "Backend API"
```

Install dependencies:

```bash
npm install
```

Create the required environment file:

```text
.env
```

Configure the required environment variables.

The Google service account credentials should also be configured securely.

> Never commit real credentials, API keys, passwords, OTP secrets, or private `.env` values to GitHub.

Start the backend:

```bash
npm run dev
```

The backend API will then be available on the configured local network address and port.

---

# Mobile App Setup

Open another terminal and go to the mobile application:

```bash
cd mobile-app
```

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

You can then run the application using:

* Android Emulator
* Physical Android device
* Expo development environment

---

## Development Environment

During local development, the mobile application communicates with the backend through the local network.

Example:

```text
Mobile App
    │
    │ HTTP Request
    ▼
http://192.168.x.x:4000
    │
    ▼
Backend API
```

Make sure the mobile device and development computer are connected to the same network when using a local backend.

---

## Security

The project is designed with several security considerations:

* Authentication for admin/member access
* Password/PIN protection
* OTP verification
* Backend-side validation
* Protected API routes
* Secure credential handling

Sensitive files should **not** be committed to the repository.

Recommended `.gitignore` entries include:

```gitignore
node_modules/
.env
credentials.json
*.log
.expo/
dist/
build/
```

---

## Current Application Modules

### Admin

```text
Dashboard
Profile
Create Member
Member Management
Weekly Deposit
Weekly Deposit Requests
Deposit Management
Change Password
Gmail Verification
Language
Logout
```

### Member

```text
Dashboard
Profile
Change Gmail
Change PIN
Weekly Deposit
Weekly Deposit History
Deposit Information
Due Information
Advance Information
Language
Logout
```

---

## Future Improvements

Planned or possible improvements include:

* Complete deposit history interface
* More detailed financial reports
* Improved notification system
* Push notifications
* Production API deployment
* Automated backup
* Improved account security
* Advanced admin reporting
* Offline support
* Production-ready release management
* Android APK distribution

---

## Deployment

The application is currently designed primarily for a private cooperative organization.

The Android application can be distributed privately without publishing it to the Google Play Store.

Possible distribution methods include:

```text
GitHub
   │
   └── Source Code

Build APK
   │
   ▼
Google Drive
   │
   ▼
WhatsApp / Direct Sharing
   │
   ▼
Members' Android Devices
```

For production use, the backend should be deployed to a reliable server and the mobile application should point to the production API URL.

---

## Project Goals

The main goal of **Khudro Sanchay** is to digitize the day-to-day savings and account management process of a small cooperative society.

Instead of maintaining member savings, weekly collections, advances, and dues manually, the system provides a centralized digital platform for both administrators and members.

---

## License

This project is currently intended for private/internal use.

The licensing terms may be updated when the project is prepared for public distribution.

---

## Developer

**Abdul Alim Sarkar**

Computer Science & Engineering

Daffodil International University

---

## Project Name

**ক্ষুদ্র সঞ্চয় — Khudro Sanchay**

> A simple digital solution for cooperative savings management.
