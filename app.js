const form = document.querySelector('#order-form');
const pdfInput = document.querySelector('#pdf');
const fileName = document.querySelector('#file-name');
const success = document.querySelector('#success');
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const shopForm = document.querySelector('#shop-login-form');
const shopMessage = document.querySelector('#shop-message');
const ownerDesk = document.querySelector('#owner-desk');
const ownerLogout = document.querySelector('#owner-logout');
const ordersList = document.querySelector('#orders-list');
const orderCount = document.querySelector('#order-count');
const clearOrders = document.querySelector('#clear-orders');
const ORDERS_KEY = 'printhub-orders';
const OWNER_KEY = 'printhub-owner-session';
const DEMO_OWNER = 'owner';
const DEMO_PASSWORD = 'printdesk';

const readOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeOrders = (orders) => localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#039;',
  '"': '&quot;'
}[character]));

const formatDate = (value) => new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(new Date(value));

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  mobileNav.hidden = isOpen;
  menuButton.textContent = isOpen ? '☰' : '×';
});

document.querySelectorAll('.mobile-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.hidden = true;
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) menuButton.textContent = '☰';
  });
});

pdfInput?.addEventListener('change', () => {
  const file = pdfInput.files?.[0];
  if (!file) return;
  if (file.type !== 'application/pdf') {
    pdfInput.value = '';
    fileName.innerHTML = 'Choose your PDF<br><small>PDF only · up to 10 MB</small>';
    alert('Please choose a PDF file.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    pdfInput.value = '';
    fileName.innerHTML = 'Choose your PDF<br><small>PDF only · up to 10 MB</small>';
    alert('Please choose a PDF smaller than 10 MB.');
    return;
  }
  fileName.textContent = file.name;
});

const renderOrders = () => {
  const orders = readOrders();
  orderCount.textContent = `${orders.length} request${orders.length === 1 ? '' : 's'}`;
  if (!orders.length) {
    ordersList.innerHTML = '<p class="empty-orders">No print requests yet. New requests will appear here.</p>';
    return;
  }

  ordersList.innerHTML = orders.map((order) => `
    <article class="order-card" data-order-id="${escapeHtml(order.id)}">
      <div class="order-card-head">
        <div><strong>${escapeHtml(order.id)}</strong><small>${escapeHtml(formatDate(order.createdAt))}</small></div>
        <select class="order-status" aria-label="Status for ${escapeHtml(order.id)}" data-order-id="${escapeHtml(order.id)}">
          ${['New', 'Printing', 'Ready', 'Delivered'].map((status) => `<option ${order.status === status ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
      </div>
      <div class="order-details">
        <p><b>WhatsApp</b><span>${escapeHtml(order.whatsapp)}</span></p>
        <p><b>PDF</b><span>${escapeHtml(order.fileName)}</span></p>
        <p><b>Print</b><span>${escapeHtml(order.printType)} · ${escapeHtml(order.delivery)}</span></p>
        <p><b>Instructions</b><span>${escapeHtml(order.message)}</span></p>
      </div>
      <div class="order-actions">
        <a class="button button-dark" target="_blank" rel="noreferrer" href="https://wa.me/${encodeURIComponent(order.whatsapp.replace(/\D/g, ''))}?text=${encodeURIComponent(`Hi, this is PrintHub. Update for order ${order.id}: ${order.status}. ${order.message}`)}">Message student ↗</a>
        <button class="button button-light delete-order" type="button" data-order-id="${escapeHtml(order.id)}">Remove</button>
      </div>
    </article>
  `).join('');
};

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const file = pdfInput?.files?.[0];
  if (!file) return;
  const orderNumber = `PH-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const order = {
    id: orderNumber,
    createdAt: new Date().toISOString(),
    whatsapp: String(data.get('whatsapp') || ''),
    token: String(data.get('token') || ''),
    fileName: file.name,
    printType: String(data.get('printType') || ''),
    delivery: String(data.get('delivery') || ''),
    message: String(data.get('message') || ''),
    status: 'New'
  };
  writeOrders([order, ...readOrders()]);
  success.hidden = false;
  success.textContent = `Order ${orderNumber} saved on this device. The shop owner can now review it in the owner desk.`;
  form.reset();
  fileName.innerHTML = 'Choose your PDF<br><small>PDF only · up to 10 MB</small>';
});

shopForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(shopForm);
  const username = String(data.get('username') || '').trim();
  const password = String(data.get('password') || '');
  shopMessage.hidden = false;
  if (username === DEMO_OWNER && password === DEMO_PASSWORD) {
    sessionStorage.setItem(OWNER_KEY, 'true');
    shopMessage.textContent = 'Owner desk unlocked.';
    shopMessage.style.background = 'var(--sage)';
    shopForm.reset();
    ownerDesk.hidden = false;
    renderOrders();
    ownerDesk.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    shopMessage.textContent = 'Incorrect owner username or password.';
    shopMessage.style.background = '#f5d6cf';
  }
});

ownerLogout?.addEventListener('click', () => {
  sessionStorage.removeItem(OWNER_KEY);
  ownerDesk.hidden = true;
  shopMessage.hidden = true;
});

clearOrders?.addEventListener('click', () => {
  if (!readOrders().length || !confirm('Remove all demo orders from this browser?')) return;
  writeOrders([]);
  renderOrders();
});

ordersList?.addEventListener('change', (event) => {
  const target = event.target.closest('.order-status');
  if (!target) return;
  const orders = readOrders().map((order) => order.id === target.dataset.orderId
    ? { ...order, status: target.value }
    : order);
  writeOrders(orders);
  renderOrders();
});

ordersList?.addEventListener('click', (event) => {
  const target = event.target.closest('.delete-order');
  if (!target) return;
  writeOrders(readOrders().filter((order) => order.id !== target.dataset.orderId));
  renderOrders();
});

if (sessionStorage.getItem(OWNER_KEY) === 'true') {
  ownerDesk.hidden = false;
  renderOrders();
}
