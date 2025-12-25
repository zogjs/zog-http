/**
 * ZogHttp Plugin v0.4.8
 * A powerful, production-ready HTTP client plugin for Zog.js
 * 
 * Features:
 * - All HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
 * - Request/Response interceptors (before/after hooks)
 * - File upload with progress tracking
 * - Authentication token management
 * - Custom headers support
 * - Automatic JSON parsing
 * - Request cancellation via AbortController
 * - Reactive loading/error states
 * - Timeout configuration
 * - Base URL configuration
 * - Retry mechanism
 * 
 * @author Zog.js Community
 * @license MIT
 */

/**
 * Default configuration for the HTTP client
 */
const DEFAULT_CONFIG = {
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  retries: 0,
  retryDelay: 1000,
};

/**
 * HTTP Status codes enum for easy reference
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Custom HTTP Error class with detailed information
 */
export class HttpError extends Error {
  constructor(message, status, response, request) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.response = response;
    this.request = request;
    this.isHttpError = true;
  }
}

/**
 * Upload progress tracker class
 */
class UploadTracker {
  constructor(reactive) {
    this.state = reactive({
      progress: 0,
      loaded: 0,
      total: 0,
      status: 'idle', // idle, uploading, completed, error
      error: null,
      startTime: null,
      speed: 0, // bytes per second
      remainingTime: 0, // seconds
    });
  }

  /**
   * Start tracking upload
   */
  start(total) {
    this.state.progress = 0;
    this.state.loaded = 0;
    this.state.total = total;
    this.state.status = 'uploading';
    this.state.error = null;
    this.state.startTime = Date.now();
    this.state.speed = 0;
    this.state.remainingTime = 0;
  }

  /**
   * Update upload progress
   * @param {number} loaded - Bytes loaded
   * @param {number} total - Total bytes
   */
  update(loaded, total) {
    this.state.loaded = loaded;
    this.state.total = total;
    this.state.progress = total > 0 ? Math.round((loaded / total) * 100) : 0;
    
    // Calculate speed and remaining time
    const elapsed = (Date.now() - this.state.startTime) / 1000;
    if (elapsed > 0) {
      this.state.speed = Math.round(loaded / elapsed);
      const remaining = total - loaded;
      this.state.remainingTime = this.state.speed > 0 
        ? Math.round(remaining / this.state.speed) 
        : 0;
    }
  }

  /**
   * Mark upload as completed
   */
  complete() {
    this.state.progress = 100;
    this.state.status = 'completed';
  }

  /**
   * Mark upload as failed
   * @param {Error} error - The error that occurred
   */
  fail(error) {
    this.state.status = 'error';
    this.state.error = error.message || 'Upload failed';
  }

  /**
   * Reset tracker to initial state
   */
  reset() {
    this.state.progress = 0;
    this.state.loaded = 0;
    this.state.total = 0;
    this.state.status = 'idle';
    this.state.error = null;
    this.state.startTime = null;
    this.state.speed = 0;
    this.state.remainingTime = 0;
  }
}

/**
 * Main HTTP Client class
 */
class ZogHttpClient {
  constructor(config, reactive, ref) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.reactive = reactive;
    this.ref = ref;
    
    // Interceptors storage
    this.interceptors = {
      request: [],
      response: [],
    };
    
    // Global reactive state
    this.state = reactive({
      loading: false,
      error: null,
      lastRequest: null,
      pendingRequests: 0,
    });
    
    // Active abort controllers for request cancellation
    this.abortControllers = new Map();
  }

  /**
   * Set the base URL for all requests
   * @param {string} url - The base URL
   * @returns {ZogHttpClient} - Returns this for chaining
   */
  setBaseURL(url) {
    this.config.baseURL = url;
    return this;
  }

  /**
   * Set a default header for all requests
   * @param {string} key - Header name
   * @param {string} value - Header value
   * @returns {ZogHttpClient} - Returns this for chaining
   */
  setHeader(key, value) {
    this.config.headers[key] = value;
    return this;
  }

  /**
   * Set multiple headers at once
   * @param {Object} headers - Headers object
   * @returns {ZogHttpClient} - Returns this for chaining
   */
  setHeaders(headers) {
    this.config.headers = { ...this.config.headers, ...headers };
    return this;
  }

  /**
   * Remove a default header
   * @param {string} key - Header name to remove
   * @returns {ZogHttpClient} - Returns this for chaining
   */
  removeHeader(key) {
    delete this.config.headers[key];
    return this;
  }

  /**
   * Set the authentication token (Bearer token)
   * @param {string} token - The authentication token
   * @returns {ZogHttpClient} - Returns this for chaining
   */
  setAuthToken(token) {
    if (token) {
      this.config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.config.headers['Authorization'];
    }
    return this;
  }

  /**
   * Set Basic authentication
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {ZogHttpClient} - Returns this for chaining
   */
  setBasicAuth(username, password) {
    const encoded = btoa(`${username}:${password}`);
    this.config.headers['Authorization'] = `Basic ${encoded}`;
    return this;
  }

  /**
   * Clear authentication
   * @returns {ZogHttpClient} - Returns this for chaining
   */
  clearAuth() {
    delete this.config.headers['Authorization'];
    return this;
  }

  /**
   * Set request timeout
   * @param {number} ms - Timeout in milliseconds
   * @returns {ZogHttpClient} - Returns this for chaining
   */
  setTimeout(ms) {
    this.config.timeout = ms;
    return this;
  }

  /**
   * Add a request interceptor
   * @param {Function} fulfilled - Function to run before request
   * @param {Function} rejected - Function to run on request error
   * @returns {number} - Interceptor ID for removal
   */
  addRequestInterceptor(fulfilled, rejected) {
    const id = this.interceptors.request.length;
    this.interceptors.request.push({ fulfilled, rejected, id });
    return id;
  }

  /**
   * Add a response interceptor
   * @param {Function} fulfilled - Function to run on successful response
   * @param {Function} rejected - Function to run on response error
   * @returns {number} - Interceptor ID for removal
   */
  addResponseInterceptor(fulfilled, rejected) {
    const id = this.interceptors.response.length;
    this.interceptors.response.push({ fulfilled, rejected, id });
    return id;
  }

  /**
   * Remove a request interceptor by ID
   * @param {number} id - Interceptor ID
   */
  removeRequestInterceptor(id) {
    const index = this.interceptors.request.findIndex(i => i.id === id);
    if (index !== -1) {
      this.interceptors.request.splice(index, 1);
    }
  }

  /**
   * Remove a response interceptor by ID
   * @param {number} id - Interceptor ID
   */
  removeResponseInterceptor(id) {
    const index = this.interceptors.response.findIndex(i => i.id === id);
    if (index !== -1) {
      this.interceptors.response.splice(index, 1);
    }
  }

  /**
   * Clear all interceptors
   */
  clearInterceptors() {
    this.interceptors.request = [];
    this.interceptors.response = [];
  }

  /**
   * Build the full URL with query parameters
   * @param {string} url - The endpoint URL
   * @param {Object} params - Query parameters
   * @returns {string} - Full URL with query string
   */
  buildURL(url, params = {}) {
    // Handle base URL
    let fullURL = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
    
    // Build query string
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value);
        }
      }
    }
    
    const queryString = queryParams.toString();
    if (queryString) {
      fullURL += (fullURL.includes('?') ? '&' : '?') + queryString;
    }
    
    return fullURL;
  }

  /**
   * Run request interceptors
   * @param {Object} config - Request configuration
   * @returns {Promise<Object>} - Modified configuration
   */
  async runRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    
    for (const interceptor of this.interceptors.request) {
      try {
        if (interceptor.fulfilled) {
          modifiedConfig = await interceptor.fulfilled(modifiedConfig) || modifiedConfig;
        }
      } catch (error) {
        if (interceptor.rejected) {
          modifiedConfig = await interceptor.rejected(error) || modifiedConfig;
        } else {
          throw error;
        }
      }
    }
    
    return modifiedConfig;
  }

  /**
   * Run response interceptors
   * @param {Object} response - Response object
   * @returns {Promise<Object>} - Modified response
   */
  async runResponseInterceptors(response) {
    let modifiedResponse = response;
    
    for (const interceptor of this.interceptors.response) {
      try {
        if (interceptor.fulfilled) {
          modifiedResponse = await interceptor.fulfilled(modifiedResponse) || modifiedResponse;
        }
      } catch (error) {
        if (interceptor.rejected) {
          modifiedResponse = await interceptor.rejected(error);
        } else {
          throw error;
        }
      }
    }
    
    return modifiedResponse;
  }

  /**
   * Run response error interceptors
   * @param {Error} error - The error object
   * @returns {Promise} - Rejected promise or modified error
   */
  async runResponseErrorInterceptors(error) {
    for (const interceptor of this.interceptors.response) {
      if (interceptor.rejected) {
        try {
          const result = await interceptor.rejected(error);
          if (result !== undefined) {
            return result;
          }
        } catch (e) {
          error = e;
        }
      }
    }
    throw error;
  }

  /**
   * Generate a unique request ID
   * @returns {string} - Unique ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Main request method
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response data
   */
  async request(options) {
    const requestId = this.generateRequestId();
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);
    
    // Merge options with defaults
    let config = {
      method: 'GET',
      headers: { ...this.config.headers },
      timeout: this.config.timeout,
      withCredentials: this.config.withCredentials,
      retries: this.config.retries,
      retryDelay: this.config.retryDelay,
      ...options,
    };
    
    // Merge custom headers
    if (options.headers) {
      config.headers = { ...config.headers, ...options.headers };
    }
    
    // Run request interceptors
    try {
      config = await this.runRequestInterceptors(config);
    } catch (error) {
      this.abortControllers.delete(requestId);
      throw error;
    }
    
    // Build URL
    const url = this.buildURL(config.url, config.params);
    
    // Prepare fetch options
    const fetchOptions = {
      method: config.method.toUpperCase(),
      headers: config.headers,
      signal: abortController.signal,
      credentials: config.withCredentials ? 'include' : 'same-origin',
    };
    
    // Add body for non-GET requests
    if (config.body !== undefined && !['GET', 'HEAD'].includes(fetchOptions.method)) {
      if (config.body instanceof FormData) {
        // Remove Content-Type for FormData (browser sets it with boundary)
        delete fetchOptions.headers['Content-Type'];
        fetchOptions.body = config.body;
      } else if (typeof config.body === 'object') {
        fetchOptions.body = JSON.stringify(config.body);
      } else {
        fetchOptions.body = config.body;
      }
    }
    
    // Update global state
    this.state.loading = true;
    this.state.pendingRequests++;
    this.state.lastRequest = { url, method: fetchOptions.method, time: Date.now() };
    this.state.error = null;
    
    // Timeout handling
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, config.timeout);
    
    // Retry logic wrapper
    const executeRequest = async (retriesLeft) => {
      try {
        const response = await fetch(url, fetchOptions);
        
        // Parse response
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else if (contentType && contentType.includes('text/')) {
          data = await response.text();
        } else {
          // Try JSON first, fallback to text
          const text = await response.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = text;
          }
        }
        
        // Build response object
        const responseObj = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          config,
          request: { url, ...fetchOptions },
        };
        
        // Check for HTTP errors
        if (!response.ok) {
          const error = new HttpError(
            data?.message || response.statusText || `Request failed with status ${response.status}`,
            response.status,
            responseObj,
            { url, ...fetchOptions }
          );
          
          // Retry on server errors (5xx)
          if (response.status >= 500 && retriesLeft > 0) {
            await new Promise(r => setTimeout(r, config.retryDelay));
            return executeRequest(retriesLeft - 1);
          }
          
          throw error;
        }
        
        // Run response interceptors
        return await this.runResponseInterceptors(responseObj);
        
      } catch (error) {
        // Handle abort
        if (error.name === 'AbortError') {
          throw new HttpError('Request timeout', 408, null, { url, ...fetchOptions });
        }
        
        // Handle network errors with retry
        if (error.name === 'TypeError' && retriesLeft > 0) {
          await new Promise(r => setTimeout(r, config.retryDelay));
          return executeRequest(retriesLeft - 1);
        }
        
        // Run error interceptors
        try {
          return await this.runResponseErrorInterceptors(error);
        } catch (e) {
          throw e;
        }
      }
    };
    
    try {
      const result = await executeRequest(config.retries);
      return result;
    } finally {
      clearTimeout(timeoutId);
      this.abortControllers.delete(requestId);
      this.state.pendingRequests--;
      this.state.loading = this.state.pendingRequests > 0;
    }
  }

  /**
   * GET request
   * @param {string} url - Endpoint URL
   * @param {Object} options - Additional options (params, headers, etc.)
   * @returns {Promise<Object>} - Response data
   */
  async get(url, options = {}) {
    return this.request({ ...options, method: 'GET', url });
  }

  /**
   * POST request
   * @param {string} url - Endpoint URL
   * @param {Object} body - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response data
   */
  async post(url, body = {}, options = {}) {
    return this.request({ ...options, method: 'POST', url, body });
  }

  /**
   * PUT request
   * @param {string} url - Endpoint URL
   * @param {Object} body - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response data
   */
  async put(url, body = {}, options = {}) {
    return this.request({ ...options, method: 'PUT', url, body });
  }

  /**
   * PATCH request
   * @param {string} url - Endpoint URL
   * @param {Object} body - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response data
   */
  async patch(url, body = {}, options = {}) {
    return this.request({ ...options, method: 'PATCH', url, body });
  }

  /**
   * DELETE request
   * @param {string} url - Endpoint URL
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response data
   */
  async delete(url, options = {}) {
    return this.request({ ...options, method: 'DELETE', url });
  }

  /**
   * HEAD request
   * @param {string} url - Endpoint URL
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response headers
   */
  async head(url, options = {}) {
    return this.request({ ...options, method: 'HEAD', url });
  }

  /**
   * OPTIONS request
   * @param {string} url - Endpoint URL
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Response data
   */
  async options(url, options = {}) {
    return this.request({ ...options, method: 'OPTIONS', url });
  }

  /**
   * Upload file(s) with progress tracking
   * @param {string} url - Upload endpoint URL
   * @param {File|File[]|FormData} files - File(s) to upload
   * @param {Object} options - Upload options
   * @returns {Object} - { promise, tracker, abort }
   */
  upload(url, files, options = {}) {
    const tracker = new UploadTracker(this.reactive);
    const abortController = new AbortController();
    const requestId = this.generateRequestId();
    this.abortControllers.set(requestId, abortController);
    
    const {
      fieldName = 'file',
      additionalData = {},
      headers = {},
      onProgress,
      onComplete,
      onError,
      ...restOptions
    } = options;
    
    // Build FormData
    let formData;
    if (files instanceof FormData) {
      formData = files;
    } else {
      formData = new FormData();
      
      if (Array.isArray(files)) {
        files.forEach((file, index) => {
          formData.append(`${fieldName}[${index}]`, file);
        });
      } else {
        formData.append(fieldName, files);
      }
      
      // Add additional data
      for (const [key, value] of Object.entries(additionalData)) {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
        }
      }
    }
    
    // Calculate total size
    let totalSize = 0;
    for (const [, value] of formData.entries()) {
      if (value instanceof File) {
        totalSize += value.size;
      } else if (typeof value === 'string') {
        totalSize += new Blob([value]).size;
      }
    }
    
    tracker.start(totalSize);
    
    // Create XMLHttpRequest for progress tracking
    const promise = new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Progress handler
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          tracker.update(event.loaded, event.total);
          if (onProgress) {
            onProgress({
              loaded: event.loaded,
              total: event.total,
              progress: tracker.state.progress,
              speed: tracker.state.speed,
              remainingTime: tracker.state.remainingTime,
            });
          }
        }
      });
      
      // Load handler (success)
      xhr.addEventListener('load', async () => {
        this.abortControllers.delete(requestId);
        
        let data;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          data = xhr.responseText;
        }
        
        const response = {
          data,
          status: xhr.status,
          statusText: xhr.statusText,
          headers: this.parseXHRHeaders(xhr.getAllResponseHeaders()),
        };
        
        if (xhr.status >= 200 && xhr.status < 300) {
          tracker.complete();
          
          // Run response interceptors
          try {
            const interceptedResponse = await this.runResponseInterceptors(response);
            if (onComplete) {
              onComplete(interceptedResponse);
            }
            resolve(interceptedResponse);
          } catch (error) {
            tracker.fail(error);
            if (onError) onError(error);
            reject(error);
          }
        } else {
          const error = new HttpError(
            data?.message || xhr.statusText || 'Upload failed',
            xhr.status,
            response,
            { url, method: 'POST' }
          );
          tracker.fail(error);
          
          try {
            await this.runResponseErrorInterceptors(error);
          } catch (e) {
            if (onError) onError(e);
            reject(e);
          }
        }
      });
      
      // Error handler
      xhr.addEventListener('error', () => {
        this.abortControllers.delete(requestId);
        const error = new HttpError('Network error during upload', 0, null, { url, method: 'POST' });
        tracker.fail(error);
        if (onError) onError(error);
        reject(error);
      });
      
      // Abort handler
      xhr.addEventListener('abort', () => {
        this.abortControllers.delete(requestId);
        const error = new HttpError('Upload cancelled', 0, null, { url, method: 'POST' });
        tracker.fail(error);
        if (onError) onError(error);
        reject(error);
      });
      
      // Timeout handler
      xhr.addEventListener('timeout', () => {
        this.abortControllers.delete(requestId);
        const error = new HttpError('Upload timeout', 408, null, { url, method: 'POST' });
        tracker.fail(error);
        if (onError) onError(error);
        reject(error);
      });
      
      // Abort signal listener
      abortController.signal.addEventListener('abort', () => {
        xhr.abort();
      });
      
      // Open and configure request
      const fullURL = this.buildURL(url);
      xhr.open('POST', fullURL);
      
      // Set headers (excluding Content-Type for FormData)
      const mergedHeaders = { ...this.config.headers, ...headers };
      delete mergedHeaders['Content-Type']; // Let browser set it
      
      for (const [key, value] of Object.entries(mergedHeaders)) {
        xhr.setRequestHeader(key, value);
      }
      
      // Set timeout
      xhr.timeout = restOptions.timeout || this.config.timeout;
      
      // Set credentials
      xhr.withCredentials = restOptions.withCredentials ?? this.config.withCredentials;
      
      // Send request
      xhr.send(formData);
    });
    
    return {
      promise,
      tracker: tracker.state,
      abort: () => abortController.abort(),
      requestId,
    };
  }

  /**
   * Parse XHR response headers
   * @param {string} headersString - Raw headers string
   * @returns {Object} - Parsed headers object
   */
  parseXHRHeaders(headersString) {
    const headers = {};
    if (!headersString) return headers;
    
    headersString.split('\r\n').forEach(line => {
      const [key, ...values] = line.split(':');
      if (key && values.length) {
        headers[key.trim().toLowerCase()] = values.join(':').trim();
      }
    });
    
    return headers;
  }

  /**
   * Download file with progress
   * @param {string} url - Download URL
   * @param {Object} options - Download options
   * @returns {Object} - { promise, tracker, abort }
   */
  download(url, options = {}) {
    const tracker = new UploadTracker(this.reactive); // Reuse tracker for download
    const abortController = new AbortController();
    const requestId = this.generateRequestId();
    this.abortControllers.set(requestId, abortController);
    
    const {
      filename,
      onProgress,
      onComplete,
      onError,
      ...restOptions
    } = options;
    
    const promise = (async () => {
      try {
        const response = await fetch(this.buildURL(url), {
          method: 'GET',
          headers: { ...this.config.headers, ...options.headers },
          signal: abortController.signal,
          credentials: this.config.withCredentials ? 'include' : 'same-origin',
        });
        
        if (!response.ok) {
          throw new HttpError(
            `Download failed with status ${response.status}`,
            response.status,
            null,
            { url, method: 'GET' }
          );
        }
        
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        tracker.start(total);
        
        const reader = response.body.getReader();
        const chunks = [];
        let loaded = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          loaded += value.length;
          
          if (total > 0) {
            tracker.update(loaded, total);
            if (onProgress) {
              onProgress({
                loaded,
                total,
                progress: tracker.state.progress,
                speed: tracker.state.speed,
                remainingTime: tracker.state.remainingTime,
              });
            }
          }
        }
        
        tracker.complete();
        
        // Combine chunks into Blob
        const blob = new Blob(chunks);
        
        // Auto-download if filename provided
        if (filename) {
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
        }
        
        const result = { blob, filename, size: blob.size };
        
        if (onComplete) {
          onComplete(result);
        }
        
        this.abortControllers.delete(requestId);
        return result;
        
      } catch (error) {
        this.abortControllers.delete(requestId);
        
        if (error.name === 'AbortError') {
          const abortError = new HttpError('Download cancelled', 0, null, { url, method: 'GET' });
          tracker.fail(abortError);
          if (onError) onError(abortError);
          throw abortError;
        }
        
        tracker.fail(error);
        if (onError) onError(error);
        throw error;
      }
    })();
    
    return {
      promise,
      tracker: tracker.state,
      abort: () => abortController.abort(),
      requestId,
    };
  }

  /**
   * Cancel a specific request by ID
   * @param {string} requestId - Request ID to cancel
   */
  cancelRequest(requestId) {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAll() {
    for (const [id, controller] of this.abortControllers) {
      controller.abort();
    }
    this.abortControllers.clear();
    this.state.loading = false;
    this.state.pendingRequests = 0;
  }

  /**
   * Create a new instance with merged configuration
   * @param {Object} config - Configuration to merge
   * @returns {ZogHttpClient} - New client instance
   */
  create(config = {}) {
    return new ZogHttpClient(
      { ...this.config, ...config },
      this.reactive,
      this.ref
    );
  }
}

/**
 * ZogHttp Plugin for Zog.js
 * 
 * Usage:
 * ```javascript
 * import { createApp } from './zog.js';
 * import { ZogHttpPlugin } from './zog-http.js';
 * 
 * createApp(() => ({
 *   // your reactive data
 * }))
 * .use(ZogHttpPlugin, {
 *   baseURL: 'https://api.example.com',
 *   timeout: 30000,
 *   headers: {
 *     'X-Custom-Header': 'value'
 *   }
 * })
 * .mount('#app');
 * ```
 * 
 * After installation, $http is available in scope:
 * ```javascript
 * // In your app methods:
 * async fetchUsers() {
 *   const response = await this.$http.get('/users');
 *   this.users = response.data;
 * }
 * ```
 */
export const ZogHttpPlugin = {
  install(api, options = {}) {
    const { reactive, ref } = api;
    
    // Create HTTP client instance
    const http = new ZogHttpClient(options, reactive, ref);
    
    // Store reference for global access
    ZogHttpPlugin._instance = http;
    
    // Inject $http into all scopes via afterCompile hook
    api.onHook('afterCompile', (el, scope, cs) => {
      // Only inject once per scope
      if (!scope.$http) {
        scope.$http = http;
        
        // Also inject convenience methods
        scope.$get = http.get.bind(http);
        scope.$post = http.post.bind(http);
        scope.$put = http.put.bind(http);
        scope.$patch = http.patch.bind(http);
        scope.$delete = http.delete.bind(http);
        scope.$upload = http.upload.bind(http);
        scope.$download = http.download.bind(http);
      }
    });
    
    // Handle errors from HTTP requests
    api.onHook('onError', (err, type, context) => {
      if (err.isHttpError) {
        console.error(`[ZogHttp] ${err.status} - ${err.message}`, err.response);
      }
    });
  },
  
  /**
   * Get the HTTP client instance (for use outside Zog components)
   * @returns {ZogHttpClient|null}
   */
  getInstance() {
    return ZogHttpPlugin._instance || null;
  }
};

/**
 * Create a standalone HTTP client (without Zog.js)
 * @param {Object} options - Configuration options
 * @returns {ZogHttpClient} - HTTP client instance
 */
export function createHttpClient(options = {}) {
  // Minimal reactive implementation for standalone use
  const simpleReactive = (obj) => obj;
  const simpleRef = (val) => ({ value: val });
  
  return new ZogHttpClient(options, simpleReactive, simpleRef);
}

// Export classes for advanced usage
export { ZogHttpClient, UploadTracker };

// Default export
export default ZogHttpPlugin;