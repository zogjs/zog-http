# ZogHttp Plugin v0.4.8

A powerful HTTP client plugin for Zog.js with full support for all HTTP methods, file uploads with progress tracking, file downloads, request/response interceptors, and reactive state management.

## Features

- ✅ All HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- ✅ Request/Response interceptors (before/after hooks)
- ✅ File upload with real-time progress tracking (XMLHttpRequest-based)
- ✅ File download with progress tracking (Fetch API with ReadableStream)
- ✅ Authentication token management (Bearer, Basic)
- ✅ Custom headers support
- ✅ Automatic JSON parsing
- ✅ Request cancellation via AbortController
- ✅ Reactive loading/error states
- ✅ Timeout configuration
- ✅ Base URL configuration
- ✅ Automatic retry mechanism
- ✅ TypeScript-friendly API (via JSDoc)
- ✅ Two usage patterns: imported `$http` or injected `this.$http`

## Installation

```html
<script type="module">
import { createApp } from './zog.js';
import { ZogHttpPlugin } from './zog-http.js';

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

## Usage Patterns

There are **two ways** to use ZogHttp:

### 1. Using Imported `$http` (Outside Component)

```javascript
import { $http } from './zog-http.js';

// After plugin installation, use it anywhere
const users = await $http.get('/users');
```

### 2. Using Injected `this.$http` (Inside Component Methods)

```javascript
createApp(() => {
  async function fetchUsers() {
    // Use this.$http inside component methods
    const response = await this.$http.get('/users');
  }
  
  return { fetchUsers };
})
```

**Note:** Both refer to the same instance, so you can use whichever is more convenient for your use case.

## Quick Start

### Method 1: Using `this.$http` (Recommended for Component Methods)

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
      // Use this.$http inside component methods
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

### Method 2: Using Imported `$http` (For Global Access)

```javascript
import { createApp } from './zog.js';
import { ZogHttpPlugin, $http } from './zog-http.js';

createApp(() => ({
  // your data
}))
.use(ZogHttpPlugin, { baseURL: 'https://api.example.com' })
.mount('#app');

// Now use $http anywhere in your code
const users = await $http.get('/users');
console.log(users.data);
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
// Using this.$http (inside component methods)
const response = await this.$http.get('/users');

// Using imported $http (outside component)
import { $http } from './zog-http.js';
const response = await $http.get('/users');

// GET with query parameters
const response = await $http.get('/users', {
  params: { page: 1, limit: 10, status: 'active' }
});

// GET with custom headers
const response = await $http.get('/users', {
  headers: { 'X-Request-ID': '123' }
});
```

#### POST Request

```javascript
// Simple POST
const response = await $http.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// POST with additional options
const response = await $http.post('/users', 
  { name: 'John' },
  { headers: { 'X-Custom': 'value' } }
);
```

#### PUT Request

```javascript
const response = await $http.put('/users/123', {
  name: 'Jane Doe',
  email: 'jane@example.com'
});
```

#### PATCH Request

```javascript
const response = await $http.patch('/users/123', {
  name: 'Updated Name'
});
```

#### DELETE Request

```javascript
const response = await $http.delete('/users/123');

// DELETE with body
const response = await $http.delete('/users', {
  body: { ids: [1, 2, 3] }
});
```

#### HEAD & OPTIONS

```javascript
const headResponse = await $http.head('/users');
const optionsResponse = await $http.options('/users');
```

### Shorthand Methods

For convenience, shorthand methods are also available:

```javascript
// Using this.$get, this.$post, etc. (inside component methods)
await this.$get('/users');
await this.$post('/users', data);
await this.$put('/users/1', data);
await this.$patch('/users/1', data);
await this.$delete('/users/1');
await this.$upload('/avatar', file);
await this.$download('/files/report.pdf');

// Using $http methods (anywhere)
await $http.get('/users');
await $http.post('/users', data);
// etc...
```

### Authentication

#### Bearer Token

```javascript
// Set token
$http.setAuthToken('your-jwt-token');

// Clear token
$http.clearAuth();

// Or set directly
$http.setHeader('Authorization', 'Bearer your-token');
```

#### Basic Authentication

```javascript
$http.setBasicAuth('username', 'password');
```

### Headers Management

```javascript
// Set single header
$http.setHeader('X-API-Key', 'your-api-key');

// Set multiple headers
$http.setHeaders({
  'X-API-Key': 'key',
  'X-Client-Version': '1.0.0'
});

// Remove header
$http.removeHeader('X-API-Key');
```

### Base URL

```javascript
// Change base URL at runtime
$http.setBaseURL('https://api.newdomain.com');
```

### Timeout

```javascript
// Set global timeout
$http.setTimeout(60000); // 60 seconds

// Per-request timeout
await $http.get('/slow-endpoint', { timeout: 120000 });
```

## Interceptors

Interceptors allow you to run code before requests are sent and after responses are received.

### Request Interceptors

```javascript
// Add request interceptor
const interceptorId = $http.addRequestInterceptor(
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
$http.removeRequestInterceptor(interceptorId);
```

### Response Interceptors

```javascript
// Add response interceptor
const interceptorId = $http.addResponseInterceptor(
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
      return $http.request(error.config);
    }
    
    throw error;
  }
);

// Remove interceptor later
$http.removeResponseInterceptor(interceptorId);
```

### Clear All Interceptors

```javascript
$http.clearInterceptors();
```

## File Upload

The upload method provides real-time progress tracking and supports single/multiple files using XMLHttpRequest.

### Basic Upload

```javascript
// Using imported $http
import { $http } from './zog-http.js';

const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const { promise, tracker, abort, requestId } = $http.upload('/upload', file);

// Access reactive progress state
console.log(tracker.progress); // 0-100
console.log(tracker.status);   // 'idle' | 'uploading' | 'completed' | 'error'
console.log(tracker.loaded);   // Bytes uploaded
console.log(tracker.total);    // Total bytes
console.log(tracker.speed);    // Upload speed (bytes/sec)
console.log(tracker.remainingTime); // Estimated time remaining (seconds)

const response = await promise;
```

### Upload with Progress Callbacks

```javascript
const { promise, tracker, abort } = $http.upload('/upload', file, {
  // Field name for the file
  fieldName: 'document',
  
  // Additional form data
  additionalData: {
    userId: 123,
    category: 'documents'
  },
  
  // Custom headers
  headers: {
    'X-Upload-Source': 'web'
  },
  
  // Progress callback
  onProgress: (info) => {
    console.log(`Progress: ${info.progress}%`);
    console.log(`Speed: ${info.speed} bytes/sec`);
    console.log(`Remaining: ${info.remainingTime} seconds`);
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

try {
  const response = await promise;
  console.log('File uploaded:', response.data);
} catch (error) {
  console.error('Upload error:', error);
}
```

### Upload Multiple Files

```javascript
const files = document.querySelector('input[type="file"]').files;

// Upload files sequentially
for (const file of files) {
  const { promise } = $http.upload('/upload', file);
  await promise;
}

// Or upload in parallel
const uploads = Array.from(files).map(file => 
  $http.upload('/upload', file).promise
);
await Promise.all(uploads);
```

### Cancel Upload

```javascript
const { abort, requestId } = $http.upload('/upload', file);

// Cancel using abort function
abort();

// Or cancel by request ID
$http.cancelRequest(requestId);
```

### Upload in Template

```html
<div id="app">
  <input type="file" @change="handleFileSelect" />
  
  <div z-if="upload.status === 'uploading'">
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: upload.progress + '%' }"></div>
    </div>
    <p>{{ upload.progress }}% - {{ upload.speed }} B/s</p>
    <p>Remaining: {{ upload.remainingTime }}s</p>
    <button @click="cancelUpload">Cancel</button>
  </div>
  
  <div z-if="upload.status === 'completed'">
    ✓ Upload complete!
  </div>
  
  <div z-if="upload.status === 'error'" class="error">
    {{ upload.error }}
  </div>
</div>

<script type="module">
import { createApp, reactive } from './zog.js';
import { ZogHttpPlugin } from './zog-http.js';

createApp(() => {
  const upload = reactive({
    progress: 0,
    status: 'idle',
    error: null,
    speed: 0,
    remainingTime: 0
  });
  
  let uploadAbort = null;
  
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Use this.$http inside component methods
    const { promise, tracker, abort } = this.$http.upload('/upload', file, {
      onProgress: (info) => {
        upload.progress = info.progress;
        upload.speed = info.speed;
        upload.remainingTime = info.remainingTime;
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
    uploadAbort = abort;
  }
  
  function cancelUpload() {
    if (uploadAbort) {
      uploadAbort();
      upload.status = 'idle';
    }
  }
  
  return { upload, handleFileSelect, cancelUpload };
})
.use(ZogHttpPlugin, { baseURL: 'https://api.example.com' })
.mount('#app');
</script>
```

## File Download

The download method provides progress tracking for file downloads using the Fetch API with ReadableStream.

### Basic Download

```javascript
// Using imported $http
import { $http } from './zog-http.js';

// Download with auto-save
const { promise, tracker, abort } = $http.download('/files/report.pdf', {
  filename: 'report.pdf'
});

// Monitor progress
console.log(tracker.progress); // 0-100
console.log(tracker.status);   // 'idle' | 'uploading' | 'completed' | 'error'

const { blob, filename, size } = await promise;
```

### Download with Progress Callbacks

```javascript
const { promise, tracker, abort } = $http.download('/files/large-file.zip', {
  filename: 'download.zip',
  
  onProgress: (info) => {
    console.log(`Downloaded: ${info.progress}%`);
    console.log(`Speed: ${info.speed} bytes/sec`);
    console.log(`Remaining: ${info.remainingTime} seconds`);
  },
  
  onComplete: ({ blob, filename, size }) => {
    console.log(`Downloaded ${filename} (${size} bytes)`);
  },
  
  onError: (error) => {
    console.error('Download failed:', error.message);
  }
});

const { blob } = await promise;
```

### Download without Auto-Save

```javascript
const { promise } = $http.download('/files/image.jpg');
const { blob } = await promise;

// Process blob manually
const imageUrl = URL.createObjectURL(blob);
document.querySelector('img').src = imageUrl;
```

### Cancel Download

```javascript
const { abort, requestId } = $http.download('/large-file.zip');

// Cancel using abort function
abort();

// Or cancel by request ID
$http.cancelRequest(requestId);
```

### Download in Template

```html
<div id="app">
  <button @click="startDownload">Download File</button>
  
  <div z-if="download.status === 'uploading'">
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: download.progress + '%' }"></div>
    </div>
    <p>{{ download.progress }}% - {{ download.speed }} B/s</p>
    <button @click="cancelDownload">Cancel</button>
  </div>
  
  <div z-if="download.status === 'completed'">
    ✓ Download complete!
  </div>
</div>

<script type="module">
import { createApp, reactive } from './zog.js';
import { ZogHttpPlugin } from './zog-http.js';

createApp(() => {
  const download = reactive({
    progress: 0,
    status: 'idle',
    speed: 0
  });
  
  let downloadAbort = null;
  
  function startDownload() {
    // Use this.$http inside component methods
    const { promise, tracker, abort } = this.$http.download('/files/report.pdf', {
      filename: 'report.pdf',
      onProgress: (info) => {
        download.progress = info.progress;
        download.speed = info.speed;
      },
      onComplete: () => {
        download.status = 'completed';
      }
    });
    
    download.status = 'uploading'; // Note: tracker uses 'uploading' for download too
    downloadAbort = abort;
  }
  
  function cancelDownload() {
    if (downloadAbort) {
      downloadAbort();
      download.status = 'idle';
    }
  }
  
  return { download, startDownload, cancelDownload };
})
.use(ZogHttpPlugin, { baseURL: 'https://api.example.com' })
.mount('#app');
</script>
```

## Reactive State

The plugin provides reactive global state accessible from anywhere:

```javascript
// Access using imported $http
import { $http } from './zog-http.js';

$http.state.loading         // true when any request is pending
$http.state.error           // Last error message
$http.state.pendingRequests // Number of pending requests
$http.state.lastRequest     // Info about last request

// Access in component methods using this.$http
this.$http.state.loading

// Access in template (both work)
<div z-show="$http.state.loading">Loading...</div>
<div z-if="$http.state.pendingRequests > 0">
  {{ $http.state.pendingRequests }} requests in progress
</div>
<div z-if="$http.state.error" class="error">
  {{ $http.state.error }}
</div>
```

## Request Cancellation

### Cancel Single Request

```javascript
// Upload example
const { requestId } = $http.upload('/upload', file);
$http.cancelRequest(requestId);

// Regular request example  
const { requestId } = $http.get('/users');
$http.cancelRequest(requestId);

// Or use abort function directly
const { abort } = $http.upload('/upload', file);
abort();
```

### Cancel All Requests

```javascript
// Cancel all pending requests (uploads, downloads, regular requests)
$http.cancelAll();
```

## Error Handling

### HttpError Object

```javascript
try {
  await $http.get('/users');
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

// Available status codes:
// OK: 200
// CREATED: 201
// NO_CONTENT: 204
// BAD_REQUEST: 400
// UNAUTHORIZED: 401
// FORBIDDEN: 403
// NOT_FOUND: 404
// UNPROCESSABLE_ENTITY: 422
// INTERNAL_SERVER_ERROR: 500
// BAD_GATEWAY: 502
// SERVICE_UNAVAILABLE: 503
```

## Creating Instances

Create multiple HTTP clients with different configurations:

```javascript
// Using imported $http
import { $http } from './zog-http.js';

// Create a new instance with different config
const adminApi = $http.create({
  baseURL: 'https://admin.api.com',
  headers: { 'X-Admin-Key': 'secret' },
  timeout: 60000
});

await adminApi.get('/dashboard');

// Original instance is unchanged
await $http.get('/users'); // Still uses original baseURL

// Can also create from component methods
function setupAdminApi() {
  const adminApi = this.$http.create({
    baseURL: 'https://admin.api.com'
  });
  return adminApi;
}
```

## Standalone Usage

Use without Zog.js framework:

```javascript
import { createHttpClient } from './zog-http.js';

const http = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  headers: {
    'X-API-Key': 'your-key'
  }
});

// Add interceptor
http.addRequestInterceptor(config => {
  config.headers['Authorization'] = 'Bearer token';
  return config;
});

// Make requests
const users = await http.get('/users');

// Upload files
const { promise } = http.upload('/upload', file);
await promise;

// Download files
const { promise: downloadPromise } = http.download('/file.pdf', {
  filename: 'document.pdf'
});
await downloadPromise;
```

### Global Access

Access the HTTP client instance globally (after plugin installation):

```javascript
import { $http } from './zog-http.js';

// Can be used anywhere after plugin is installed
const users = await $http.get('/users');
```

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>ZogHttp Demo</title>
  <style>
    .loading { opacity: 0.5; pointer-events: none; }
    .progress-bar { width: 100%; height: 20px; background: #eee; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; background: #4caf50; transition: width 0.3s; }
    .error { color: red; padding: 10px; background: #fee; border-radius: 4px; }
    .success { color: green; }
  </style>
</head>
<body>
  <div id="app">
    <!-- Global loading indicator -->
    <div z-show="$http.state.loading" class="loading-overlay">
      Loading... ({{ $http.state.pendingRequests }} requests)
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
        <p>
          {{ upload.progress }}% 
          ({{ Math.round(upload.speed / 1024) }} KB/s)
          - {{ upload.remainingTime }}s remaining
        </p>
        <button @click="cancelUpload">Cancel</button>
      </div>
      
      <div z-if="upload.status === 'completed'" class="success">
        Upload complete! ✓
      </div>
      
      <div z-if="upload.status === 'error'" class="error">
        {{ upload.error }}
      </div>
    </section>
    
    <!-- File download -->
    <section>
      <h2>Download File</h2>
      <button @click="downloadFile">Download Report</button>
      
      <div z-if="download.status === 'uploading'">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: download.progress + '%' }"></div>
        </div>
        <p>{{ download.progress }}% - {{ Math.round(download.speed / 1024) }} KB/s</p>
        <button @click="cancelDownload">Cancel</button>
      </div>
      
      <div z-if="download.status === 'completed'" class="success">
        Download complete! ✓
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
        error: null,
        speed: 0,
        remainingTime: 0
      });
      
      const download = reactive({
        progress: 0,
        status: 'idle',
        speed: 0
      });
      
      let abortUpload = null;
      let abortDownload = null;
      
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
        
        const { promise, tracker, abort } = this.$http.upload('/avatar', file, {
          fieldName: 'avatar',
          additionalData: { userId: 1 },
          onProgress: (info) => {
            upload.progress = info.progress;
            upload.speed = info.speed;
            upload.remainingTime = info.remainingTime;
          },
          onComplete: () => {
            upload.status = 'completed';
            setTimeout(() => upload.status = 'idle', 3000);
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
      
      // Download file
      function downloadFile() {
        const { promise, tracker, abort } = this.$http.download('/files/report.pdf', {
          filename: 'report.pdf',
          onProgress: (info) => {
            download.progress = info.progress;
            download.speed = info.speed;
          },
          onComplete: () => {
            download.status = 'completed';
            setTimeout(() => download.status = 'idle', 3000);
          }
        });
        
        download.status = 'uploading';
        download.progress = 0;
        abortDownload = abort;
      }
      
      // Cancel download
      function cancelDownload() {
        if (abortDownload) {
          abortDownload();
          download.status = 'idle';
        }
      }
      
      return {
        users,
        newUser,
        error,
        upload,
        download,
        fetchUsers,
        addUser,
        deleteUser,
        handleUpload,
        cancelUpload,
        downloadFile,
        cancelDownload
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

## Advanced Features

### Retry Mechanism

The plugin automatically retries failed requests:

```javascript
createApp(() => ({}))
.use(ZogHttpPlugin, {
  baseURL: 'https://api.example.com',
  retries: 3,           // Retry up to 3 times
  retryDelay: 2000,     // Wait 2 seconds between retries
})
.mount('#app');

// Retries apply to all requests automatically
// Using imported $http
import { $http } from './zog-http.js';
await $http.get('/unstable-endpoint');

// Or inside component methods
async function fetchData() {
  await this.$http.get('/unstable-endpoint');
}
```

### Request Configuration

Each request can override global configuration:

```javascript
await $http.get('/users', {
  timeout: 60000,              // Override timeout
  headers: { 'X-Custom': 'value' }, // Merge with default headers
  withCredentials: true,       // Override credentials setting
  retries: 5,                  // Override retry count
  retryDelay: 3000            // Override retry delay
});
```

### Combining Interceptors

Use multiple interceptors for different concerns:

```javascript
import { $http } from './zog-http.js';

// Authentication interceptor
$http.addRequestInterceptor(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Logging interceptor
$http.addRequestInterceptor(config => {
  console.log(`[${config.method}] ${config.url}`);
  return config;
});

// Error tracking interceptor
$http.addResponseInterceptor(
  response => response,
  error => {
    // Send to error tracking service
    trackError(error);
    throw error;
  }
);
```

## TypeScript Support

The plugin includes JSDoc comments for IDE autocomplete and type checking:

```javascript
/**
 * @typedef {Object} HttpResponse
 * @property {any} data - Response data
 * @property {number} status - HTTP status code
 * @property {string} statusText - Status text
 * @property {Object} headers - Response headers
 * @property {Object} config - Request configuration
 * @property {Object} request - Request information
 */

/**
 * @typedef {Object} UploadProgress
 * @property {number} loaded - Bytes uploaded
 * @property {number} total - Total bytes
 * @property {number} progress - Progress percentage (0-100)
 * @property {number} speed - Upload speed (bytes/sec)
 * @property {number} remainingTime - Estimated remaining time (seconds)
 */

/**
 * @typedef {Object} UploadOptions
 * @property {string} [fieldName='file'] - Form field name
 * @property {Object} [additionalData={}] - Additional form data
 * @property {Object} [headers={}] - Custom headers
 * @property {function(UploadProgress): void} [onProgress] - Progress callback
 * @property {function(HttpResponse): void} [onComplete] - Completion callback
 * @property {function(HttpError): void} [onError] - Error callback
 */
```

## Browser Support

- Chrome 66+
- Firefox 57+
- Safari 11.1+
- Edge 79+

Requires: `fetch`, `AbortController`, `FormData`, `Blob`, `URL.createObjectURL`, `XMLHttpRequest`

## Migration Guide

### From v1.0.0 to v0.4.8

The plugin version has been updated to match Zog.js versioning (v0.4.8). No breaking changes in functionality.

### Key Differences from Axios

```javascript
// Axios
axios.get('/users').then(response => {
  console.log(response.data);
});

// ZogHttp with imported $http
import { $http } from './zog-http.js';
$http.get('/users').then(response => {
  console.log(response.data);
});

// ZogHttp in component methods
async function fetchUsers() {
  const response = await this.$http.get('/users');
  console.log(response.data);
}

// Upload in Axios
const formData = new FormData();
formData.append('file', file);
axios.post('/upload', formData);

// Upload in ZogHttp (simplified)
$http.upload('/upload', file);
// or
this.$http.upload('/upload', file);
```

## Troubleshooting

### Upload Progress Not Working

Make sure your server sends the `Content-Length` header:

```javascript
// Server-side (Node.js/Express)
res.setHeader('Content-Length', fileSize);
```

### CORS Issues

Enable credentials if needed:

```javascript
.use(ZogHttpPlugin, {
  withCredentials: true,
  headers: {
    'Access-Control-Allow-Credentials': 'true'
  }
})
```

### Request Timeout

Increase timeout for slow connections:

```javascript
import { $http } from './zog-http.js';

// Global
$http.setTimeout(120000); // 2 minutes

// Per request
await $http.get('/large-data', { timeout: 300000 }); // 5 minutes
```

## License

MIT License - feel free to use in any project.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Created for the Zog.js framework. Compatible with Zog.js v0.4.8+.
