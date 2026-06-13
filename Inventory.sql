

CREATE TABLE inventory (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    category VARCHAR(20),
	brand VARCHAR(40) NOT NULL,
	supplier VARCHAR(40),
    unit VARCHAR(20),
    quantity INTEGER DEFAULT 0,
	price DECIMAL(12, 2) DEFAULT 0.00,
    minimum_stock INTEGER DEFAULT 10,
	created_at DATE NOT NULL,
	updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE brand (
    brand_id SERIAL PRIMARY KEY,
   	brand_name VARCHAR(40) NOT NULL,
	brand_color VARCHAR(7) DEFAULT '#1565c0'
);

CREATE TABLE supplier (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(100) NOT NULL,
    address TEXT,                           -- Binago sa TEXT para sa mahabang address
    contact_no VARCHAR(50),                 -- Sapat na ang 50 para sa phone/mobile numbers
    other_details TEXT                      -- Binago sa TEXT para sa flexible na mga tala
);

CREATE TABLE inventory_remarks (
    ir_id SERIAL PRIMARY KEY,
    -- Naka-reference sa inventory table
    item_id INTEGER REFERENCES inventory(item_id) ON DELETE CASCADE,
    remarks TEXT,                           -- Binago sa TEXT para hindi mag-error sa mahabang remarks
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Ginawang TIMESTAMPTZ para sa eksaktong log ng oras
);

CREATE TABLE inventory_ledger (
    printinv_id SERIAL PRIMARY KEY,
    -- Fixed: item_id references inventory(item_id)
    item_id INTEGER REFERENCES inventory(item_id) ON DELETE CASCADE,
    old_quantity INTEGER DEFAULT 0,
    new_quantity INTEGER DEFAULT 0,
    change_amount INTEGER DEFAULT 0, -- The difference (e.g., +10 or -5)
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE raw_materials (
    material_id SERIAL PRIMARY KEY,
    material_name VARCHAR(100) NOT NULL,
    category VARCHAR(15),
	unit VARCHAR(15),
    qty_ INTEGER DEFAULT 0,
	minimum_stock INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE raw_materials_ledger (
    ledger_id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES raw_materials(material_id) ON DELETE CASCADE,
    old_qty_value INTEGER DEFAULT 0,
    new_qty_value INTEGER DEFAULT 0,
    change_amount INTEGER DEFAULT 0,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE raw_materials_remarks (
    rm_id SERIAL PRIMARY KEY,
    -- Naka-reference sa inventory table
     material_id INTEGER REFERENCES raw_materials(material_id) ON DELETE CASCADE,
    remarks TEXT,                           -- Binago sa TEXT para hindi mag-error sa mahabang remarks
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Ginawang TIMESTAMPTZ para sa eksaktong log ng oras
	added_by VARCHAR(100)
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

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    -- 0: SuperAdmin, 1: Admin , 2: Office , 3: Production , 4 :Viewer
    user_level INTEGER DEFAULT 4, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_otp VARCHAR(6),
    otp_expiry TIMESTAMP
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

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
) WITH (OIDS=FALSE);

CREATE INDEX "IX_session_expire" ON "session" ("expire");