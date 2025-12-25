# ZogHttp Plugin v1.0.0

A powerful, production-ready HTTP client plugin for Zog.js with full support for all HTTP methods, file uploads with progress tracking, request/response interceptors, and reactive state management.

## Features

- ✅ All HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- ✅ Request/Response interceptors (before/after hooks)
- ✅ File upload with real-time progress tracking
- ✅ File download with progress tracking
- ✅ Authentication token management (Bearer, Basic)
- ✅ Custom headers support
- ✅ Automatic JSON parsing
- ✅ Request cancellation via AbortController
- ✅ Reactive loading/error states
- ✅ Timeout configuration
- ✅ Base URL configuration
- ✅ Automatic retry mechanism
- ✅ TypeScript-friendly API

## Installation

```html
<script type="module">
import { createApp } from 'zogjs';
import { ZogHttpPlugin } from '@zogjs/http';

createApp(() => ({
  // your data
}))
.use(ZogHttpPlugin, {
  baseURL: 'https://api.example.com',
  timeout: 30000,
})
.mount('#app');
</script>
```

## Quick Start

```html
<div id="app">
  <div z-if="$http.state.loading">Loading...</div>
  <div z-if="$http.state.error">{{ $http.state.error }}</div>
  
  <ul>
    <li z-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
  
  <button @click="loadUsers">Load Users</button>
</div>

<script type="module">
import { createApp, reactive } from './zog.js';
import { ZogHttpPlugin } from './zog-http.js';

createApp(() => {
  const users = reactive([]);
  
  async function loadUsers() {
    try {
      const response = await this.$http.get('/users');
      users.splice(0, users.length, ...response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }
  
  return { users, loadUsers };
})
.use(ZogHttpPlugin, { baseURL: 'https://api.example.com' })
.mount('#app');
</script>
```

## Configuration Options

```javascript
.use(ZogHttpPlugin, {
  // Base URL for all requests
  baseURL: 'https://api.example.com',
  
  // Default timeout in milliseconds
  timeout: 30000,
  
  // Default headers for all requests
  headers: {
    'Content-Type': 'application/json',
    'X-Custom-Header': 'value',
  },
  
  // Include credentials (cookies) in requests
  withCredentials: false,
  
  // Number of automatic retries on failure
  retries: 0,
  
  // Delay between retries in milliseconds
  retryDelay: 1000,
})
```

## API Reference

### HTTP Methods

All methods return a Promise that resolves to a response object:

```javascript
// Response object structure
{
  data: any,              // Parsed response body
  status: number,         // HTTP status code
  statusText: string,     // HTTP status text
  headers: object,        // Response headers
  config: object,         // Request configuration
  request: object,        // Original request info
}
```

#### GET Request

```javascript
// Simple GET
const response = await this.$http.get('/users');

// GET with query parameters
const response = await this.$http.get('/users', {
  params: { page: 1, limit: 10, status: 'active' }
});

// GET with custom headers
const response = await this.$http.get('/users', {
  headers: { 'X-Request-ID': '123' }
});
```

#### POST Request

```javascript
// Simple POST
const response = await this.$http.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// POST with additional options
const response = await this.$http.post('/users', 
  { name: 'John' },
  { headers: { 'X-Custom': 'value' } }
);
```

#### PUT Request

```javascript
const response = await this.$http.put('/users/123', {
  name: 'Jane Doe',
  email: 'jane@example.com'
});
```

#### PATCH Request

```javascript
const response = await this.$http.patch('/users/123', {
  name: 'Updated Name'
});
```

#### DELETE Request

```javascript
const response = await this.$http.delete('/users/123');

// DELETE with body
const response = await this.$http.delete('/users', {
  body: { ids: [1, 2, 3] }
});
```

#### HEAD & OPTIONS

```javascript
const headResponse = await this.$http.head('/users');
const optionsResponse = await this.$http.options('/users');
```

### Shorthand Methods

For convenience, shorthand methods are also injected into scope:

```javascript
await this.$get('/users');
await this.$post('/users', data);
await this.$put('/users/1', data);
await this.$patch('/users/1', data);
await this.$delete('/users/1');
```

### Authentication

#### Bearer Token

```javascript
// Set token
this.$http.setAuthToken('your-jwt-token');

// Clear token
this.$http.clearAuth();

// Or set directly
this.$http.setHeader('Authorization', 'Bearer your-token');
```

#### Basic Authentication

```javascript
this.$http.setBasicAuth('username', 'password');
```

### Headers Management

```javascript
// Set single header
this.$http.setHeader('X-API-Key', 'your-api-key');

// Set multiple headers
this.$http.setHeaders({
  'X-API-Key': 'key',
  'X-Client-Version': '1.0.0'
});

// Remove header
this.$http.removeHeader('X-API-Key');
```

### Base URL

```javascript
// Change base URL at runtime
this.$http.setBaseURL('https://api.newdomain.com');
```

### Timeout

```javascript
// Set global timeout
this.$http.setTimeout(60000); // 60 seconds

// Per-request timeout
await this.$http.get('/slow-endpoint', { timeout: 120000 });
```

## Interceptors

Interceptors allow you to run code before requests are sent and after responses are received.

### Request Interceptors

```javascript
// Add request interceptor
const interceptorId = this.$http.addRequestInterceptor(
  // Success handler (called before each request)
  async (config) => {
    // Add timestamp to all requests
    config.headers['X-Request-Time'] = Date.now();
    
    // Add token from storage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('Request:', config.method, config.url);
    return config; // Must return config
  },
  // Error handler (optional)
  async (error) => {
    console.error('Request error:', error);
    throw error;
  }
);

// Remove interceptor later
this.$http.removeRequestInterceptor(interceptorId);
```

### Response Interceptors

```javascript
// Add response interceptor
const interceptorId = this.$http.addResponseInterceptor(
  // Success handler
  async (response) => {
    console.log('Response:', response.status, response.data);
    
    // Transform response data
    if (response.data?.items) {
      response.data = response.data.items;
    }
    
    return response;
  },
  // Error handler
  async (error) => {
    if (error.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    }
    
    if (error.status === 429) {
      // Handle rate limiting - wait and retry
      await new Promise(r => setTimeout(r, 5000));
      return this.$http.request(error.request);
    }
    
    throw error;
  }
);
```

### Clear All Interceptors

```javascript
this.$http.clearInterceptors();
```

## File Upload

The upload method provides real-time progress tracking and supports single/multiple files.

### Basic Upload

```javascript
// Single file upload
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const { promise, tracker, abort } = this.$http.upload('/upload', file);

// Access reactive progress state
console.log(tracker.progress); // 0-100
console.log(tracker.status);   // 'idle' | 'uploading' | 'completed' | 'error'

const response = await promise;
```

### Upload with Progress Callbacks

```javascript
const { promise, tracker, abort } = this.$http.upload('/upload', file, {
  // Field name for the file
  fieldName: 'document',
  
  // Additional form data
  additionalData: {
    description: 'My file',
    category: 'documents'
  },
  
  // Custom headers
  headers: {
    'X-Upload-ID': 'unique-id'
  },
  
  // Progress callback
  onProgress: (info) => {
    console.log(`Progress: ${info.progress}%`);
    console.log(`Speed: ${(info.speed / 1024).toFixed(2)} KB/s`);
    console.log(`Remaining: ${info.remainingTime}s`);
  },
  
  // Completion callback
  onComplete: (response) => {
    console.log('Upload complete!', response.data);
  },
  
  // Error callback
  onError: (error) => {
    console.error('Upload failed:', error.message);
  }
});
```

### Multiple Files Upload

```javascript
const files = document.querySelector('input[type="file"]').files;

const { promise, tracker } = this.$http.upload('/upload', Array.from(files), {
  fieldName: 'files',
  additionalData: { albumId: '123' }
});
```

### Upload with FormData

```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('name', 'custom name');

const { promise } = this.$http.upload('/upload', formData);
```

### Cancel Upload

```javascript
const { promise, abort, requestId } = this.$http.upload('/upload', file);

// Cancel by abort function
abort();

// Or cancel by request ID
this.$http.cancelRequest(requestId);
```

### Reactive Upload State in Template

```html
<div id="app">
  <input type="file" @change="handleFileSelect" />
  
  <div z-if="uploadState.status === 'uploading'">
    <div class="progress-bar">
      <div :style="{ width: uploadState.progress + '%' }"></div>
    </div>
    <p>{{ uploadState.progress }}% - {{ formatSpeed(uploadState.speed) }}</p>
    <p>Remaining: {{ uploadState.remainingTime }}s</p>
    <button @click="cancelUpload">Cancel</button>
  </div>
  
  <div z-if="uploadState.status === 'completed'">
    Upload complete! ✓
  </div>
  
  <div z-if="uploadState.status === 'error'">
    Error: {{ uploadState.error }}
  </div>
</div>

<script type="module">
createApp(() => {
  const uploadState = reactive({
    progress: 0,
    status: 'idle',
    speed: 0,
    remainingTime: 0,
    error: null
  });
  
  let abortFn = null;
  
  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const { promise, tracker, abort } = this.$upload('/upload', file);
    
    // Sync tracker state with local state
    Object.assign(uploadState, tracker);
    abortFn = abort;
    
    try {
      await promise;
    } catch (err) {
      // Error already handled via tracker
    }
  }
  
  function cancelUpload() {
    if (abortFn) abortFn();
  }
  
  function formatSpeed(bytesPerSec) {
    return (bytesPerSec / 1024).toFixed(2) + ' KB/s';
  }
  
  return { uploadState, handleFileSelect, cancelUpload, formatSpeed };
}).use(ZogHttpPlugin).mount('#app');
</script>
```

## File Download

Download files with progress tracking and optional auto-save.

### Basic Download

```javascript
const { promise, tracker, abort } = this.$http.download('/files/report.pdf', {
  filename: 'report.pdf', // Auto-triggers download
  
  onProgress: (info) => {
    console.log(`Downloaded: ${info.progress}%`);
  },
  
  onComplete: ({ blob, filename, size }) => {
    console.log(`Downloaded ${filename} (${size} bytes)`);
  }
});

const { blob } = await promise;
```

### Download without Auto-Save

```javascript
const { promise } = this.$http.download('/files/image.jpg');
const { blob } = await promise;

// Process blob manually
const imageUrl = URL.createObjectURL(blob);
```

## Reactive State

The plugin provides reactive global state:

```javascript
// Access in JavaScript
this.$http.state.loading       // true when any request is pending
this.$http.state.error         // Last error message
this.$http.state.pendingRequests // Number of pending requests
this.$http.state.lastRequest   // Info about last request

// Access in template
<div z-show="$http.state.loading">Loading...</div>
<div z-if="$http.state.pendingRequests > 0">
  {{ $http.state.pendingRequests }} requests in progress
</div>
```

## Request Cancellation

### Cancel Single Request

```javascript
const { requestId } = this.$http.upload('/upload', file);

// Cancel by ID
this.$http.cancelRequest(requestId);
```

### Cancel All Requests

```javascript
// Cancel all pending requests
this.$http.cancelAll();
```

## Error Handling

### HttpError Object

```javascript
try {
  await this.$http.get('/users');
} catch (error) {
  if (error.isHttpError) {
    console.log(error.status);    // 404, 500, etc.
    console.log(error.message);   // Error message
    console.log(error.response);  // Full response object
    console.log(error.request);   // Original request info
  }
}
```

### HTTP Status Codes

```javascript
import { HttpStatus } from './zog-http.js';

if (error.status === HttpStatus.NOT_FOUND) {
  // Handle 404
}

if (error.status === HttpStatus.UNAUTHORIZED) {
  // Handle 401
}
```

## Creating Instances

Create multiple HTTP clients with different configurations:

```javascript
// Create a new instance
const adminApi = this.$http.create({
  baseURL: 'https://admin.api.com',
  headers: { 'X-Admin-Key': 'secret' }
});

await adminApi.get('/dashboard');
```

## Standalone Usage

Use without Zog.js:

```javascript
import { createHttpClient } from './zog-http.js';

const http = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 30000
});

// Add interceptor
http.addRequestInterceptor(config => {
  config.headers['Authorization'] = 'Bearer token';
  return config;
});

// Make requests
const users = await http.get('/users');
```

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>ZogHttp Demo</title>
  <style>
    .loading { opacity: 0.5; pointer-events: none; }
    .progress-bar { width: 100%; height: 20px; background: #eee; }
    .progress-fill { height: 100%; background: #4caf50; transition: width 0.3s; }
    .error { color: red; }
  </style>
</head>
<body>
  <div id="app">
    <!-- Global loading indicator -->
    <div z-show="$http.state.loading" class="loading-overlay">
      Loading...
    </div>
    
    <!-- User list -->
    <section>
      <h2>Users</h2>
      <button @click="fetchUsers" :disabled="$http.state.loading">
        Refresh Users
      </button>
      <ul>
        <li z-for="user in users" :key="user.id">
          {{ user.name }} ({{ user.email }})
          <button @click="deleteUser(user.id)">Delete</button>
        </li>
      </ul>
    </section>
    
    <!-- Add user form -->
    <section>
      <h2>Add User</h2>
      <input z-model="newUser.name" placeholder="Name" />
      <input z-model="newUser.email" placeholder="Email" />
      <button @click="addUser">Add User</button>
    </section>
    
    <!-- File upload -->
    <section>
      <h2>Upload Avatar</h2>
      <input type="file" @change="handleUpload" accept="image/*" />
      
      <div z-if="upload.status === 'uploading'">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: upload.progress + '%' }"></div>
        </div>
        <span>{{ upload.progress }}%</span>
        <button @click="cancelUpload">Cancel</button>
      </div>
      
      <div z-if="upload.status === 'completed'" style="color: green;">
        Upload complete! ✓
      </div>
      
      <div z-if="upload.status === 'error'" class="error">
        {{ upload.error }}
      </div>
    </section>
    
    <!-- Error display -->
    <div z-if="error" class="error">
      {{ error }}
    </div>
  </div>

  <script type="module">
    import { createApp, ref, reactive } from './zog.js';
    import { ZogHttpPlugin } from './zog-http.js';
    
    createApp(() => {
      // Reactive data
      const users = reactive([]);
      const newUser = reactive({ name: '', email: '' });
      const error = ref('');
      const upload = reactive({
        progress: 0,
        status: 'idle',
        error: null
      });
      
      let abortUpload = null;
      
      // Fetch users
      async function fetchUsers() {
        try {
          error.value = '';
          const response = await this.$http.get('/users');
          users.splice(0, users.length, ...response.data);
        } catch (e) {
          error.value = e.message;
        }
      }
      
      // Add user
      async function addUser() {
        if (!newUser.name || !newUser.email) return;
        
        try {
          error.value = '';
          const response = await this.$http.post('/users', {
            name: newUser.name,
            email: newUser.email
          });
          users.push(response.data);
          newUser.name = '';
          newUser.email = '';
        } catch (e) {
          error.value = e.message;
        }
      }
      
      // Delete user
      async function deleteUser(id) {
        try {
          error.value = '';
          await this.$http.delete(`/users/${id}`);
          const index = users.findIndex(u => u.id === id);
          if (index > -1) users.splice(index, 1);
        } catch (e) {
          error.value = e.message;
        }
      }
      
      // Handle file upload
      function handleUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const { promise, tracker, abort } = this.$upload('/avatar', file, {
          fieldName: 'avatar',
          additionalData: { userId: 1 },
          onProgress: (info) => {
            upload.progress = info.progress;
          },
          onComplete: () => {
            upload.status = 'completed';
          },
          onError: (err) => {
            upload.status = 'error';
            upload.error = err.message;
          }
        });
        
        upload.status = 'uploading';
        upload.progress = 0;
        upload.error = null;
        abortUpload = abort;
      }
      
      // Cancel upload
      function cancelUpload() {
        if (abortUpload) {
          abortUpload();
          upload.status = 'idle';
        }
      }
      
      return {
        users,
        newUser,
        error,
        upload,
        fetchUsers,
        addUser,
        deleteUser,
        handleUpload,
        cancelUpload
      };
    })
    .use(ZogHttpPlugin, {
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 30000,
      retries: 2,
      retryDelay: 1000,
    })
    .mount('#app');
  </script>
</body>
</html>
```

## TypeScript Support

The plugin is written in vanilla JavaScript but includes JSDoc comments for IDE support. For full TypeScript support, type definitions can be added:

```typescript
interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
  request: RequestInfo;
}

interface UploadProgress {
  loaded: number;
  total: number;
  progress: number;
  speed: number;
  remainingTime: number;
}

interface UploadOptions {
  fieldName?: string;
  additionalData?: Record<string, any>;
  headers?: Record<string, string>;
  onProgress?: (info: UploadProgress) => void;
  onComplete?: (response: HttpResponse) => void;
  onError?: (error: HttpError) => void;
}
```

## Browser Support

- Chrome 66+
- Firefox 57+
- Safari 11.1+
- Edge 79+

Requires: `fetch`, `AbortController`, `FormData`, `Blob`, `URL.createObjectURL`

## License

MIT License - feel free to use in any project.