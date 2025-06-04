let role = "";
let currentUser = null;
let users = {}; // {username: {password, role}}
const ADMIN_SECRET = "hi"; // Change this to your desired secret key
let events = [];
let merchList = [];
let selectedDates = new Set(); // Store selected dates for current event
let currentPaymentId = null; // Store the current payment ID

// API base URL
const API_URL = 'http://localhost:8080/api';

// Function to generate a unique payment ID
function generatePaymentId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PAY-${timestamp}-${random}`;
}

// Set minimum date for date inputs
function setMinDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const minDate = `${yyyy}-${mm}-${dd}`;
    document.getElementById("eventDates").min = minDate;
}

// Call setMinDate when page loads
window.onload = function() {
    setMinDate();
    loadEventTypes();
    loadArtists();
    loadMerchandise(); // Load merchandise when page loads
    
    // Add event listeners for user dropdowns
    document.getElementById("userEventType").addEventListener("change", handleEventTypeChange);
    document.getElementById("userArtist").addEventListener("change", handleArtistChange);
    document.getElementById("userVenue").addEventListener("change", handleVenueChange);
    document.getElementById("userTicketType").addEventListener("change", updatePrice);
    
    // Add event listeners for merchandise
    document.getElementById("userMerch").addEventListener("change", updateMerchPrice);
    document.getElementById("merchQty").addEventListener("input", updateMerchPrice);
};

function selectRole(r) {
    role = r;
    document.getElementById("loginError").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
    if (role === "admin") {
        // Show secret key input, hide username/password and register button
        document.getElementById("adminSecret").classList.remove("hidden");
        document.getElementById("username").classList.add("hidden");
        document.getElementById("password").classList.add("hidden");
        document.getElementById("registerBtn").classList.add("hidden");
    } else if (role === "user") {
        // Show username/password and register button, hide secret key
        document.getElementById("adminSecret").classList.add("hidden");
        document.getElementById("username").classList.remove("hidden");
        document.getElementById("password").classList.remove("hidden");
        document.getElementById("registerBtn").classList.remove("hidden");
    }
}

async function register() {
    if (role !== "user") return alert("Only users can register.");
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
        alert("Username and password are required.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role: 'user' })
        });

        const data = await response.json();
        if (response.ok) {
            alert("User registered! Please login.");
            document.getElementById("username").value = "";
            document.getElementById("password").value = "";
        } else {
            alert(data.error || "Registration failed");
        }
    } catch (error) {
        alert("Error registering user");
    }
}

async function login() {
    if (role === "admin") {
        const secret = document.getElementById("adminSecret").value;
        if (secret === "hi") { // In production, this should be handled securely
            document.getElementById("login").classList.add("hidden");
            document.getElementById("admin").classList.remove("hidden");
            await loadEventTypes();
            await loadArtists(); // Load artists when admin logs in
        } else {
            showLoginError();
        }
    } else if (role === "user") {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role: 'user' })
            });

            const data = await response.json();
            if (response.ok) {
                currentUser = { id: data.userId, username };
                document.getElementById("login").classList.add("hidden");
                document.getElementById("user").classList.remove("hidden");
                loadEventTypes();
            } else {
                showLoginError();
            }
        } catch (error) {
            showLoginError();
        }
    }
}

function showLoginError() {
    document.getElementById("loginError").classList.remove("hidden");
}

function logout(panelId) {
    // Reset form fields and hide panels
    document.getElementById(panelId).classList.add("hidden");
    document.getElementById("login").classList.remove("hidden");
    document.getElementById("adminSecret").value = "";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("loginError").classList.add("hidden");
    currentUser = null;
    currentPaymentId = null;
    role = "";
}

function addDate() {
    const dateInput = document.getElementById("eventDates");
    const date = dateInput.value;
    if (date) {
        selectedDates.add(date);
        updateSelectedDatesDisplay();
        dateInput.value = "";
    }
}

function updateSelectedDatesDisplay() {
    const container = document.getElementById("selectedDates");
    container.innerHTML = "";
    selectedDates.forEach(date => {
        const dateSpan = document.createElement("span");
        dateSpan.className = "bg-blue-100 text-blue-800 px-2 py-1 rounded";
        dateSpan.textContent = date;
        container.appendChild(dateSpan);
    });
}

async function addEvent() {
    const artist = document.getElementById("artist").value;
    const venue = document.getElementById("venue").value;
    const eventType = document.getElementById("eventType").value;
    const ticketType = document.getElementById("ticketType").value;
    const ticketPrice = document.getElementById("ticketPrice").value;
    const numTickets = document.getElementById("numTickets").value;

    if (!artist || !venue || !eventType || !ticketType || !ticketPrice || !numTickets || selectedDates.size === 0) {
        alert("Please fill in all fields and select at least one date.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                artist,
                venue,
                eventType,
                ticketType,
                ticketPrice,
                numTickets,
                dates: Array.from(selectedDates)
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Event added successfully!");
            // Reset form
            document.getElementById("artist").value = "";
            document.getElementById("venue").value = "";
            document.getElementById("eventType").value = "";
            document.getElementById("ticketType").selectedIndex = 0;
            document.getElementById("ticketPrice").value = "";
            document.getElementById("numTickets").value = "";
            selectedDates.clear();
            updateSelectedDatesDisplay();
            
            // Reload artists list to include the new artist
            await loadArtists();
        } else {
            alert(data.error || "Error adding event");
        }
    } catch (error) {
        alert("Error adding event");
    }
}

async function addMerch() {
    const name = document.getElementById("merchName").value;
    const price = document.getElementById("merchPrice").value;
    const stock = document.getElementById("merchStock").value;
    const artist = document.getElementById("merchArtist").value;

    if (!name || !price || !stock || !artist) {
        alert("Please fill in all merchandise fields.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/merchandise`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                price,
                stock,
                artist
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Merchandise added successfully!");
            // Reset form
            document.getElementById("merchName").value = "";
            document.getElementById("merchPrice").value = "";
            document.getElementById("merchStock").value = "";
            document.getElementById("merchArtist").selectedIndex = 0;
            
            // Reload artists list
            await loadArtists();
        } else {
            alert(data.error || "Error adding merchandise");
        }
    } catch (error) {
        alert("Error adding merchandise");
    }
}

function populateArtistDropdowns() {
    const uniqueArtists = [...new Set(events.map(event => event.artist))];
    const artistDropdowns = ["merchArtist", "userArtist"];
    
    artistDropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        const currentValue = dropdown.value;
        dropdown.innerHTML = '<option disabled selected>Select Artist</option>';
        uniqueArtists.forEach(artist => {
            const option = document.createElement("option");
            option.value = artist;
            option.textContent = artist;
            dropdown.appendChild(option);
        });
        if (currentValue && uniqueArtists.includes(currentValue)) {
            dropdown.value = currentValue;
        }
    });

    // Also populate merchandise dropdown
    const merchDropdown = document.getElementById("userMerch");
    merchDropdown.innerHTML = '<option disabled selected>Select Merchandise</option>';
    merchList.forEach(merch => {
        const option = document.createElement("option");
        option.value = merch.name;
        option.textContent = `${merch.name} - ₹${merch.price}`;
        merchDropdown.appendChild(option);
    });

    // Populate event types first
    const eventTypeDropdown = document.getElementById("userEventType");
    const uniqueEventTypes = [...new Set(events.map(event => event.eventType))];
    eventTypeDropdown.innerHTML = '<option disabled selected>Select Event type</option>';
    uniqueEventTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        eventTypeDropdown.appendChild(option);
    });
}

// Load event types for the dropdown
async function loadEventTypes() {
    try {
        const response = await fetch(`${API_URL}/event-types`);
        const eventTypes = await response.json();
        
        const dropdown = document.getElementById("userEventType");
        dropdown.innerHTML = '<option disabled selected>Select Event type</option>';
        eventTypes.forEach(type => {
            const option = document.createElement("option");
            option.value = type.event_type_id;
            option.textContent = type.type_name;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading event types:', error);
    }
}

// Load artists for admin merchandise form
async function loadArtists() {
    try {
        const response = await fetch(`${API_URL}/artists`);
        const artists = await response.json();
        
        // Update admin merchandise artist dropdown
        const merchArtistDropdown = document.getElementById("merchArtist");
        if (merchArtistDropdown) {
            merchArtistDropdown.innerHTML = '<option disabled selected>Select Artist</option>';
            artists.forEach(artist => {
                const option = document.createElement("option");
                option.value = artist.artist_name;
                option.textContent = artist.artist_name;
                merchArtistDropdown.appendChild(option);
            });
        }

        // Also update the event artist input datalist if it exists
        const artistInput = document.getElementById("artist");
        const artistDatalist = document.getElementById("artistList");
        if (artistInput && !artistDatalist) {
            // Create datalist if it doesn't exist
            const datalist = document.createElement("datalist");
            datalist.id = "artistList";
            artistInput.setAttribute("list", "artistList");
            document.body.appendChild(datalist);
        }
        
        if (artistDatalist) {
            artistDatalist.innerHTML = '';
            artists.forEach(artist => {
                const option = document.createElement("option");
                option.value = artist.artist_name;
                artistDatalist.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading artists:', error);
    }
}

// Handle event type selection
async function handleEventTypeChange() {
    const eventTypeId = document.getElementById("userEventType").value;
    try {
        const response = await fetch(`${API_URL}/artists/${eventTypeId}`);
        const artists = await response.json();
        
        const dropdown = document.getElementById("userArtist");
        dropdown.innerHTML = '<option disabled selected>Select Artist</option>';
        artists.forEach(artist => {
            const option = document.createElement("option");
            option.value = artist.artist_id;
            option.textContent = artist.artist_name;
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading artists:', error);
    }
}

// Handle artist selection for user
async function handleArtistChange() {
    const artistId = document.getElementById("userArtist").value;
    const eventTypeId = document.getElementById("userEventType").value;
    
    try {
        // Get venues for this artist and event type
        const venueResponse = await fetch(`${API_URL}/venues/${artistId}/${eventTypeId}`);
        const venues = await venueResponse.json();
        
        const venueDropdown = document.getElementById("userVenue");
        venueDropdown.innerHTML = '<option disabled selected>Select venue</option>';
        venues.forEach(venue => {
            const option = document.createElement("option");
            option.value = venue.venue_id;
            option.textContent = venue.venue_name;
            venueDropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading venues:', error);
    }
}

// Handle venue selection
async function handleVenueChange() {
    const artistId = document.getElementById("userArtist").value;
    const eventTypeId = document.getElementById("userEventType").value;
    const venueId = document.getElementById("userVenue").value;
    
    try {
        // Get dates for this event
        const dateResponse = await fetch(`${API_URL}/dates/${artistId}/${eventTypeId}/${venueId}`);
        const dates = await dateResponse.json();
        
        const dateDropdown = document.getElementById("userEventDate");
        dateDropdown.innerHTML = '<option disabled selected>Select Date</option>';
        dates.forEach(date => {
            const option = document.createElement("option");
            option.value = date.event_date_id;
            option.textContent = new Date(date.event_date).toLocaleDateString();
            dateDropdown.appendChild(option);
        });

        // Get ticket types
        const ticketResponse = await fetch(`${API_URL}/tickets/${artistId}/${eventTypeId}/${venueId}`);
        const tickets = await ticketResponse.json();
        
        const ticketDropdown = document.getElementById("userTicketType");
        ticketDropdown.innerHTML = '<option disabled selected>Select Ticket Type</option>';
        tickets.forEach(ticket => {
            const option = document.createElement("option");
            option.value = ticket.ticket_id;
            option.textContent = ticket.category_name;
            option.dataset.price = ticket.price;
            ticketDropdown.appendChild(option);
        });

        // Reset price display
        document.getElementById("userPrice").textContent = '₹0';
    } catch (error) {
        console.error('Error loading event details:', error);
    }
}

function populateOptions() {
    const eventType = document.getElementById("userEventType").value;
    const artist = document.getElementById("userArtist").value;
    const artistEvents = events.filter(event => event.artist === artist && event.eventType === eventType);

    // Populate venues
    const venueDropdown = document.getElementById("userVenue");
    const uniqueVenues = [...new Set(artistEvents.map(event => event.venue))];
    venueDropdown.innerHTML = '<option disabled selected>Select venue</option>';
    uniqueVenues.forEach(venue => {
        const option = document.createElement("option");
        option.value = venue;
        option.textContent = venue;
        venueDropdown.appendChild(option);
    });

    // Populate dates
    const dateDropdown = document.getElementById("userEventDate");
    const allDates = artistEvents.flatMap(event => event.dates);
    const uniqueDates = [...new Set(allDates)];
    dateDropdown.innerHTML = '<option disabled selected>Select Date</option>';
    uniqueDates.forEach(date => {
        const option = document.createElement("option");
        option.value = date;
        option.textContent = date;
        dateDropdown.appendChild(option);
    });

    // Populate ticket types
    const ticketTypeDropdown = document.getElementById("userTicketType");
    const uniqueTicketTypes = [...new Set(artistEvents.map(event => event.ticketType))];
    ticketTypeDropdown.innerHTML = '<option disabled selected>Select Ticket Type</option>';
    uniqueTicketTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        ticketTypeDropdown.appendChild(option);
    });
}

function updatePrice() {
    const ticketTypeSelect = document.getElementById("userTicketType");
    const selectedOption = ticketTypeSelect.options[ticketTypeSelect.selectedIndex];
    if (selectedOption && selectedOption.dataset.price) {
        document.getElementById("userPrice").textContent = `₹${selectedOption.dataset.price}`;
    } else {
        document.getElementById("userPrice").textContent = '₹0';
    }
}

function updateMerchPrice() {
    const merchSelect = document.getElementById("userMerch");
    const quantity = document.getElementById("merchQty").value;
    const selectedOption = merchSelect.options[merchSelect.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.price && quantity) {
        const total = selectedOption.dataset.price * quantity;
        document.getElementById("merchTotal").textContent = `₹${total}`;
    } else {
        document.getElementById("merchTotal").textContent = '₹0';
    }
}

async function confirmBooking() {
    if (!currentUser) {
        alert("Please login first");
        return;
    }

    const eventDateId = document.getElementById("userEventDate").value;
    const ticketId = document.getElementById("userTicketType").value;
    const paymentMethod = document.getElementById("paymentMethod").value;
    const quantity = 1; // You can add quantity selection if needed

    if (!eventDateId || !ticketId || !paymentMethod) {
        alert("Please fill in all booking details.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                eventDateId,
                ticketId,
                quantity,
                paymentMethod
            })
        });

        const data = await response.json();
        if (response.ok) {
            currentPaymentId = data.paymentId;
            document.getElementById("paymentID").value = currentPaymentId;
            alert(`Booking confirmed! Your payment ID is: ${currentPaymentId}`);
        } else {
            alert(data.error || "Booking failed");
        }
    } catch (error) {
        alert("Error processing booking");
    }
}

async function confirmMerch() {
    if (!currentUser) {
        alert("Please login first");
        return;
    }

    const merchId = document.getElementById("userMerch").value;
    const quantity = parseInt(document.getElementById("merchQty").value);
    const paymentMethod = document.getElementById("merchPaymentMethod").value;

    if (!merchId || !quantity || !paymentMethod) {
        alert("Please fill in all merchandise purchase details.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/merchandise/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                merchId,
                quantity,
                paymentMethod,
                existingPaymentId: currentPaymentId
            })
        });

        const data = await response.json();
        if (response.ok) {
            if (!currentPaymentId) {
                currentPaymentId = data.paymentId;
            }
            document.getElementById("merchPaymentID").value = currentPaymentId;
            alert("Merchandise purchase confirmed!");
        } else {
            alert(data.error || "Purchase failed");
        }
    } catch (error) {
        alert("Error processing purchase");
    }
}

// Load merchandise for user
async function loadMerchandise() {
    try {
        const response = await fetch(`${API_URL}/merchandise`);
        const merchandise = await response.json();
        
        const merchDropdown = document.getElementById("userMerch");
        merchDropdown.innerHTML = '<option disabled selected>Select Merchandise</option>';
        
        // Group merchandise by artist
        const groupedMerch = merchandise.reduce((acc, item) => {
            if (!acc[item.artist_name]) {
                acc[item.artist_name] = [];
            }
            acc[item.artist_name].push(item);
            return acc;
        }, {});

        // Create optgroups for each artist
        Object.entries(groupedMerch).forEach(([artist, items]) => {
            const optgroup = document.createElement("optgroup");
            optgroup.label = artist;
            
            items.forEach(merch => {
                const option = document.createElement("option");
                option.value = merch.merch_id;
                option.textContent = `${merch.merch_name} - ₹${merch.price}`;
                option.dataset.price = merch.price;
                optgroup.appendChild(option);
            });
            
            merchDropdown.appendChild(optgroup);
        });
    } catch (error) {
        console.error('Error loading merchandise:', error);
    }
} 