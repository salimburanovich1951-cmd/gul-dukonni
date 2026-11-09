// State management
let allProducts = [];
let currentCategory = 'all';
let cart = JSON.parse(localStorage.getItem('gulzor_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('gulzor_wishlist') || '[]');
let promoDiscountPercent = 0;
let appliedPromoCode = '';

// Quick View State
let qvProduct = null;
let qvSizeMultiplier = 1;
let qvSizeName = 'Standart';
let qvCount = 1;

// Category translations
const CATEGORY_NAMES = {
    'all': 'Barchasi',
    'roses': 'Atirgullar',
    'bouquets': 'Mualliflik guldastalari',
    'boxes': 'Shlyapa qutidagi gullar',
    'tulips': 'Gollandiya lolalari',
    'plants': 'Xona o\'simliklari',
    'vip': 'VIP & 101 Atirgul'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    updateCartBadges();
    updateWishlistBadges();
    loadProducts();

    // Set today's date in checkout date picker
    const dateInput = document.getElementById('orderDeliveryDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.min = today;
    }

    // Search input live handler
    const searchInput = document.getElementById('searchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => loadProducts(), 300));
    }
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', debounce(() => {
            if (searchInput) searchInput.value = mobileSearchInput.value;
            loadProducts();
        }, 300));
    }
});

// Format currency
function formatMoney(amount) {
    if (!amount && amount !== 0) return '0 so\'m';
    return Number(amount).toLocaleString('uz-UZ').replace(/,/g, ' ') + ' so\'m';
}

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Fetch products from server
async function loadProducts() {
    const sort = document.getElementById('sortSelect')?.value || 'default';
    const search = document.getElementById('searchInput')?.value || '';

    let url = `/api/products?sort=${encodeURIComponent(sort)}`;
    if (currentCategory !== 'all') {
        url += `&category=${encodeURIComponent(currentCategory)}`;
    }
    if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
            allProducts = data.products;
            renderProducts(allProducts);
            const countLabel = document.getElementById('productCountLabel');
            if (countLabel) {
                countLabel.textContent = `${data.products.length} ta guldasta`;
            }
        }
    } catch (err) {
        console.error("Gullarni yuklashda xatolik:", err);
    }
}

// Render Products Grid
function renderProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center text-gray-500 bg-white rounded-3xl border border-gray-100 p-8">
                <i data-lucide="flower2" class="w-12 h-12 text-rose-300 mx-auto mb-3"></i>
                <h4 class="font-bold text-gray-700 text-base">Guldastalar topilmadi</h4>
                <p class="text-xs text-gray-400 mt-1">Boshqa toifa yoki qidiruv so'zini sinab ko'ring</p>
                <button onclick="setCategory('all')" class="mt-4 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors">
                    Barcha gullarni ko'rsatish
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    grid.innerHTML = products.map(p => {
        const isFav = wishlist.includes(p.id);
        const currentPrice = p.discount_price || p.price;
        const discountBadge = p.discount_price ? `
            <span class="bg-rose-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                -${Math.round((1 - p.discount_price / p.price) * 100)}% Chegirma
            </span>` : '';
        const popularBadge = p.is_popular ? `
            <span class="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                <i data-lucide="flame" class="w-3 h-3"></i> Xit
            </span>` : '';
        const newBadge = p.is_new ? `
            <span class="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Yangi
            </span>` : '';

        return `
            <div class="flower-card bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm flex flex-col justify-between group">
                <!-- Image Wrapper -->
                <div class="relative overflow-hidden aspect-square bg-gray-50">
                    <img src="${p.image_url}" alt="${p.name}" loading="lazy"
                        class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500">
                    
                    <!-- Top Badges -->
                    <div class="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                        ${discountBadge}
                        ${popularBadge}
                        ${newBadge}
                    </div>

                    <!-- Wishlist Button -->
                    <button onclick="toggleWishlist(${p.id}, event)" 
                        class="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-rose-600 shadow-md transition-transform active:scale-90"
                        title="Sevimlilarga qo'shish">
                        <i data-lucide="heart" class="w-5 h-5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}"></i>
                    </button>

                    <!-- Quick View Overlay Button -->
                    <button onclick="openQuickView(${p.id})" 
                        class="absolute bottom-3 left-3 right-3 py-2 bg-white/95 backdrop-blur-md rounded-xl text-gray-800 text-xs font-bold shadow-md opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center justify-center gap-1.5 hover:bg-rose-50 hover:text-rose-600">
                        <i data-lucide="eye" class="w-4 h-4"></i>
                        <span>Tezkor ko'rish</span>
                    </button>
                </div>

                <!-- Info Body -->
                <div class="p-5 flex-1 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-1.5">
                            <span>${CATEGORY_NAMES[p.category] || p.category}</span>
                            <div class="flex items-center gap-1 text-amber-500 font-bold">
                                <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400"></i>
                                <span>${p.rating}</span>
                                <span class="text-gray-400 text-[10px]">(${p.review_count})</span>
                            </div>
                        </div>

                        <h3 class="font-serif font-bold text-gray-900 text-base leading-snug line-clamp-1 group-hover:text-rose-600 transition-colors cursor-pointer" onclick="openQuickView(${p.id})">
                            ${p.name}
                        </h3>

                        <p class="text-xs text-gray-500 line-clamp-2 mt-1.5 font-light leading-relaxed">
                            ${p.description}
                        </p>
                    </div>

                    <!-- Price & CTA -->
                    <div class="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
                        <div>
                            <div class="text-base font-extrabold text-rose-600">
                                ${formatMoney(currentPrice)}
                            </div>
                            ${p.discount_price ? `
                                <div class="text-[11px] text-gray-400 line-through">
                                    ${formatMoney(p.price)}
                                </div>
                            ` : ''}
                        </div>

                        <button onclick="addToCartById(${p.id})" 
                            class="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                            title="Savatga qo'shish">
                            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                            <span>Savatga</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// Category filter
function setCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.cat-pill').forEach(btn => {
        if (btn.dataset.cat === cat) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    loadProducts();
}

// Wishlist Logic
function toggleWishlist(id, e) {
    if (e) e.stopPropagation();
    const idx = wishlist.indexOf(id);
    if (idx > -1) {
        wishlist.splice(idx, 1);
        showToast("Sevimlilardan o'chirildi", "info");
    } else {
        wishlist.push(id);
        showToast("Sevimlilarga qo'shildi! ❤️", "success");
    }
    localStorage.setItem('gulzor_wishlist', JSON.stringify(wishlist));
    updateWishlistBadges();
    renderProducts(allProducts);
}

function updateWishlistBadges() {
    const badge = document.getElementById('wishlistCount');
    if (badge) badge.textContent = wishlist.length;
}

function toggleWishlistModal() {
    const modal = document.getElementById('wishlistModal');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
        renderWishlistItems();
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function renderWishlistItems() {
    const list = document.getElementById('wishlistItemsList');
    if (!list) return;

    const favs = allProducts.filter(p => wishlist.includes(p.id));
    if (favs.length === 0) {
        list.innerHTML = `
            <div class="py-12 text-center text-gray-400">
                <i data-lucide="heart" class="w-10 h-10 mx-auto text-gray-300 mb-2"></i>
                <p class="text-xs">Hozircha sevimli gullar yo'q</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    list.innerHTML = favs.map(p => `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <img src="${p.image_url}" class="w-14 h-14 rounded-xl object-cover">
            <div class="flex-1">
                <div class="font-bold text-xs text-gray-900">${p.name}</div>
                <div class="text-xs text-rose-600 font-extrabold">${formatMoney(p.discount_price || p.price)}</div>
            </div>
            <button onclick="addToCartById(${p.id}); toggleWishlistModal();" class="p-2 bg-rose-600 text-white rounded-xl text-xs hover:bg-rose-700">
                <i data-lucide="shopping-bag" class="w-4 h-4"></i>
            </button>
            <button onclick="toggleWishlist(${p.id}); renderWishlistItems();" class="p-2 text-gray-400 hover:text-rose-600">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');
    lucide.createIcons();
}

// Cart Logic
function addToCartById(id) {
    const prod = allProducts.find(p => p.id === id);
    if (!prod) return;
    addToCart(prod, 1, 'Standart', 1);
}

function addToCart(product, qty = 1, sizeName = 'Standart', sizeMultiplier = 1) {
    const basePrice = product.discount_price || product.price;
    const finalItemPrice = Math.round(basePrice * sizeMultiplier);

    const existingIndex = cart.findIndex(item => item.id === product.id && item.sizeName === sizeName);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            image_url: product.image_url,
            price: finalItemPrice,
            originalPrice: product.price,
            sizeName: sizeName,
            qty: qty
        });
    }

    saveCart();
    showToast(`"${product.name}" savatga qo'shildi! 🌸`, "success");
    openCartDrawer();
}

function saveCart() {
    localStorage.setItem('gulzor_cart', JSON.stringify(cart));
    updateCartBadges();
    renderCart();
    calculateCartTotals();
}

function updateCartBadges() {
    const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById('cartCountBadge');
    const drawerBadge = document.getElementById('cartDrawerCount');
    if (badge) badge.textContent = totalItems;
    if (drawerBadge) drawerBadge.textContent = totalItems;
}

function openCartDrawer() {
    renderCart();
    calculateCartTotals();
    document.getElementById('cartDrawerBackdrop')?.classList.remove('hidden');
    document.getElementById('cartDrawer')?.classList.remove('translate-x-full');
}

function closeCartDrawer() {
    document.getElementById('cartDrawerBackdrop')?.classList.add('hidden');
    document.getElementById('cartDrawer')?.classList.add('translate-x-full');
}

function renderCart() {
    const list = document.getElementById('cartItemsList');
    if (!list) return;

    if (cart.length === 0) {
        list.innerHTML = `
            <div class="py-16 text-center text-gray-400">
                <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto text-rose-200 mb-3"></i>
                <p class="font-bold text-gray-700 text-sm">Savat bo'sh</p>
                <p class="text-xs text-gray-400 mt-1">O'zingizga yoqqan guldastalarni tanlang</p>
                <button onclick="closeCartDrawer()" class="mt-4 px-5 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-bold hover:bg-rose-700 shadow-md">
                    Katalogni ko'rish
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    list.innerHTML = cart.map((item, idx) => `
        <div class="flex items-center gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
            <img src="${item.image_url}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover shrink-0">
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-xs text-gray-900 truncate">${item.name}</h4>
                <div class="text-[11px] text-gray-400">O'lcham: ${item.sizeName}</div>
                <div class="text-xs font-extrabold text-rose-600 mt-1">${formatMoney(item.price)}</div>
            </div>

            <!-- Qty controls -->
            <div class="flex items-center border border-gray-200 rounded-xl bg-white p-1">
                <button onclick="changeCartQty(${idx}, -1)" class="w-6 h-6 text-xs text-gray-600 hover:text-black flex items-center justify-center">-</button>
                <span class="w-6 text-center text-xs font-bold">${item.qty}</span>
                <button onclick="changeCartQty(${idx}, 1)" class="w-6 h-6 text-xs text-gray-600 hover:text-black flex items-center justify-center">+</button>
            </div>

            <button onclick="removeCartItem(${idx})" class="p-2 text-gray-400 hover:text-rose-600" title="O'chirish">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');

    lucide.createIcons();
}

function changeCartQty(idx, delta) {
    if (cart[idx]) {
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) {
            cart.splice(idx, 1);
        }
        saveCart();
    }
}

function removeCartItem(idx) {
    cart.splice(idx, 1);
    saveCart();
}

function calculateCartTotals() {
    let subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    // Extras
    const chocolateCheck = document.getElementById('extraChocolateCheck');
    const toyCheck = document.getElementById('extraToyCheck');
    
    let extras = 0;
    if (chocolateCheck?.checked) extras += 50000;
    if (toyCheck?.checked) extras += 75000;

    let discount = 0;
    if (promoDiscountPercent > 0) {
        discount = Math.round(subtotal * (promoDiscountPercent / 100));
    }

    // Delivery is free if order > 500,000, else free in promotional period
    let deliveryFee = subtotal >= 500000 || subtotal === 0 ? 0 : 0; // Currently free promo

    const total = Math.max(0, subtotal - discount + extras + deliveryFee);

    // Update DOM
    const subtotalEl = document.getElementById('cartSubtotal');
    const discountEl = document.getElementById('cartDiscount');
    const discountRow = document.getElementById('cartDiscountRow');
    const deliveryEl = document.getElementById('cartDeliveryFee');
    const totalEl = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutButton');
    const checkoutTotalAmount = document.getElementById('checkoutTotalAmount');

    if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal + extras);
    if (discountRow) {
        if (discount > 0) {
            discountRow.style.display = 'flex';
            discountEl.textContent = `-${formatMoney(discount)}`;
        } else {
            discountRow.style.display = 'none';
        }
    }
    if (deliveryEl) deliveryEl.textContent = deliveryFee === 0 ? 'Bepul (Aksiya)' : formatMoney(deliveryFee);
    if (totalEl) totalEl.textContent = formatMoney(total);
    if (checkoutTotalAmount) checkoutTotalAmount.textContent = formatMoney(total);

    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
        if (cart.length === 0) {
            checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    return { subtotal, extras, discount, deliveryFee, total };
}

// Promo code handler
function applyPromoCode() {
    const input = document.getElementById('promoInput');
    const feedback = document.getElementById('promoFeedback');
    if (!input || !feedback) return;

    const code = input.value.trim().toUpperCase();
    if (code === 'BAHOR2026') {
        promoDiscountPercent = 10;
        appliedPromoCode = code;
        feedback.textContent = "Tabriklaymiz! 10% bayram chegirmasi qo'llandi! 🎉";
        feedback.className = "text-[11px] font-bold text-emerald-600 block";
        calculateCartTotals();
        showToast("10% chegirma promokodi muvaffaqiyatli qo'llandi!", "success");
    } else {
        promoDiscountPercent = 0;
        appliedPromoCode = '';
        feedback.textContent = "Kiritilgan promokod noto'g'ri!";
        feedback.className = "text-[11px] font-bold text-rose-600 block";
        calculateCartTotals();
    }
}

// Quick View Modal
function openQuickView(id) {
    qvProduct = allProducts.find(p => p.id === id);
    if (!qvProduct) return;

    qvSizeMultiplier = 1;
    qvSizeName = 'Standart';
    qvCount = 1;

    document.getElementById('qvTitle').textContent = qvProduct.name;
    document.getElementById('qvCategory').textContent = CATEGORY_NAMES[qvProduct.category] || qvProduct.category;
    document.getElementById('qvImage').src = qvProduct.image_url;
    document.getElementById('qvDescription').textContent = qvProduct.description;
    
    const curPrice = qvProduct.discount_price || qvProduct.price;
    document.getElementById('qvPrice').textContent = formatMoney(curPrice);
    
    const oldPriceEl = document.getElementById('qvOldPrice');
    if (qvProduct.discount_price) {
        oldPriceEl.textContent = formatMoney(qvProduct.price);
        oldPriceEl.classList.remove('hidden');
    } else {
        oldPriceEl.classList.add('hidden');
    }

    const badgeEl = document.getElementById('qvBadge');
    if (qvProduct.is_popular) {
        badgeEl.textContent = "Xit guldasta";
        badgeEl.classList.remove('hidden');
    } else if (qvProduct.is_new) {
        badgeEl.textContent = "Yangi";
        badgeEl.classList.remove('hidden');
    } else {
        badgeEl.classList.add('hidden');
    }

    // Stars
    const starsEl = document.getElementById('qvStars');
    starsEl.innerHTML = Array(5).fill(0).map((_, i) => `
        <i data-lucide="star" class="w-4 h-4 ${i < Math.round(qvProduct.rating) ? 'fill-amber-400' : 'text-gray-300'}"></i>
    `).join('');
    document.getElementById('qvRatingText').textContent = `${qvProduct.rating} (${qvProduct.review_count} sharh)`;

    // Reset size buttons
    document.querySelectorAll('.qv-size-btn').forEach((btn, idx) => {
        if (idx === 0) {
            btn.className = "qv-size-btn active py-2 border rounded-xl text-center border-rose-500 bg-rose-50 text-rose-700 font-bold";
        } else {
            btn.className = "qv-size-btn py-2 border rounded-xl text-center border-gray-200 text-gray-700 hover:border-rose-300";
        }
    });

    document.getElementById('qvQty').textContent = qvCount;
    document.getElementById('quickViewModal').classList.remove('hidden');
    lucide.createIcons();
}

function closeQuickView() {
    document.getElementById('quickViewModal')?.classList.add('hidden');
}

function selectQvSize(type, el) {
    document.querySelectorAll('.qv-size-btn').forEach(b => {
        b.className = "qv-size-btn py-2 border rounded-xl text-center border-gray-200 text-gray-700 hover:border-rose-300";
    });
    el.className = "qv-size-btn active py-2 border rounded-xl text-center border-rose-500 bg-rose-50 text-rose-700 font-bold";

    if (type === 'standard') {
        qvSizeMultiplier = 1;
        qvSizeName = 'Standart';
    } else if (type === 'medium') {
        qvSizeMultiplier = 1.3;
        qvSizeName = '+30% Katta';
    } else if (type === 'deluxe') {
        qvSizeMultiplier = 1.6;
        qvSizeName = 'Royal Luxe';
    }

    if (qvProduct) {
        const base = qvProduct.discount_price || qvProduct.price;
        document.getElementById('qvPrice').textContent = formatMoney(Math.round(base * qvSizeMultiplier));
    }
}

function incrementQvQty() {
    qvCount++;
    document.getElementById('qvQty').textContent = qvCount;
}

function decrementQvQty() {
    if (qvCount > 1) {
        qvCount--;
        document.getElementById('qvQty').textContent = qvCount;
    }
}

function addQvToCart() {
    if (!qvProduct) return;
    addToCart(qvProduct, qvCount, qvSizeName, qvSizeMultiplier);
    closeQuickView();
}

// Checkout Modal
function openCheckoutModal() {
    if (cart.length === 0) {
        showToast("Savatingiz bo'sh!", "error");
        return;
    }
    closeCartDrawer();
    calculateCartTotals();
    document.getElementById('checkoutModal')?.classList.remove('hidden');
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal')?.classList.add('hidden');
}

function toggleSelfRecipient(checkbox) {
    const fields = document.getElementById('recipientFields');
    if (checkbox.checked) {
        fields.classList.add('opacity-40', 'pointer-events-none');
    } else {
        fields.classList.remove('opacity-40', 'pointer-events-none');
    }
}

// Submit Order
async function submitOrder(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById('submitOrderBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Yuborilmoqda...`;
    lucide.createIcons();

    const formData = new FormData(form);
    const totals = calculateCartTotals();

    const selfRecipient = document.getElementById('selfRecipientCheck')?.checked;
    const customerName = formData.get('customer_name');
    const customerPhone = formData.get('customer_phone');
    const region = formData.get('delivery_region');
    const rawAddress = formData.get('delivery_address');
    const fullDeliveryAddress = region ? `${region}, ${rawAddress}` : rawAddress;

    const orderPayload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        recipient_name: selfRecipient ? customerName : (formData.get('recipient_name') || customerName),
        recipient_phone: selfRecipient ? customerPhone : (formData.get('recipient_phone') || customerPhone),
        is_anonymous: formData.get('is_anonymous') === 'on',
        delivery_address: fullDeliveryAddress,
        delivery_date: formData.get('delivery_date'),
        delivery_time: formData.get('delivery_time'),
        greeting_card_text: formData.get('greeting_card_text') || '',
        extra_chocolate: document.getElementById('extraChocolateCheck')?.checked || false,
        extra_toy: document.getElementById('extraToyCheck')?.checked || false,
        payment_method: formData.get('payment_method') || 'click',
        promo_code: appliedPromoCode,
        subtotal: totals.subtotal + totals.extras,
        discount: totals.discount,
        delivery_fee: totals.deliveryFee,
        total_amount: totals.total,
        items: cart
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });
        const data = await res.json();

        if (data.success) {
            // Clear cart
            cart = [];
            saveCart();
            form.reset();
            closeCheckoutModal();

            // Show Success Modal
            document.getElementById('successOrderNumber').textContent = data.order_number;
            document.getElementById('successOrderAmount').textContent = formatMoney(data.total_amount);
            document.getElementById('successModal').classList.remove('hidden');
            lucide.createIcons();
        } else {
            showToast(data.message || "Xatolik yuz berdi", "error");
        }
    } catch (err) {
        console.error("Buyurtma yuborishda xatolik:", err);
        showToast("Tarmoq xatoligi. Qaytadan urinib ko'ring.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Buyurtmani tasdiqlash</span> <i data-lucide="check" class="w-4 h-4"></i>`;
        lucide.createIcons();
    }
}

function closeSuccessModal() {
    document.getElementById('successModal')?.classList.add('hidden');
}

// Mobile Menu
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('hidden');
}

// Toast helper
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-800' : type === 'error' ? 'bg-rose-700' : 'bg-gray-800';
    const iconName = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : 'info';

    toast.className = `toast-msg pointer-events-auto flex items-center gap-3 ${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold border border-white/20`;
    toast.innerHTML = `
        <i data-lucide="${iconName}" class="w-5 h-5 shrink-0"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

