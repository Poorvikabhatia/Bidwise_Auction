from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from datetime import datetime, timedelta
import json

app = Flask(__name__)
app.secret_key = 'bidwise_secret_key_2026'

DATABASE = 'database.db'

# ==================== DATABASE INITIALIZATION ====================
def init_db():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  email TEXT UNIQUE NOT NULL,
                  password TEXT NOT NULL,
                  credits REAL DEFAULT 100,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Auctions table
    c.execute('''CREATE TABLE IF NOT EXISTS auctions
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  description TEXT,
                  starting_price REAL NOT NULL,
                  current_bid REAL,
                  highest_bidder_id INTEGER,
                  end_time TIMESTAMP NOT NULL,
                  status TEXT DEFAULT 'active',
                  winner_id INTEGER,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Bids table
    c.execute('''CREATE TABLE IF NOT EXISTS bids
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  auction_id INTEGER NOT NULL,
                  user_id INTEGER NOT NULL,
                  bid_amount REAL NOT NULL,
                  bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY(auction_id) REFERENCES auctions(id),
                  FOREIGN KEY(user_id) REFERENCES users(id))''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# ==================== DATABASE HELPERS ====================
def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def close_db(conn):
    conn.close()

# ==================== AUTHENTICATION ROUTES ====================
@app.route('/')
def index():
    """Home page - display all active auctions"""
    conn = get_db()
    c = conn.cursor()
    
    now = datetime.now().isoformat()
    
    # Get all active auctions (not yet ended)
    c.execute('''SELECT a.*, u.name as highest_bidder_name 
                 FROM auctions a 
                 LEFT JOIN users u ON a.highest_bidder_id = u.id
                 WHERE a.end_time > ? AND a.status = 'active'
                 ORDER BY a.created_at DESC''', (now,))
    auctions = c.fetchall()
    
    close_db(conn)
    
    auctions_list = []
    for auction in auctions:
        auctions_list.append({
            'id': auction['id'],
            'title': auction['title'],
            'description': auction['description'],
            'starting_price': auction['starting_price'],
            'current_bid': auction['current_bid'] or auction['starting_price'],
            'highest_bidder_name': auction['highest_bidder_name'],
            'end_time': auction['end_time']
        })
    
    return render_template('index.html', auctions=auctions_list, user=session.get('user'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not name or not email or not password:
            return render_template('register.html', error='All fields required')
        
        conn = get_db()
        c = conn.cursor()
        
        try:
            hashed_password = generate_password_hash(password)
            c.execute('INSERT INTO users (name, email, password, credits) VALUES (?, ?, ?, ?)',
                     (name, email, hashed_password, 100))
            conn.commit()
            close_db(conn)
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            close_db(conn)
            return render_template('register.html', error='Email already exists')
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        is_admin = request.form.get('is_admin') == 'on'
        
        if is_admin:
            # Admin login
            if email == 'admin' and password == 'admin123':
                session['user'] = {'id': 0, 'name': 'Admin', 'email': 'admin', 'is_admin': True}
                return redirect(url_for('admin_panel'))
            else:
                return render_template('login.html', error='Invalid admin credentials')
        else:
            # Regular user login
            conn = get_db()
            c = conn.cursor()
            c.execute('SELECT * FROM users WHERE email = ?', (email,))
            user = c.fetchone()
            close_db(conn)
            
            if user and check_password_hash(user['password'], password):
                session['user'] = {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'credits': user['credits'],
                    'is_admin': False
                }
                return redirect(url_for('dashboard'))
            else:
                return render_template('login.html', error='Invalid credentials')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout user"""
    session.clear()
    return redirect(url_for('index'))

# ==================== USER DASHBOARD ====================
@app.route('/dashboard')
def dashboard():
    """User dashboard"""
    if 'user' not in session or session['user'].get('is_admin'):
        return redirect(url_for('login'))
    
    user_id = session['user']['id']
    conn = get_db()
    c = conn.cursor()
    
    # Get user credits
    c.execute('SELECT credits FROM users WHERE id = ?', (user_id,))
    user_data = c.fetchone()
    credits = user_data['credits'] if user_data else 0
    
    # Get user's bid history
    c.execute('''SELECT b.id, b.bid_amount, b.bid_time, a.title, a.status
                 FROM bids b
                 JOIN auctions a ON b.auction_id = a.id
                 WHERE b.user_id = ?
                 ORDER BY b.bid_time DESC''', (user_id,))
    bid_history = c.fetchall()
    
    # Get active auctions
    now = datetime.now().isoformat()
    c.execute('''SELECT a.*, u.name as highest_bidder_name 
                 FROM auctions a 
                 LEFT JOIN users u ON a.highest_bidder_id = u.id
                 WHERE a.status = 'active'
                 ORDER BY a.end_time ASC''')
    auctions = c.fetchall()
    
    close_db(conn)
    
    auctions_list = []
    for auction in auctions:
        auctions_list.append({
            'id': auction['id'],
            'title': auction['title'],
            'description': auction['description'],
            'starting_price': auction['starting_price'],
            'current_bid': auction['current_bid'] or auction['starting_price'],
            'highest_bidder_name': auction['highest_bidder_name'],
            'end_time': auction['end_time']
        })
    
    return render_template('dashboard.html', 
                         user=session['user'], 
                         credits=credits, 
                         bid_history=bid_history,
                         auctions=auctions_list)

# ==================== BIDDING ====================
@app.route('/place_bid', methods=['POST'])
def place_bid():
    """Place a bid on an auction"""
    if 'user' not in session or session['user'].get('is_admin'):
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    user_id = session['user']['id']
    auction_id = request.json.get('auction_id')
    bid_amount = request.json.get('bid_amount')
    
    try:
        bid_amount = float(bid_amount)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Invalid bid amount'}), 400
    
    conn = get_db()
    c = conn.cursor()
    
    now = datetime.now().isoformat()
    
    # Get auction details
    c.execute('SELECT * FROM auctions WHERE id = ?', (auction_id,))
    auction = c.fetchone()
    
    if not auction:
        close_db(conn)
        return jsonify({'success': False, 'error': 'Auction not found'}), 404
    
    if auction['status'] != 'active':
        close_db(conn)
        return jsonify({'success': False, 'error': 'Auction is not active'}), 400
    
    if auction['end_time'] <= now:
        close_db(conn)
        return jsonify({'success': False, 'error': 'Auction has ended'}), 400
    
    current_bid = auction['current_bid'] or auction['starting_price']
    
    if bid_amount <= current_bid:
        close_db(conn)
        return jsonify({'success': False, 'error': 'Bid must be higher than current bid'}), 400
    
    # Check if bid is within last 30 seconds and extend time
    end_time = datetime.fromisoformat(auction['end_time'])
    time_left = (end_time - datetime.now()).total_seconds()
    
    if 0 < time_left <= 30:
        # Extend auction by 30 seconds (anti-sniping)
        new_end_time = (end_time + timedelta(seconds=30)).isoformat()
        c.execute('UPDATE auctions SET end_time = ? WHERE id = ?', (new_end_time, auction_id))
        conn.commit()
    
    # Place the bid
    c.execute('''INSERT INTO bids (auction_id, user_id, bid_amount)
                 VALUES (?, ?, ?)''', (auction_id, user_id, bid_amount))
    
    # Update auction current bid and highest bidder
    c.execute('''UPDATE auctions SET current_bid = ?, highest_bidder_id = ?
                 WHERE id = ?''', (bid_amount, user_id, auction_id))
    
    conn.commit()
    close_db(conn)
    
    return jsonify({
        'success': True,
        'message': 'Bid placed successfully',
        'new_bid': bid_amount,
        'time_extended': 0 < time_left <= 30
    })

# ==================== ADMIN PANEL ====================
@app.route('/admin')
def admin_panel():
    """Admin panel"""
    if 'user' not in session or not session['user'].get('is_admin'):
        return redirect(url_for('login'))
    
    conn = get_db()
    c = conn.cursor()
    
    now = datetime.now().isoformat()
    
    # Get all auctions
    c.execute('''SELECT a.*, u.name as highest_bidder_name
                 FROM auctions a
                 LEFT JOIN users u ON a.highest_bidder_id = u.id
                 ORDER BY a.created_at DESC''')
    auctions = c.fetchall()
    
    # Get all bids
    c.execute('''SELECT b.*, a.title, u.name as user_name
                 FROM bids b
                 JOIN auctions a ON b.auction_id = a.id
                 JOIN users u ON b.user_id = u.id
                 ORDER BY b.bid_time DESC''')
    all_bids = c.fetchall()
    
    # Get all users
    c.execute('SELECT id, name, email, credits FROM users ORDER BY created_at DESC')
    users = c.fetchall()
    
    close_db(conn)
    
    return render_template('admin.html', 
                         auctions=auctions, 
                         all_bids=all_bids, 
                         users=users,
                         user=session['user'])

@app.route('/admin/create_auction', methods=['POST'])
def create_auction():
    """Create a new auction (admin only)"""
    if 'user' not in session or not session['user'].get('is_admin'):
        return jsonify({'success': False, 'error': 'Not authorized'}), 401
    
    data = request.json
    title = data.get('title')
    description = data.get('description')
    starting_price = data.get('starting_price')
    duration_hours = float(data.get('duration_hours', 1))
    
    try:
        starting_price = float(starting_price)
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Invalid price'}), 400
    
    if not title or starting_price <= 0:
        return jsonify({'success': False, 'error': 'Invalid auction data'}), 400
    
    end_time = (datetime.now() + timedelta(hours=duration_hours)).isoformat()
    
    conn = get_db()
    c = conn.cursor()
    c.execute('''INSERT INTO auctions (title, description, starting_price, current_bid, end_time, status)
                 VALUES (?, ?, ?, ?, ?, ?)''',
             (title, description, starting_price, starting_price, end_time, 'active'))
    conn.commit()
    auction_id = c.lastrowid
    conn.close()
    
    return jsonify({
        'success': True,
        'message': 'Auction created successfully',
        'auction_id': auction_id
    })

@app.route('/admin/declare_winner/<int:auction_id>', methods=['POST'])
def declare_winner(auction_id):
    """Declare winner of an auction"""
    if 'user' not in session or not session['user'].get('is_admin'):
        return jsonify({'success': False, 'error': 'Not authorized'}), 401
    
    conn = get_db()
    c = conn.cursor()
    
    c.execute('SELECT * FROM auctions WHERE id = ?', (auction_id,))
    auction = c.fetchone()
    
    if not auction:
        close_db(conn)
        return jsonify({'success': False, 'error': 'Auction not found'}), 404
    
    if auction['highest_bidder_id'] is None:
        close_db(conn)
        return jsonify({'success': False, 'error': 'No bids placed on this auction'}), 400
    
    # Update auction status and winner
    c.execute('''UPDATE auctions SET status = ?, winner_id = ?
                 WHERE id = ?''', ('closed', auction['highest_bidder_id'], auction_id))
    
    # Deduct credits from winner
    winning_amount = auction['current_bid']
    c.execute('''UPDATE users SET credits = credits - ?
                 WHERE id = ?''', (winning_amount, auction['highest_bidder_id']))
    
    conn.commit()
    close_db(conn)
    
    return jsonify({
        'success': True,
        'message': 'Winner declared and credits deducted'
    })

# ==================== API ENDPOINTS ====================
@app.route('/api/auction/<int:auction_id>')
def get_auction(auction_id):
    """Get auction details via API"""
    conn = get_db()
    c = conn.cursor()
    
    c.execute('''SELECT a.*, u.name as highest_bidder_name
                 FROM auctions a
                 LEFT JOIN users u ON a.highest_bidder_id = u.id
                 WHERE a.id = ?''', (auction_id,))
    auction = c.fetchone()
    close_db(conn)
    
    if not auction:
        return jsonify({'error': 'Auction not found'}), 404
    
    return jsonify({
        'id': auction['id'],
        'title': auction['title'],
        'description': auction['description'],
        'starting_price': auction['starting_price'],
        'current_bid': auction['current_bid'],
        'highest_bidder_name': auction['highest_bidder_name'],
        'end_time': auction['end_time'],
        'status': auction['status']
    })

@app.route('/api/user/credits')
def get_user_credits():
    """Get user's current credits"""
    if 'user' not in session or session['user'].get('is_admin'):
        return jsonify({'error': 'Not authenticated'}), 401
    
    user_id = session['user']['id']
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT credits FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()
    close_db(conn)
    
    if user:
        return jsonify({'credits': user['credits']})
    return jsonify({'error': 'User not found'}), 404

# ==================== ERROR HANDLERS ====================
@app.errorhandler(404)
def not_found(error):
    return render_template('index.html'), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)