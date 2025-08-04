# PharmaPro - Pharmacy Management System

A comprehensive pharmacy management application with modules for products, vendors, categories, units, POS, and order management.

## Features

### Core Modules
- **Product Management**: Complete CRUD operations with batch numbers and expiry dates
- **Vendor Management**: Track supplier information and contacts
- **Category Management**: Organize products by therapeutic categories
- **Unit Management**: Define measurement units for products
- **Order Management**: Handle customer orders with full lifecycle
- **Point of Sale (POS)**: Real-time sales interface with cart functionality

### Key Features
- **Stock Management**: Track inventory levels with low-stock alerts
- **Expiry Tracking**: Automatic alerts for expired or near-expiry products
- **Dashboard Analytics**: Real-time statistics and alerts
- **Search & Filter**: Advanced search across all modules
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technology Stack

### Backend
- **FastAPI**: Modern, fast Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **SQLite**: Lightweight database (easily upgradable to PostgreSQL)
- **Pydantic**: Data validation using Python type hints

### Frontend
- **HTML5/CSS3**: Modern web standards
- **JavaScript (ES6+)**: Dynamic functionality
- **Tailwind CSS**: Utility-first CSS framework
- **Font Awesome**: Icons and visual elements

## Installation & Setup

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Quick Start

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start Backend Server**
   ```bash
   python main.py
   ```
   The API will be available at: http://localhost:57945

3. **Start Frontend Server**
   ```bash
   python -m http.server 52186 --bind 0.0.0.0
   ```
   The frontend will be available at: http://localhost:52186

## API Documentation

### Base URL
```
http://localhost:57945
```

### Endpoints

#### Products
- `GET /products/` - List all products
- `POST /products/` - Create new product
- `GET /products/{id}` - Get product details
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product
- `GET /products/low-stock` - Get low stock products
- `GET /products/expired` - Get expired products

#### Categories
- `GET /categories/` - List all categories
- `POST /categories/` - Create new category
- `GET /categories/{id}` - Get category details
- `PUT /categories/{id}` - Update category
- `DELETE /categories/{id}` - Delete category

#### Vendors
- `GET /vendors/` - List all vendors
- `POST /vendors/` - Create new vendor
- `GET /vendors/{id}` - Get vendor details
- `PUT /vendors/{id}` - Update vendor
- `DELETE /vendors/{id}` - Delete vendor

#### Units
- `GET /units/` - List all units
- `POST /units/` - Create new unit
- `GET /units/{id}` - Get unit details
- `PUT /units/{id}` - Update unit
- `DELETE /units/{id}` - Delete unit

#### Orders
- `GET /orders/` - List all orders
- `POST /orders/` - Create new order
- `GET /orders/{id}` - Get order details
- `PUT /orders/{id}/status` - Update order status

#### POS
- `POST /pos/checkout` - Process POS checkout
- `GET /pos/products` - Get products for POS

## Usage Guide

### Getting Started

1. **Initial Setup**: Add categories, units, and vendors first
2. **Add Products**: Create products with batch numbers and expiry dates
3. **Monitor Stock**: Use dashboard to track low stock and expiry alerts
4. **Process Sales**: Use POS interface for quick sales
5. **Manage Orders**: Track all customer orders

### Dashboard Features
- **Real-time Statistics**: Product count, low stock alerts, expired items
- **Visual Alerts**: Color-coded warnings for critical items
- **Quick Actions**: Direct links to add new items

### Product Management
- **Batch Tracking**: Track products by batch numbers
- **Expiry Management**: Automatic expiry date tracking
- **Stock Levels**: Set minimum stock levels for alerts
- **Pricing**: Cost price and selling price tracking

### POS System
- **Quick Search**: Find products by name or generic name
- **Cart Management**: Add, remove, and adjust quantities
- **Discount & Tax**: Apply discounts and taxes
- **Multiple Payment Methods**: Cash, card, or custom methods

## Database Schema

### Products Table
- id (Primary Key)
- name, generic_name, brand
- category_id, unit_id, vendor_id (Foreign Keys)
- cost_price, selling_price
- stock_quantity, min_stock_level
- batch_number, expiry_date
- is_active (Boolean)

### Categories Table
- id (Primary Key)
- name, description

### Vendors Table
- id (Primary Key)
- name, contact_person, phone, email, address

### Units Table
- id (Primary Key)
- name, abbreviation

### Orders Table
- id (Primary Key)
- order_number, customer_name, customer_phone
- total_amount, discount, tax, grand_total
- payment_method, status, created_at

### Order Items Table
- id (Primary Key)
- order_id, product_id (Foreign Keys)
- quantity, unit_price, total_price

## Development

### Adding New Features
The modular architecture makes it easy to add new features:
- Backend: Add new models and endpoints in `main.py`
- Frontend: Add new sections in `index.html` and corresponding JavaScript in `app.js`

### Database Migration
To upgrade to PostgreSQL:
1. Update SQLALCHEMY_DATABASE_URL in `main.py`
2. Install PostgreSQL driver: `pip install psycopg2-binary`
3. Run database migrations

## Support

For issues or questions, please check:
1. Ensure both servers are running
2. Check browser console for JavaScript errors
3. Verify API endpoints are accessible
4. Check database file permissions

## License

This project is open source and available under the MIT License.