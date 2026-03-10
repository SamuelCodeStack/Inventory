CREATE TABLE inventory (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50),
    quantity INTEGER DEFAULT 0,
    minimum_stock INTEGER DEFAULT 10
);

-- CREATE TABLE purchase_order(
-- 	po_id SERIAL PRIMARY KEY,	
-- 	po_number VARCHAR(255) NOT NULL,
--     customer_name VARCHAR(255) NOT NULL,
-- 	price INT NOT NULL,
--     status VARCHAR(50) NOT NULL,
-- 	created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE TABLE item_order(
-- 	po_id INT REFERENCES purchase_order(po_id) ON DELETE SET NULL,
-- 	po_number VARCHAR(255) NOT NULL,
--     customer_name VARCHAR(255) NOT NULL,
-- 	item_id INT REFERENCES inventory(item_id) ON DELETE SET NULL,
-- 	item_name VARCHAR(255) NOT NULL,
--     category VARCHAR(50) NOT NULL,
--     unit VARCHAR(50) NOT NULL,
-- 	quantity INT NOT NULL 
-- );



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