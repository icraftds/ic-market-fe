import { noStoreHeaders } from '../sso/security.js'

// Jangan pernah cache publik respons yang menyetel cookie (mis. sesi/CSRF).
export default defineNitroPlugin(nitroApp => {
    nitroApp.hooks.hook('beforeResponse', event => {
        if (event.node.res.hasHeader('set-cookie')) {
            for (const [name, value] of Object.entries(noStoreHeaders)) event.node.res.setHeader(name, value)
        }
    })
})
