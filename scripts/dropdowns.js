function closeDropdowns(except) {
  document.querySelectorAll('.dropdown.open').forEach(dropdown => {
    if (dropdown === except) return;
    dropdown.classList.remove('open');
    dropdown.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'false');
  });
}

function openDropdown(dropdown) {
  closeDropdowns(dropdown);
  dropdown.classList.add('open');
  dropdown.querySelector('.dropdown-toggle').setAttribute('aria-expanded', 'true');
}

document.addEventListener('click', event => {
  const toggle = event.target.closest('.dropdown-toggle');
  if (toggle) {
    const dropdown = toggle.closest('.dropdown');
    if (dropdown.classList.contains('open')) {
      closeDropdowns();
    } else {
      openDropdown(dropdown);
    }
  } else {
    closeDropdowns();
  }
});

document.addEventListener('keydown', event => {
  const dropdown = event.target.closest('.dropdown');
  if (!dropdown) return;
  const toggle = dropdown.querySelector('.dropdown-toggle');
  if (event.key === 'Escape' && dropdown.classList.contains('open')) {
    event.preventDefault();
    closeDropdowns();
    toggle.focus();
  } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    openDropdown(dropdown);
    const links = Array.from(dropdown.querySelectorAll('.dropdown-menu a[href]'));
    if (!links.length) return;
    const current = links.indexOf(document.activeElement);
    let next;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = links.length - 1;
    else if (event.key === 'ArrowDown') next = (current + 1) % links.length;
    else next = current <= 0 ? links.length - 1 : current - 1;
    links[next].focus();
  }
});

document.addEventListener('focusin', event => {
  closeDropdowns(event.target.closest('.dropdown'));
});