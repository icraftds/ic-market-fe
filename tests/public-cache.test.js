import test from 'node:test'
import assert from 'node:assert/strict'
import { cacheHeadersFor, noStoreHeaders, publicCacheHeaders } from '../server/sso/security.js'

test('anonymous visitors may cache public pages', () => {
    for (const path of ['/', '/product/web-sprint-js', '/store/creative-studio', '/blog', '/faq', '/panduan', '/tentang', '/kebijakan']) {
        assert.equal(cacheHeadersFor({ method: 'GET', path }), publicCacheHeaders, path)
    }
})

test('anything with a cookie, private routes and non-GET stay no-store', () => {
    assert.equal(cacheHeadersFor({ path: '/', cookie: 'sid=abc' }), noStoreHeaders)
    for (const path of ['/cart', '/checkout', '/orders', '/profile', '/admin/orders', '/seller/dashboard', '/login', '/auth/callback', '/api/session', '/product', '/product/a/b']) {
        assert.equal(cacheHeadersFor({ method: 'GET', path }), noStoreHeaders, path)
    }
    assert.equal(cacheHeadersFor({ method: 'POST', path: '/' }), noStoreHeaders)
})
