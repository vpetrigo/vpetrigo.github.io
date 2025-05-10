---
layout: page
title: About
---

<div class="message">
<img src="{{ "assets/me.jpeg" | relative_url }}" alt="avatar" class="rounded" width=140em>
Hello! My name is Vladimir and I am an embedded systems engineer.
<br /><br />
You may find some of my projects on <a href="{{site.repo}}" alt="GitHub">GitHub</a> and
find out some info about my experience on <a href="{{site.linkedin}}" alt="LinkedIn">LinkedIn</a>
<br /><br />
If you have a question, feel free to reach me out via email. Or send me a message
on my <a href="{{site.boosty}}" alt="Boosty">Boosty</a> page where you can support me
as well if you like. :sweat_smile:
<br /><br />
<b>Crypto Wallets:</b>
<div class="crypto-wallet">
    <div class="wallet-row">
        <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256">
                <defs>
                    <linearGradient id="logosBitcoin0" x1="49.973%" x2="49.973%" y1="-.024%" y2="99.99%">
                        <stop offset="0%" stop-color="#F9AA4B" />
                        <stop offset="100%" stop-color="#F7931A" />
                    </linearGradient>
                </defs>
                <path fill="url(#logosBitcoin0)"
                    d="M252.171 158.954c-17.102 68.608-86.613 110.314-155.123 93.211c-68.61-17.102-110.316-86.61-93.213-155.119C20.937 28.438 90.347-13.268 158.957 3.835c68.51 17.002 110.317 86.51 93.214 155.119Z" />
                <path fill="#FFF"
                    d="M188.945 112.05c2.5-17-10.4-26.2-28.2-32.3l5.8-23.1l-14-3.5l-5.6 22.5c-3.7-.9-7.5-1.8-11.3-2.6l5.6-22.6l-14-3.5l-5.7 23c-3.1-.7-6.1-1.4-9-2.1v-.1l-19.4-4.8l-3.7 15s10.4 2.4 10.2 2.5c5.7 1.4 6.7 5.2 6.5 8.2l-6.6 26.3c.4.1.9.2 1.5.5c-.5-.1-1-.2-1.5-.4l-9.2 36.8c-.7 1.7-2.5 4.3-6.4 3.3c.1.2-10.2-2.5-10.2-2.5l-7 16.1l18.3 4.6c3.4.9 6.7 1.7 10 2.6l-5.8 23.3l14 3.5l5.8-23.1c3.8 1 7.6 2 11.2 2.9l-5.7 23l14 3.5l5.8-23.3c24 4.5 42 2.7 49.5-19c6.1-17.4-.3-27.5-12.9-34.1c9.3-2.1 16.2-8.2 18-20.6Zm-32.1 45c-4.3 17.4-33.7 8-43.2 5.6l7.7-30.9c9.5 2.4 40.1 7.1 35.5 25.3Zm4.4-45.3c-4 15.9-28.4 7.8-36.3 5.8l7-28c7.9 2 33.4 5.7 29.3 22.2Z" />
            </svg>
        </span>
        <img src="{{ 'assets/btc.png' | relative_url }}" alt="BTC QR Code" class="qr-code" />
        <div class="wallet-address">
            <span class="address" id="btc-address">18JQRbkXFAFnsDfqFe6xqpcfUV9rKHCGpM</span>
            <button class="copy-btn" onclick="copyToClipboard('btc-address')">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </button>
        </div>
    </div>

    <div class="wallet-row">
        <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 417">
                <path fill="#343434" d="m127.961 0l-2.795 9.5v275.668l2.795 2.79l127.962-75.638z" />
                <path fill="#8C8C8C" d="M127.962 0L0 212.32l127.962 75.639V154.158z" />
                <path fill="#3C3C3B" d="m127.961 312.187l-1.575 1.92v98.199l1.575 4.601l128.038-180.32z" />
                <path fill="#8C8C8C" d="M127.962 416.905v-104.72L0 236.585z" />
                <path fill="#141414" d="m127.961 287.958l127.96-75.637l-127.96-58.162z" />
                <path fill="#393939" d="m.001 212.321l127.96 75.637V154.159z" />
            </svg>
        </span>
        <img src="{{ 'assets/eth.png' | relative_url }}" alt="ETH QR Code" class="qr-code" />
        <div class="wallet-address">
            <span class="address" id="eth-address">0x60Fe1F3248E79dEd1285944bC97f4EA44e6c2e39</span>
            <button class="copy-btn" onclick="copyToClipboard('eth-address')">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </button>
        </div>
    </div>
    
    <div class="wallet-row">
        <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32">
                <g fill="none" fill-rule="evenodd">
                    <circle cx="16" cy="16" r="16" fill="#C3A634" />
                    <path fill="#FFF"
                        d="M13.248 14.61h4.314v2.286h-4.314v4.818h2.721c1.077 0 1.958-.145 2.644-.437c.686-.291 1.224-.694 1.615-1.21a4.4 4.4 0 0 0 .796-1.815a11.4 11.4 0 0 0 .21-2.252a11.4 11.4 0 0 0-.21-2.252a4.396 4.396 0 0 0-.796-1.815c-.391-.516-.93-.919-1.615-1.21c-.686-.292-1.567-.437-2.644-.437h-2.721v4.325zm-2.766 2.286H9v-2.285h1.482V8h6.549c1.21 0 2.257.21 3.142.627c.885.419 1.607.99 2.168 1.715c.56.724.977 1.572 1.25 2.543c.273.971.409 2.01.409 3.115a11.47 11.47 0 0 1-.41 3.115c-.272.97-.689 1.819-1.25 2.543c-.56.725-1.282 1.296-2.167 1.715c-.885.418-1.933.627-3.142.627h-6.549v-7.104z" />
                </g>
            </svg>
        </span>
        <img src="{{ 'assets/doge.png' | relative_url }}" alt="DOGE QR Code" class="qr-code" />
        <div class="wallet-address">
            <span class="address" id="doge-address">DFK2N49MxxhGoo5x44kUUy2Bgpsr6K9Kqy</span>
            <button class="copy-btn" onclick="copyToClipboard('doge-address')">
                <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            </button>
        </div>
    </div>
</div>
</div>
