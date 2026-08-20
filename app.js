const form = document.querySelector('#order-form');
const pdfInput = document.querySelector('#pdf');
const fileName = document.querySelector('#file-name');
const success = document.querySelector('#success');
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const whatsappNumber = '919999999999';

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
  const text = [
    'Hello PrintHub, I want to print.',
    `Order: ${orderNumber}`,
    `WhatsApp: ${data.get('whatsapp')}`,
    `Token / order no: ${data.get('token') || 'Not provided'}`,
    `File: ${file.name}`,
    `Print type: ${data.get('printType')}`,
    `Delivery: ${data.get('delivery')}`,
    `Message: ${data.get('message')}`
  ].join('\n');
  success.hidden = false;
  success.textContent = `Order ${orderNumber} is ready to send. WhatsApp is opening now.`;
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
});
