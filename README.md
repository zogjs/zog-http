# ZogKit

**Essential utilities plugin for Zog.js**

[![Version](https://img.shields.io/badge/version-1.0.4-blue.svg)](https://github.com/zogjs/kit)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

ZogKit is a comprehensive utilities plugin that extends Zog.js with powerful features including HTTP client, storage helpers, DOM directives, event bus, and performance utilities.

## 📦 Installation

```bash
npm install @zogjs/kit
```

## 🚀 Quick Start

```javascript
import Zog from 'zog';
import ZogKit from '@zogjs/kit';

const app = Zog.createApp({
  // your app config
});

app.use(ZogKit, {
  baseURL: 'https://api.example.com',
  timeout: 30000,
  storagePrefix: 'myapp_'
});

app.mount('#app');
```

## 📚 Features

### HTTP Client (`$http`)
A powerful HTTP client with automatic JSON handling, timeout support, and request abortion.

### Storage Helpers (`$storage`, `$session`)
Enhanced localStorage and sessionStorage with TTL support and reactive state.

### DOM Directives
- `z-pre` - Skip compilation
- `z-once` - Render once without reactivity
- `z-cloak` - Hide until compiled
- `z-autofocus` - Auto focus elements
- `z-click-outside` - Detect outside clicks
- `z-lazy` - Lazy load images
- `z-copy` - Copy to clipboard

### Event Bus (`$bus`)
Global event system for component communication.

### Performance Utilities
- `debounce` - Debounce function calls
- `throttle` - Throttle function calls

### Clipboard Helper (`$clipboard`)
Easy-to-use clipboard operations with fallback support.

---

## 📖 Detailed Documentation

### Configuration Options

```javascript
app.use(ZogKit, {
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

The `$http` service provides a clean API for making HTTP requests.

### Basic Usage

```javascript
const app = Zog.createApp({
  async mounted() {
    // GET request
    const { data } = await this.$http.get('/users');
    
    // POST request
    const response = await this.$http.post('/users', {
      name: 'John Doe',
      email: 'john@example.com'
    });
    
    // PUT request
    await this.$http.put('/users/1', { name: 'Jane Doe' });
    
    // DELETE request
    await this.$http.delete('/users/1');
  }
});
```

### Advanced Usage

```javascript
// Custom headers
const { data } = await this.$http.get('/api/data', {
  headers: {
    'Authorization': 'Bearer token123'
  }
});

// Custom timeout
const response = await this.$http.post('/api/upload', formData, {
  timeout: 60000
});

// Full response access
const { data, response, status } = await this.$http.get('/users');
console.log(status); // 200
console.log(response.headers);
```

### FormData Support

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

await this.$http.post('/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

---

## 💾 Storage Helpers

Enhanced storage with TTL support and reactive state.

### LocalStorage (`$storage`)

```javascript
const app = Zog.createApp({
  mounted() {
    // Set value
    this.$storage.set('user', { name: 'John', age: 30 });
    
    // Get value
    const user = this.$storage.get('user');
    
    // With default value
    const theme = this.$storage.get('theme', 'light');
    
    // Set with TTL (5 minutes)
    this.$storage.set('token', 'abc123', 5 * 60 * 1000);
    
    // Check if exists
    if (this.$storage.has('token')) {
      console.log('Token exists');
    }
    
    // Remove item
    this.$storage.remove('token');
    
    // Clear all prefixed items
    this.$storage.clear();
  }
});
```

### SessionStorage (`$session`)

```javascript
// Same API as $storage
this.$session.set('tempData', { foo: 'bar' });
const data = this.$session.get('tempData');
```

### Reactive Storage

Create reactive state that automatically syncs with storage:

```javascript
const app = Zog.createApp({
  setup() {
    // Reactive localStorage
    const theme = this.$storage.reactive('theme', 'light');
    
    // Changes automatically saved
    theme.value = 'dark'; // Saved to localStorage
    
    return { theme };
  }
});
```

```html
<div>
  <p>Current theme: {{ theme }}</p>
  <button @click="theme = theme === 'light' ? 'dark' : 'light'">
    Toggle Theme
  </button>
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
const app = Zog.createApp({
  data: {
    isOpen: false
  },
  methods: {
    close() {
      this.isOpen = false;
    }
  }
});
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
const app = Zog.createApp({
  data: {
    code: 'npm install @zogjs/kit'
  }
});
```

```html
<button z-copy="code">Copy Code</button>

<!-- Listen to copied event -->
<button z-copy="code" @copied="showNotification">
  Copy
</button>
```

---

## 🎭 Event Modifiers

### Debounce

Delay function execution until after wait time has elapsed:

```html
<!-- Wait 500ms after user stops typing -->
<input @input.debounce.500="search" type="text">

<!-- Default delay is 300ms -->
<input @keyup.debounce="handleInput">
```

**Use case:** Search inputs, form validation

### Throttle

Execute function at most once per specified time period:

```html
<!-- Execute at most once per 1000ms -->
<div @scroll.throttle.1000="handleScroll">
  Scrollable content
</div>

<!-- Default limit is 300ms -->
<button @click.throttle="saveData">Save</button>
```

**Use case:** Scroll handlers, resize handlers, rapid button clicks

---

## 📢 Event Bus

Global event system for component communication.

### Basic Usage

```javascript
// Component A - Emit event
this.$bus.emit('user-login', { userId: 123 });

// Component B - Listen for event
this.$bus.on('user-login', (data) => {
  console.log('User logged in:', data.userId);
});
```

### Complete API

```javascript
const app = Zog.createApp({
  mounted() {
    // Listen to event
    const unsubscribe = this.$bus.on('message', (data) => {
      console.log('Received:', data);
    });
    
    // Remove listener
    unsubscribe();
    // or
    this.$bus.off('message', handler);
    
    // Listen once
    this.$bus.once('init', () => {
      console.log('Initialized once');
    });
    
    // Emit event
    this.$bus.emit('message', { text: 'Hello' });
    
    // Clear specific event listeners
    this.$bus.clear('message');
    
    // Clear all listeners
    this.$bus.clear();
  }
});
```

### Real-world Example

```javascript
// Notification system
const NotificationManager = Zog.createApp({
  data: {
    notifications: []
  },
  mounted() {
    this.$bus.on('notify', (message) => {
      this.notifications.push(message);
      setTimeout(() => this.notifications.shift(), 3000);
    });
  }
});

// Somewhere in your app
this.$bus.emit('notify', { 
  type: 'success', 
  text: 'Data saved successfully!' 
});
```

---

## 📋 Clipboard Helper

Copy text to clipboard with automatic fallback.

```javascript
const app = Zog.createApp({
  async copyToClipboard() {
    const success = await this.$clipboard.copy('Text to copy');
    
    if (success) {
      console.log('Copied!');
    }
  }
});
```

**Features:**
- Modern Clipboard API with fallback
- Automatic error handling
- Works in all browsers

---

## ⚡ Performance Utilities

### Debounce Function

```javascript
const app = Zog.createApp({
  methods: {
    search: this.utils.debounce(function(query) {
      // API call
      this.$http.get('/search?q=' + query);
    }, 500)
  }
});
```

### Throttle Function

```javascript
const app = Zog.createApp({
  methods: {
    handleScroll: this.utils.throttle(function() {
      // Heavy computation
      this.updateScrollPosition();
    }, 100)
  }
});
```

---

## 🔧 Complete Example

Here's a comprehensive example using multiple ZogKit features:

```javascript
import Zog from 'zog';
import ZogKit from '@zogjs/kit';

const app = Zog.createApp({
  data: {
    users: [],
    loading: false,
    searchQuery: '',
    isDropdownOpen: false,
    selectedUser: null
  },
  
  async mounted() {
    // Load users from API
    await this.loadUsers();
    
    // Listen for global events
    this.$bus.on('user-updated', this.loadUsers);
    
    // Load saved preferences
    this.searchQuery = this.$storage.get('lastSearch', '');
  },
  
  methods: {
    async loadUsers() {
      this.loading = true;
      try {
        const { data } = await this.$http.get('/api/users');
        this.users = data;
      } catch (error) {
        this.$bus.emit('notify', { 
          type: 'error', 
          text: 'Failed to load users' 
        });
      } finally {
        this.loading = false;
      }
    },
    
    search: this.utils.debounce(async function(query) {
      this.$storage.set('lastSearch', query);
      const { data } = await this.$http.get(`/api/search?q=${query}`);
      this.users = data;
    }, 500),
    
    closeDropdown() {
      this.isDropdownOpen = false;
    },
    
    async copyUserId(id) {
      await this.$clipboard.copy(id);
      this.$bus.emit('notify', { 
        type: 'success', 
        text: 'User ID copied!' 
      });
    }
  }
});

app.use(ZogKit, {
  baseURL: 'https://api.example.com',
  timeout: 30000,
  storagePrefix: 'myapp_'
});

app.mount('#app');
```

```html
<div id="app" z-cloak>
  <!-- Search Input with Debounce -->
  <input 
    z-autofocus
    @input.debounce.500="search($event.target.value)"
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
      
      <!-- Copy User ID -->
      <button z-copy="user.id" @copied="copyUserId(user.id)">
        Copy ID
      </button>
    </div>
  </div>
  
  <!-- Dropdown with Click Outside -->
  <div z-click-outside="closeDropdown" class="dropdown">
    <button @click="isDropdownOpen = !isDropdownOpen">
      Options
    </button>
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
<!-- Good: Static user profile -->
<div z-once>
  <h1>{{ user.name }}</h1>
  <p>{{ user.bio }}</p>
</div>

<!-- Bad: Dynamic counter -->
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

### 3. Use Appropriate Debounce/Throttle Delays
```html
<!-- Search: 300-500ms -->
<input @input.debounce.500="search">

<!-- Scroll: 100-200ms -->
<div @scroll.throttle.100="onScroll">

<!-- Resize: 250-500ms -->
<div @resize.throttle.250="onResize">
```

### 4. Clean Up Event Listeners
```javascript
mounted() {
  const unsubscribe = this.$bus.on('event', handler);
  
  // Clean up when component unmounts
  this.cleanup = unsubscribe;
},
unmounted() {
  this.cleanup?.();
}
```

### 5. Use Storage with TTL for Sensitive Data
```javascript
// Token expires in 1 hour
this.$storage.set('authToken', token, 60 * 60 * 1000);
```

---

## 🐛 Troubleshooting

### HTTP Requests Not Working
- Check if `baseURL` is configured correctly
- Verify CORS headers on your API
- Check browser console for errors

### z-click-outside Not Triggering
- Ensure the element is in the DOM
- Check if click event is bubbling properly
- Verify the expression/function exists in scope

### Storage Not Persisting
- Check if localStorage is available
- Verify storage quota isn't exceeded
- Check browser privacy settings

### z-autofocus Not Working
- Ensure element is focusable (input, textarea, button, etc.)
- Check if element is visible (z-if/z-show)
- Verify no conflicting autofocus attributes

---

## 📄 API Reference

### $http
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `get(url, options)` | url: string, options: object | Promise | GET request |
| `post(url, body, options)` | url: string, body: any, options: object | Promise | POST request |
| `put(url, body, options)` | url: string, body: any, options: object | Promise | PUT request |
| `delete(url, options)` | url: string, options: object | Promise | DELETE request |

### $storage / $session
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `set(key, value, ttl)` | key: string, value: any, ttl: number | boolean | Store value |
| `get(key, defaultValue)` | key: string, defaultValue: any | any | Retrieve value |
| `remove(key)` | key: string | void | Remove item |
| `clear()` | - | void | Clear all prefixed items |
| `has(key)` | key: string | boolean | Check if exists |
| `reactive(key, defaultValue, ttl)` | key: string, defaultValue: any, ttl: number | Ref | Reactive storage |

### $clipboard
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `copy(text)` | text: string | Promise\<boolean\> | Copy to clipboard |

### $bus
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `on(event, handler)` | event: string, handler: function | function | Listen to event |
| `off(event, handler)` | event: string, handler: function | void | Remove listener |
| `emit(event, data)` | event: string, data: any | void | Emit event |
| `once(event, handler)` | event: string, handler: function | void | Listen once |
| `clear(event)` | event: string | void | Clear listeners |

### utils
| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `debounce(fn, delay)` | fn: function, delay: number | function | Debounced function |
| `throttle(fn, limit)` | fn: function, limit: number | function | Throttled function |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

