# Beyond Reviews

A full-stack web application for reviewing movies built with React, express, and MongoDB.

## 🚀 Features

-   User authentication with Google OAuth
-   Browse and filter movies by genre, year, and director
-   Rate and review movies
-   User profiles and watchlists
-   Messaging between users
-   Friend system and activity feeds

## 🛠️ Tech Stack

**Frontend:**

-   React 18 with TypeScript
-   React Router v7
-   Redux Toolkit for state management
-   Tailwind CSS for styling

**Backend:**

-   Node.js with express
-   TypeScript
-   Prisma ORM with MongoDB
-   Passport.js for authentication

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

-   [Node.js](https://nodejs.org/)
-   [MongoDB](https://www.mongodb.com/) (local installation or MongoDB Atlas account)
-   [Git](https://git-scm.com/)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone -b v2 https://github.com/osydorchuk89/beyond-reviews.git
cd beyond-reviews
```

### 2. Set Up the Server

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a .env file in the server directory and add the following environment variables:

-   `AWS_S3_ACCESS_KEY`
-   `AWS_S3_SECRET_ACCESS_KEY`
-   `DATABASE_URL`
-   `EXPRESS_SESSION_SECRET`
-   `GOOGLE_CLIENT_ID`
-   `GOOGLE_CLIENT_SECRET`

### 3. Set Up the Client

Open a new terminal, navigate to the client directory and install dependencies:

```bash
cd client
npm install
```

### 4. Run the Application

You need to run both the server and client simultaneously.

#### Terminal 1 - Start the Server:

```bash
cd server
npm run dev
```

The server will start on `http://localhost:8080`

#### Terminal 2 - Start the Client:

```bash
cd client
npm run dev
```

The server will start on `http://localhost:5173`

### 5. Access the Application

Open your browser and navigate to `http://localhost:5173` to use the application.
