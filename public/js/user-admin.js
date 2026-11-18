const initializeUserAdmin = async () => {
  const root = document.getElementById('user-admin');
  const list = document.getElementById('users-list');
  const template = document.getElementById('user-card-template');
  const loading = document.getElementById('users-loading');
  const error = document.getElementById('users-error');
  const status = document.getElementById('users-status');
  const empty = document.getElementById('users-empty');
  let currentUserId;
  let csrfToken;
  let busy = false;

  const setBusy = (value) => {
    busy = value;
    root.querySelectorAll('button, input').forEach((control) => { control.disabled = value; });
  };

  const showError = (message) => {
    error.textContent = message;
    error.hidden = false;
  };

  const request = async (url, options) => {
    const response = await fetch(url, options);
    if (response.status === 401) {
      window.location.assign('/login');
      throw new Error('Your session has ended. Please log in again.');
    }
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to complete this request.');
    }
    return payload;
  };

  const loadUsers = async () => {
    loading.hidden = false;
    const payload = await request('/api/users');
    if (!Array.isArray(payload.users) || !payload.csrfToken || !payload.currentUserId) {
      throw new Error('Unable to load profiles. Please try again.');
    }
    currentUserId = payload.currentUserId;
    csrfToken = payload.csrfToken;
    const fragment = document.createDocumentFragment();
    for (const user of payload.users) {
      const card = template.content.cloneNode(true);
      const form = card.querySelector('form');
      form.dataset.userId = user.id;
      card.querySelector('[data-field="heading"]').textContent = user.displayName;
      card.querySelector('[data-field="role"]').textContent = user.role;
      for (const field of ['displayName', 'username', 'email']) {
        form.elements.namedItem(field).value = user[field];
      }
      fragment.appendChild(card);
    }
    list.replaceChildren(fragment);
    empty.hidden = payload.users.length > 0;
    const self = payload.users.find((user) => user.id === currentUserId);
    const signedInName = document.querySelector('[data-session-name]');
    if (self && signedInName) {
      signedInName.textContent = `Signed in as ${self.displayName}`;
    }
  };

  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    error.hidden = true;
    status.textContent = '';
    try {
      await loadUsers();
    } catch (failure) {
      showError(failure.message || 'Unable to load profiles. Please try again.');
    } finally {
      loading.hidden = true;
      setBusy(false);
    }
  };

  const mutate = async (form, method) => {
    if (busy) return;
    setBusy(true);
    error.hidden = true;
    status.textContent = '';
    let saved = false;
    try {
      const options = { method, headers: { 'X-CSRF-Token': csrfToken } };
      if (method === 'PATCH') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(Object.fromEntries(
          ['displayName', 'username', 'email'].map((field) => [field, form.elements.namedItem(field).value])
        ));
      }
      const result = await request(`/api/users/${encodeURIComponent(form.dataset.userId)}`, options);
      if (result.signedOut) {
        window.location.assign('/login');
        return;
      }
      saved = true;
      await loadUsers();
      status.textContent = method === 'PATCH' ? 'Profile updated.' : 'Account deleted.';
    } catch (failure) {
      showError(saved
        ? 'Your change was saved, but the list could not be refreshed. Refresh profiles to try again.'
        : failure.message || 'Unable to save this change. Please try again.');
    } finally {
      loading.hidden = true;
      setBusy(false);
    }
  };

  list.addEventListener('submit', async (event) => {
    event.preventDefault();
    await mutate(event.target, 'PATCH');
  });
  list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action="delete"]');
    if (!button || busy) return;
    const form = button.closest('form');
    const message = form.dataset.userId === currentUserId
      ? 'Delete your account? You will be signed out. This cannot be undone.'
      : 'Delete this account? This cannot be undone.';
    if (window.confirm(message)) {
      await mutate(form, 'DELETE');
    }
  });
  document.getElementById('users-refresh').addEventListener('click', refresh);
  await refresh();
};

initializeUserAdmin();
