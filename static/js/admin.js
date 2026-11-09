// Admin dashboard logic
let adminOrders = [];
let adminProducts = [];
let activeTab = 'orders';

const STATUS_BADGES = {
    'yangi': { text: '🟢 Yangi', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'tayyorlanmoqda': { text: '🟡 Tayyorlanmoqda', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    'yetkazilmoqda': { text: '🚚 Yetkazilmoqda', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    'bajarildi': { text: '✅ Bajarildi', class: 'bg-gray-100 text-gray-700 border-gray-200' },
    'bekor_qilindi': { text: '❌ Bekor', class: 'bg-rose-50 text-rose-700 border-rose-200' }
};

const CATEGORY_NAMES = {
    'roses': '🌹 Atirgullar',
    'bouquets': '💐 Guldasta',
    'boxes': '🎁 Qutidagi',
    'tulips': '🌷 Lolalar',
    'plants': '🪴 Xona guli',
    'vip': '👑 VIP'
};

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadAdminStats();
    loadAdminOrders();
    loadAdminProducts();
});

function formatMoney(amount) {
    if (!amount && amount !== 0) return '0 so\'m';
    return Number(amount).toLocaleString('uz-UZ').replace(/,/g, ' ') + ' so\'m';
}

function switchTab(tab) {
    activeTab = tab;
    const ordersSec = document.getElementById('ordersSection');
    const productsSec = document.getElementById('productsSection');
    const tabOrders = document.getElementById('tabBtnOrders');
    const tabProducts = document.getElementById('tabBtnProducts');

    if (tab === 'orders') {
        ordersSec.classList.remove('hidden');
        productsSec.classList.add('hidden');
        tabOrders.className = "px-5 py-3 font-bold text-sm border-b-2 border-rose-600 text-rose-600 flex items-center gap-2";
        tabProducts.className = "px-5 py-3 font-bold text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 flex items-center gap-2";
        loadAdminOrders();
    } else {
        ordersSec.classList.add('hidden');
        productsSec.classList.remove('hidden');
        tabProducts.className = "px-5 py-3 font-bold text-sm border-b-2 border-rose-600 text-rose-600 flex items-center gap-2";
        tabOrders.className = "px-5 py-3 font-bold text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 flex items-center gap-2";
        loadAdminProducts();
    }
}

// Load Stats
async function loadAdminStats() {
    try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success) {
            document.getElementById('statRevenue').textContent = formatMoney(data.stats.total_revenue);
            document.getElementById('statOrdersCount').textContent = `${data.stats.total_orders} ta`;
            document.getElementById('statPendingOrders').textContent = `${data.stats.pending_orders} ta`;
            document.getElementById('statActiveProducts').textContent = `${data.stats.active_products} ta`;
        }
    } catch (err) {
        console.error("Statistikani olishda xatolik:", err);
    }
}

// Load Orders
async function loadAdminOrders() {
    const status = document.getElementById('orderStatusFilter')?.value || 'all';
    let url = '/api/orders';
    if (status !== 'all') url += `?status=${encodeURIComponent(status)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
            adminOrders = data.orders;
            renderAdminOrders(adminOrders);
        }
    } catch (err) {
        console.error("Buyurtmalarni yuklashda xatolik:", err);
    }
}

function searchOrders() {
    const q = document.getElementById('orderSearchInput')?.value.toLowerCase().trim() || '';
    if (!q) {
        renderAdminOrders(adminOrders);
        return;
    }
    const filtered = adminOrders.filter(o => 
        (o.order_number && o.order_number.toLowerCase().includes(q)) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
        (o.customer_phone && o.customer_phone.toLowerCase().includes(q))
    );
    renderAdminOrders(filtered);
}

function renderAdminOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-gray-400">Hech qanday buyurtma topilmadi</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = orders.map(o => {
        const dateStr = o.created_at ? o.created_at.split(' ')[0] : '';
        return `
            <tr class="hover:bg-gray-50/70 transition-colors">
                <td class="p-4 font-mono font-bold text-gray-900">${o.order_number}</td>
                <td class="p-4">
                    <div class="font-bold text-gray-800">${o.customer_name}</div>
                    <div class="text-gray-400 font-mono text-[11px]">${o.customer_phone}</div>
                </td>
                <td class="p-4">
                    <div class="font-medium text-gray-800">${o.recipient_name || o.customer_name}</div>
                    <div class="text-[11px] text-gray-400">${o.is_anonymous ? '🔒 Anonim' : (o.recipient_phone || o.customer_phone)}</div>
                </td>
                <td class="p-4">
                    <div class="font-medium text-gray-700">${o.delivery_date}</div>
                    <div class="text-gray-400 text-[11px]">${o.delivery_time}</div>
                </td>
                <td class="p-4">
                    <div class="font-extrabold text-rose-600">${formatMoney(o.total_amount)}</div>
                    <div class="text-[11px] uppercase text-gray-400">${o.payment_method}</div>
                </td>
                <td class="p-4">
                    <select onchange="updateOrderStatus(${o.id}, this.value)" class="text-xs font-semibold rounded-lg px-2 py-1 outline-none border cursor-pointer ${STATUS_BADGES[o.status]?.class || 'bg-gray-50'}">
                        <option value="yangi" ${o.status === 'yangi' ? 'selected' : ''}>🟢 Yangi</option>
                        <option value="tayyorlanmoqda" ${o.status === 'tayyorlanmoqda' ? 'selected' : ''}>🟡 Tayyorlanmoqda</option>
                        <option value="yetkazilmoqda" ${o.status === 'yetkazilmoqda' ? 'selected' : ''}>🚚 Yetkazilmoqda</option>
                        <option value="bajarildi" ${o.status === 'bajarildi' ? 'selected' : ''}>✅ Bajarildi</option>
                        <option value="bekor_qilindi" ${o.status === 'bekor_qilindi' ? 'selected' : ''}>❌ Bekor</option>
                    </select>
                </td>
                <td class="p-4 text-right">
                    <button onclick="viewOrderDetail(${o.id})" class="px-3 py-1.5 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 rounded-xl font-bold text-xs transition-colors">
                        Batafsil
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
            loadAdminStats();
            loadAdminOrders();
        }
    } catch (err) {
        console.error("Status yangilashda xatolik:", err);
    }
}

function viewOrderDetail(orderId) {
    const o = adminOrders.find(item => item.id === orderId);
    if (!o) return;

    document.getElementById('odNumber').textContent = `Buyurtma: ${o.order_number}`;
    document.getElementById('odCreatedAt').textContent = `Yaratilgan vaqti: ${o.created_at || ''}`;
    document.getElementById('odCustomerName').textContent = o.customer_name;
    document.getElementById('odCustomerPhone').textContent = o.customer_phone;
    document.getElementById('odRecipientName').textContent = o.recipient_name || o.customer_name;
    document.getElementById('odRecipientPhone').textContent = o.recipient_phone || o.customer_phone;
    document.getElementById('odIsAnonymous').textContent = o.is_anonymous ? "🔒 Anonim yetkazish so'ralgan" : "";
    document.getElementById('odAddress').textContent = o.delivery_address;
    document.getElementById('odDateTime').textContent = `${o.delivery_date} | ${o.delivery_time}`;

    const cardBox = document.getElementById('odCardBox');
    if (o.greeting_card_text || o.extra_chocolate || o.extra_toy) {
        cardBox.classList.remove('hidden');
        document.getElementById('odCardText').textContent = o.greeting_card_text ? `"${o.greeting_card_text}"` : 'Tabriknoma so\'zi yo\'q';
        let extras = [];
        if (o.extra_chocolate) extras.push("🍫 Shokolad qo'shilgan (+50,000)");
        if (o.extra_toy) extras.push("🧸 Ayiqcha qo'shilgan (+75,000)");
        document.getElementById('odExtras').textContent = extras.join(', ');
    } else {
        cardBox.classList.add('hidden');
    }

    const itemsList = document.getElementById('odItemsList');
    itemsList.innerHTML = (o.items || []).map(i => `
        <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-2">
                <img src="${i.image_url}" class="w-10 h-10 rounded-lg object-cover">
                <div>
                    <div class="font-bold text-gray-900">${i.name}</div>
                    <div class="text-[10px] text-gray-500">${i.sizeName || 'Standart'} &bull; ${i.qty} dona</div>
                </div>
            </div>
            <div class="font-extrabold text-rose-600">${formatMoney(i.price * i.qty)}</div>
        </div>
    `).join('');

    document.getElementById('odTotalAmount').textContent = formatMoney(o.total_amount);
    document.getElementById('orderDetailModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeOrderDetailModal() {
    document.getElementById('orderDetailModal')?.classList.add('hidden');
}

// Products Management
async function loadAdminProducts() {
    try {
        const res = await fetch('/api/products?sort=default');
        const data = await res.json();
        if (data.success) {
            adminProducts = data.products;
            renderAdminProducts(adminProducts);
            const badge = document.getElementById('adminProductCountBadge');
            if (badge) badge.textContent = adminProducts.length;
        }
    } catch (err) {
        console.error("Gullarni yuklashda xatolik:", err);
    }
}

function renderAdminProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    tbody.innerHTML = products.map(p => `
        <tr class="hover:bg-gray-50/70 transition-colors">
            <td class="p-4 flex items-center gap-3">
                <img src="${p.image_url}" class="w-12 h-12 rounded-xl object-cover">
                <div>
                    <div class="font-bold text-gray-900">${p.name}</div>
                    <div class="text-[10px] text-gray-400 max-w-xs truncate">${p.description}</div>
                </div>
            </td>
            <td class="p-4 font-medium">${CATEGORY_NAMES[p.category] || p.category}</td>
            <td class="p-4 font-bold text-gray-800">${formatMoney(p.price)}</td>
            <td class="p-4 font-bold text-rose-600">${p.discount_price ? formatMoney(p.discount_price) : '-'}</td>
            <td class="p-4 text-amber-500 font-bold">${p.rating} ★ (${p.review_count})</td>
            <td class="p-4">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${p.in_stock ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                    ${p.in_stock ? 'Mavjud' : 'Tugagan'}
                </span>
            </td>
            <td class="p-4 text-right space-x-2">
                <button onclick="editProduct(${p.id})" class="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors" title="Tahrirlash">
                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteProduct(${p.id})" class="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-rose-600 transition-colors" title="O'chirish">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');

    lucide.createIcons();
}

function openAddProductModal() {
    document.getElementById('productForm').reset();
    document.getElementById('pmId').value = '';
    document.getElementById('productModalTitle').textContent = "Yangi Gul Qo'shish";
    document.getElementById('productModal').classList.remove('hidden');
}

function editProduct(id) {
    const p = adminProducts.find(item => item.id === id);
    if (!p) return;

    document.getElementById('pmId').value = p.id;
    document.getElementById('pmName').value = p.name;
    document.getElementById('pmCategory').value = p.category;
    document.getElementById('pmPrice').value = p.price;
    document.getElementById('pmDiscountPrice').value = p.discount_price || '';
    document.getElementById('pmImageUrl').value = p.image_url;
    document.getElementById('pmDescription').value = p.description;
    document.getElementById('pmInStock').checked = p.in_stock === 1;
    document.getElementById('pmIsPopular').checked = p.is_popular === 1;
    document.getElementById('pmIsNew').checked = p.is_new === 1;

    document.getElementById('productModalTitle').textContent = "Gul Ma'lumotlarini Tahrirlash";
    document.getElementById('productModal').classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('productModal')?.classList.add('hidden');
}

async function saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('pmId').value;
    const isEdit = Boolean(id);

    const payload = {
        name: document.getElementById('pmName').value.trim(),
        category: document.getElementById('pmCategory').value,
        price: Number(document.getElementById('pmPrice').value),
        discount_price: document.getElementById('pmDiscountPrice').value ? Number(document.getElementById('pmDiscountPrice').value) : null,
        image_url: document.getElementById('pmImageUrl').value.trim(),
        description: document.getElementById('pmDescription').value.trim(),
        in_stock: document.getElementById('pmInStock').checked ? 1 : 0,
        is_popular: document.getElementById('pmIsPopular').checked ? 1 : 0,
        is_new: document.getElementById('pmIsNew').checked ? 1 : 0
    };

    const url = isEdit ? `/api/products/${id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            closeProductModal();
            loadAdminProducts();
            loadAdminStats();
        } else {
            alert(data.message || "Xatolik yuz berdi");
        }
    } catch (err) {
        console.error("Saqlashda xatolik:", err);
    }
}

async function deleteProduct(id) {
    if (!confirm("Haqiqatan ham ushbu gulni o'chirmoqchimisiz?")) return;
    try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            loadAdminProducts();
            loadAdminStats();
        }
    } catch (err) {
        console.error("O'chirishda xatolik:", err);
    }
}

