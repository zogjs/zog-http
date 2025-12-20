/**
 * ZogKit v0.3.0
 * Essential utilities plugin for Zog.js
 * 
 * @description A comprehensive utilities plugin providing HTTP client, storage helpers,
 * DOM directives, event bus, and performance utilities for Zog.js applications
 * @author Ben Khalife
 * @license MIT
 */

export const ZogKit = {
    name: 'ZogKit',
    version: '0.3.0',

    install(zog, options = {}) {
        const { reactive, ref, computed, watchEffect, addHook, utils } = zog;
        const { compile, Scope, evalExp } = utils;

        // Configuration
        const config = {
            http: {
                baseURL: options.baseURL || '',
                timeout: options.timeout || 30000,
                headers: options.headers || {}
            },
            storage: {
                prefix: options.storagePrefix || 'zog_',
                ttl: options.storageTTL || null
            }
        };

        // ============================================
        // z-pre: Skip compilation completely
        // ============================================
        addHook('beforeCompile', (el) => {
            if (el.nodeType === 1 && el.hasAttribute('z-pre')) {
                el.removeAttribute('z-pre');
                return false;
            }
        });

        // ============================================
        // z-once: Render once without reactivity
        // ============================================
        addHook('beforeCompile', (el, scope, cs) => {
            if (el.nodeType !== 1 || !el.hasAttribute('z-once')) return;

            el.removeAttribute('z-once');

            const compileOnce = (node) => {
                if (!node) return;

                // Process text nodes with interpolation
                if (node.nodeType === 3) {
                    const txt = node.textContent;
                    if (txt.includes('{{')) {
                        node.textContent = txt.replace(/{{\s*(.*?)\s*}}/g, (_, exp) => {
                            try {
                                return evalExp(exp, scope) ?? '';
                            } catch (err) {
                                return '';
                            }
                        });
                    }
                    return;
                }

                if (node.nodeType !== 1) return;

                const attrsToRemove = [];

                // Process reactive attributes
                for (const attr of [...node.attributes]) {
                    const { name, value } = attr;

                    // Skip event handlers
                    if (name.startsWith('@') || name.startsWith('z-on:')) {
                        attrsToRemove.push(name);
                        continue;
                    }

                    // Process directives and bindings
                    if (name.startsWith(':') || name.startsWith('z-')) {
                        attrsToRemove.push(name);

                        try {
                            const attrName = name[0] === ':' ? name.slice(1) : name;
                            const result = evalExp(value, scope);

                            if (attrName === 'z-text') {
                                node.textContent = result ?? '';
                            } else if (attrName === 'z-html') {
                                node.innerHTML = result ?? '';
                            } else if (attrName === 'z-show') {
                                node.style.display = result ? '' : 'none';
                            } else if (attrName === 'class') {
                                if (typeof result === 'object' && result !== null) {
                                    const dynamic = Object.keys(result).filter(k => result[k]).join(' ');
                                    node.className = (node.className + ' ' + dynamic).trim();
                                } else if (typeof result === 'string') {
                                    node.className = (node.className + ' ' + result).trim();
                                }
                            } else if (!attrName.startsWith('z-')) {
                                if (typeof result === 'boolean') {
                                    result ? node.setAttribute(attrName, '') : node.removeAttribute(attrName);
                                } else if (result != null) {
                                    node.setAttribute(attrName, String(result));
                                }
                            }
                        } catch (err) {
                            // Silent fail for production
                        }
                    }
                }

                attrsToRemove.forEach(name => node.removeAttribute(name));
                [...node.childNodes].forEach(compileOnce);
            };

            compileOnce(el);
            return false;
        });

        // ============================================
        // z-cloak: Hide element until compiled
        // ============================================
        if (!document.getElementById('zog-kit-styles')) {
            const style = document.createElement('style');
            style.id = 'zog-kit-styles';
            style.textContent = `[z-cloak] { display: none !important; }`;
            document.head.appendChild(style);
        }

        addHook('afterCompile', (el) => {
            if (el.nodeType === 1 && el.hasAttribute('z-cloak')) {
                el.removeAttribute('z-cloak');
            }
        });

        // ============================================
        // z-autofocus: Auto focus when element appears
        // ============================================
        addHook('beforeCompile', (el, scope, cs) => {
            if (el.nodeType !== 1 || !el.hasAttribute('z-autofocus')) return;

            el.removeAttribute('z-autofocus');

            const markerId = 'af-' + Math.random().toString(36).substr(2, 6);
            el.setAttribute('data-autofocus', markerId);

            const tryFocus = () => {
                const realEl = document.querySelector(`[data-autofocus="${markerId}"]`);
                if (realEl && document.body.contains(realEl)) {
                    realEl.focus();
                    return true;
                }
                return false;
            };

            // Attempt to focus after DOM updates
            requestAnimationFrame(() => {
                if (tryFocus()) return;

                // Wait for element to be inserted (e.g., via z-if)
                const observer = new MutationObserver(() => {
                    if (tryFocus()) {
                        observer.disconnect();
                    }
                });

                observer.observe(document.body, { childList: true, subtree: true });
                cs.addEffect(() => observer.disconnect());
            });
        });

        // ============================================
        // z-click-outside: Detect clicks outside element
        // ============================================
        addHook('beforeCompile', (el, scope, cs) => {
            if (el.nodeType !== 1 || !el.hasAttribute('z-click-outside')) return;

            const expression = el.getAttribute('z-click-outside');
            el.removeAttribute('z-click-outside');

            const uniqueId = 'zog-outside-' + Math.random().toString(36).substr(2, 9);
            el.setAttribute('data-click-outside-id', uniqueId);

            let currentListener = null;

            cs.addEffect(watchEffect(() => {
                const inDOM = document.body.contains(el);

                if (currentListener) {
                    document.removeEventListener('click', currentListener, true);
                    currentListener = null;
                }

                if (inDOM) {
                    const handleClickOutside = (e) => {
                        const realEl = document.querySelector(`[data-click-outside-id="${uniqueId}"]`);

                        if (!realEl || realEl.contains(e.target)) return;

                        const fn = scope[expression];
                        if (typeof fn === 'function') {
                            fn(e);
                        } else {
                            try {
                                Function(...Object.keys(scope), 'e', '$event', `"use strict";${expression}`)(
                                    ...Object.values(scope), e, e
                                );
                            } catch (err) {
                                // Silent fail for production
                            }
                        }
                    };

                    setTimeout(() => {
                        document.addEventListener('click', handleClickOutside, true);
                        currentListener = handleClickOutside;
                    }, 0);
                }
            }));

            cs.addEffect(() => {
                if (currentListener) {
                    document.removeEventListener('click', currentListener, true);
                }
                el.removeAttribute('data-click-outside-id');
            });
        });

        // ============================================
        // HTTP Client
        // ============================================
        class ZogFetch {
            constructor(baseConfig = {}) {
                this.config = { ...config.http, ...baseConfig };
                this.pendingRequests = new Map();
            }

            async request(url, options = {}) {
                const fullURL = url.startsWith('http') ? url : this.config.baseURL + url;
                const controller = new AbortController();

                const finalOptions = {
                    method: options.method || 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.config.headers,
                        ...options.headers
                    },
                    signal: controller.signal,
                    ...options
                };

                const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.config.timeout);

                if (options.body && !(options.body instanceof FormData)) {
                    finalOptions.body = JSON.stringify(options.body);
                }

                try {
                    const response = await fetch(fullURL, finalOptions);
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        throw new Error(`HTTP Error: ${response.status}`);
                    }

                    const contentType = response.headers.get('content-type');
                    const data = contentType?.includes('application/json')
                        ? await response.json()
                        : await response.text();

                    return { data, response, status: response.status };
                } catch (error) {
                    clearTimeout(timeoutId);
                    throw error;
                }
            }

            get(url, options = {}) { return this.request(url, { ...options, method: 'GET' }); }
            post(url, body, options = {}) { return this.request(url, { ...options, method: 'POST', body }); }
            put(url, body, options = {}) { return this.request(url, { ...options, method: 'PUT', body }); }
            delete(url, options = {}) { return this.request(url, { ...options, method: 'DELETE' }); }
        }

        const $http = new ZogFetch();

        // ============================================
        // Storage Helper
        // ============================================
        class StorageHelper {
            constructor(storage, prefix = 'zog_') {
                this.storage = storage;
                this.prefix = prefix;
            }

            _getKey(key) { return this.prefix + key; }

            set(key, value, ttl = null) {
                try {
                    this.storage.setItem(this._getKey(key), JSON.stringify({ value, timestamp: Date.now(), ttl }));
                    return true;
                } catch (e) { return false; }
            }

            get(key, defaultValue = null) {
                try {
                    const item = this.storage.getItem(this._getKey(key));
                    if (!item) return defaultValue;
                    const data = JSON.parse(item);
                    if (data.ttl && (Date.now() - data.timestamp) > data.ttl) {
                        this.remove(key);
                        return defaultValue;
                    }
                    return data.value;
                } catch (e) { return defaultValue; }
            }

            remove(key) { this.storage.removeItem(this._getKey(key)); }

            clear() {
                Object.keys(this.storage).forEach(key => {
                    if (key.startsWith(this.prefix)) this.storage.removeItem(key);
                });
            }

            has(key) { return this.storage.getItem(this._getKey(key)) !== null; }

            reactive(key, defaultValue = null, ttl = null) {
                const storedValue = this.get(key, defaultValue);
                const state = ref(storedValue);
                watchEffect(() => { this.set(key, state.value, ttl); });
                return state;
            }
        }

        const $storage = new StorageHelper(localStorage, config.storage.prefix);
        const $session = new StorageHelper(sessionStorage, config.storage.prefix);

        // ============================================
        // Performance Utilities
        // ============================================
        function debounce(fn, delay = 300) {
            let timeoutId;
            return function (...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn.apply(this, args), delay);
            };
        }

        function throttle(fn, limit = 300) {
            let inThrottle;
            return function (...args) {
                if (!inThrottle) {
                    fn.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }

        // ============================================
        // Event Modifier Processing (debounce/throttle)
        // ============================================
        addHook('beforeCompile', (el, scope, cs) => {
            if (el.nodeType !== 1) return;

            const attrsToRemove = [];
            const eventsToAdd = [];

            [...el.attributes].forEach(attr => {
                if (attr.name.startsWith('@') || attr.name.startsWith('z-on:')) {
                    const parts = attr.name.split('.');
                    if (parts.length > 1) {
                        const modifiers = parts.slice(1);
                        const hasDebounce = modifiers.includes('debounce');
                        const hasThrottle = modifiers.includes('throttle');

                        if (hasDebounce || hasThrottle) {
                            const delay = parseInt(modifiers.find(m => !isNaN(m))) || 300;
                            const eventName = attr.name[0] === '@' ? parts[0].slice(1) : parts[0].slice(5);
                            const expression = attr.value;

                            attrsToRemove.push(attr.name);
                            eventsToAdd.push({ eventName, expression, wrapper: hasDebounce ? debounce : throttle, delay });
                        }
                    }
                }
            });

            attrsToRemove.forEach(name => el.removeAttribute(name));

            eventsToAdd.forEach(({ eventName, expression, wrapper, delay }) => {
                const handler = (e) => {
                    const fn = scope[expression];
                    if (typeof fn === 'function') {
                        fn(e);
                    } else {
                        try {
                            Function(...Object.keys(scope), 'e', `"use strict";${expression}`)(...Object.values(scope), e);
                        } catch (err) {
                            // Silent fail for production
                        }
                    }
                };

                const wrappedHandler = wrapper(handler, delay);
                el.addEventListener(eventName, wrappedHandler);
                cs.addListener(el, eventName, wrappedHandler);
            });
        });

        // ============================================
        // Lazy Loading
        // ============================================
        const lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.getAttribute('data-lazy-src');
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-lazy-src');
                        lazyObserver.unobserve(img);
                    }
                }
            });
        }, { rootMargin: '50px' });

        addHook('afterCompile', (el) => {
            if (el.nodeType === 1 && el.hasAttribute('z-lazy')) {
                const src = el.getAttribute('z-lazy');
                el.removeAttribute('z-lazy');
                el.setAttribute('data-lazy-src', src);
                lazyObserver.observe(el);
            }
        });

        // ============================================
        // Clipboard Helper
        // ============================================
        const $clipboard = {
            async copy(text) {
                try {
                    await navigator.clipboard.writeText(text);
                    return true;
                } catch (err) {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    textarea.style.cssText = 'position:fixed;opacity:0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    const success = document.execCommand('copy');
                    document.body.removeChild(textarea);
                    return success;
                }
            }
        };

        addHook('beforeCompile', (el, scope, cs) => {
            if (el.nodeType !== 1 || !el.hasAttribute('z-copy')) return;

            const expression = el.getAttribute('z-copy');
            el.removeAttribute('z-copy');

            const clickHandler = async () => {
                try {
                    const text = evalExp(expression, scope);
                    const success = await $clipboard.copy(String(text));
                    if (success) {
                        el.dispatchEvent(new CustomEvent('copied', { detail: text, bubbles: true }));
                    }
                } catch (err) {
                    // Silent fail for production
                }
            };

            el.addEventListener('click', clickHandler);
            cs.addListener(el, 'click', clickHandler);
        });

        // ============================================
        // Event Bus
        // ============================================
        class EventBus {
            constructor() { this.events = new Map(); }

            on(event, handler) {
                if (!this.events.has(event)) this.events.set(event, new Set());
                this.events.get(event).add(handler);
                return () => this.off(event, handler);
            }

            off(event, handler) { this.events.get(event)?.delete(handler); }

            emit(event, data) { this.events.get(event)?.forEach(h => h(data)); }

            once(event, handler) {
                const once = (data) => { handler(data); this.off(event, once); };
                this.on(event, once);
            }

            clear(event) { event ? this.events.delete(event) : this.events.clear(); }
        }

        const $bus = new EventBus();

        // Return public API
        return {
            $http,
            $storage,
            $session,
            $clipboard,
            $bus,
            utils: { debounce, throttle },
            version: this.version
        };
    }
};

export default ZogKit;