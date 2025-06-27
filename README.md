<p align="center">
  <img src="https://raw.githubusercontent.com/Jasmine-Afrem/DaemonView/main/frontend/daemonview-fe/public/images/daemonview.png" alt="DaemonView Banner" width="800"/>
</p>

<p align="center">
  <em>An operational dashboard built in collaboration with <strong>Nokia</strong></em>
</p>

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-Frontend-000000?style=for-the-badge&logo=next.js&logoColor=white" />
    &nbsp;&nbsp;
  <img src="https://img.shields.io/badge/Express.js-Backend-303030?style=for-the-badge&logo=express&logoColor=white" />
    &nbsp;&nbsp;
  <img src="https://img.shields.io/badge/Status-Completed-4CAF50?style=for-the-badge&logo=checkmarx&logoColor=white" />
</p>

---

<div align="center">
  <h2><strong>Roles</strong></h3>
  <p style="line-height: 1.6;">
    <strong>Frontend:</strong><br/>
       Afrem Jasmine - <a href="https://github.com/Jasmine-Afrem" target="_blank">(Jasmine-Afrem)</a><br/>
       Balas Bianca - <a href="https://github.com/biaqwe" target="_blank">(biaqwe)</a>
  </p>
  <p style="line-height: 1.6; margin-top: 0.5em;">
    <strong>Backend + Database:</strong><br/>
       Grad Andrei - <a href="https://github.com/AF1DC2" target="_blank">(AF1DC2)</a><br/>
       Sandu Aida - <a href="https://github.com/Aida1506" target="_blank">(Aida1506)</a> 
  </p>
</div>

---

## Overview

DaemonView is a web-based operational dashboard designed to provide internal teams with powerful tools for monitoring and managing support tickets. Developed in partnership with Nokia, the platform offers clarity and control through an intuitive interface, real-time data visualization, and robust reporting capabilities.

## Key Features

- **Ticket Management:** A comprehensive system to view, edit, and manage the lifecycle of support and issue tickets.
- **Dashboard Analytics:** Visualize ticket trends, priority distribution, and SLA compliance with dynamic, real-time charts.
- **Interactive Drill-Down:** Analyze data with greater precision by clicking on chart segments to view the underlying tickets.
- **Data Export:** Export filtered chart data to Excel for offline analysis, reporting, and presentations.
- **Advanced Filtering:** Efficiently locate information using filters for priority, date range, and status.
- **Secure Authentication:** Role-based access control and a secure password recovery system protect sensitive data.
- **Responsive Design:** A fully responsive interface ensures a seamless user experience across all devices.

---

## Tech Stack

- **Frontend:** Next.js (React Framework)
- **Backend:** Express.js (Node.js)
- **Database:** MySQL
- **Styling:** Styled Components
- **Charting:** Chart.js
- **Authentication:** Session-based

---

## Screenshots

<p align="center">
  <strong>Login Page</strong><br/>
  <img src="https://raw.githubusercontent.com/Jasmine-Afrem/DaemonView/main/frontend/daemonview-fe/public/images/login.png" alt="Login Page" width="1000"/>
</p>
<br/>
<p align="center">
  <strong>Loading State</strong><br/>
  <img src="https://raw.githubusercontent.com/Jasmine-Afrem/DaemonView/main/frontend/daemonview-fe/public/images/loading.png" alt="Loading State" width="1000"/>
</p>
<br/>
<p align="center">
  <strong>Main Dashboard</strong><br/>
  <img src="https://raw.githubusercontent.com/Jasmine-Afrem/DaemonView/main/frontend/daemonview-fe/public/images/dashboard.png" alt="DaemonView Dashboard" width="1000"/>
</p>
<br/>
<p align="center">
  <strong>Account Settings</strong><br/>
  <img src="https://raw.githubusercontent.com/Jasmine-Afrem/DaemonView/main/frontend/daemonview-fe/public/images/account-settings.png" alt="Account Settings Page" width="1000"/>
</p>
<br/>
<p align="center">
  <strong>Tickets Charts</strong><br/>
  <img src="https://raw.githubusercontent.com/Jasmine-Afrem/DaemonView/main/frontend/daemonview-fe/public/images/tickets-charts.png" alt="Tickets Charts" width="1000"/>
</p>
<br/>
<p align="center">
  <strong>Tickets Charts - Extended View</strong><br/>
  <img src="https://raw.githubusercontent.com/Jasmine-Afrem/DaemonView/main/frontend/daemonview-fe/public/images/tickets-charts-extended.png" alt="Tickets Charts Extended View" width="1000"/>
</p>
<br/>
<p align="center">
  <strong>Drill-Down on Chart Data</strong><br/>
  <img src="https://raw.githubusercontent.com/Jasmine-Afrem/DaemonView/main/frontend/daemonview-fe/public/images/drilldown.png" alt="Chart Data Drill-Down" width="1000"/>
</p>
<br/>
<p align="center">
  <strong>Team-Specific Charts</strong><br/>
  <img src="https://raw.githubusercontent.com/Jasmine-Afrem/DaemonView/main/frontend/daemonview-fe/public/images/team-charts.png" alt="Team Charts" width="1000"/>
</p>
<br/>
<p align="center">
  <strong>Admin Page: User & Team Management</strong><br/>
  <img src="https://raw.githubusercontent.com/Jasmine-Afrem/DaemonView/main/frontend/daemonview-fe/public/images/admin-page.png" alt="Admin Page" width="1000"/>
  <br/><br/>
  <img src="https://raw.githubusercontent.com/Jasmine-Afrem/DaemonView/main/frontend/daemonview-fe/public/images/admin-page-members-in-a-team.png" alt="View Members in a Team" width="1000"/>
  <br/><br/>
  <img src="https://raw.githubusercontent.com/Jasmine-Afrem/DaemonView/main/frontend/daemonview-fe/public/images/add-members-in-a-team.png" alt="Add Members to a Team" width="1000"/>
</p>

---

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

Make sure you have the following software installed on your machine:
- [Node.js](https://nodejs.org/en/) (v16 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A running [MySQL](https://www.mysql.com/) server

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    > git clone https://github.com/Jasmine-Afrem/DaemonView.git
    > cd DaemonView
    ```

2.  **Install dependencies:**
    This will install both frontend and backend packages.
    ```bash
    > npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project. You can copy the example file:
    ```bash
    > cp .env.example .env
    ```
    Then, fill in the required variables in the `.env` file (e.g., database credentials, session secret).

4.  **Run the development server:**
    ```bash
    > npm run dev
    ```
    The application will be available at `http://localhost:3000`.
