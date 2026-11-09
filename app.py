import json
import sqlite3
import os
from datetime import datetime
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
DB_PATH = os.path.join(os.path.dirname(__file__), 'flowers.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Products table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price INTEGER NOT NULL,
        discount_price INTEGER DEFAULT NULL,
        image_url TEXT NOT NULL,
        description TEXT NOT NULL,
        rating REAL DEFAULT 5.0,
        review_count INTEGER DEFAULT 1,
        in_stock INTEGER DEFAULT 1,
        is_popular INTEGER DEFAULT 0,
        is_new INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Orders table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        recipient_name TEXT,
        recipient_phone TEXT,
        is_anonymous INTEGER DEFAULT 0,
        delivery_address TEXT NOT NULL,
        delivery_date TEXT NOT NULL,
        delivery_time TEXT NOT NULL,
        greeting_card_text TEXT,
        extra_chocolate INTEGER DEFAULT 0,
        extra_toy INTEGER DEFAULT 0,
        payment_method TEXT NOT NULL,
        promo_code TEXT,
        subtotal INTEGER NOT NULL,
        discount INTEGER DEFAULT 0,
        delivery_fee INTEGER DEFAULT 0,
        total_amount INTEGER NOT NULL,
        status TEXT DEFAULT 'yangi', -- yangi, tayyorlanmoqda, yetkazilmoqda, bajarildi, bekor_qilindi
        items_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Reviews table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        author_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Check if products already exist
    cursor.execute('SELECT COUNT(*) as count FROM products')
    count = cursor.fetchone()['count']

    if count == 0:
        seed_products = [
            (
                "Qirolicha Atirgullari (51 dona)",
                "roses",
                790000,
                720000,
                "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
                "Yuqori sifatli Ekvador qizil atirgullari. Maxsus baxmal qadoq va atlas lenta bilan bezatilgan shohona guldasta.",
                4.9,
                48,
                1,
                1,
                0
            ),
            (
                "Nafis Bahor Simfoniyasi",
                "bouquets",
                520000,
                470000,
                "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
                "Pionlar, pushti ranunkulyus va evkalipt barglari uyg'unlashgan zamonaviy mualliflik kompozitsiyasi.",
                4.8,
                32,
                1,
                1,
                1
            ),
            (
                "Oq Marvarid Elegans",
                "roses",
                580000,
                None,
                "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
                "35 dona sof oq atirgullar va nozik gipsofila guldastasi. To'ylar va eng yorqin xotiralar uchun munosib sovg'a.",
                5.0,
                29,
                1,
                0,
                1
            ),
            (
                "Parij Orzulari Shlyapa Qutisida",
                "boxes",
                650000,
                590000,
                "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80",
                "Och pushti va krem rangli mayda atirgullar suv kapsulasi bo'lgan nafis hashamatli qutida. Gullar 10 kungacha so'lmaydi.",
                4.9,
                56,
                1,
                1,
                0
            ),
            (
                "Gollandiya Rang-barang Lolalari (35 dona)",
                "tulips",
                420000,
                380000,
                "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=80",
                "Gollandiyadan to'g'ridan-to'g'ri keltirilgan bahoriy, xushbo'y va yorqin lolalar majmuasi.",
                4.7,
                21,
                1,
                1,
                1
            ),
            (
                "Royal Moviy Gortenziya",
                "bouquets",
                490000,
                None,
                "https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=800&q=80",
                "Yirik moviy gortenziyalar, oq evstoma va ko'rkam yashil novdalar uyg'unligi.",
                4.9,
                17,
                1,
                0,
                0
            ),
            (
                "101 Qizil Atirgul Grand Luxe",
                "vip",
                1450000,
                1290000,
                "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80",
                "Haqiqiy muhabbat izhori uchun 101 dona 70-80 sm uzunlikdagi premium qizil atirgullar to'plami.",
                5.0,
                64,
                1,
                1,
                0
            ),
            (
                "Shirin Lahzalar Qutisi",
                "boxes",
                560000,
                499000,
                "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
                "Tirik pushti atirgullar, Ferrero Rocher shokoladlari va xushbo'y makaron shirinliklari bilan to'ldirilgan maxsus sovg'a qutisi.",
                4.8,
                38,
                1,
                1,
                0
            ),
            (
                "Qirollik Oq Orxideyasi (2 shoxli)",
                "plants",
                390000,
                None,
                "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80",
                "Tirik oq Falenopsis orxideyasi, sifatli sopol tuvakda. Uyingizga nafosat va uzoq muddatli go'zallik baxsh etadi.",
                4.9,
                19,
                1,
                0,
                1
            ),
            (
                "Quyoshli Tong",
                "bouquets",
                450000,
                395000,
                "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
                "Iliq shaftolirang va sarg'ish mayin atirgullar, romashkalar hamda maxsus dekorativ o'tlar bilan tayyorlangan guldasta.",
                4.7,
                14,
                1,
                0,
                0
            ),
            (
                "Monstera Deliciosa (Tirik xona o'simligi)",
                "plants",
                290000,
                None,
                "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80",
                "Yirik go'zal yashil bargli sog'lom tropik o'simlik. Xonadoningiz va ofisingiz havosini tozalaydi.",
                4.8,
                23,
                1,
                0,
                0
            ),
            (
                "Kelinchak Orzusi (To'y guldastasi)",
                "vip",
                680000,
                620000,
                "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
                "Kelinlar uchun mo'ljallangan nozik pionlar, oq atirgullar va ipak lentalar bilan bezatilgan to'y guldastasi.",
                5.0,
                41,
                1,
                1,
                0
            )
        ]
        
        cursor.executemany('''
        INSERT INTO products (name, category, price, discount_price, image_url, description, rating, review_count, in_stock, is_popular, is_new)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', seed_products)

        # Seed some initial reviews
        cursor.execute('''
        INSERT INTO reviews (product_id, author_name, rating, comment) VALUES
        (1, 'Malika Karimova', 5, 'Gullar juda yangi va chiroyli chiqdi! Onam tug''ilgan kunlariga juda quvondilar. Rahmat!'),
        (1, 'Jasur Bek', 5, 'Yetkazib berish juda tez va kuryer xushmuomala. Tavsiya qilaman!'),
        (2, 'Dilnoza Axmedova', 5, 'Guldasta xuddi rasmdagidek terilgan. Hidi butun xonani tutdi!'),
        (4, 'Sardor Rustamov', 5, 'Shlyapa qutisi juda qulay ekan, vaza qidirish shart bo''lmadi. 10 kun turdi.')
        ''')

    conn.commit()
    conn.close()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

# API Endpoints
@app.route('/api/products', methods=['GET'])
def get_products():
    category = request.args.get('category')
    search = request.args.get('search', '').strip().lower()
    sort = request.args.get('sort', 'default')
    min_price = request.args.get('min_price', type=int)
    max_price = request.args.get('max_price', type=int)

    query = 'SELECT * FROM products WHERE 1=1'
    params = []

    if category and category != 'all':
        query += ' AND category = ?'
        params.append(category)

    if search:
        query += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)'
        params.extend([f'%{search}%', f'%{search}%'])

    if min_price is not None:
        query += ' AND price >= ?'
        params.append(min_price)

    if max_price is not None:
        query += ' AND price <= ?'
        params.append(max_price)

    if sort == 'price_asc':
        query += ' ORDER BY COALESCE(discount_price, price) ASC'
    elif sort == 'price_desc':
        query += ' ORDER BY COALESCE(discount_price, price) DESC'
    elif sort == 'rating':
        query += ' ORDER BY rating DESC'
    elif sort == 'popular':
        query += ' ORDER BY is_popular DESC, rating DESC'
    else:
        query += ' ORDER BY id ASC'

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    products = [dict(row) for row in rows]
    conn.close()

    return jsonify({'success': True, 'count': len(products), 'products': products})

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    product = cursor.fetchone()
    
    if not product:
        conn.close()
        return jsonify({'success': False, 'message': 'Mahsulot topilmadi'}), 404

    cursor.execute('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC', (product_id,))
    reviews = [dict(r) for r in cursor.fetchall()]
    conn.close()

    p_dict = dict(product)
    p_dict['reviews'] = reviews
    return jsonify({'success': True, 'product': p_dict})

@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.json or {}
    name = data.get('name')
    category = data.get('category', 'bouquets')
    price = data.get('price')
    discount_price = data.get('discount_price') or None
    image_url = data.get('image_url')
    description = data.get('description', '')
    in_stock = 1 if data.get('in_stock', True) else 0
    is_popular = 1 if data.get('is_popular', False) else 0
    is_new = 1 if data.get('is_new', False) else 0

    if not name or not price or not image_url:
        return jsonify({'success': False, 'message': 'Nom, narx va rasm manzili majburiy!'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO products (name, category, price, discount_price, image_url, description, in_stock, is_popular, is_new)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (name, category, price, discount_price, image_url, description, in_stock, is_popular, is_new))
    product_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'id': product_id, 'message': 'Mahsulot muvaffaqiyatli qo\'shildi!'}), 201

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.json or {}
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM products WHERE id = ?', (product_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({'success': False, 'message': 'Mahsulot topilmadi'}), 404

    cursor.execute('''
    UPDATE products SET
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        price = COALESCE(?, price),
        discount_price = ?,
        image_url = COALESCE(?, image_url),
        description = COALESCE(?, description),
        in_stock = COALESCE(?, in_stock),
        is_popular = COALESCE(?, is_popular),
        is_new = COALESCE(?, is_new)
    WHERE id = ?
    ''', (
        data.get('name'),
        data.get('category'),
        data.get('price'),
        data.get('discount_price'),
        data.get('image_url'),
        data.get('description'),
        data.get('in_stock'),
        data.get('is_popular'),
        data.get('is_new'),
        product_id
    ))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Mahsulot yangilandi!'})

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM products WHERE id = ?', (product_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Mahsulot o\'chirildi!'})

@app.route('/api/orders', methods=['POST'])
def create_order():
    data = request.json or {}
    customer_name = data.get('customer_name')
    customer_phone = data.get('customer_phone')
    recipient_name = data.get('recipient_name') or customer_name
    recipient_phone = data.get('recipient_phone') or customer_phone
    is_anonymous = 1 if data.get('is_anonymous') else 0
    delivery_address = data.get('delivery_address')
    delivery_date = data.get('delivery_date') or datetime.now().strftime('%Y-%m-%d')
    delivery_time = data.get('delivery_time') or '14:00 - 16:00'
    greeting_card_text = data.get('greeting_card_text', '')
    extra_chocolate = 1 if data.get('extra_chocolate') else 0
    extra_toy = 1 if data.get('extra_toy') else 0
    payment_method = data.get('payment_method', 'click')
    promo_code = data.get('promo_code', '')
    subtotal = data.get('subtotal', 0)
    discount = data.get('discount', 0)
    delivery_fee = data.get('delivery_fee', 0)
    total_amount = data.get('total_amount', 0)
    items = data.get('items', [])

    if not customer_name or not customer_phone or not delivery_address or not items:
        return jsonify({'success': False, 'message': 'Iltimos, barcha majburiy maydonlarni to\'ldiring!'}), 400

    order_number = f"GL-{datetime.now().strftime('%y%m%d')}-{int(datetime.now().timestamp() % 10000):04d}"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO orders (
        order_number, customer_name, customer_phone, recipient_name, recipient_phone,
        is_anonymous, delivery_address, delivery_date, delivery_time, greeting_card_text,
        extra_chocolate, extra_toy, payment_method, promo_code, subtotal, discount,
        delivery_fee, total_amount, items_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        order_number, customer_name, customer_phone, recipient_name, recipient_phone,
        is_anonymous, delivery_address, delivery_date, delivery_time, greeting_card_text,
        extra_chocolate, extra_toy, payment_method, promo_code, subtotal, discount,
        delivery_fee, total_amount, json.dumps(items, ensure_ascii=False)
    ))
    conn.commit()
    order_id = cursor.lastrowid
    conn.close()

    return jsonify({
        'success': True,
        'order_id': order_id,
        'order_number': order_number,
        'total_amount': total_amount,
        'message': 'Buyurtmangiz muvaffaqiyatli qabul qilindi! Tez orada operator siz bilan bog\'lanadi.'
    }), 201

@app.route('/api/orders', methods=['GET'])
def get_orders():
    status = request.args.get('status')
    search = request.args.get('search')
    
    query = 'SELECT * FROM orders WHERE 1=1'
    params = []

    if status and status != 'all':
        query += ' AND status = ?'
        params.append(status)

    if search:
        query += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)'
        params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])

    query += ' ORDER BY created_at DESC'

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(query, params)
    orders = []
    for row in cursor.fetchall():
        order = dict(row)
        try:
            order['items'] = json.loads(order['items_json'])
        except Exception:
            order['items'] = []
        orders.append(order)
    conn.close()

    return jsonify({'success': True, 'orders': orders})

@app.route('/api/orders/<int:order_id>/status', methods=['PATCH'])
def update_order_status(order_id):
    data = request.json or {}
    new_status = data.get('status')
    valid_statuses = ['yangi', 'tayyorlanmoqda', 'yetkazilmoqda', 'bajarildi', 'bekor_qilindi']
    
    if new_status not in valid_statuses:
        return jsonify({'success': False, 'message': 'Noto\'g\'ri status!'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE orders SET status = ? WHERE id = ?', (new_status, order_id))
    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': f'Status "{new_status}" ga o\'zgartirildi!'})

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue FROM orders WHERE status != "bekor_qilindi"')
    stat_row = cursor.fetchone()
    
    cursor.execute('SELECT COUNT(*) as pending_count FROM orders WHERE status IN ("yangi", "tayyorlanmoqda", "yetkazilmoqda")')
    pending_row = cursor.fetchone()

    cursor.execute('SELECT COUNT(*) as products_count FROM products WHERE in_stock = 1')
    products_row = cursor.fetchone()

    cursor.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5')
    recent_orders = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return jsonify({
        'success': True,
        'stats': {
            'total_orders': stat_row['total_orders'],
            'total_revenue': stat_row['total_revenue'],
            'pending_orders': pending_row['pending_count'],
            'active_products': products_row['products_count'],
            'recent_orders': recent_orders
        }
    })

@app.route('/api/reviews', methods=['POST'])
def add_review():
    data = request.json or {}
    product_id = data.get('product_id')
    author_name = data.get('author_name', 'Mijoz')
    rating = int(data.get('rating', 5))
    comment = data.get('comment', '').strip()

    if not product_id or not comment:
        return jsonify({'success': False, 'message': 'Izoh matni majburiy!'}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO reviews (product_id, author_name, rating, comment)
    VALUES (?, ?, ?, ?)
    ''', (product_id, author_name, rating, comment))
    
    # Update average rating of product
    cursor.execute('SELECT AVG(rating) as avg_rating, COUNT(*) as cnt FROM reviews WHERE product_id = ?', (product_id,))
    stat = cursor.fetchone()
    if stat and stat['cnt'] > 0:
        cursor.execute('UPDATE products SET rating = ?, review_count = ? WHERE id = ?', 
                       (round(stat['avg_rating'], 1), stat['cnt'], product_id))

    conn.commit()
    conn.close()

    return jsonify({'success': True, 'message': 'Fikringiz uchun tashakkur!'})

if __name__ == '__main__':
    init_db()
    print("Gul do'koni ilovasi http://127.0.0.1:5000 manzilida ishga tushdi!")
    app.run(host='0.0.0.0', port=5000, debug=True)

