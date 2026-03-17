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
    
    // ======================== CHATBOT FUNCTIONALITY ========================
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const voiceBtn = document.getElementById('voiceBtn');
    const chatMessages = document.getElementById('chatMessages');

    // Toggle chatbot window
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', function(e) {
            e.preventDefault();
            chatbotWindow.classList.toggle('open');
        });
    }

    // Close chatbot
    if (chatbotClose) {
        chatbotClose.addEventListener('click', function(e) {
            e.preventDefault();
            chatbotWindow.classList.remove('open');
        });
    }

    // Send message on button click
    if (sendBtn) {
        sendBtn.addEventListener('click', sendChatMessage);
    }

    // Send message on Enter key
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }

    // Voice input
    if (voiceBtn) {
        voiceBtn.addEventListener('click', startVoiceInput);
    }

    function sendChatMessage() {
        const inputField = document.getElementById('chatInput');
        const message = inputField.value.trim().toLowerCase();

        // Debug log
        console.log('Message sent:', message);

        // Empty message check
        if (message === '') {
            return;
        }

        // Add user message to chat
        addChatMessage(inputField.value.trim(), 'user');

        // Clear input
        inputField.value = '';

        // Show typing indicator
        const typingMessageEl = addChatMessage('Korin is typing...', 'bot typing');

        // Simulate thinking with random delay (500-1000ms)
        const delay = 500 + Math.random() * 500;
        setTimeout(() => {
            // Get bot response with varied options
            const response = getBotResponse(message);

            // Replace typing message with actual response
            if (typingMessageEl && typingMessageEl.parentNode) {
                typingMessageEl.textContent = response;
                typingMessageEl.classList.remove('typing');
            }
        }, delay);
    }

    function addChatMessage(text, sender) {
        const messageContainer = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${sender}-message`;
        if (sender === 'bot typing') {
            messageEl.classList.add('typing');
        }
        messageEl.textContent = text;

        if (messageContainer) {
            messageContainer.appendChild(messageEl);
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
        return messageEl;
    }

    function getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    function getBotResponse(message) {
        const msg = message.toLowerCase();
        let reply = '';

        // Response arrays for varied, natural replies
        const biddingResponses = [
            'Place a bid higher than the current highest bid using your credits.',
            'You can bid by entering an amount greater than the current highest bid.',
            'To win, try placing a higher bid using your available credits.'
        ];

        const creditResponses = [
            'Credits are only deducted if you win the auction.',
            'You only lose credits when you win a bid.',
            'Your credits remain safe unless you win the auction. Check your dashboard!'
        ];

        const winnerResponses = [
            'The highest bidder when the timer ends is declared the winner.',
            'Whoever places the highest bid before time runs out wins the auction.',
            'The person with the highest bid at the end becomes the winner!'
        ];

        const auctionResponses = [
            'You can explore live auctions on your dashboard.',
            'Check the dashboard to see all active auctions.',
            'Browse ongoing auctions and start bidding anytime!'
        ];

        const greetingResponses = [
            'Hi! I am Korin, your AI assistant 🤖. I can help you with bidding, credits, and auctions. What would you like to know?',
            'Hello! I\'m Korin, your auction assistant. How can I help you today?',
            'Hey there! I\'m Korin. Ready to bid and win? Ask me anything!'
        ];

        const defaultResponses = [
            'I\'m Korin! You can ask me about bidding, credits, or live auctions 😊',
            'Not sure about that, but I can help with bidding, credits, or auctions!',
            'That\'s a great question! I specialize in auctions, bidding, and credits.'
        ];

        // BIDDING
        if (msg.includes('bid') || msg.includes('bidding') || msg.includes('place bid')) {
            reply = getRandomResponse(biddingResponses);
        }
        // CREDITS
        else if (msg.includes('credit') || msg.includes('balance') || msg.includes('points')) {
            reply = getRandomResponse(creditResponses);
        }
        // WINNER
        else if (msg.includes('winner') || msg.includes('win') || msg.includes('highest bidder')) {
            reply = getRandomResponse(winnerResponses);
        }
        // AUCTIONS
        else if (msg.includes('auction') || msg.includes('live') || msg.includes('available')) {
            reply = getRandomResponse(auctionResponses);
        }
        // GREETING
        else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
            reply = getRandomResponse(greetingResponses);
        }
        // DEFAULT
        else {
            reply = getRandomResponse(defaultResponses);
        }

        console.log('Bot response:', reply);
        return reply;
    }

    function startVoiceInput() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Voice input not supported in your browser');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';

        if (voiceBtn) {
            voiceBtn.classList.add('listening');
            voiceBtn.textContent = '🎙️';
        }

        recognition.onstart = () => {
            if (voiceBtn) voiceBtn.classList.add('listening');
        };

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript + ' ';
            }

            if (chatInput) {
                chatInput.value = transcript.trim();
            }

            if (voiceBtn) {
                voiceBtn.classList.remove('listening');
                voiceBtn.textContent = '🎤';
            }
        };

        recognition.onerror = () => {
            if (voiceBtn) {
                voiceBtn.classList.remove('listening');
                voiceBtn.textContent = '🎤';
            }
            console.log('Voice input error');
        };

        recognition.onend = () => {
            if (voiceBtn) {
                voiceBtn.classList.remove('listening');
                voiceBtn.textContent = '🎤';
            }
        };

        recognition.start();
    }
    // ==================================================================
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