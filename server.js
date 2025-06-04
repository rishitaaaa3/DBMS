const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'event_management'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to database');
});

// Routes

// 1. User Authentication
app.post('/api/register', async (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO Users (username, password, role) VALUES (?, ?, ?)';
    db.query(query, [username, hashedPassword, role], (err, result) => {
        if (err) {
            res.status(500).json({ error: 'Error registering user' });
            return;
        }
        res.json({ message: 'User registered successfully' });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password, role } = req.body;

    const query = 'SELECT * FROM Users WHERE username = ? AND role = ?';
    db.query(query, [username, role], async (err, results) => {
        if (err || results.length === 0) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const user = results[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        res.json({ message: 'Login successful', userId: user.user_id });
    });
});

// 2. Event Management
app.get('/api/events', (req, res) => {
    const query = `
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
        ORDER BY ed.event_date
    `;

    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Error fetching events' });
            return;
        }
        res.json(results);
    });
});

app.get('/api/event-types', (req, res) => {
    const query = 'SELECT * FROM Event_Types';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Error fetching event types' });
            return;
        }
        res.json(results);
    });
});

app.get('/api/artists/:eventTypeId', (req, res) => {
    const query = `
        SELECT DISTINCT a.* 
        FROM Artists a
        JOIN Events e ON a.artist_id = e.artist_id
        WHERE e.event_type_id = ?
    `;
    
    db.query(query, [req.params.eventTypeId], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Error fetching artists' });
            return;
        }
        res.json(results);
    });
});

// Get all artists
app.get('/api/artists', (req, res) => {
    const query = 'SELECT * FROM Artists ORDER BY artist_name';
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Error fetching artists' });
            return;
        }
        res.json(results);
    });
});

// Get venues for artist and event type
app.get('/api/venues/:artistId/:eventTypeId', (req, res) => {
    const query = `
        SELECT DISTINCT v.* 
        FROM Venues v
        JOIN Events e ON v.venue_id = e.venue_id
        WHERE e.artist_id = ? AND e.event_type_id = ?
    `;
    
    db.query(query, [req.params.artistId, req.params.eventTypeId], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Error fetching venues' });
            return;
        }
        res.json(results);
    });
});

// Get dates for event
app.get('/api/dates/:artistId/:eventTypeId/:venueId', (req, res) => {
    const query = `
        SELECT ed.* 
        FROM Event_Dates ed
        JOIN Events e ON ed.event_id = e.event_id
        WHERE e.artist_id = ? 
        AND e.event_type_id = ? 
        AND e.venue_id = ?
        AND ed.event_date >= CURDATE()
        ORDER BY ed.event_date
    `;
    
    db.query(query, [req.params.artistId, req.params.eventTypeId, req.params.venueId], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Error fetching dates' });
            return;
        }
        res.json(results);
    });
});

// Get ticket types for event
app.get('/api/tickets/:artistId/:eventTypeId/:venueId', (req, res) => {
    const query = `
        SELECT et.*, tc.category_name 
        FROM Event_Tickets et
        JOIN Events e ON et.event_id = e.event_id
        JOIN Ticket_Categories tc ON et.category_id = tc.category_id
        WHERE e.artist_id = ? 
        AND e.event_type_id = ? 
        AND e.venue_id = ?
        AND et.available_quantity > 0
    `;
    
    db.query(query, [req.params.artistId, req.params.eventTypeId, req.params.venueId], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Error fetching tickets' });
            return;
        }
        res.json(results);
    });
});

// 3. Booking Management
app.post('/api/bookings', (req, res) => {
    const { userId, eventDateId, ticketId, quantity, paymentMethod } = req.body;
    
    // Generate payment ID
    const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Start transaction
    db.beginTransaction(err => {
        if (err) {
            res.status(500).json({ error: 'Error starting transaction' });
            return;
        }

        // First insert payment
        const paymentQuery = 'INSERT INTO Payments (payment_id, user_id, payment_method, amount) VALUES (?, ?, ?, ?)';
        db.query(paymentQuery, [paymentId, userId, paymentMethod, 0], (err, result) => {
            if (err) {
                db.rollback(() => {
                    res.status(500).json({ error: 'Error processing payment' });
                });
                return;
            }

            // Then create booking
            const bookingQuery = 'INSERT INTO Bookings (payment_id, event_date_id, ticket_id, quantity) VALUES (?, ?, ?, ?)';
            db.query(bookingQuery, [paymentId, eventDateId, ticketId, quantity], (err, result) => {
                if (err) {
                    db.rollback(() => {
                        res.status(500).json({ error: 'Error creating booking' });
                    });
                    return;
                }

                // Commit transaction
                db.commit(err => {
                    if (err) {
                        db.rollback(() => {
                            res.status(500).json({ error: 'Error committing transaction' });
                        });
                        return;
                    }
                    res.json({ message: 'Booking successful', paymentId });
                });
            });
        });
    });
});

// 4. Merchandise Management
app.get('/api/merchandise/:artistId', (req, res) => {
    const query = 'SELECT * FROM Merchandise WHERE artist_id = ?';
    db.query(query, [req.params.artistId], (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Error fetching merchandise' });
            return;
        }
        res.json(results);
    });
});

app.post('/api/merchandise/order', (req, res) => {
    const { userId, merchId, quantity, paymentMethod, existingPaymentId } = req.body;
    
    // Use existing payment ID or generate new one
    const paymentId = existingPaymentId || `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Start transaction
    db.beginTransaction(err => {
        if (err) {
            res.status(500).json({ error: 'Error starting transaction' });
            return;
        }

        // If no existing payment ID, create new payment
        if (!existingPaymentId) {
            const paymentQuery = 'INSERT INTO Payments (payment_id, user_id, payment_method, amount) VALUES (?, ?, ?, ?)';
            db.query(paymentQuery, [paymentId, userId, paymentMethod, 0], (err, result) => {
                if (err) {
                    db.rollback(() => {
                        res.status(500).json({ error: 'Error processing payment' });
                    });
                    return;
                }
            });
        }

        // Create merchandise order
        const orderQuery = 'INSERT INTO Merchandise_Orders (payment_id, merch_id, quantity) VALUES (?, ?, ?)';
        db.query(orderQuery, [paymentId, merchId, quantity], (err, result) => {
            if (err) {
                db.rollback(() => {
                    res.status(500).json({ error: 'Error creating order' });
                });
                return;
            }

            // Commit transaction
            db.commit(err => {
                if (err) {
                    db.rollback(() => {
                        res.status(500).json({ error: 'Error committing transaction' });
                    });
                    return;
                }
                res.json({ message: 'Order successful', paymentId });
            });
        });
    });
});

// Get all merchandise
app.get('/api/merchandise', (req, res) => {
    const query = `
        SELECT m.*, a.artist_name 
        FROM Merchandise m
        JOIN Artists a ON m.artist_id = a.artist_id
        WHERE m.stock > 0
        ORDER BY a.artist_name, m.merch_name
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            res.status(500).json({ error: 'Error fetching merchandise' });
            return;
        }
        res.json(results);
    });
});

// Admin Routes
app.post('/api/admin/events', (req, res) => {
    const { artist, venue, eventType, ticketType, ticketPrice, numTickets, dates } = req.body;
    
    // Start transaction
    db.beginTransaction(async (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error starting transaction' });
        }

        try {
            // Insert or get artist
            let artistResult = await db.promise().query('INSERT INTO Artists (artist_name) VALUES (?) ON DUPLICATE KEY UPDATE artist_id=LAST_INSERT_ID(artist_id)', [artist]);
            const artistId = artistResult[0].insertId;

            // Insert or get venue
            let venueResult = await db.promise().query('INSERT INTO Venues (venue_name) VALUES (?) ON DUPLICATE KEY UPDATE venue_id=LAST_INSERT_ID(venue_id)', [venue]);
            const venueId = venueResult[0].insertId;

            // Get event type ID
            const [eventTypes] = await db.promise().query('SELECT event_type_id FROM Event_Types WHERE type_name = ?', [eventType]);
            if (eventTypes.length === 0) {
                throw new Error('Invalid event type');
            }
            const eventTypeId = eventTypes[0].event_type_id;

            // Insert event
            let eventResult = await db.promise().query(
                'INSERT INTO Events (event_type_id, artist_id, venue_id) VALUES (?, ?, ?)',
                [eventTypeId, artistId, venueId]
            );
            const eventId = eventResult[0].insertId;

            // Get ticket category ID
            const [ticketCategories] = await db.promise().query('SELECT category_id FROM Ticket_Categories WHERE category_name = ?', [ticketType]);
            if (ticketCategories.length === 0) {
                throw new Error('Invalid ticket category');
            }
            const categoryId = ticketCategories[0].category_id;

            // Insert ticket information
            await db.promise().query(
                'INSERT INTO Event_Tickets (event_id, category_id, price, total_quantity, available_quantity) VALUES (?, ?, ?, ?, ?)',
                [eventId, categoryId, ticketPrice, numTickets, numTickets]
            );

            // Insert event dates
            for (const date of dates) {
                await db.promise().query(
                    'INSERT INTO Event_Dates (event_id, event_date) VALUES (?, ?)',
                    [eventId, date]
                );
            }

            // Commit transaction
            await db.promise().commit();
            res.json({ message: 'Event added successfully', eventId });
        } catch (error) {
            await db.promise().rollback();
            res.status(500).json({ error: error.message || 'Error adding event' });
        }
    });
});

app.post('/api/admin/merchandise', (req, res) => {
    const { name, price, stock, artist } = req.body;
    
    // Start transaction
    db.beginTransaction(async (err) => {
        if (err) {
            return res.status(500).json({ error: 'Error starting transaction' });
        }

        try {
            // Insert or get artist
            let artistResult = await db.promise().query('INSERT INTO Artists (artist_name) VALUES (?) ON DUPLICATE KEY UPDATE artist_id=LAST_INSERT_ID(artist_id)', [artist]);
            const artistId = artistResult[0].insertId;

            // Insert merchandise
            await db.promise().query(
                'INSERT INTO Merchandise (artist_id, merch_name, price, stock) VALUES (?, ?, ?, ?)',
                [artistId, name, price, stock]
            );

            // Commit transaction
            await db.promise().commit();
            res.json({ message: 'Merchandise added successfully' });
        } catch (error) {
            await db.promise().rollback();
            res.status(500).json({ error: error.message || 'Error adding merchandise' });
        }
    });
});

// Start server
const PORT = 8080;
const server = app.listen(PORT, 'localhost', (err) => {
    if (err) {
        console.error('Error starting server:', err);
        return;
    }
    console.log(`Server is running on http://localhost:${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port.`);
    } else {
        console.error('Server error:', err);
    }
});

// Handle process termination gracefully
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    server.close(() => {
        console.log('Server terminated');
        process.exit(0);
    });
}); 