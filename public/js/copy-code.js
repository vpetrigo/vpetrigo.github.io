let codeBlocks = document.querySelectorAll('pre.highlight');

codeBlocks.forEach(function (codeBlock) {
    let copyButton = document.createElement('button');
    copyButton.className = 'copy';
    copyButton.type = 'button';
    copyButton.ariaLabel = 'Copy code to clipboard';
    copyButton.innerText = 'Copy';

    copyButton.addEventListener('click', function () {
        let code = codeBlock.querySelector('code').innerText;

        try {
            code = code.trimEnd()
        } catch (e) {
            code = code.trim();
        }

        navigator.clipboard.writeText(code);

        copyButton.innerText = 'Copied';
        let fourSeconds = 4000;

        setTimeout(function () {
            copyButton.innerText = 'Copy';
        }, fourSeconds);
    });

    codeBlock.appendChild(copyButton);
});
