# Disaster Resource Coordination Platform

A web-based disaster-relief coordination platform designed to help shelters, coordinators, field officers, volunteers, donors, and the public coordinate essential resources during disasters.

The platform focuses on tracking relief resources such as food, water, medicines, and beds while providing a foundation for reliable disaster reporting, even when networks are unstable or traffic increases suddenly.

## Project Overview

Disaster Resource Coordination aims to improve communication and resource visibility between disaster-response teams. It combines a React frontend with a Node.js and Express backend and PostgreSQL for persistent report storage.

The project is being developed with a focus on API reliability, data consistency, input validation, and resilience under challenging network conditions.

## Current Implementation Status

- React frontend built with Vite.
- Node.js and Express backend.
- PostgreSQL database integration for field reports.
- REST API for creating, listing, and retrieving field reports.
- Idempotency-key support to prevent duplicate reports from repeated requests.
- Request validation and appropriate HTTP error responses.
- Photo upload API supporting PNG, JPEG, and WebP images.
- Photo metadata stored in PostgreSQL, with uploaded files stored on the server.
- Automated backend tests using Jest and Supertest.
- SOAP request and response examples and project design/integration documents.

**Note:** Authentication, role-based access control, donation payments, live map integration, and additional resilience mechanisms remain planned or require further integration and verification.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React 18, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| API Architecture | REST |
| File Uploads | Multer |
| Configuration | dotenv |
| Testing | Jest, Supertest |
| API Documentation | OpenAPI (YAML) |
| Version Control | Git and GitHub |

## Repository Structure

```text
disaster-resource-coordination/
├── README.md
├── docs/
│   └── brief.md
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── reports/
│   ├── errors.js
│   ├── models/
│   └── store.js
├── server/
│   ├── app.js
│   ├── db.js
│   ├── schema.sql
│   ├── reports/
│   │   ├── errors.js
│   │   ├── models/
│   │   ├── openapi.yaml
│   │   ├── photoStore.js
│   │   ├── photoUpload.js
│   │   └── store.js
│   ├── tests/
│   ├── package.json
│   └── partner.wsdl
└── tests/
```

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/amankumar242323-png/disaster-resource-coordination.git
cd disaster-resource-coordination
```

### 2. Configure the Database

Create a PostgreSQL database and configure the connection settings in `server/.env`.

Use the environment variable names expected by `server/db.js`. Keep database credentials private and never commit the `.env` file.

Apply the database schema using the PostgreSQL command-line tool:

```bash
psql -U YOUR_DB_USER -d YOUR_DB_NAME -f server/schema.sql
```

Replace `YOUR_DB_USER` and `YOUR_DB_NAME` with your PostgreSQL username and database name.

### 3. Start the Backend

Open a terminal in the project root:

```bash
cd server
npm ci
npm start
```

The backend starts using the command configured in `server/package.json`. Configure the database connection before starting the service.

### 4. Start the Frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local development URL displayed by Vite, normally:

http://localhost:5173

## Backend API

The currently implemented field-report endpoints include:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Check backend health |
| POST | `/reports` | Create a field report |
| GET | `/reports` | Retrieve field reports |
| GET | `/reports/:reportId` | Retrieve a specific report |
| POST | `/reports/:reportId/photos` | Upload a photo for a field report |

The photo upload endpoint accepts a multipart form-data field named `photo`. Supported image formats are PNG, JPEG, and WebP, with a maximum file size of 5 MiB.

The API also implements idempotency handling for report creation to reduce duplicate records when requests are retried.

Refer to `server/reports/openapi.yaml` for the API contract.

## Running Tests

Run the backend test suite from the server directory:

```bash
cd server
npm test
```

The current test suite covers health checks, report creation and retrieval, idempotency, validation errors, concurrent requests, and photo uploads.

## Design Goals

- **Resource visibility:** Improve coordination and tracking of essential relief resources.
- **Reliable reporting:** Handle repeated requests without creating duplicate reports.
- **Data consistency:** Persist field reports and photo metadata in PostgreSQL.
- **Input validation:** Reject invalid requests and unsupported image uploads.
- **Network resilience:** Build toward safer retries, timeouts, and reliable operation under unstable connectivity.
- **Extensibility:** Support future integrations for maps, notifications, authentication, and donation workflows.

## Planned Enhancements

- Authentication and role-based authorization.
- Complete resource inventory and transfer management.
- Shelter and resource availability tracking.
- Live map integration and location-based search.
- Donation and payment integration.
- Offline-first workflows and synchronization.
- Rate limiting, correlation IDs, structured logging, and external-service resilience.
- Deployment and production database configuration.

## Documentation

- [Project Brief](docs/brief.md)
- [Frontend Documentation](client/README.md)
- [OpenAPI Specification](server/reports/openapi.yaml)
- [Database Schema](server/schema.sql)
- [SOAP Request and Response Examples](server/)

## Contributing

Contributions, suggestions, and improvements are welcome. Please test changes locally and avoid committing secrets, environment files, uploaded test data, or generated dependencies.

## License

A license has not yet been specified for this repository.
