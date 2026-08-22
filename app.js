const form = document.querySelector('#order-form');
const pdfInput = document.querySelector('#pdf');
const fileName = document.querySelector('#file-name');
const success = document.querySelector('#success');
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const ownerLoginButton = document.querySelector('#owner-login-button');
const ownerModal = document.querySelector('#owner-modal');
const ownerModalClose = document.querySelector('#owner-modal-close');
const shopForm = document.querySelector('#shop-login-form');
const shopMessage = document.querySelector('#shop-message');
const ownerDesk = document.querySelector('#owner-desk');
const ownerLogout = document.querySelector('#owner-logout');
const ordersList = document.querySelector('#orders-list');
const orderCount = document.querySelector('#order-count');
const clearOrders = document.querySelector('#clear-orders');

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => ({})) : {};
  if (!response.ok) {
    if (!contentType.includes('application/json') && path.startsWith('/api/')) {
      throw new Error('This demo is open on a static website. Open the deployed Node portal URL to send print requests.');
    }
    throw new Error(payload.error || 'The portal request failed.');
  }
  return payload;
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
}[character]));

const formatDate = (value) => new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium', timeStyle: 'short'
}).format(new Date(value));

const openOwnerModal = () => {
  ownerModal.hidden = false;
  document.body.classList.add('modal-open');
  setTimeout(() => shopForm?.querySelector('input[name="username"]')?.focus(), 0);
};

const closeOwnerModal = () => {
  ownerModal.hidden = true;
  document.body.classList.remove('modal-open');
};

const setOwnerMessage = (message, isError = false) => {
  shopMessage.hidden = false;
  shopMessage.textContent = message;
  shopMessage.style.background = isError ? '#f5d6cf' : 'var(--sage)';
};

const renderOrders = (orders) => {
  orderCount.textContent = `${orders.length} request${orders.length === 1 ? '' : 's'}`;
  if (!orders.length) {
    ordersList.innerHTML = '<p class="empty-orders">No print requests yet. New requests will appear here.</p>';
    return;
  }
  ordersList.innerHTML = orders.map((order) => `
    <article class="order-card" data-order-id="${escapeHtml(order.id)}">
      <div class="order-card-head"><div><strong>${escapeHtml(order.id)}</strong><small>${escapeHtml(formatDate(order.createdAt))}</small></div>
        <select class="order-status" aria-label="Status for ${escapeHtml(order.id)}" data-order-id="${escapeHtml(order.id)}">
          ${['New', 'Printing', 'Ready', 'Delivered'].map((status) => `<option ${order.status === status ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
      </div>
      <div class="order-details">
        <p><b>WhatsApp</b><span>${escapeHtml(order.whatsapp)}</span></p>
        <p><b>PDF</b><a href="/api/orders/${encodeURIComponent(order.id)}/file" target="_blank" rel="noreferrer">${escapeHtml(order.fileName)} ↗</a></p>
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

const loadOrders = async () => {
  const payload = await api('/api/orders');
  ownerDesk.hidden = false;
  renderOrders(payload.orders);
};

ownerLoginButton?.addEventListener('click', openOwnerModal);
ownerModalClose?.addEventListener('click', closeOwnerModal);
ownerModal?.querySelector('[data-close-owner]')?.addEventListener('click', closeOwnerModal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !ownerModal.hidden) closeOwnerModal();
});

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
  if (file.type !== 'application/pdf' || file.size > 10 * 1024 * 1024) {
    pdfInput.value = '';
    fileName.innerHTML = 'Choose your PDF<br><small>PDF only · up to 10 MB</small>';
    alert(file.type !== 'application/pdf' ? 'Please choose a PDF file.' : 'Please choose a PDF smaller than 10 MB.');
    return;
  }
  fileName.textContent = file.name;
});

const readAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const file = pdfInput?.files?.[0];
  if (!file) return;
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const payload = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        whatsapp: data.get('whatsapp'), token: data.get('token'), fileName: file.name,
        fileData: await readAsDataUrl(file), printType: data.get('printType'),
        delivery: data.get('delivery'), message: data.get('message')
      })
    });
    success.hidden = false;
    success.textContent = `Order ${payload.order.id} was submitted. The shop will contact you using the number provided.`;
    form.reset();
    fileName.innerHTML = 'Choose your PDF<br><small>PDF only · up to 10 MB</small>';
  } catch (error) {
    success.hidden = false;
    success.style.background = '#f5d6cf';
    success.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});

shopForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(shopForm);
  try {
    await api('/api/login', { method: 'POST', body: JSON.stringify({ username: data.get('username'), password: data.get('password') }) });
    shopForm.reset();
    setOwnerMessage('Owner desk unlocked.');
    await loadOrders();
  } catch (error) {
    const message = error.message === 'Failed to fetch'
      ? 'The owner portal is not connected to its server. Open the deployed Node portal URL, not a static GitHub Pages URL.'
      : error.message;
    setOwnerMessage(message, true);
  }
});

ownerLogout?.addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' }).catch(() => {});
  ownerDesk.hidden = true;
  shopMessage.hidden = true;
  closeOwnerModal();
});

clearOrders?.addEventListener('click', async () => {
  if (!confirm('Remove all orders from the portal?')) return;
  try {
    const payload = await api('/api/orders', { method: 'DELETE' });
    renderOrders(payload.orders);
  } catch (error) {
    setOwnerMessage(error.message, true);
  }
});

ordersList?.addEventListener('change', async (event) => {
  const target = event.target.closest('.order-status');
  if (!target) return;
  try {
    await api(`/api/orders/${encodeURIComponent(target.dataset.orderId)}`, { method: 'PATCH', body: JSON.stringify({ status: target.value }) });
    await loadOrders();
  } catch (error) {
    setOwnerMessage(error.message, true);
  }
});

ordersList?.addEventListener('click', async (event) => {
  const target = event.target.closest('.delete-order');
  if (!target) return;
  try {
    await api(`/api/orders/${encodeURIComponent(target.dataset.orderId)}`, { method: 'DELETE' });
    await loadOrders();
  } catch (error) {
    setOwnerMessage(error.message, true);
  }
});

api('/api/session').then(async (session) => {
  const directOwnerAccess = new URLSearchParams(window.location.search).get('owner') === '1';
  if (!session.authenticated && !directOwnerAccess) return;
  openOwnerModal();
  if (session.authenticated) await loadOrders();
}).catch(() => {});
