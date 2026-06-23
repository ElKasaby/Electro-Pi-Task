# Project & Task Management System API

A production-grade, secure RESTful API built with **Node.js**, **Express**, **TypeScript**, **TypeORM**, and **PostgreSQL** for managing projects and tasks, supporting secure authentication, role-based/ownership-based access control, input validation, and automated testing.

---

## Tech Stack

- **Runtime & Language**: Node.js (v20+) & TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (v15+)
- **ORM**: TypeORM (with CLI Migration support)
- **Security & Authorization**: bcryptjs, JSON Web Tokens (JWT)
- **Request Validation**: Zod
- **Documentation**: Swagger UI & OpenAPI 3.0, Postman Collection
- **Testing Framework**: Jest & Supertest (Unit + E2E integration tests)
- **Containerization**: Docker & Docker Compose

---

## Project Structure

```
├── API DOC/
│   ├── openapi.yaml                                # OpenAPI 3.0 Specification
│   ├── Project_Management_API.postman_collection    # Postman collection with token scripts
│   └── Testing_playbook.md                         # Detailed endpoint manual testing guide
├── src/
│   ├── config/                                     # TypeORM DataSource & DB creation
│   ├── controllers/                                # Request binders (Auth, Project, Task)
│   ├── entities/                                   # TypeORM schemas (User, Project, Task)
│   ├── errors/                                     # Custom AppError subclasses
│   ├── middlewares/                                # Auth, rate limit, logging, global errors
│   ├── routes/                                     # Express router endpoints
│   ├── services/                                   # Core business logic & database queries
│   ├── validations/                                # Zod schemas for input validation
│   ├── app.ts                                      # App configurations & Swagger UI mounting
│   └── server.ts                                   # Server entry point
├── test/
│   ├── unit/                                       # Mocked service tests
│   └── e2e/                                        # Database-backed Supertest E2E workflow
├── Dockerfile                                      # Optimized multi-stage Docker build
├── docker-compose.yml                              # PG DB & Node service orchestrator
├── jest.config.js                                  # Jest runner configuration
└── tsconfig.json                                   # TS compiler configuration
```

---

## How to Run Locally

### 1. Prerequisites
- **Node.js** (v20 or higher)
- **PostgreSQL** running locally on port `5432`

### 2. Installation
Clone this repository and install the dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):
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

### 4. Database Setup & Seeding
Run the database helper, migrations, and seeds:
```bash
# 1. Create the database in PostgreSQL if it doesn't exist
npx ts-node src/config/init_db.ts

# 2. Run TypeORM migrations to build the tables
npm run migration:run

# 3. Seed initial users, projects, and tasks
npm run db:seed
```

### 5. Running the Application
- **Development Mode** (with hot-reload):
  ```bash
  npm run dev
  ```
- **Production Mode** (compile and run):
  ```bash
  npm run build
  npm start
  ```

---

## Running with Docker Compose

To build and run the entire environment (database + application) inside isolated containers:

```bash
# Build and start services in the background
docker-compose up --build -d

# View running container logs
docker-compose logs -f

# Stop and remove containers and database volumes
docker-compose down -v
```
*The Express application will expose port `3000` to the host.*

---

## Running Automated Tests

A comprehensive suite of **12 Unit Tests** (testing business logic with repository mocks) and **10 E2E Integration Tests** (executing workflows on the real Postgres database) is provided:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests and generate coverage report
npm run test:coverage
```

---

## API Documentation & Postman

### 1. Interactive Swagger UI
When the server is running, navigate to:
```
http://localhost:3000/api-docs
```
You can inspect the OpenAPI specification and test endpoints directly from the browser by pasting your JWT Bearer token into the **Authorize** box.

### 2. Postman Collection
An automated collection is exported at `API DOC/Project_Management_API.postman_collection.json`. 
- **Auto-Token Capture**: Running the Login or Register endpoints automatically extracts the returned JWT and saves it as a collection variable (`{{accessToken}}`), authorizing all other protected endpoints automatically.

---

## Important Implementation Notes

- **Layered Architecture**: Standardized separation of concerns is maintained where routers manage paths, controllers handle HTTP bindings, services resolve business transactions, and entities define database structures.
- **Strict Validation**: Request validation is handled using **Zod** middleware to fail fast on invalid inputs (such as validating future dates on tasks or strict email patterns).
- **Error Interceptor**: A global error handling middleware interceptor maps TypeORM DB violations (unique constraints or UUID format errors) to clean JSON error responses, hiding system stack traces in production mode.
- **Cascading Deletes**: Relationships are set to `{ onDelete: 'CASCADE' }`. Deleting a project automatically cascade-deletes all its tasks.
- **Access Control Boundaries (RBAC / OBAC)**:
  - Users with the `member` role are strictly restricted: they can only view, update, or delete projects/tasks they own.
  - Users with the `admin` role bypass ownership controls and can manage all records across the system.
- **SQL Injection Prevention**: TypeORM Repository and QueryBuilder API parameterization are strictly followed to sanitize inputs.
- **Rate Limiting**: Configured `express-rate-limit` to allow maximum `100` requests per 15 minutes per IP address.
- **Security Headers**: Mounts `helmet` middleware setting strict HTTP headers.
