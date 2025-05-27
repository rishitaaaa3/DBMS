-- Create Database
CREATE DATABASE helpdb;
USE helpdb;

-- 1. Users Table
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role ENUM('admin', 'user') NOT NULL
);

INSERT INTO Users (username, password, role) VALUES
('admin1', 'adminpass', 'admin'),
('john_doe', 'pass123', 'user'),
('alice', 'alicepass', 'user');

-- 2. Artists Table
CREATE TABLE Artists (
    artist_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO Artists (name) VALUES
('Coldplay'), ('Adele'), ('Ed Sheeran');

-- 3. Venues Table
CREATE TABLE Venues (
    venue_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

INSERT INTO Venues (name) VALUES
('Madison Square Garden'), 
('Sydney Opera House'), 
('Wembley Stadium');

-- 4. EventTypes Table
CREATE TABLE EventTypes (
    event_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO EventTypes (name) VALUES
('Music'), ('Dance'), ('Stand-up Comedy');

-- 5. TicketTypes Table
CREATE TABLE TicketTypes (
    ticket_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO TicketTypes (name) VALUES
('Premium'), ('Gold'), ('Standing');

-- 6. Events Table
CREATE TABLE Events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    artist_id INT,
    venue_id INT,
    event_type_id INT,
    ticket_type_id INT,
    price DECIMAL(10,2),
    total_tickets INT,
    FOREIGN KEY (artist_id) REFERENCES Artists(artist_id),
    FOREIGN KEY (venue_id) REFERENCES Venues(venue_id),
    FOREIGN KEY (event_type_id) REFERENCES EventTypes(event_type_id),
    FOREIGN KEY (ticket_type_id) REFERENCES TicketTypes(ticket_type_id)
);

INSERT INTO Events (artist_id, venue_id, event_type_id, ticket_type_id, price, total_tickets) VALUES
(1, 1, 1, 1, 150.00, 500),
(2, 2, 2, 2, 100.00, 300),
(3, 3, 1, 3, 50.00, 1000);

-- 7. EventDates Table
CREATE TABLE EventDates (
    date_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    event_date DATE,
    FOREIGN KEY (event_id) REFERENCES Events(event_id)
);

INSERT INTO EventDates (event_id, event_date) VALUES
(1, '2025-07-01'),
(1, '2025-07-02'),
(2, '2025-08-10'),
(3, '2025-09-15');

-- 8. Merchandise Table
CREATE TABLE Merchandise (
    merch_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL,
    artist_id INT,
    FOREIGN KEY (artist_id) REFERENCES Artists(artist_id)
);

INSERT INTO Merchandise (name, price, stock, artist_id) VALUES
('T-Shirt', 20.00, 200, 1),
('Poster', 10.00, 300, 2),
('Mug', 15.00, 100, 3);

-- 9. Bookings Table
CREATE TABLE Bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    event_id INT,
    date_id INT,
    ticket_type_id INT,
    amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    payment_id VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (event_id) REFERENCES Events(event_id),
    FOREIGN KEY (date_id) REFERENCES EventDates(date_id),
    FOREIGN KEY (ticket_type_id) REFERENCES TicketTypes(ticket_type_id)
);

INSERT INTO Bookings (user_id, event_id, date_id, ticket_type_id, amount, payment_method, payment_id) VALUES
(2, 1, 1, 1, 150.00, 'UPI', 'upi12345'),
(3, 2, 3, 2, 100.00, 'Credit Card', 'cc56789');

-- 10. MerchPurchases Table
CREATE TABLE MerchPurchases (
    purchase_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    merch_id INT,
    quantity INT,
    total_price DECIMAL(10,2),
    payment_method VARCHAR(50),
    payment_id VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (merch_id) REFERENCES Merchandise(merch_id)
);

INSERT INTO MerchPurchases (user_id, merch_id, quantity, total_price, payment_method, payment_id) VALUES
(2, 1, 2, 40.00, 'UPI', 'upi54321'),
(3, 2, 1, 10.00, 'Debit Card', 'dc98765');
