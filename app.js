const form = document.querySelector('#order-form');
const pdfInput = document.querySelector('#pdf');
const fileName = document.querySelector('#file-name');
const success = document.querySelector('#success');
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
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

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const file = pdfInput?.files?.[0];
  if (!file) return;
  const orderNumber = `PH-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  success.hidden = false;
  success.textContent = `Order ${orderNumber} saved on this device. The shop will review your request and contact you using the number provided.`;
  form.reset();
  fileName.innerHTML = 'Choose your PDF<br><small>PDF only · up to 10 MB</small>';
});

const shopForm = document.querySelector('#shop-login-form');
const shopMessage = document.querySelector('#shop-message');
shopForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(shopForm);
  const username = String(data.get('username') || '');
  const password = String(data.get('password') || '');
  shopMessage.hidden = false;
  if (username === 'admin' && password === 'admin') {
    shopMessage.textContent = 'Shop login successful. Incoming student requests will appear in the shop workspace.';
    shopMessage.style.background = 'var(--sage)';
    shopForm.reset();
  } else {
    shopMessage.textContent = 'Incorrect username or password.';
    shopMessage.style.background = '#f5d6cf';
  }
});
