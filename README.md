# E-commerce Storefront and Admin Dashboard

**Live Website:** [https://tpsi.rlarosa.com](https://tpsi.rlarosa.com)

## Client Architecture

This application utilizes a **Thick Client** architecture. The Node.js/Express backend functions strictly as a RESTful JSON API. The frontend relies on plain HTML, CSS, and JavaScript to fetch data asynchronously via the Fetch API, manage session state locally, and dynamically update the DOM.

## Core Features

* **Role-Based Access Control (RBAC):** Distinct interfaces and privileges for standard users and administrators.
* **Persistent Storage:** PostgreSQL database integration for durable state management of users, products, and balances.
* **Transaction Safety:** SQL transactions and row-level locking prevent race conditions during concurrent purchase requests.
* **Styled UI:** Unified CSS formatting for a clean, responsive presentation across both the storefront and admin dashboard.



## API Routes

| Method | Route | Description | Payload / Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/login` | Authenticates a user and returns profile data including role. | Body: `{ id, password }` |
| `GET` | `/api/user/:id` | Retrieves user details including current balance. | URL Param: `id` |
| `GET` | `/api/products` | Retrieves the catalog of all products. | None |
| `POST` | `/api/purchase` | Processes a transaction, decrementing balance and stock. | Body: `{ userId, productId }` |
| `POST` | `/api/admin/products` | Adds a new product to the database. | Body: `{ id, name, price, stock }` |
| `PUT` | `/api/admin/products/:id/stock` | Updates the stock level of an existing product. | URL Param: `id`, Body: `{ stock }` |
| `PUT` | `/api/admin/users/:id/balance` | Overrides a user's current credit balance. | URL Param: `id`, Body: `{ balance }` |

## Server-Side Validation Measures

To prevent invalid state mutations, such as negative balances, overselling inventory, or data corruption from race conditions, the server and database enforce strict validation on the `/api/purchase` route:

1.  **Entity Verification:** The system verifies that both the requested `userId` and `productId` exist.
2.  **Row-Level Locking:** The database executes `SELECT ... FOR UPDATE` within a `BEGIN ... COMMIT` transaction block to lock the specific user and product rows. This ensures concurrent requests queue sequentially and do not read stale data.
3.  **Stock Verification:** Evaluates `product.stock > 0`. If false, the transaction is rolled back and a 400 Bad Request is returned.
4.  **Balance Verification:** Evaluates `user.balance >= product.price`. String representations of numeric types are explicitly cast to floats to ensure accurate mathematical comparison. If insufficient, the transaction is rolled back and a 400 Bad Request is returned.
5.  **Atomic Commits:** Only after all programmatic checks pass are the database `UPDATE` commands executed and the transaction committed. If any error occurs, the entire transaction is rolled back.