-- Event Management System Database Schema
-- Drop existing tables if they exist (in reverse order of creation to handle foreign key constraints)
DROP TABLE IF EXISTS Merchandise_Orders;
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS Merchandise;
DROP TABLE IF EXISTS Event_Tickets;
DROP TABLE IF EXISTS Event_Dates;
DROP TABLE IF EXISTS Events;
DROP TABLE IF EXISTS Ticket_Categories;
DROP TABLE IF EXISTS Venues;
DROP TABLE IF EXISTS Artists;
DROP TABLE IF EXISTS Event_Types;
DROP TABLE IF EXISTS Users;

-- Create Tables
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Should be hashed in production
    role VARCHAR(10) CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Event_Types (
    event_type_id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE Artists (
    artist_id INT PRIMARY KEY AUTO_INCREMENT,
    artist_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Venues (
    venue_id INT PRIMARY KEY AUTO_INCREMENT,
    venue_name VARCHAR(100) NOT NULL,
    capacity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Ticket_Categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    event_type_id INT,
    artist_id INT,
    venue_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_type_id) REFERENCES Event_Types(event_type_id),
    FOREIGN KEY (artist_id) REFERENCES Artists(artist_id),
    FOREIGN KEY (venue_id) REFERENCES Venues(venue_id),
    UNIQUE(event_type_id, artist_id, venue_id)
);

CREATE TABLE Event_Dates (
    event_date_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT,
    event_date DATE NOT NULL,
    FOREIGN KEY (event_id) REFERENCES Events(event_id),
    UNIQUE(event_id, event_date)
);

CREATE TABLE Event_Tickets (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT,
    category_id INT,
    price DECIMAL(10,2) NOT NULL,
    total_quantity INT NOT NULL,
    available_quantity INT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES Events(event_id),
    FOREIGN KEY (category_id) REFERENCES Ticket_Categories(category_id),
    UNIQUE(event_id, category_id)
);

CREATE TABLE Merchandise (
    merch_id INT PRIMARY KEY AUTO_INCREMENT,
    artist_id INT,
    merch_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES Artists(artist_id)
);

CREATE TABLE Payments (
    payment_id VARCHAR(50) PRIMARY KEY,
    user_id INT,
    payment_method VARCHAR(20) CHECK (payment_method IN ('UPI', 'Credit Card', 'Debit Card', 'Net Banking')),
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id VARCHAR(50),
    event_date_id INT,
    ticket_id INT,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES Payments(payment_id),
    FOREIGN KEY (event_date_id) REFERENCES Event_Dates(event_date_id),
    FOREIGN KEY (ticket_id) REFERENCES Event_Tickets(ticket_id)
);

CREATE TABLE Merchandise_Orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    payment_id VARCHAR(50),
    merch_id INT,
    quantity INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES Payments(payment_id),
    FOREIGN KEY (merch_id) REFERENCES Merchandise(merch_id)
);

-- Insert Sample Data

-- Insert Users
INSERT INTO Users (username, password, role) VALUES
('admin', 'admin123', 'admin'),
('john_doe', 'pass123', 'user'),
('jane_smith', 'pass456', 'user');

-- Insert Event Types
INSERT INTO Event_Types (type_name) VALUES
('Music'),
('Dance'),
('Comedy'),
('Theatre');

-- Insert Artists
INSERT INTO Artists (artist_name) VALUES
('AR Rahman'),
('Arijit Singh'),
('Zakir Hussain'),
('Vir Das'),
('Prateek Kuhad');

-- Insert Venues
INSERT INTO Venues (venue_name, capacity) VALUES
('Phoenix Mall Amphitheatre', 1000),
('National Stadium', 5000),
('City Convention Center', 2000),
('Town Hall', 800),
('Beach Resort', 1500);

-- Insert Ticket Categories
INSERT INTO Ticket_Categories (category_name) VALUES
('Premium'),
('Gold'),
('Standing');

-- Insert Events
INSERT INTO Events (event_type_id, artist_id, venue_id) VALUES
(1, 1, 1),  -- AR Rahman Music at Phoenix Mall
(1, 2, 2),  -- Arijit Singh Music at National Stadium
(2, 3, 3),  -- Zakir Hussain Dance at Convention Center
(3, 4, 4),  -- Vir Das Comedy at Town Hall
(1, 5, 5);  -- Prateek Kuhad Music at Beach Resort

-- Insert Event Dates
INSERT INTO Event_Dates (event_id, event_date) VALUES
(1, '2024-04-15'),
(1, '2024-04-16'),
(2, '2024-04-20'),
(3, '2024-05-01'),
(4, '2024-05-15'),
(5, '2024-06-01');

-- Insert Event Tickets
INSERT INTO Event_Tickets (event_id, category_id, price, total_quantity, available_quantity) VALUES
(1, 1, 5000.00, 100, 100),  -- AR Rahman Premium
(1, 2, 3000.00, 200, 200),  -- AR Rahman Gold
(1, 3, 1000.00, 300, 300),  -- AR Rahman Standing
(2, 1, 4500.00, 150, 150),  -- Arijit Singh Premium
(2, 2, 2500.00, 250, 250),  -- Arijit Singh Gold
(3, 1, 3500.00, 100, 100),  -- Zakir Hussain Premium
(4, 1, 2000.00, 200, 200),  -- Vir Das Premium
(5, 1, 3000.00, 100, 100);  -- Prateek Kuhad Premium

-- Insert Merchandise
INSERT INTO Merchandise (artist_id, merch_name, price, stock) VALUES
(1, 'AR Rahman T-Shirt', 999.00, 500),
(1, 'Concert Poster', 499.00, 1000),
(2, 'Arijit Singh Hoodie', 1499.00, 300),
(3, 'Tabla Miniature', 2999.00, 100),
(5, 'Album CD', 599.00, 1000);

-- Example Queries

-- 1. Get all upcoming events with their details
SELECT 
    e.event_id,
    et.type_name as event_type,
    a.artist_name,
    v.venue_name,
    ed.event_date,
    tc.category_name,
    et2.price,
    et2.available_quantity
FROM Events e
JOIN Event_Types et ON e.event_type_id = et.event_type_id
JOIN Artists a ON e.artist_id = a.artist_id
JOIN Venues v ON e.venue_id = v.venue_id
JOIN Event_Dates ed ON e.event_id = ed.event_id
JOIN Event_Tickets et2 ON e.event_id = et2.event_id
JOIN Ticket_Categories tc ON et2.category_id = tc.category_id
WHERE ed.event_date >= CURDATE()
ORDER BY ed.event_date;

-- 2. Get all merchandise for a specific artist
SELECT 
    a.artist_name,
    m.merch_name,
    m.price,
    m.stock
FROM Merchandise m
JOIN Artists a ON m.artist_id = a.artist_id
WHERE a.artist_name = 'AR Rahman';

-- 3. Get booking history for a user
SELECT 
    b.booking_id,
    a.artist_name,
    v.venue_name,
    ed.event_date,
    tc.category_name,
    b.quantity,
    et.price,
    p.payment_method,
    p.payment_id,
    p.payment_date
FROM Bookings b
JOIN Event_Dates ed ON b.event_date_id = ed.event_date_id
JOIN Events e ON ed.event_id = e.event_id
JOIN Artists a ON e.artist_id = a.artist_id
JOIN Venues v ON e.venue_id = v.venue_id
JOIN Event_Tickets et ON b.ticket_id = et.ticket_id
JOIN Ticket_Categories tc ON et.category_id = tc.category_id
JOIN Payments p ON b.payment_id = p.payment_id
JOIN Users u ON p.user_id = u.user_id
WHERE u.username = 'john_doe'
ORDER BY p.payment_date DESC;

-- 4. Get events by type
SELECT 
    et.type_name,
    a.artist_name,
    v.venue_name,
    ed.event_date
FROM Events e
JOIN Event_Types et ON e.event_type_id = et.event_type_id
JOIN Artists a ON e.artist_id = a.artist_id
JOIN Venues v ON e.venue_id = v.venue_id
JOIN Event_Dates ed ON e.event_id = ed.event_id
WHERE et.type_name = 'Music'
AND ed.event_date >= CURDATE()
ORDER BY ed.event_date;

-- 5. Get available tickets for an event
SELECT 
    a.artist_name,
    v.venue_name,
    ed.event_date,
    tc.category_name,
    et.price,
    et.available_quantity
FROM Event_Tickets et
JOIN Events e ON et.event_id = e.event_id
JOIN Artists a ON e.artist_id = a.artist_id
JOIN Venues v ON e.venue_id = v.venue_id
JOIN Event_Dates ed ON e.event_id = ed.event_id
JOIN Ticket_Categories tc ON et.category_id = tc.category_id
WHERE e.event_id = 1
AND ed.event_date >= CURDATE()
AND et.available_quantity > 0;

-- 6. Get merchandise orders for a payment
SELECT 
    m.merch_name,
    mo.quantity,
    m.price,
    (m.price * mo.quantity) as total_amount,
    mo.created_at
FROM Merchandise_Orders mo
JOIN Merchandise m ON mo.merch_id = m.merch_id
WHERE mo.payment_id = 'PAY-123456';

-- Triggers for maintaining available_quantity
DELIMITER //

CREATE TRIGGER after_booking_insert
AFTER INSERT ON Bookings
FOR EACH ROW
BEGIN
    UPDATE Event_Tickets
    SET available_quantity = available_quantity - NEW.quantity
    WHERE ticket_id = NEW.ticket_id;
END//

CREATE TRIGGER after_merch_order_insert
AFTER INSERT ON Merchandise_Orders
FOR EACH ROW
BEGIN
    UPDATE Merchandise
    SET stock = stock - NEW.quantity
    WHERE merch_id = NEW.merch_id;
END//

DELIMITER ; 