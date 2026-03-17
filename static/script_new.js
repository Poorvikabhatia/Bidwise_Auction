// ==================== DARK MODE TOGGLE ====================
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;
const body = document.body;

// Check localStorage for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    enableDarkMode();
}

function enableDarkMode() {
    body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
    localStorage.setItem('theme', 'dark');
}

function disableDarkMode() {
    body.classList.remove('dark-mode');
    themeToggle.textContent = '🌙';
    localStorage.setItem('theme', 'light');
}

themeToggle.addEventListener('click', () => {
    if (body.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
});

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    // Bid button click handler
    document.querySelectorAll('.bid-button').forEach(button => {
        button.addEventListener('click', function() {
            const auctionId = this.getAttribute('data-auction-id');
            const bidInput = this.previousElementSibling;
            placeBid(parseInt(auctionId), bidInput);
        });
    });
    
    // Declare winner button click handler
    document.querySelectorAll('.declare-winner-btn').forEach(button => {
        button.addEventListener('click', function() {
            const auctionId = this.getAttribute('data-auction-id');
            declareWinner(parseInt(auctionId));
        });
    });
    
    // Create auction button click handler
    const createAuctionBtn = document.querySelector('.create-auction-btn');
    if (createAuctionBtn) {
        createAuctionBtn.addEventListener('click', createAuction);
    }
    
    // Chatbot event listeners
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const sendButton = document.getElementById('sendButton');
    const voiceButton = document.getElementById('voiceButton');
    const chatInput = document.getElementById('chatInput');
    
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', toggleChatbot);
    }
    
    if (chatbotClose) {
        chatbotClose.addEventListener('click', () => {
            chatbotWindow.classList.remove('open');
            chatbotToggle.classList.remove('active');
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', sendChatMessage);
    }
    
    if (voiceButton) {
        voiceButton.addEventListener('click', startVoiceInput);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
});

// ==================== TIMER FUNCTIONS ====================
function formatTime(seconds) {
    if (seconds <= 0) return "Ended";
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

function updateTimers() {
    const now = new Date().getTime();
    
    document.querySelectorAll('[data-end-time]').forEach(element => {
        const endTime = new Date(element.getAttribute('data-end-time')).getTime();
        const timeLeft = Math.floor((endTime - now) / 1000);
        
        const timerElement = element.querySelector('.timer');
        if (timerElement) {
            timerElement.textContent = formatTime(timeLeft);
            
            // Alert if ending soon (within 2 minutes)
            if (timeLeft > 0 && timeLeft <= 120) {
                timerElement.classList.add('ending-soon');
            } else {
                timerElement.classList.remove('ending-soon');
            }
            
            // Mark as ended
            if (timeLeft <= 0) {
                const button = element.querySelector('.bid-button');
                if (button) {
                    button.setAttribute('disabled', 'disabled');
                    button.style.opacity = '0.5';
                    button.style.cursor = 'not-allowed';
                }
            }
        }
    });
}

// Update timers every second
setInterval(updateTimers, 1000);
updateTimers(); // Initial call

// ==================== BIDDING FUNCTIONS ====================
function placeBid(auctionId, bidAmountInput) {
    const bidAmount = parseFloat(bidAmountInput.value);
    const minBid = parseFloat(bidAmountInput.getAttribute('data-min-bid'));
    const maxBid = parseFloat(bidAmountInput.getAttribute('data-max-bid'));
    
    if (!bidAmount || bidAmount <= 0) {
        showToast('Please enter a valid bid amount', 'error');
        return;
    }
    
    if (minBid && bidAmount < minBid) {
        showToast(`Bid must be at least $${minBid.toFixed(2)}`, 'error');
        return;
    }
    
    if (maxBid && bidAmount > maxBid) {
        showToast(`Insufficient credits. Maximum bid: $${maxBid.toFixed(2)}`, 'error');
        return;
    }
    
    fetch('/place_bid', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            auction_id: auctionId,
            bid_amount: bidAmount
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Bid placed successfully!', 'success');
            bidAmountInput.value = '';
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(data.error || 'Failed to place bid', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred', 'error');
    });
}

// ==================== ADMIN FUNCTIONS ====================
function createAuction() {
    const title = document.getElementById('auction-title')?.value;
    const description = document.getElementById('auction-description')?.value;
    const startingPrice = document.getElementById('auction-starting-price')?.value;
    const durationHours = document.getElementById('auction-duration')?.value || 1;
    
    if (!title || !startingPrice) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    fetch('/admin/create_auction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: title,
            description: description,
            starting_price: startingPrice,
            duration_hours: durationHours
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Auction created successfully!', 'success');
            document.getElementById('auction-title').value = '';
            document.getElementById('auction-description').value = '';
            document.getElementById('auction-starting-price').value = '';
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(data.error || 'Failed to create auction', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred', 'error');
    });
}

function declareWinner(auctionId) {
    if (!confirm('Are you sure you want to declare the winner and deduct credits?')) {
        return;
    }
    
    fetch(`/admin/declare_winner/${auctionId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('Winner declared!', 'success');
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(data.error || 'Failed to declare winner', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred', 'error');
    });
}

// ==================== CHATBOT FUNCTIONS ====================
function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotToggle = document.getElementById('chatbotToggle');
    
    chatbotWindow.classList.toggle('open');
    chatbotToggle.classList.toggle('active');
    
    if (chatbotWindow.classList.contains('open')) {
        document.getElementById('chatInput').focus();
    }
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addChatMessage(message, 'user');
    chatInput.value = '';
    
    // Get bot response
    setTimeout(() => {
        const response = getBotResponse(message);
        addChatMessage(response, 'bot');
    }, 500);
}

function addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chatbotMessages');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    messageElement.textContent = message;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getBotResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Define chatbot responses
    const responses = {
        'how to bid': 'To place a bid:\n1. Browse active auctions\n2. Enter your bid amount (must be higher than current bid)\n3. Click "Place Bid"\n4. If you win, your credits will be deducted!',
        'bid': 'To place a bid:\n1. Browse active auctions\n2. Enter your bid amount (must be higher than current bid)\n3. Click "Place Bid"\n4. If you win, your credits will be deducted!',
        'credits': 'You start with 100 credits. Bidding does NOT deduct credits immediately. Only when you win an auction, your final bid amount is deducted from your credits.',
        'credit': 'You start with 100 credits. Bidding does NOT deduct credits immediately. Only when you win an auction, your final bid amount is deducted from your credits.',
        'winner': 'The highest bidder at the end of an auction becomes the winner. The admin will declare the winner, and the winning bid amount is deducted from their credits.',
        'auction': 'BidWise is a real-time auction platform where you can bid on items. Each auction has a countdown timer. If you bid in the last 30 seconds, the auction extends by 30 seconds (anti-sniping protection).',
        'how': 'To place a bid:\n1. Browse active auctions\n2. Enter your bid amount (must be higher than current bid)\n3. Click "Place Bid"\n\nFor more help, ask about: "bid", "credits", "winner", or "auction"',
        'help': 'I can help with:\n• How to bid\n• Credits system\n• Winner logic\n• How auctions work\n\nWhat would you like to know?',
        'hi': 'Hello! 👋 I\'m the BidWise Assistant. Ask me about bidding, credits, auctions, or winners!',
        'hello': 'Hello! 👋 I\'m the BidWise Assistant. Ask me about bidding, credits, auctions, or winners!',
    };
    
    // Check for matching keywords
    for (const [key, response] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    
    // Default response
    return 'I am here to help with auctions and bidding! Ask me about:\n• How to bid\n• Credits system\n• Winner logic\n• How auctions work';
}

function startVoiceInput() {
    const voiceButton = document.getElementById('voiceButton');
    const chatInput = document.getElementById('chatInput');
    
    // Check for Web Speech API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showToast('Voice input is not supported in your browser', 'error');
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    
    voiceButton.classList.add('listening');
    voiceButton.textContent = '🎙️';
    
    recognition.onstart = () => {
        voiceButton.classList.add('listening');
    };
    
    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        
        chatInput.value = transcript;
        voiceButton.classList.remove('listening');
        voiceButton.textContent = '🎤';
    };
    
    recognition.onerror = (event) => {
        voiceButton.classList.remove('listening');
        voiceButton.textContent = '🎤';
        showToast('Error with voice input', 'error');
    };
    
    recognition.start();
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Add icon
    const iconMap = {
        success: '✓',
        error: '✕',
        warning: '!',
        info: 'ℹ'
    };
    
    const icon = document.createElement('span');
    icon.textContent = iconMap[type];
    icon.style.fontSize = '18px';
    icon.style.fontWeight = 'bold';
    
    const text = document.createElement('span');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    
    container.appendChild(toast);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Add slideOutRight animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        to {
            opacity: 0;
            transform: translateX(400px);
        }
    }
`;
document.head.appendChild(style);
