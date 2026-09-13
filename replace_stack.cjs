const fs = require('fs');

let content = fs.readFileSync('app/pages/index.vue', 'utf8');

const newStack = `
                <!-- Card 3 — paling belakang -->
                <article class="stack-card stack-card--3 product-card"
                    data-title="Admin Dashboard Pro"
                    data-category="Web Template"
                    data-price="199000"
                    data-img="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
                    data-tags="Dashboard,HTML">
                    <div class="card-thumb">
                        <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=70" alt="Admin Dashboard Pro">
                        <span class="card-badge premium">Premium</span>
                    </div>
                    <div class="card-body">
                        <span class="card-category">Web Template</span>
                        <h3 class="card-title">Admin Dashboard Pro</h3>
                        <div class="card-footer">
                            <span class="card-price">Rp 199.000</span>
                            <div class="card-rating"><i class="fa-solid fa-star"></i> 4.8</div>
                        </div>
                        <div class="card-actions hero-featured-btn" style="padding:0; margin-top:8px;">
                            <button class="btn-primary card-buy-direct" style="width:100%"
                                data-title="Admin Dashboard Pro"
                                data-category="Web Template"
                                data-price="199000"
                                data-img="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
                                data-tags="Dashboard,HTML">
                                <i class="fa-solid fa-cart-shopping"></i> Tambah
                            </button>
                        </div>
                    </div>
                </article>

                <!-- Card 2 — tengah -->
                <article class="stack-card stack-card--2 product-card"
                    data-title="UI/UX Startup Kit"
                    data-category="UI Kit"
                    data-price="150000"
                    data-img="https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80"
                    data-tags="Figma,Design">
                    <div class="card-thumb">
                        <img src="https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=400&q=70" alt="UI/UX Startup Kit">
                        <span class="card-badge premium">Premium</span>
                    </div>
                    <div class="card-body">
                        <span class="card-category">UI Kit</span>
                        <h3 class="card-title">UI/UX Startup Kit</h3>
                        <div class="card-footer">
                            <span class="card-price">Rp 150.000</span>
                            <div class="card-rating"><i class="fa-solid fa-star"></i> 5.0</div>
                        </div>
                        <div class="card-actions hero-featured-btn" style="padding:0; margin-top:8px;">
                            <button class="btn-primary card-buy-direct" style="width:100%"
                                data-title="UI/UX Startup Kit"
                                data-category="UI Kit"
                                data-price="150000"
                                data-img="https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80"
                                data-tags="Figma,Design">
                                <i class="fa-solid fa-cart-shopping"></i> Tambah
                            </button>
                        </div>
                    </div>
                </article>

                <!-- Card 1 — paling depan (aktif) -->
                <article class="stack-card stack-card--1 stack-active product-card"
                    data-title="Template E-Commerce Super"
                    data-category="Web Template"
                    data-price="350000"
                    data-img="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"
                    data-tags="HTML,E-Commerce">
                    <div class="card-thumb">
                        <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80" alt="Template E-Commerce Super">
                        <span class="card-badge premium">Premium</span>
                    </div>
                    <div class="card-body">
                        <span class="card-category">Web Template</span>
                        <h3 class="card-title">Template E-Commerce Super</h3>
                        <div class="card-footer">
                            <span class="card-price">Rp 350.000</span>
                            <div class="card-rating"><i class="fa-solid fa-star"></i> 4.9</div>
                        </div>
                        <div class="card-actions hero-featured-btn" style="padding:0; margin-top:8px;">
                            <button class="btn-primary card-buy-direct" style="width:100%"
                                data-title="Template E-Commerce Super"
                                data-category="Web Template"
                                data-price="350000"
                                data-img="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80"
                                data-tags="HTML,E-Commerce">
                                <i class="fa-solid fa-cart-shopping"></i> Tambah
                            </button>
                        </div>
                    </div>
                </article>
`;

content = content.replace(/<!-- Card 3 — paling belakang -->[\s\S]*?<!-- Hint klik -->/, newStack + '\n                <!-- Hint klik -->');
fs.writeFileSync('app/pages/index.vue', content);
console.log('Replaced stack cards.');
