# Seller API Module

The Seller API module provides a programmatic interface for sellers to interact with the Vorex platform. It enables sellers to create and manage orders, check order status, and more through a secure API.

## Features

- Secure API key authentication
- API request logging and analytics
- Order management (create, list, view)
- Rate limiting (to be implemented)
- Comprehensive error handling

## API Endpoints

### Authentication

All API requests (except key management) must include an API key in the `X-API-Key` header.

Example:
```
X-API-Key: your_api_key_here
```

### Key Management

These endpoints are accessible via the web interface and require regular user authentication.

- `GET /seller-api/me` - Get your API key and usage statistics
- `GET /seller-api/history` - Get your API call history
- `POST /seller-api/generate-key` - Generate a new API key
- `POST /seller-api/revoke-key` - Revoke your current API key

### Order Management

These endpoints require API key authentication.

- `POST /seller-api/orders` - Create a new order
- `GET /seller-api/orders` - List all your orders
- `GET /seller-api/orders/:id` - Get a specific order

## Usage Examples

### Creating an Order

```
POST /seller-api/orders
X-API-Key: your_api_key_here
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "address": "123 Main St",
  "city": "Tunis",
  "governorate": "Tunis",
  "postalCode": "1000",
  "phone": "55123456",
  "items": [
    {
      "productId": "product_id_here",
      "quantity": 2,
      "price": 20.5,
      "weight": 1.5,
      "dimensions": "20x15x10",
      "packagingType": "Box",
      "fragile": false,
      "perishable": false
    }
  ]
}
```

### Listing Orders

```
GET /seller-api/orders
X-API-Key: your_api_key_here
```

### Getting an Order

```
GET /seller-api/orders/order_id_here
X-API-Key: your_api_key_here
```

## Security Considerations

- API keys are stored hashed in the database
- API keys should be kept secure and not shared
- API keys can be revoked at any time
- All API requests are logged for security and debugging purposes 