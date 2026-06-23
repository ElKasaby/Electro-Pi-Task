# Testing Playbook: Project & Task Management API

This testing playbook outlines the manual and automated validation procedures for verifying the functionality, security rules, and data constraints of the Project & Task Management system.

---

## Prerequisites & Setup

Ensure the application environment and database are initialized before testing.

1. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and verify the values:
   ```ini
   PORT=3000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=231100
   DB_NAME=taskmanager
   JWT_SECRET=electro_pi_backend_assessment_secure_secret_key_2026
   JWT_EXPIRES_IN=1h
   ```

2. **Initialize and Seed Database**:
   Run the following commands to create the database, execute migrations, and seed initial test accounts:
   ```bash
   # Create database if missing
   npx ts-node src/config/init_db.ts

   # Run migrations to create schema
   npm run migration:run

   # Seed default accounts (admin@taskmanager.com / member@taskmanager.com)
   npm run db:seed
   ```

3. **Start Application**:
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:3000`.

---

## Manual Endpoint Testing Guide

All API requests must use the base URL: `http://localhost:3000/api/v1`.

### 1. Authentication Flow

#### Register a Member User
- **Method & Path**: `POST /auth/register`
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "JanePassword123",
    "role": "member"
  }
  ```
- **Expected Response (`201 Created`)**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "uuid-here",
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "role": "member"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR..."
    }
  }
  ```

#### Login (Receive Access Token)
- **Method & Path**: `POST /auth/login`
- **Request Body**:
  ```json
  {
    "email": "member@taskmanager.com",
    "password": "MemberPass123"
  }
  ```
- **Expected Response (`200 OK`)**:
  - Extracts JWT token. Copy this token to use in the `Authorization: Bearer <token>` header for all subsequent protected endpoints.

---

### 2. Project Management

*All requests require `Authorization: Bearer <JWT_TOKEN>`*

#### Create a Project
- **Method & Path**: `POST /projects`
- **Request Body**:
  ```json
  {
    "title": "Backend Development",
    "description": "Building the main Express backend API",
    "status": "in_progress"
  }
  ```
- **Expected Response (`201 Created`)**:
  - Returns the newly created project entity containing its `id` (e.g. `p-uuid`).

#### Get Paginated Projects (Filtering & Sorting)
- **Method & Path**: `GET /projects?page=1&limit=10&sortBy=createdAt&sortOrder=DESC&status=in_progress`
- **Expected Response (`200 OK`)**:
  - Member role will return *only* their owned projects.
  - Admin role will return *all* projects.

#### Get Project by ID
- **Method & Path**: `GET /projects/:projectId`
- **Authorization Rule**: If a Member attempts to fetch a project owned by another user, the API will return a `403 Forbidden` response.

#### Update a Project
- **Method & Path**: `PATCH /projects/:projectId`
- **Request Body**:
  ```json
  {
    "status": "completed"
  }
  ```
- **Expected Response (`200 OK`)**

#### Delete a Project
- **Method & Path**: `DELETE /projects/:projectId`
- **Behavior**: Deleting a project automatically cascade-deletes all associated tasks.

---

### 3. Task Management

*All requests require `Authorization: Bearer <JWT_TOKEN>`*

#### Create a Task under a Project
- **Method & Path**: `POST /projects/:projectId/tasks`
- **Authorization Rule**: Member users must own the project (`projectId`) to add a task, otherwise it returns `403 Forbidden`.
- **Request Body**:
  ```json
  {
    "title": "Design Database Schema",
    "description": "Create users, projects, and tasks tables",
    "status": "pending",
    "priority": "high",
    "dueDate": "2026-06-30T12:00:00.000Z"
  }
  ```
- **Expected Response (`201 Created`)**

#### Get Tasks for a Project
- **Method & Path**: `GET /projects/:projectId/tasks?page=1&limit=5&sortBy=dueDate&sortOrder=ASC&status=pending&priority=high`
- **Expected Response (`200 OK`)**

#### Update a Task
- **Method & Path**: `PATCH /tasks/:taskId`
- **Request Body**:
  ```json
  {
    "status": "in_progress"
  }
  ```
- **Expected Response (`200 OK`)**

#### Delete a Task
- **Method & Path**: `DELETE /tasks/:taskId`
- **Expected Response (`200 OK`)**

---

## Automated Testing Collection & UI

### 1. Interactive Swagger Documentation UI
1. Start the server: `npm run dev`
2. Navigate to `http://localhost:3000/api-docs` in your web browser.
3. Click **Authorize** at the top right, enter your Bearer token, and test the endpoints directly from the UI.

### 2. Postman Collection
1. Open Postman.
2. Click **Import** and select the file located at: `API DOC/Project_Management_API.postman_collection.json`.
3. The collection is pre-configured with environment variables `{{baseUrl}}`, `{{accessToken}}`, `{{projectId}}`, and `{{taskId}}`.
4. Run the **Login** request. The test scripts will automatically capture the returned token and populate the `{{accessToken}}` variable.

---

## Automated Testing Runner

The codebase contains a full test suite with Unit tests (mock DB context) and E2E tests (real database execution).

- **Run All Tests**:
  ```bash
  npm test
  ```
- **Run Tests in Watch Mode**:
  ```bash
  npm run test:watch
  ```
- **Run Tests with Coverage Report**:
  ```bash
  npm run test:coverage
  ```

---

## Dockerized Execution Verification

To verify the system runs in isolation (containerized):

1. **Spin Up Containers**:
   ```bash
   docker-compose up --build -d
   ```
   *Note: This starts both the PostgreSQL database and the API backend. It maps port `3000` to your host machine.*
2. **Access Swagger UI**:
   Open `http://localhost:3000/api-docs` on your browser to verify connectivity.
3. **Shutdown Containers**:
   ```bash
   docker-compose down -v
   ```
