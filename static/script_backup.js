// ==================== DARK MODE TOGGLE ====================
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check localStorage for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    enableDarkMode();
}

function enableDarkMode() {
    body.classList.add('dark-mode');
    if (themeToggle) themeToggle.innerHTML = '☀️';
    localStorage.setItem('theme', 'dark');
}

function disableDarkMode() {
    body.classList.remove('dark-mode');
    if (themeToggle) themeToggle.innerHTML = '🌙';
    localStorage.setItem('theme', 'light');
}

if (themeToggle) {
    themeToggle.addEventListener('click', function(e) {
        e.preventDefault();
        if (body.classList.contains('dark-mode')) {
            disableDarkMode();
        } else {
            enableDarkMode();
        }
    });
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded');
    
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
    
    console.log('Chatbot elements:', { chatbotToggle, chatbotWindow });
    
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Chatbot toggle clicked');
            toggleChatbot();
        });
    }
    
    if (chatbotClose) {
        chatbotClose.addEventListener('click', function(e) {
            e.preventDefault();
            chatbotWindow.classList.remove('open');
            if (chatbotToggle) chatbotToggle.classList.remove('active');
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', sendChatMessage);
    }
    
    if (voiceButton) {
        voiceButton.addEventListener('click', startVoiceInput);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
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
            
            if (timeLeft > 0 && timeLeft <= 120) {
                timerElement.classList.add('ending-soon');
            } else {
                timerElement.classList.remove('ending-soon');
            }
            
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

setInterval(updateTimers, 1000);
updateTimers();

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
            setTimeout(() => location.reload(), 1500);
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
            setTimeout(() => location.reload(), 1500);
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
            setTimeout(() => location.reload(), 1500);
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
    console.log('toggleChatbot called');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotToggle = document.getElementById('chatbotToggle');
    
    if (chatbotWindow) {
        console.log('Toggling chatbot, current state:', chatbotWindow.classList.contains('open'));
        chatbotWindow.classList.toggle('open');
        if (chatbotToggle) {
            chatbotToggle.classList.toggle('active');
        }
        
        if (chatbotWindow.classList.contains('open')) {
            const chatInput = document.getElementById('chatInput');
            if (chatInput) chatInput.focus();
        }
    }
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    addChatMessage(message, 'user');
    chatInput.value = '';
    
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
    
    if (chatMessages) {
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function getBotResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    const responses = {
        'how to bid': 'To place a bid: 1) Browse active auctions 2) Enter your bid amount (higher than current bid) 3) Click "Place Bid" 4) If you win, credits are deducted!',
        'bid': 'To bid: Enter amount > current bid, then click "Place Bid". Winner pays their final bid amount.',
        'credits': 'You start with 100 credits. Bidding doesn\'t deduct credits immediately. Only winners lose credits equal to their final bid amount.',
        'credit': 'You have 100 starting credits. Credits only deduct when you win an auction.',
        'winner': 'The highest bidder when auction ends becomes the winner. Admin declares winner, then credits are deducted.',
        'auction': 'BidWise is a real-time auction platform. Each auction has a countdown timer. Bid in last 30 seconds? Timer extends 30 more seconds!',
        'how': 'Ask me about: bidding, credits, winners, or how auctions work!',
        'help': 'I can help with: How to bid | Credits system | Winner logic | How auctions work',
        'hi': 'Hello! I\'m the BidWise Assistant. Ask me anything about bidding!',
        'hello': 'Hello! I\'m the BidWise Assistant. How can I help?',
    };
    
    for (const [key, response] of Object.entries(responses)) {
        if (lowerMessage.includes(key)) {
            return response;
        }
    }
    
    return 'I can help with: How to bid | Credits system | Winner logic | How auctions work. What would you like to know?';
}

function startVoiceInput() {
    const voiceButton = document.getElementById('voiceButton');
    const chatInput = document.getElementById('chatInput');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showToast('Voice input not supported in your browser', 'error');
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    
    if (voiceButton) {
        voiceButton.classList.add('listening');
        voiceButton.innerHTML = '🎙️';
    }
    
    recognition.onstart = () => {
        if (voiceButton) voiceButton.classList.add('listening');
    };
    
    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        
        if (chatInput) chatInput.value = transcript;
        if (voiceButton) {
            voiceButton.classList.remove('listening');
            voiceButton.innerHTML = '🎤';
        }
    };
    
    recognition.onerror = (event) => {
        if (voiceButton) {
            voiceButton.classList.remove('listening');
            voiceButton.innerHTML = '🎤';
        }
        showToast('Voice input error', 'error');
    };
    
    recognition.start();
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: '✓',
        error: '✕',
        warning: '!',
        info: 'ℹ'
    };
    
    const icon = document.createElement('span');
    icon.textContent = iconMap[type];
    icon.style.fontSize = '16px';
    icon.style.fontWeight = 'bold';
    icon.style.minWidth = '20px';
    
    const text = document.createElement('span');
    text.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(text);
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}