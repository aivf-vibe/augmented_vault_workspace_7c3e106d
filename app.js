
// API Configuration
const API_BASE_URL = 'http://localhost:57945';

// Global variables
let currentSection = 'dashboard';
let products = [];
let categories = [];
let vendors = [];
let units = [];
let orders = [];
let cart = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    updateCurrentDate();
    setupEventListeners();
    await loadAllData();
    showSection('dashboard');
}

function updateCurrentDate() {
    const now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.closest('.nav-link').dataset.section;
            showSection(section);
        });
    });

    // Sidebar toggle
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);

    // Form submissions
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);
    document.getElementById('vendorForm').addEventListener('submit', handleVendorSubmit);
    document.getElementById('unitForm').addEventListener('submit', handleUnitSubmit);

    // Search functionality
    document.getElementById('productSearch').addEventListener('input', filterProducts);
    document.getElementById('posSearch').addEventListener('input', filterPOSProducts);

    // Cart updates
    document.getElementById('cartDiscount').addEventListener('input', updateCartTotal);
    document.getElementById('cartTax').addEventListener('input', updateCartTotal);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    sidebar.classList.toggle('sidebar-collapsed');
    if (sidebar.classList.contains('sidebar-collapsed')) {
        mainContent.style.marginLeft = '0';
    } else {
        mainContent.style.marginLeft = '16rem';
    }
}

function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    
    // Show selected section
    document.getElementById(`${section}-section`).classList.remove('hidden');
    
    // Update current section
    currentSection = section;
    
    // Load section-specific data
    switch(section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'products':
            loadProducts();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'vendors':
            loadVendors();
            break;
        case 'units':
            loadUnits();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'pos':
            loadPOSProducts();
            break;
    }
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        alert('Failed to connect to server. Please check if the server is running.');
        throw error;
    }
}

async function loadAllData() {
    try {
        [categories, vendors, units, products] = await Promise.all([
            apiRequest('/categories/'),
            apiRequest('/vendors/'),
            apiRequest('/units/'),
            apiRequest('/products/')
        ]);
        
        populateDropdowns();
    } catch (error) {
        console.error('Failed to load data:', error);
    }
}

function populateDropdowns() {
    // Category dropdown
    const categorySelects = ['productCategory', 'categoryFilter'];
    categorySelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>';
            categories.forEach(category => {
                select.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            });
        }
    });

    // Unit dropdown
    const unitSelect = document.getElementById('productUnit');
    if (unitSelect) {
        unitSelect.innerHTML = '<option value="">Select Unit</option>';
        units.forEach(unit => {
            unitSelect.innerHTML += `<option value="${unit.id}">${unit.name}</option>`;
        });
    }

    // Vendor dropdown
    const vendorSelect = document.getElementById('productVendor');
    if (vendorSelect) {
        vendorSelect.innerHTML = '<option value="">Select Vendor</option>';
        vendors.forEach(vendor => {
            vendorSelect.innerHTML += `<option value="${vendor.id}">${vendor.name}</option>`;
        });
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        const [lowStock, expired, allOrders] = await Promise.all([
            apiRequest('/products/low-stock'),
            apiRequest('/products/expired'),
            apiRequest('/orders/')
        ]);

        // Update counts
        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('lowStockCount').textContent = lowStock.length;
        document.getElementById('expiredCount').textContent = expired.length;
        
        // Filter today's orders
        const today = new Date().toDateString();
        const todayOrders = allOrders.filter(order => 
            new Date(order.created_at).toDateString() === today
        );
        document.getElementById('todayOrders').textContent = todayOrders.length;

        // Update alerts
        updateAlerts('lowStockAlerts', lowStock, 'low-stock');
        updateAlerts('expiryAlerts', expired, 'expiry-warning');
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function updateAlerts(containerId, items, className) {
    const container = document.getElementById(containerId);
    if (items.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No alerts</p>';
        return;
    }

    container.innerHTML = items.slice(0, 5).map(item => `
        <div class="p-3 rounded-lg ${className}">
            <div class="flex justify-between items-center">
                <span class="font-medium">${item.name}</span>
                <span class="text-sm">${item.stock_quantity || 'N/A'}</span>
            </div>
        </div>
    `).join('');
}

// Product Functions
async function loadProducts() {
    try {
        products = await apiRequest('/products/');
        displayProducts(products);
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

function displayProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    if (productsToShow.length === 0) {
        grid.innerHTML = '<p class="text-gray-500 col-span-full">No products found</p>';
        return;
    }

    grid.innerHTML = productsToShow.map(product => `
        <div class="product-card bg-white rounded-lg shadow p-4">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-semibold text-lg">${product.name}</h4>
                <div class="flex space-x-2">
                    <button onclick="editProduct(${product.id})" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProduct(${product.id})" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="text-sm text-gray-600 mb-2">${product.generic_name || ''}</p>
            <p class="text-sm text-gray-500 mb-2">Brand: ${product.brand || 'N/A'}</p>
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm">Stock: ${product.stock_quantity}</span>
                <span class="text-sm text-green-600 font-semibold">$${product.selling_price}</span>
            </div>
            <div class="text-xs text-gray-500">
                <p>Batch: ${product.batch_number || 'N/A'}</p>
                <p>Expiry: ${product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : 'N/A'}</p>
            </div>
        </div>
    `).join('');
}

function filterProducts() {
    const search = document.getElementById('productSearch').value.toLowerCase();
    const categoryId = document.getElementById('categoryFilter').value;
    
    let filtered = products;
    
    if (search) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) || 
            p.generic_name?.toLowerCase().includes(search)
        );
    }
    
    if (categoryId) {
        filtered = filtered.filter(p => p.category_id === parseInt(categoryId));
    }
    
    displayProducts(filtered);
}

function openProductModal(product = null) {
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    
    if (product) {
        title.textContent = 'Edit Product';
        document.getElementById('productName').value = product.name;
        document.getElementById('productGeneric').value = product.generic_name || '';
        document.getElementById('productBrand').value = product.brand || '';
        document.getElementById('productCategory').value = product.category_id;
        document.getElementById('productUnit').value = product.unit_id;
        document.getElementById('productVendor').value = product.vendor_id;
        document.getElementById('productCostPrice').value = product.cost_price;
        document.getElementById('productSellingPrice').value = product.selling_price;
        document.getElementById('productStock').value = product.stock_quantity;
        document.getElementById('productMinStock').value = product.min_stock_level;
        document.getElementById('productBatch').value = product.batch_number || '';
        document.getElementById('productExpiry').value = product.expiry_date ? 
            new Date(product.expiry_date).toISOString().split('T')[0] : '';
        
        form.dataset.productId = product.id;
    } else {
        title.textContent = 'Add Product';
        form.reset();
        delete form.dataset.productId;
    }
    
    modal.classList.remove('modal-hidden');
}

function closeProductModal() {
    document.getElementById('productModal').classList.add('modal-hidden');
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('productName').value,
        generic_name: document.getElementById('productGeneric').value,
        brand: document.getElementById('productBrand').value,
        category_id: parseInt(document.getElementById('productCategory').value),
        unit_id: parseInt(document.getElementById('productUnit').value),
        vendor_id: parseInt(document.getElementById('productVendor').value),
        cost_price: parseFloat(document.getElementById('productCostPrice').value),
        selling_price: parseFloat(document.getElementById('productSellingPrice').value),
        stock_quantity: parseInt(document.getElementById('productStock').value),
        min_stock_level: parseInt(document.getElementById('productMinStock').value),
        batch_number: document.getElementById('productBatch').value,
        expiry_date: document.getElementById('productExpiry').value ? 
            new Date(document.getElementById('productExpiry').value).toISOString() : null
    };
    
    try {
        const productId = e.target.dataset.productId;
        if (productId) {
            await apiRequest(`/products/${productId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
        } else {
            await apiRequest('/products/', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
        }
        
        closeProductModal();
        loadProducts();
        loadDashboardData();
    } catch (error) {
        console.error('Failed to save product:', error);
    }
}

async function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        openProductModal(product);
    }
}

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await apiRequest(`/products/${productId}`, {
                method: 'DELETE'
            });
            loadProducts();
            loadDashboardData();
        } catch (error) {
            console.error('Failed to delete product:', error);
        }
    }
}

// Category Functions
async function loadCategories() {
    try {
        categories = await apiRequest('/categories/');
        displayCategories(categories);
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

function displayCategories(categoriesToShow) {
    const table = document.getElementById('categoriesTable');
    if (categoriesToShow.length === 0) {
        table.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">No categories found</td></tr>';
        return;
    }

    table.innerHTML = categoriesToShow.map(category => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${category.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${category.description || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="editCategory(${category.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteCategory(${category.id})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openCategoryModal(category = null) {
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('categoryModalTitle');
    const form = document.getElementById('categoryForm');
    
    if (category) {
        title.textContent = 'Edit Category';
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';
        form.dataset.categoryId = category.id;
    } else {
        title.textContent = 'Add Category';
        form.reset();
        delete form.dataset.categoryId;
    }
    
    modal.classList.remove('modal-hidden');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.add('modal-hidden');
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDescription').value
    };
    
    try {
        const categoryId = e.target.dataset.categoryId;
        if (categoryId) {
            await apiRequest(`/categories/${categoryId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
        } else {
            await apiRequest('/categories/', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
        }
        
        closeCategoryModal();
        loadCategories();
        loadAllData();
    } catch (error) {
        console.error('Failed to save category:', error);
    }
}

async function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
        openCategoryModal(category);
    }
}

async function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category?')) {
        try {
            await apiRequest(`/categories/${categoryId}`, {
                method: 'DELETE'
            });
            loadCategories();
            loadAllData();
        } catch (error) {
            console.error('Failed to delete category:', error);
        }
    }
}

// Vendor Functions
async function loadVendors() {
    try {
        vendors = await apiRequest('/vendors/');
        displayVendors(vendors);
    } catch (error) {
        console.error('Failed to load vendors:', error);
    }
}

function displayVendors(vendorsToShow) {
    const table = document.getElementById('vendorsTable');
    if (vendorsToShow.length === 0) {
        table.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No vendors found</td></tr>';
        return;
    }

    table.innerHTML = vendorsToShow.map(vendor => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${vendor.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${vendor.contact_person || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">${vendor.phone || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="editVendor(${vendor.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteVendor(${vendor.id})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openVendorModal(vendor = null) {
    const modal = document.getElementById('vendorModal');
    const title = document.getElementById('vendorModalTitle');
    const form = document.getElementById('vendorForm');
    
    if (vendor) {
        title.textContent = 'Edit Vendor';
        document.getElementById('vendorName').value = vendor.name;
        document.getElementById('vendorContact').value = vendor.contact_person || '';
        document.getElementById('vendorPhone').value = vendor.phone || '';
        document.getElementById('vendorEmail').value = vendor.email || '';
        document.getElementById('vendorAddress').value = vendor.address || '';
        form.dataset.vendorId = vendor.id;
    } else {
        title.textContent = 'Add Vendor';
        form.reset();
        delete form.dataset.vendorId;
    }
    
    modal.classList.remove('modal-hidden');
}

function closeVendorModal() {
    document.getElementById('vendorModal').classList.add('modal-hidden');
}

async function handleVendorSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('vendorName').value,
        contact_person: document.getElementById('vendorContact').value,
        phone: document.getElementById('vendorPhone').value,
        email: document.getElementById('vendorEmail').value,
        address: document.getElementById('vendorAddress').value
    };
    
    try {
        const vendorId = e.target.dataset.vendorId;
        if (vendorId) {
            await apiRequest(`/vendors/${vendorId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
        } else {
            await apiRequest('/vendors/', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
        }
        
        closeVendorModal();
        loadVendors();
        loadAllData();
    } catch (error) {
        console.error('Failed to save vendor:', error);
    }
}

async function editVendor(vendorId) {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
        openVendorModal(vendor);
    }
}

async function deleteVendor(vendorId) {
    if (confirm('Are you sure you want to delete this vendor?')) {
        try {
            await apiRequest(`/vendors/${vendorId}`, {
                method: 'DELETE'
            });
            loadVendors();
            loadAllData();
        } catch (error) {
            console.error('Failed to delete vendor:', error);
        }
    }
}

// Unit Functions
async function loadUnits() {
    try {
        units = await apiRequest('/units/');
        displayUnits(units);
    } catch (error) {
        console.error('Failed to load units:', error);
    }
}

function displayUnits(unitsToShow) {
    const table = document.getElementById('unitsTable');
    if (unitsToShow.length === 0) {
        table.innerHTML = '<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">No units found</td></tr>';
        return;
    }

    table.innerHTML = unitsToShow.map(unit => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${unit.name}</td>
            <td class="px-6 py-4 whitespace-nowrap">${unit.abbreviation || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="editUnit(${unit.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteUnit(${unit.id})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openUnitModal(unit = null) {
    const modal = document.getElementById('unitModal');
    const title = document.getElementById('unitModalTitle');
    const form = document.getElementById('unitForm');
    
    if (unit) {
        title.textContent = 'Edit Unit';
        document.getElementById('unitName').value = unit.name;
        document.getElementById('unitAbbreviation').value = unit.abbreviation || '';
        form.dataset.unitId = unit.id;
    } else {
        title.textContent = 'Add Unit';
        form.reset();
        delete form.dataset.unitId;
    }
    
    modal.classList.remove('modal-hidden');
}

function closeUnitModal() {
    document.getElementById('unitModal').classList.add('modal-hidden');
}

async function handleUnitSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('unitName').value,
        abbreviation: document.getElementById('unitAbbreviation').value
    };
    
    try {
        const unitId = e.target.dataset.unitId;
        if (unitId) {
            await apiRequest(`/units/${unitId}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
        } else {
            await apiRequest('/units/', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
        }
        
        closeUnitModal();
        loadUnits();
        loadAllData();
    } catch (error) {
        console.error('Failed to save unit:', error);
    }
}

async function editUnit(unitId) {
    const unit = units.find(u => u.id === unitId);
    if (unit) {
        openUnitModal(unit);
    }
}

async function deleteUnit(unitId) {
    if (confirm('Are you sure you want to delete this unit?')) {
        try {
            await apiRequest(`/units/${unitId}`, {
                method: 'DELETE'
            });
            loadUnits();
            loadAllData();
        } catch (error) {
            console.error('Failed to delete unit:', error);
        }
    }
}

// Order Functions
async function loadOrders() {
    try {
        orders = await apiRequest('/orders/');
        displayOrders(orders);
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

function displayOrders(ordersToShow) {
    const table = document.getElementById('ordersTable');
    if (ordersToShow.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No orders found</td></tr>';
        return;
    }

    table.innerHTML = ordersToShow.map(order => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">${order.order_number}</td>
            <td class="px-6 py-4 whitespace-nowrap">${order.customer_name || 'Walk-in'}</td>
            <td class="px-6 py-4 whitespace-nowrap">$${order.grand_total.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }">${order.status}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">${new Date(order.created_at).toLocaleDateString()}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="viewOrder(${order.id})" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// POS Functions
async function loadPOSProducts() {
    try {
        products = await apiRequest('/pos/products');
        displayPOSProducts(products);
    } catch (error) {
        console.error('Failed to load POS products:', error);
    }
}

function displayPOSProducts(productsToShow) {
    const container = document.getElementById('posProducts');
    if (productsToShow.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No products found</p>';
        return;
    }

    container.innerHTML = productsToShow.map(product => `
        <div class="bg-white border rounded-lg p-4 cursor-pointer hover:bg-gray-50" onclick="addToCart(${product.id})">
            <h4 class="font-semibold">${product.name}</h4>
            <p class="text-sm text-gray-600">${product.generic_name || ''}</p>
            <div class="flex justify-between items-center mt-2">
                <span class="text-green-600 font-semibold">$${product.selling_price}</span>
                <span class="text-sm text-gray-500">Stock: ${product.stock_quantity}</span>
            </div>
        </div>
    `).join('');
}

function filterPOSProducts() {
    const search = document.getElementById('posSearch').value.toLowerCase();
    
    let filtered = products;
    if (search) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) || 
            p.generic_name?.toLowerCase().includes(search)
        );
    }
    
    displayPOSProducts(filtered);
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.product_id === productId);
    if (existingItem) {
        if (existingItem.quantity < product.stock_quantity) {
            existingItem.quantity += 1;
            existingItem.total_price = existingItem.quantity * existingItem.unit_price;
        } else {
            alert('Not enough stock available');
            return;
        }
    } else {
        cart.push({
            product_id: productId,
            product_name: product.name,
            quantity: 1,
            unit_price: product.selling_price,
            total_price: product.selling_price
        });
    }
    
    updateCartDisplay();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartDisplay();
}

function updateCartQuantity(index, newQuantity) {
    const product = products.find(p => p.id === cart[index].product_id);
    if (newQuantity <= 0) {
        removeFromCart(index);
    } else if (newQuantity <= product.stock_quantity) {
        cart[index].quantity = newQuantity;
        cart[index].total_price = newQuantity * cart[index].unit_price;
        updateCartDisplay();
    } else {
        alert('Not enough stock available');
    }
}

function updateCartDisplay() {
    const container = document.getElementById('cartItems');
    if (cart.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Cart is empty</p>';
    } else {
        container.innerHTML = cart.map((item, index) => `
            <div class="flex justify-between items-center p-2 border rounded">
                <div class="flex-1">
                    <p class="font-medium">${item.product_name}</p>
                    <p class="text-sm text-gray-600">$${item.unit_price} x ${item.quantity}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="updateCartQuantity(${index}, ${item.quantity - 1})" 
                            class="px-2 py-1 text-sm border rounded hover:bg-gray-100">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartQuantity(${index}, ${item.quantity + 1})" 
                            class="px-2 py-1 text-sm border rounded hover:bg-gray-100">+</button>
                    <button onclick="removeFromCart(${index})" 
                            class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    updateCartTotal();
}

function updateCartTotal() {
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    const discount = parseFloat(document.getElementById('cartDiscount').value) || 0;
    const tax = parseFloat(document.getElementById('cartTax').value) || 0;
    const total = subtotal - discount + tax;
    
    document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
}

async function checkout() {
    if (cart.length === 0) {
        alert('Cart is empty');
        return;
    }

    const customerName = prompt('Enter customer name (optional):') || null;
    const paymentMethod = prompt('Enter payment method (cash/card):', 'cash') || 'cash';
    
    const orderData = {
        customer_name: customerName,
        payment_method: paymentMethod,
        discount: parseFloat(document.getElementById('cartDiscount').value) || 0,
        tax: parseFloat(document.getElementById('cartTax').value) || 0,
        order_items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price
        }))
    };

    try {
        await apiRequest('/pos/checkout', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        
        alert('Order placed successfully!');
        cart = [];
        updateCartDisplay();
        loadPOSProducts();
        loadDashboardData();
    } catch (error) {
        console.error('Failed to checkout:', error);
        alert('Failed to place order');
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.add('modal-hidden');
    }
}

