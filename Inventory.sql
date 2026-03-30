CREATE TABLE inventory (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    unit VARCHAR(255),
    quantity INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 10,
	created_at DATE NOT NULL,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order(
	po_id SERIAL PRIMARY KEY,	
	po_number VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL,
	contact BIGINT NOT NULL,
	company VARCHAR(255) NOT NULL,
	address VARCHAR(255) NOT NULL,
	total_price INT NOT NULL,
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
	price INT NOT NULL
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CREATE TABLE activity_log (
--     activity_log_id SERIAL PRIMARY KEY,
--     item_id INT REFERENCES inventory(item_id) ON DELETE SET NULL,   
--     item_name VARCHAR(50),
--     quantity INT,
--     action_type VARCHAR(50) NOT NULL, -- e.g., 'Stock In', 'Stock Out', 'Deletion'
-- 	users_id INT REFERENCES users(users_id) ON DELETE SET NULL, -- THE FOREIGN KEY
--     handled_by VARCHAR(255), -- Keep this for a text snapshot of the name
--     remarks VARCHAR(255) NOT NULL,
--     logged_at TIMESTAMPTZ DEFAULT NOW()
-- );

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'Staff', -- Admin, Manager, Staff
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_token TEXT,
    reset_expires TIMESTAMP
);