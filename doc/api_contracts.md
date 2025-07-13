# BP Writing Tool API Contracts

This document describes the REST API endpoints for the BP Writing Tool backend.

---

## Base URL

    http://localhost:8080/

---

## Endpoints

### 1. Create Document
- **POST** `/create_document/<template_type>`
  - `template_type`: `letter` or `diary`
  - **Request Body (JSON):**
    - For `letter` or `diary`, fields depend on the template, e.g.
      ```json
      {
        "content": "This is a test document",
        "filename": "test_doc" // optional
      }
      ```
  - **Response (200):**
    ```json
    { "doc_id": 1 }
    ```
  - **Error (400):**
    ```json
    { "error": "Invalid template type" }
    ```

### 2. Update Document
- **PUT** `/update_document/<template_type>/<doc_id>`
  - `template_type`: `letter` or `diary`
  - `doc_id`: integer document ID
  - **Request Body (JSON):**
    - Fields to update, e.g.
      ```json
      {
        "content": "Updated content",
        "filename": "test_doc"
      }
      ```
  - **Response (200):**
    ```json
    { "success": true }
    ```
  - **Error (400):**
    ```json
    { "error": "Invalid template type" }
    ```
  - **Error (404):**
    ```json
    { "error": "Document not found" }
    ```

### 3. Delete Document
- **DELETE** `/delete_document/<template_type>/<doc_id>`
  - `template_type`: `letter` or `diary`
  - `doc_id`: integer document ID
  - **Response (200):**
    ```json
    { "success": true }
    ```
  - **Error (400):**
    ```json
    { "error": "Invalid template type" }
    ```
  - **Error (404):**
    ```json
    { "error": "Document not found" }
    ```

### 4. Get Documents
- **GET** `/get_documents/<template_type>`
  - `template_type`: `letter` or `diary`
  - **Response (200):**
    ```json
    { "documents": [ ... ] }
    ```
  - **Error (400):**
    ```json
    { "error": "Invalid template type" }
    ```

### 5. Get Single Document
- **GET** `/get_document/<template_type>/<doc_id>`
  - `template_type`: `letter` or `diary`
  - `doc_id`: integer document ID
  - **Response (200):**
    ```json
    { "document": { ... } }
    ```
  - **Error (400):**
    ```json
    { "error": "Invalid template type" }
    ```
  - **Error (404):**
    ```json
    { "error": "Document not found" }
    ```

---

## Notes
- All endpoints expect and return JSON.
- For error handling, HTTP status codes 400 (bad request) and 404 (not found) are used where appropriate.
- Document IDs are integers.
- The actual fields for `letter` and `diary` may vary depending on your implementation.
- Update, delete, and get single document endpoints return 404 if the document is not found. 