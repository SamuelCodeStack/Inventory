CREATE TABLE inventory (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    unit VARCHAR(255),
    quantity INTEGER DEFAULT 0,
	price DECIMAL(12, 2) DEFAULT 0.00,
    minimum_stock INTEGER DEFAULT 10,
	created_at DATE NOT NULL,
	updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order(
	po_id SERIAL PRIMARY KEY,	
	po_number VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL,
	contact BIGINT NOT NULL,
	company VARCHAR(255) NOT NULL,
	address VARCHAR(255) NOT NULL,
	total_price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(255) NOT NULL,
	remarks VARCHAR(255) NOT NULL,
	delivery_date DATE NOT NULL,
	status_date DATE NOT NULL,
	created_at DATE NOT NULL
);

CREATE TABLE item_order(
	po_id INT REFERENCES purchase_order(po_id) ON DELETE SET NULL,
	po_number VARCHAR(255) NOT NULL,
	item_id INT REFERENCES inventory(item_id) ON DELETE SET NULL,
	item_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    unit VARCHAR(255) NOT NULL,
	quantity INTEGER NOT NULL,
	price DECIMAL(12, 2) NOT NULL	
);


CREATE TABLE raw_materials (
    material_id SERIAL PRIMARY KEY,
    material_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    base_value NUMERIC(12, 2) DEFAULT 0.00,
    base_unit VARCHAR(20) NOT NULL, 
    qty_value NUMERIC(12, 2) DEFAULT 0.00,
    qty_unit VARCHAR(50) NOT NULL, 
    min_stock_threshold NUMERIC(12, 2) NOT NULL,
    min_stock_target VARCHAR(10) DEFAULT 'base', 
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    user_name VARCHAR(255), -- Stores name at time of action in case user is deleted
    action_type VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    table_name VARCHAR(100) NOT NULL, -- 'inventory', 'purchase_order', etc.
    record_id INT, -- The ID of the item affected
    description TEXT, -- Summary of what changed (e.g., "Updated quantity from 10 to 50")
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'Staff', -- Admin, Manager, Staff
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_otp VARCHAR(6),
    otp_expiry TIMESTAMP
);