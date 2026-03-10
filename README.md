# E-commerce Project

## Client Architecture
This application utilizes a **Thick Client** architecture. The Express backend serves strictly as a RESTful JSON API. The frontend uses plain JavaScript to fetch data asynchronously via the Fetch API, manages the application state locally, and dynamically mutates the DOM to render the UI. 

## API Routes

| Method | Route | Description | Payload / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/user/:id` | Retrieves user details including balance. | URL Param: `id` |
| `GET` | `/api/products` | Retrieves the catalog of all products. | None |
| `POST` | `/api/purchase` | Processes a purchase, decrementing balance and stock. | Body: `{ userId, productId }` |
| `POST` | `/api/admin/products` | Adds a new product to the catalog. | Body: `{ id, name, price, stock }` |
| `PUT` | `/api/admin/products/:id/stock` | Updates the stock level of an existing product. | URL Param: `id`, Body: `{ stock }` |
| `PUT` | `/api/admin/users/:id/balance` | Overrides a user's current credit balance. | URL Param: `id`, Body: `{ balance }` |

## Server-Side Validation Measures


To prevent invalid state mutations (e.g., negative balances or overselling inventory), the server enforces strict validation on the `/api/purchase` route before any data is modified:
1. **Entity Verification**: The server confirms both the `userId` and `productId` exist in the database.
2. **Stock Verification**: Evaluates `product.stock > 0`. If false, the transaction is rejected with a 400 Bad Request.
3. **Balance Verification**: Evaluates `user.balance >= product.price`. If the item costs more than the user possesses, the transaction is rejected with a 400 Bad Request.
4. **Synchronous Execution**: Because Node.js is single-threaded, these checks and the subsequent decrements occur synchronously, mitigating basic race conditions in this in-memory implementation.