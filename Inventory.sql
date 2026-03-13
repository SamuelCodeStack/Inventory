


CREATE TABLE inventory (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    unit VARCHAR(255),
    quantity INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 10
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
	created_at TIMESTAMPTZ DEFAULT NOW()
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

CREATE TABLE raw_materials(
	rm_id SERIAL PRIMARY KEY,
	material_name VARCHAR(255) NOT NULL,
    category VARCHAR(255)NOT NULL,
    unit VARCHAR(255)NOT NULL ,
    stock DECIMAl DEFAULT 0.0,
    min_stock DECIMAl DEFAULT 0.0
);

-- 1. Main Job Order Table
CREATE TABLE job_order (
    jo_id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    handle_by VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'Pending',
    quantity_produced INT DEFAULT 0, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Junction Table: Tracks what materials were used in a Job Order (BOM)
CREATE TABLE job_materials (
    jom_id SERIAL PRIMARY KEY,
    jo_id INT REFERENCES job_order(jo_id) ON DELETE CASCADE,
    rm_id INT NOT NULL, -- The ID from either raw_materials or material_leftovers
    material_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    unit VARCHAR(255) NOT NULL,
    used_stock DECIMAL(10, 2) NOT NULL, -- Changed from 'used-stock' (invalid syntax)
    source_type VARCHAR(50) NOT NULL -- 'Raw' or 'Leftover'
);

-- 3. Leftover / Scrap Inventory
CREATE TABLE material_leftovers (
    leftover_id SERIAL PRIMARY KEY,
    jo_id INT REFERENCES job_order(jo_id) ON DELETE SET NULL, -- The JO that created this scrap
    rm_id INT REFERENCES raw_materials(rm_id) ON DELETE SET NULL, -- Link back to the original Raw Material type
    material_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    unit VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Current available leftover
    type VARCHAR(50) NOT NULL, -- 'Scrap', 'Returned', 'Offcut'
    remarks VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
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


-- CREATE TABLE users (
--     users_id SERIAL PRIMARY KEY,
--     users_level INT NOT NULL, -- 1=Admin, 2=Staff, 3=Viewer
--     first_name VARCHAR(255) NOT NULL,
--     last_name VARCHAR(255) NOT NULL,
--     email VARCHAR(50) UNIQUE NOT NULL,
--     username VARCHAR(50) UNIQUE NOT NULL,
--     password TEXT NOT NULL,
--     contact_number BIGINT, -- Using BIGINT for phone numbers is safer
--     created_at TIMESTAMPTZ DEFAULT NOW(),
-- 	reset_token TEXT,
-- 	reset_expires TIMESTAMP
-- );