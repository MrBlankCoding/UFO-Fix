// ==UserScript==
// @name         Fix UFO loading
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Its 3 Am and I wanna fucking sleep
// @author       MrBlankCoding
// @match        https://lolbeans.io/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lolbeans.io
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let localGLBData = null;
    let container = null;

    try {
        const storedGLB = localStorage.getItem('savedGLBFile');
        if (storedGLB) {
            localGLBData = new Uint8Array(JSON.parse(storedGLB)).buffer;
            console.log('Loaded GLB file from storage');
        }
    } catch (error) {
        console.error('Error loading from storage:', error);
    }

    function createFileInput() {
        container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '10px';
        container.style.right = '10px';
        container.style.zIndex = '10000';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        container.style.padding = '10px';
        container.style.borderRadius = '5px';
        container.style.color = 'white';

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.glb';
        input.style.color = 'white';

        const status = document.createElement('div');
        status.textContent = 'Please select your GLB file';
        status.style.marginTop = '5px';
        status.style.fontSize = '12px';

        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        localGLBData = e.target.result;
                        const uint8Array = new Uint8Array(localGLBData);
                        localStorage.setItem('savedGLBFile', JSON.stringify(Array.from(uint8Array)));
                        status.textContent = 'GLB file saved successfully!';
                        status.style.color = '#90EE90';
                        console.log('Successfully loaded and saved GLB file');

                        setTimeout(() => {
                            container.style.display = 'none';
                        }, 2000);
                    } catch (error) {
                        status.textContent = 'Error processing GLB file!';
                        status.style.color = '#FFB6C1';
                        console.error('Error processing file:', error);
                    }
                };
                reader.onerror = () => {
                    status.textContent = 'Error reading GLB file!';
                    status.style.color = '#FFB6C1';
                };
                reader.readAsArrayBuffer(file);
            }
        });

        container.appendChild(input);
        container.appendChild(status);
        document.body.appendChild(container);

        if (localGLBData) {
            container.style.display = 'none';
        }

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyG') {
                container.style.display = container.style.display === 'none' ? 'block' : 'none';
            }
        });
    }

    const originalFetch = window.fetch;
    window.fetch = async function(resource, init) {
        if (typeof resource === 'string' && resource.includes('Deco_Flying_Saucer.glb')) {
            if (!localGLBData) {
                console.log('GLB file not loaded! Showing UI...');
                if (container) container.style.display = 'block';
                return new Response(null, { status: 404 });
            }
            console.log('Serving local GLB file');
            return new Response(localGLBData, {
                status: 200,
                statusText: 'OK',
                headers: { 'Content-Type': 'model/gltf-binary' }
            });
        }
        return originalFetch(resource, init);
    };

    const originalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = class extends originalXMLHttpRequest {
        open(method, url) {
            if (url.includes('Deco_Flying_Saucer.glb')) {
                console.log('Intercepting XHR request for Deco_Flying_Saucer.glb');
                this.addEventListener('readystatechange', () => {
                    if (this.readyState === 4) {
                        if (!localGLBData) {
                            console.log('GLB file not loaded! Showing UI...');
                            if (container) container.style.display = 'block';
                            Object.defineProperty(this, 'status', {
                                value: 404,
                                writable: false
                            });
                        } else {
                            Object.defineProperty(this, 'response', {
                                value: localGLBData,
                                writable: false
                            });
                            Object.defineProperty(this, 'status', {
                                value: 200,
                                writable: false
                            });
                        }
                        this.dispatchEvent(new Event('load'));
                    }
                });
            }
            super.open(method, url);
        }
    };

    createFileInput();
    console.log('Press CTR SHFT Z to toggle file input');
})();
