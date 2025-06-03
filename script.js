let originalImageData = null;
let originalCanvas = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const messageInput = document.getElementById('message');
const bitsSelect = document.getElementById('bitsToUse');
const encodeBtn = document.getElementById('encodeBtn');
const results = document.getElementById('results');

// File upload handling
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalCanvas = document.createElement('canvas');
            const ctx = originalCanvas.getContext('2d');
            originalCanvas.width = img.width;
            originalCanvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            originalImageData = ctx.getImageData(0, 0, img.width, img.height);
            
            document.getElementById('originalImg').src = e.target.result;
            uploadArea.innerHTML = `<p>✅ Image loaded: ${img.width}x${img.height}</p>`;
            checkCanEncode();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function checkCanEncode() {
    const hasImage = originalImageData !== null;
    const hasMessage = messageInput.value.trim().length > 0;
    encodeBtn.disabled = !(hasImage && hasMessage);
}

messageInput.addEventListener('input', checkCanEncode);

encodeBtn.addEventListener('click', encodeMessage);

function encodeMessage() {
    if (!originalImageData || !messageInput.value.trim()) return;

    const message = messageInput.value.trim();
    const bitsToUse = parseInt(bitsSelect.value);
    
    const messageBinary = (message + '\0').split('').map(char => 
        char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');

    const maxBits = originalImageData.data.length * bitsToUse / 8;
    if (messageBinary.length > maxBits * 8) {
        alert(`Message too long! Maximum ${Math.floor(maxBits)} characters for ${bitsToUse} bit(s).`);
        return;
    }

    const encodedData = new Uint8ClampedArray(originalImageData.data);
    const mask = (1 << bitsToUse) - 1;
    const invMask = ~mask;

    let bitIndex = 0;
    for (let i = 0; i < encodedData.length && bitIndex < messageBinary.length; i++) {
        encodedData[i] = encodedData[i] & invMask;
        let bitsToEmbed = 0;
        for (let b = 0; b < bitsToUse && bitIndex < messageBinary.length; b++) {
            if (messageBinary[bitIndex] === '1') {
                bitsToEmbed |= (1 << b);
            }
            bitIndex++;
        }
        encodedData[i] = encodedData[i] | bitsToEmbed;
    }

    const encodedCanvas = document.createElement('canvas');
    encodedCanvas.width = originalImageData.width;
    encodedCanvas.height = originalImageData.height;
    const encodedCtx = encodedCanvas.getContext('2d');
    const encodedImageData = new ImageData(encodedData, originalImageData.width, originalImageData.height);
    encodedCtx.putImageData(encodedImageData, 0, 0);

    const diffData = new Uint8ClampedArray(originalImageData.data.length);
    for (let i = 0; i < originalImageData.data.length; i += 4) {
        const rDiff = Math.abs(originalImageData.data[i] - encodedData[i]) * 50;
        const gDiff = Math.abs(originalImageData.data[i + 1] - encodedData[i + 1]) * 50;
        const bDiff = Math.abs(originalImageData.data[i + 2] - encodedData[i + 2]) * 50;
        
        diffData[i] = Math.min(255, rDiff);
        diffData[i + 1] = Math.min(255, gDiff);
        diffData[i + 2] = Math.min(255, bDiff);
        diffData[i + 3] = 255;
    }

    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = originalImageData.width;
    diffCanvas.height = originalImageData.height;
    const diffCtx = diffCanvas.getContext('2d');
    const diffImageData = new ImageData(diffData, originalImageData.width, originalImageData.height);
    diffCtx.putImageData(diffImageData, 0, 0);

    document.getElementById('encodedImg').src = encodedCanvas.toDataURL();
    document.getElementById('diffImg').src = diffCanvas.toDataURL();
    results.classList.remove('hidden');
}
