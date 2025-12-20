# ZogKit

**Essential utilities plugin for Zog.js**

[![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)](https://github.com/zogjs/kit)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

ZogKit is a comprehensive utilities plugin that extends Zog.js with powerful features including HTTP client, storage helpers, DOM directives, event bus, and performance utilities.

## 📦 Installation

```bash
npm install @zogjs/kit
```

## 🚀 Quick Start

```javascript
import { createApp, ref } from './zog.js';
import ZogKit from './zog-kit.js';

const kit = createApp(() => {
  const message = ref('Hello ZogKit!');
  
  return { message };
}).use(ZogKit, {
  baseURL: 'https://api.example.com',
  timeout: 30000,
  storagePrefix: 'myapp_'
});

kit.mount('#app');
```

## ⚠️ Important: How ZogKit Works

### Plugin API Access

When you call `.use(ZogKit)`, it returns an object containing all plugin APIs:

```javascript
const kit = app.use(ZogKit);
// kit now contains: { $http, $storage, $session, $clipboard, $bus, utils }
```

**Two common patterns:**

**Pattern 1: Chain everything**
```javascript
const kit = createApp(() => {
  async function loadData() {
    const { data } = await kit.$http.get('/api/data');
    return data;
  }
  return { loadData };
}).use(ZogKit, { baseURL: 'https://api.example.com' });

kit.mount('#app');
```

**Pattern 2: Separate declarations**
```javascript
const app = createApp(() => {
  async function loadData() {
    const { data } = await kit.$http.get('/api/data');
    return data;
  }
  return { loadData };
});

const kit = app.use(ZogKit, { baseURL: 'https://api.example.com' });

app.mount('#app');
```

### Understanding Refs in Templates vs JavaScript

**In templates (auto-unwrapped):**
```html
<p>{{ count }}</p>  <!-- ✅ No .value needed -->
<button :disabled="isLoading">Submit</button>  <!-- ✅ Auto-unwrapped -->
```

**In JavaScript (use .value):**
```javascript
count.value++;  // ✅ Must use .value
if (isLoading.value) { }  // ✅ Must use .value
```

**In z-for loops (items are ALWAYS refs):**
```html
<div z-for="user in users">
  <p>{{ user.name }}</p>  <!-- ✅ Auto-unwrapped in template -->
  <button @click="selectUser(user)">Select</button>
</div>
```

```javascript
function selectUser(user) {
  // user is a ref from z-for, must use .value
  console.log(user.value.name);  // ✅
}
```

---

## 📚 Features

### HTTP Client (`kit.$http`)
A powerful HTTP client with automatic JSON handling, timeout support, and request abortion.

### Storage Helpers (`kit.$storage`, `kit.$session`)
Enhanced localStorage and sessionStorage with TTL support and reactive state.

### DOM Directives
- `z-pre` - Skip compilation
- `z-once` - Render once without reactivity
- `z-cloak` - Hide until compiled
- `z-autofocus` - Auto focus elements
- `z-click-outside` - Detect outside clicks
- `z-lazy` - Lazy load images
- `z-copy` - Copy to clipboard

### Event Bus (`kit.$bus`)
Global event system for component communication.

### Performance Utilities (`kit.utils`)
- `debounce` - Debounce function calls
- `throttle` - Throttle function calls

### Clipboard Helper (`kit.$clipboard`)
Easy-to-use clipboard operations with fallback support.

---

## 📖 Detailed Documentation

### Configuration Options

```javascript
const kit = app.use(ZogKit, {
  // HTTP Client Options
  baseURL: '',           // Base URL for HTTP requests
  timeout: 30000,        // Request timeout in milliseconds
  headers: {},           // Default headers for all requests
  
  // Storage Options
  storagePrefix: 'zog_', // Prefix for storage keys
  storageTTL: null       // Default TTL for storage items
});
```

---

## 🌐 HTTP Client

The `kit.$http` service provides a clean API for making HTTP requests.

### Basic Usage

```javascript
import { createApp, ref, watchEffect } from './zog.js';
import ZogKit from './zog-kit.js';

const kit = createApp(() => {
  const users = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  async function loadUsers() {
    loading.value = true;
    error.value = null;
    
    try {
      // GET request
      const { data } = await kit.$http.get('/users');
      users.value = data;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }
  
  async function createUser(userData) {
    // POST request
    const { data } = await kit.$http.post('/users', userData);
    users.value.push(data);
  }
  
  async function updateUser(id, userData) {
    // PUT request
    await kit.$http.put(`/users/${id}`, userData);
  }
  
  async function deleteUser(id) {
    // DELETE request
    await kit.$http.delete(`/users/${id}`);
  }
  
  // Load users on mount
  watchEffect(() => {
    loadUsers();
  });
  
  return { users, loading, error, createUser, updateUser, deleteUser };
}).use(ZogKit, { baseURL: 'https://api.example.com' });

kit.mount('#app');
```

### Advanced Usage

```javascript
// Custom headers
const { data } = await kit.$http.get('/api/data', {
  headers: {
    'Authorization': 'Bearer token123'
  }
});

// Custom timeout
const response = await kit.$http.post('/api/upload', formData, {
  timeout: 60000
});

// Full response access
const { data, response, status } = await kit.$http.get('/users');
console.log(status); // 200
console.log(response.headers);
```

### FormData Support

```javascript
const kit = createApp(() => {
  async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    await kit.$http.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
  
  return { uploadFile };
}).use(ZogKit);
```

---

## 💾 Storage Helpers

Enhanced storage with TTL support and reactive state.

### LocalStorage (`kit.$storage`)

```javascript
import { createApp } from './zog.js';
import ZogKit from './zog-kit.js';

const kit = createApp(() => {
  // Set value
  kit.$storage.set('user', { name: 'John', age: 30 });
  
  // Get value
  const user = kit.$storage.get('user');
  
  // With default value
  const theme = kit.$storage.get('theme', 'light');
  
  // Set with TTL (5 minutes)
  kit.$storage.set('token', 'abc123', 5 * 60 * 1000);
  
  // Check if exists
  if (kit.$storage.has('token')) {
    console.log('Token exists');
  }
  
  // Remove item
  function logout() {
    kit.$storage.remove('token');
  }
  
  // Clear all prefixed items
  function clearAll() {
    kit.$storage.clear();
  }
  
  return { logout, clearAll };
}).use(ZogKit, { storagePrefix: 'myapp_' });
```

### SessionStorage (`kit.$session`)

```javascript
// Same API as $storage
kit.$session.set('tempData', { foo: 'bar' });
const data = kit.$session.get('tempData');
```

### Reactive Storage

Create reactive state that automatically syncs with storage:

```javascript
import { createApp } from './zog.js';
import ZogKit from './zog-kit.js';

const kit = createApp(() => {
  // Reactive localStorage
  const theme = kit.$storage.reactive('theme', 'light');
  
  function toggleTheme() {
    // Changes automatically saved to localStorage
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }
  
  return { theme, toggleTheme };
}).use(ZogKit);

kit.mount('#app');
```

```html
<div id="app">
  <p>Current theme: {{ theme }}</p>
  <button @click="toggleTheme">Toggle Theme</button>
</div>
```

---

## 🎯 DOM Directives

### z-pre

Skip Zog compilation entirely for static content:

```html
<div z-pre>
  {{ This will not be compiled }}
  <span :class="notReactive">Static content</span>
</div>
```

### z-once

Render once without reactivity (improves performance for static data):

```html
<div z-once>
  <h1>{{ user.name }}</h1>
  <p>{{ user.bio }}</p>
</div>
```

**Use case:** Display data that won't change after initial render.

### z-cloak

Hide element until compilation is complete (prevents flash of uncompiled content):

```html
<div z-cloak>
  {{ message }}
</div>
```

Automatically adds CSS rule: `[z-cloak] { display: none !important; }`

### z-autofocus

Automatically focus an element when it appears:

```html
<input z-autofocus type="text" placeholder="Auto-focused">

<!-- Works with z-if -->
<input z-if="showModal" z-autofocus type="text">
```

### z-click-outside

Detect clicks outside an element (perfect for dropdowns, modals):

```javascript
import { createApp, ref } from './zog.js';

const kit = createApp(() => {
  const isOpen = ref(false);
  
  function close() {
    isOpen.value = false;
  }
  
  return { isOpen, close };
}).use(ZogKit);
```

```html
<div z-click-outside="close" class="dropdown">
  <button @click="isOpen = !isOpen">Toggle</button>
  <ul z-show="isOpen">
    <li>Option 1</li>
    <li>Option 2</li>
  </ul>
</div>
```

### z-lazy

Lazy load images when they enter the viewport:

```html
<!-- Image loads when scrolled into view -->
<img z-lazy="https://example.com/large-image.jpg" alt="Lazy loaded">
```

**Benefits:**
- Faster initial page load
- Reduced bandwidth usage
- Automatic IntersectionObserver integration

### z-copy

Copy text to clipboard on click:

```javascript
import { createApp, ref } from './zog.js';

const kit = createApp(() => {
  const code = ref('npm install @zogjs/kit');
  
  function showNotification() {
    console.log('Copied!');
  }
  
  return { code, showNotification };
}).use(ZogKit);
```

```html
<button z-copy="code">Copy Code</button>

<!-- Listen to copied event -->
<button z-copy="code" @copied="showNotification">Copy</button>
```

---

## 🎭 Event Modifiers

### Important: Event Modifier Support

**ZogKit adds custom modifiers** (`.debounce`, `.throttle`) to Zog.js:

```html
<!-- ✅ These work (added by ZogKit): -->
<input @input.debounce.500="search">
<div @scroll.throttle.1000="handleScroll">

<!-- ❌ Standard modifiers DON'T work (Zog.js limitation): -->
<form @submit.prevent="onSubmit">  <!-- .prevent not supported -->
<input @keyup.enter="search">      <!-- .enter not supported -->
<button @click.stop="onClick">     <!-- .stop not supported -->
```

**Workaround for standard modifiers:**

```javascript
const kit = createApp(() => {
  function onSubmit(e) {
    e.preventDefault();  // ✅ Do it manually
    e.stopPropagation(); // ✅ Do it manually
    // Your logic here
  }
  
  function onKeyup(e) {
    if (e.key === 'Enter') {  // ✅ Check manually
      search();
    }
  }
  
  return { onSubmit, onKeyup };
}).use(ZogKit);
```

### Debounce

Delay function execution until after wait time has elapsed:

```html
<!-- Wait 500ms after user stops typing -->
<input @input.debounce.500="search" type="text">

<!-- Default delay is 300ms -->
<input @keyup.debounce="handleInput">
```

**Important:** The handler must exist in scope:

```javascript
const kit = createApp(() => {
  const query = ref('');
  
  function search() {
    console.log('Searching for:', query.value);
  }
  
  return { query, search };
}).use(ZogKit);
```

**Use case:** Search inputs, form validation

### Throttle

Execute function at most once per specified time period:

```html
<!-- Execute at most once per 1000ms -->
<div @scroll.throttle.1000="handleScroll">Scrollable content</div>

<!-- Default limit is 300ms -->
<button @click.throttle="saveData">Save</button>
```

**Use case:** Scroll handlers, resize handlers, rapid button clicks

---

## 📢 Event Bus

Global event system for component communication.

### Basic Usage

```javascript
const kit = createApp(() => {
  function login(userId) {
    // Emit event
    kit.$bus.emit('user-login', { userId });
  }
  
  // Listen for event
  kit.$bus.on('user-login', (data) => {
    console.log('User logged in:', data.userId);
  });
  
  return { login };
}).use(ZogKit);
```

### Complete API

```javascript
import { createApp, watchEffect } from './zog.js';
import ZogKit from './zog-kit.js';

const kit = createApp(() => {
  // Listen to event
  const unsubscribe = kit.$bus.on('message', (data) => {
    console.log('Received:', data);
  });
  
  // Remove listener
  function cleanup() {
    unsubscribe();
    // or
    kit.$bus.off('message', handler);
  }
  
  // Listen once
  kit.$bus.once('init', () => {
    console.log('Initialized once');
  });
  
  // Emit event
  function sendMessage(text) {
    kit.$bus.emit('message', { text });
  }
  
  // Clear specific event listeners
  function clearMessages() {
    kit.$bus.clear('message');
  }
  
  // Clear all listeners
  function clearAll() {
    kit.$bus.clear();
  }
  
  return { sendMessage, cleanup, clearMessages, clearAll };
}).use(ZogKit);
```

### Real-world Example

```javascript
import { createApp, ref, reactive } from './zog.js';
import ZogKit from './zog-kit.js';

// Notification Manager
const notificationApp = createApp(() => {
  const notifications = reactive([]);
  
  notificationKit.$bus.on('notify', (message) => {
    notifications.push(message);
    setTimeout(() => notifications.shift(), 3000);
  });
  
  return { notifications };
}).use(ZogKit);

const notificationKit = notificationApp;

// User Manager that emits notifications
const userApp = createApp(() => {
  async function saveUser(userData) {
    try {
      await userKit.$http.post('/users', userData);
      userKit.$bus.emit('notify', { 
        type: 'success', 
        text: 'User saved successfully!' 
      });
    } catch (error) {
      userKit.$bus.emit('notify', { 
        type: 'error', 
        text: 'Failed to save user' 
      });
    }
  }
  
  return { saveUser };
}).use(ZogKit);

const userKit = userApp;
```

---

## 📋 Clipboard Helper

Copy text to clipboard with automatic fallback.

```javascript
const kit = createApp(() => {
  const message = ref('');
  
  async function copyToClipboard(text) {
    const success = await kit.$clipboard.copy(text);
    
    if (success) {
      message.value = 'Copied!';
    } else {
      message.value = 'Copy failed';
    }
  }
  
  return { message, copyToClipboard };
}).use(ZogKit);
```

**Features:**
- Modern Clipboard API with fallback
- Automatic error handling
- Works in all browsers

---

## ⚡ Performance Utilities

### Debounce Function

```javascript
import { createApp, ref } from './zog.js';
import ZogKit from './zog-kit.js';

const kit = createApp(() => {
  const query = ref('');
  
  // Create debounced function
  const search = kit.utils.debounce(function() {
    // API call
    kit.$http.get('/search?q=' + query.value);
  }, 500);
  
  return { query, search };
}).use(ZogKit);
```

### Throttle Function

```javascript
import { createApp, ref, watchEffect } from './zog.js';
import ZogKit from './zog-kit.js';

const kit = createApp(() => {
  const scrollPosition = ref(0);
  
  const handleScroll = kit.utils.throttle(function() {
    scrollPosition.value = window.scrollY;
  }, 100);
  
  // Add scroll listener
  watchEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });
  
  return { scrollPosition };
}).use(ZogKit);
```

---

## 🔧 Complete Example

Here's a comprehensive example using multiple ZogKit features:

```javascript
import { createApp, ref, reactive, watchEffect } from './zog.js';
import ZogKit from './zog-kit.js';

const kit = createApp(() => {
  const users = ref([]);
  const loading = ref(false);
  const searchQuery = ref('');
  const isDropdownOpen = ref(false);
  const selectedUser = ref(null);
  
  // Load users on mount
  watchEffect(() => {
    loadUsers();
  });
  
  // Listen for global events
  watchEffect(() => {
    const cleanup = kit.$bus.on('user-updated', loadUsers);
    return cleanup; // Cleanup on unmount
  });
  
  // Load saved preferences
  const lastSearch = kit.$storage.get('lastSearch', '');
  searchQuery.value = lastSearch;
  
  async function loadUsers() {
    loading.value = true;
    try {
      const { data } = await kit.$http.get('/api/users');
      users.value = data;
    } catch (error) {
      kit.$bus.emit('notify', { 
        type: 'error', 
        text: 'Failed to load users' 
      });
    } finally {
      loading.value = false;
    }
  }
  
  // Debounced search
  const search = kit.utils.debounce(async function(query) {
    kit.$storage.set('lastSearch', query);
    try {
      const { data } = await kit.$http.get(`/api/search?q=${query}`);
      users.value = data;
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, 500);
  
  function closeDropdown() {
    isDropdownOpen.value = false;
  }
  
  async function copyUserId(user) {
    // user is a ref from z-for, so use .value
    const id = user.value.id;
    const success = await kit.$clipboard.copy(id);
    
    if (success) {
      kit.$bus.emit('notify', { 
        type: 'success', 
        text: 'User ID copied!' 
      });
    }
  }
  
  return { 
    users, 
    loading, 
    searchQuery, 
    isDropdownOpen, 
    selectedUser,
    loadUsers,
    search,
    closeDropdown,
    copyUserId
  };
}).use(ZogKit, {
  baseURL: 'https://api.example.com',
  timeout: 30000,
  storagePrefix: 'myapp_'
});

kit.mount('#app');
```

```html
<div id="app" z-cloak>
  <!-- Search Input with Debounce -->
  <input 
    z-autofocus
    z-model="searchQuery"
    @input="search(searchQuery)"
    type="text" 
    placeholder="Search users..."
  >
  
  <!-- Loading State -->
  <div z-if="loading">Loading...</div>
  
  <!-- User List -->
  <div z-else>
    <div z-for="user in users" :key="user.id">
      <!-- Lazy Loaded Avatar -->
      <img z-lazy="user.avatar" :alt="user.name">
      
      <!-- User Info (Rendered Once) -->
      <div z-once>
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
      </div>
      
      <!-- Copy User ID - user is a ref from z-for -->
      <button @click="copyUserId(user)">Copy ID</button>
    </div>
  </div>
  
  <!-- Dropdown with Click Outside -->
  <div z-click-outside="closeDropdown" class="dropdown">
    <button @click="isDropdownOpen = !isDropdownOpen">Options</button>
    <ul z-show="isDropdownOpen">
      <li>Option 1</li>
      <li>Option 2</li>
    </ul>
  </div>
</div>
```

---

## 🎨 Best Practices

### 1. Use z-once for Static Content

```html
<!-- ✅ Good: Static user profile -->
<div z-once>
  <h1>{{ user.name }}</h1>
  <p>{{ user.bio }}</p>
</div>

<!-- ❌ Bad: Dynamic counter -->
<div z-once>
  <p>Count: {{ count }}</p> <!-- Won't update! -->
</div>
```

### 2. Combine z-cloak with Loading States

```html
<div z-cloak>
  <div z-if="loading">Loading...</div>
  <div z-else>{{ content }}</div>
</div>
```

### 3. Use Method Handlers Instead of Inline Expressions

```html
<!-- ❌ Bad: Inline expression with ref -->
<button @click="count.value++">Increment</button>

<!-- ✅ Good: Method handler -->
<button @click="increment">Increment</button>
```

```javascript
function increment() {
  count.value++;
}
```

### 4. Handle z-for Items Correctly

```javascript
// z-for ALWAYS wraps items in ref()
function selectUser(user) {
  // user is a ref from z-for
  console.log(user.value.name);  // ✅ Use .value
  selectedUser.value = user.value;
}
```

### 5. Use Appropriate Debounce/Throttle Delays

```html
<!-- Search: 300-500ms -->
<input @input.debounce.500="search">

<!-- Scroll: 100-200ms -->
<div @scroll.throttle.100="onScroll">
```

### 6. Clean Up Event Listeners

```javascript
import { createApp, watchEffect } from './zog.js';

const kit = createApp(() => {
  // Setup listener with cleanup
  watchEffect(() => {
    const unsubscribe = kit.$bus.on('event', handler);
    return unsubscribe; // Called on unmount
  });
  
  return { };
}).use(ZogKit);
```

### 7. Use Storage with TTL for Sensitive Data

```javascript
// Token expires in 1 hour
kit.$storage.set('authToken', token, 60 * 60 * 1000);
```

---

## 🛠 Troubleshooting

### HTTP Requests Not Working

- Check if `baseURL` is configured correctly
- Verify CORS headers on your API
- Check browser console for errors
- Ensure you're using `kit.$http`, not `this.$http`

### z-click-outside Not Triggering

- Ensure the element is in the DOM
- Check if click event is bubbling properly
- Verify the function exists in the returned scope object

### Storage Not Persisting

- Check if localStorage is available
- Verify storage quota isn't exceeded
- Check browser privacy settings
- Ensure storagePrefix is set correctly

### z-autofocus Not Working

- Ensure element is focusable (input, textarea, button, etc.)
- Check if element is visible (z-if/z-show)
- Verify no conflicting autofocus attributes

### Refs Not Working in Templates

```html
<!-- ❌ Wrong -->
<p>{{ count.value }}</p>

<!-- ✅ Correct -->
<p>{{ count }}</p>
```

### Event Handlers Not Finding Functions

```javascript
// ❌ Wrong - function not returned
const kit = createApp(() => {
  function myHandler() { }
  return { }; // myHandler not exposed!
}).use(ZogKit);

// ✅ Correct - function returned in scope
const kit = createApp(() => {
  function myHandler() { }
  return { myHandler }; // Now accessible in template
}).use(ZogKit);
```

---

## 📄 API Reference

### kit.$http

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `get(url, options)` | url: string, options: object | Promise | GET request |
| `post(url, body, options)` | url: string, body: any, options: object | Promise | POST request |
| `put(url, body, options)` | url: string, body: any, options: object | Promise | PUT request |
| `delete(url, options)` | url: string, options: object | Promise | DELETE request |

### kit.$storage / kit.$session

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `set(key, value, ttl)` | key: string, value: any, ttl: number | boolean | Store value |
| `get(key, defaultValue)` | key: string, defaultValue: any | any | Retrieve value |
| `remove(key)` | key: string | void | Remove item |
| `clear()` | - | void | Clear all prefixed items |
| `has(key)` | key: string | boolean | Check if exists |
| `reactive(key, defaultValue, ttl)` | key: string, defaultValue: any, ttl: number | Ref | Reactive storage |

### kit.$clipboard

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `copy(text)` | text: string | Promise\<boolean\> | Copy to clipboard |

### kit.$bus

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `on(event, handler)` | event: string, handler: function | function | Listen to event (returns unsubscribe) |
| `off(event, handler)` | event: string, handler: function | void | Remove listener |
| `emit(event, data)` | event: string, data: any | void | Emit event |
| `once(event, handler)` | event: string, handler: function | void | Listen once |
| `clear(event)` | event: string | void | Clear listeners for event |
| `clear()` | - | void | Clear all listeners |

### kit.utils

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `debounce(fn, delay)` | fn: function, delay: number | function | Debounced function |
| `throttle(fn, limit)` | fn: function, limit: number | function | Throttled function |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - see LICENSE file for details.