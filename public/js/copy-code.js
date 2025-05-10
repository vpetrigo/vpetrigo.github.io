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

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;

    navigator.clipboard.writeText(text).then(
        function() {
            // Show temporary success message
            const button = element.nextElementSibling;
            const originalHTML = button.innerHTML;

            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            button.style.color = 'green';

            setTimeout(function() {
                button.innerHTML = originalHTML;
                button.style.color = '';
            }, 2000);
        }
    ).catch(function(err) {
        console.error('Could not copy text: ', err);
    });
}
