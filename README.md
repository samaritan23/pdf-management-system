# PDF-Management System

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
  - [User Registration and Email Verification](#user-registration-and-email-verification)
  - [PDF Management](#pdf-management)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [Live Project](#deployed-link)
## Introduction

The PDF-Management System is a comprehensive application designed to help users manage their PDF documents efficiently. The system allows users to upload, share, and comment on PDFs. It also includes email verification for user registration and pdf sharing.

## Features

- User Registration and Login
- Email Verification
- Upload and Share PDFs
- Comment on PDFs
- Manage User Access to PDFs
- Revoked Access Handling
- Email Notifications for Verification and PDF Sharing

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB

## Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/samaritan23/pdf-management-system-backend.git
    cd pdf-management-system
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up the environment variables
    ```bash
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/pdf_management
    JWT_SECRET=your_jwt_secret
    EMAIL=your_email@example.com
    CLIENT_ID=your_google_oauth_client_id
    CLIENT_SECRET=your_google_oauth_client_secret
    REFRESH_TOKEN=your_google_oauth_refresh_token
    ```
4. Run the application:

    ```bash
    npm start
    ```

## Usage

### User Registration and Email Verification

1.  **Sign Up**:

    - Endpoint: `POST /user/create`
    - Description: Registers a new user.
    - Payload:
      ```json
      {
        "username": "johndoe",
        "email": "johndoe@example.com",
        "password": "yourpassword",
        "firstName": "John",
        "lastName": "Doe",
      }
      ```
2.  **Verify Email**:

    - Endpoint: `GET /user/verify-email`
    - Description: Verifies user's email address.
    - Query Parameter: `token` (the token sent to the user's email)

3.  **Login User**:

    - Endpoint: `POST /user/login`
    - Description: Checks for valid user credentials to allow login.
      ```json
      {
        "emailOrUsername": "johndoe",
        "password": "yourpassword",
      }
      ```

### PDF Management

Note that all the endpoints here protected with Bearer token authentication so please make sure to add it to your headers

1.  **Upload Document**:

    - Endpoint: `POST /documents/upload`
    - Description: Uploads a new document.
    - Payload: Multipart/form-data with the document file.

    file: (upload file from local Machine)
    title: Example Title
    category: Example Category

2.  **Share Document By Public Link**:

    - Endpoint: `POST /documents/shareable-link/:documentId`
    - Description: Generated a sharable url of the document a document

3.  **Share Document via Email Invite**:
    - Endpoint: `POST /documents/grant-access/:documentId`
    - Description: Shares a link in the email which allows the user to view the file
    - Payload:

    ```json
    {

    	"userId":  "ObjectID(user)"
    	/* the userId is of the user with whom the file is being
    	shared with */

    }
    ```

4.  **Handle Open Shared Link**:
    - Endpoint: `GET /documents/open-link`
    - Description: Opens a shared document using a link or token.
    - Query Parameters: `token` (the verification token)

5.  **Get All User's Document**:
    - Endpoint: `GET documents/user-documents`
    - Description: Shows all the documents that the user owns and is shared with them.

6.  **Add Comments and Replies to Document**:
    - Endpoint: `POST documents/add-comment/:documentId`
    - Description: Allows users to add replies and comments to a document
    - Payload:

    ```json
        {
          "comment": "Hello comment"
        }
    ```

    ```json
        {
          "comment":  "Hello Reply",
          "parentCommentId":  "665c8b197b6e8b2664783ebd"
        }
    ```

 7. **Get All Comments and Replies for a Document**:
	 -	Endpoint: GET documents/replies/:documentID
	 -	Description: Get all the comments and replies for a document



## Error Handling

Global error handling is implemented using a global exception filter. Unique constraint errors are handled gracefully to provide user-friendly error messages.


## Contributing

1.  Fork the repository.
2.  Create your feature branch (git checkout -b feature/your-feature).
3.  Commit your changes (git commit -m 'Add some feature').
4.  Push to the branch (git push origin feature/your-feature).
5.  Open a pull request.

## Deployed link

The project is deployed [here](https://pdf-management-system-frontend.onrender.com). You can access the deployed version to see the live application.
