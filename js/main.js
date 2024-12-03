// Base64字符映射表
const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

// Emoji映射表
const EMOJI_LIST = ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", 
                   "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", 
                   "😛", "😜", "😝", "😞", "😟", "😠", "😡", "🤬", "🤯", "😳", 
                   "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "😪", "😴", "🤤", 
                   "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥳", "🥺", "🤠", "🤡", 
                   "🤥", "🤫", "🤭", "🧐", "🤓", "😈", "👿", "👹", "👺", "💀", 
                   "☠", "👻", "👽", "👾", "🤖", "🎃", "🎄", "🎅"];

// 创建映射字典
const CHAR_TO_EMOJI = {};
const EMOJI_TO_CHAR = {};
BASE64_CHARS.split('').forEach((char, i) => {
    if (i < EMOJI_LIST.length) {
        CHAR_TO_EMOJI[char] = EMOJI_LIST[i];
        EMOJI_TO_CHAR[EMOJI_LIST[i]] = char;
    }
});

// 生成加密密钥
async function generateKey(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return hash;
}

// 标准化emoji
function normalizeEmoji(emoji) {
    return emoji.replace('\ufe0f', '');
}

// 文本转emoji
function textToEmoji(base64Str) {
    const result = [];
    for (const char of base64Str) {
        if (char in CHAR_TO_EMOJI) {
            result.push(CHAR_TO_EMOJI[char]);
        } else {
            console.error('无效字符:', char, '在位置:', base64Str.indexOf(char));
            console.log('完整的base64字符串:', base64Str);
            throw new Error(`无效的字符: ${char}`);
        }
    }
    return result.join('');
}

// emoji转文本
function emojiToText(emojiText) {
    const result = [];
    for (const emoji of emojiText) {
        const normalizedEmoji = normalizeEmoji(emoji);
        if (normalizedEmoji in EMOJI_TO_CHAR) {
            result.push(EMOJI_TO_CHAR[normalizedEmoji]);
        } else {
            throw new Error(`未知的emoji: ${emoji}`);
        }
    }
    return result.join('');
}

// 加密函数
async function encrypt() {
    try {
        const text = document.getElementById('mnemonic').value.trim();
        const password = document.getElementById('encrypt-password').value;
        const resultElement = document.getElementById('encrypt-result');

        if (!text || !password) {
            alert('请输入加密内容和密码');
            return;
        }

        // 生成密钥
        const key = await generateKey(password);
        
        // 创建初始化向量
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // 创建加密密钥
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        // 加密数据
        const encoder = new TextEncoder();
        const encryptedData = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            encoder.encode(text)
        );

        // 组合IV和加密数据
        const combined = new Uint8Array(iv.length + encryptedData.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedData), iv.length);

        // 转换为Base64，使用标准Base64编码
        const base64Str = btoa(String.fromCharCode(...combined));
        
        // 转换为emoji
        const emojiText = textToEmoji(base64Str);
        
        resultElement.textContent = emojiText;
    } catch (error) {
        console.error('加密错误:', error);
        alert('加密失败: ' + error.message);
    }
}

// 解密函数
async function decrypt() {
    try {
        const emojiText = document.getElementById('emoji-input').value.trim();
        const password = document.getElementById('decrypt-password').value;
        const resultElement = document.getElementById('decrypt-result');

        if (!emojiText || !password) {
            alert('请输入emoji和密码');
            return;
        }

        // 转换emoji为Base64
        const base64Str = emojiToText(emojiText);
        
        // 解码Base64
        const combined = new Uint8Array(
            atob(base64Str).split('').map(char => char.charCodeAt(0))
        );

        // 提取IV和加密数据
        const iv = combined.slice(0, 12);
        const encryptedData = combined.slice(12);

        // 生成密钥
        const key = await generateKey(password);
        
        // 创建解密密钥
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // 解密数据
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            encryptedData
        );

        // 转换为文本
        const decoder = new TextDecoder();
        const decryptedText = decoder.decode(decryptedData);

        resultElement.textContent = decryptedText;
    } catch (error) {
        console.error('解密错误:', error);
        alert('解密失败: ' + error.message);
    }
}

// 复制结果
function copyText(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    navigator.clipboard.writeText(text)
        .then(() => alert('已复制到剪贴板'))
        .catch(err => console.error('复制失败:', err));
}

// 标签切换
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

// 导出函数供HTML使用
window.encrypt = encrypt;
window.decrypt = decrypt;
window.copyText = copyText;
window.showTab = showTab;