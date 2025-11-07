// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD4hyxY6IP4aNp7e0UHjhshH64NvGvtEAo",
    authDomain: "issuetracker-df444.firebaseapp.com",
    projectId: "issuetracker-df444",
    storageBucket: "issuetracker-df444.firebasestorage.app",
    messagingSenderId: "80331965649",
    appId: "1:80331965649:web:e1022467ffc19c41a9b1f0",
    measurementId: "G-9R0J9NVLQE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// DOM Elements
const loginForm = document.getElementById('loginForm');
const employeeIdInput = document.getElementById('employeeId');
const passwordInput = document.getElementById('password');
const passwordGroup = document.getElementById('passwordGroup');
const loginBtn = document.querySelector('.login-btn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const statusMessage = document.getElementById('statusMessage');
const messageText = document.getElementById('messageText');
const countdownElement = document.getElementById('countdown');

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    await testFirestoreConnection();
    
    // Set placeholder with random demo ID
    const sampleIds = ['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005', 'ASSIGNEE001', 'ADMIN001'];
    employeeIdInput.placeholder = `e.g., ${sampleIds[Math.floor(Math.random() * sampleIds.length)]}`;
    employeeIdInput.focus();
    
    // Hide password field initially
    passwordGroup.style.display = 'none';
});

// Test Firestore connection
async function testFirestoreConnection() {
    try {
        const testDoc = doc(db, "employees", "EMP001");
        await getDoc(testDoc);
        console.log('Firestore connection successful');
    } catch (error) {
        console.error('Firestore connection error:', error);
        showMessage('Database connection issue. Please try again later.', 'error');
    }
}

// Login form submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const employeeId = employeeIdInput.value.trim().toUpperCase();
    const password = passwordInput.value.trim();
    
    if (employeeId) {
        showLoadingState();
        await authenticateEmployee(employeeId, password);
    } else {
        showMessage('Please enter your Employee ID', 'error');
    }
});

// Check user role when employee ID is entered
employeeIdInput.addEventListener('blur', async function() {
    const employeeId = this.value.trim().toUpperCase();
    
    if (employeeId) {
        await checkUserRole(employeeId);
    }
});

// Reset password field when employee ID changes
employeeIdInput.addEventListener('input', function() {
    passwordInput.value = '';
    // Hide password field until we check the role again
    passwordGroup.style.display = 'none';
    passwordInput.required = false;
});

// Function to check user role and show/hide password field
async function checkUserRole(employeeId) {
    try {
        const docRef = doc(db, "employees", employeeId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const employeeData = docSnap.data();
            const userType = determineUserType(employeeData.position, employeeData.role);
            
            // Show password field for specific roles
            const passwordRequiredRoles = ['admin', 'assignee', 'account_manager', 'program_manager'];
            
            if (passwordRequiredRoles.includes(userType)) {
                passwordGroup.style.display = 'block';
                passwordInput.required = true;
                passwordInput.focus();
            } else {
                passwordGroup.style.display = 'none';
                passwordInput.required = false;
            }
        } else {
            // Hide password field if employee not found
            passwordGroup.style.display = 'none';
            passwordInput.required = false;
        }
    } catch (error) {
        console.error('Role check error:', error);
        passwordGroup.style.display = 'none';
        passwordInput.required = false;
    }
}

// Show loading state
function showLoadingState() {
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    loginBtn.disabled = true;
    statusMessage.style.display = 'none';
}

// Hide loading state
function hideLoadingState() {
    btnText.style.display = 'block';
    btnLoader.style.display = 'none';
    loginBtn.disabled = false;
}

// Authenticate employee with Firebase
async function authenticateEmployee(employeeId, password) {
    try {
        const docRef = doc(db, "employees", employeeId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const employeeData = docSnap.data();
            
            // Validate required fields
            if (!employeeData.name || !employeeData.position) {
                showMessage('Invalid employee data in database. Please contact administrator.', 'error');
                hideLoadingState();
                return;
            }
            
            // Determine user type
            const userType = determineUserType(employeeData.position, employeeData.role);
            
            // Check if password is required for this role
            const passwordRequiredRoles = ['admin', 'assignee', 'account_manager', 'program_manager'];
            
            if (passwordRequiredRoles.includes(userType)) {
                // Verify password for privileged roles
                if (!password) {
                    showMessage('Password is required for this role', 'error');
                    hideLoadingState();
                    return;
                }
                
                // Check if password field exists in employee data
                if (!employeeData.password) {
                    showMessage('Password not configured for this user. Please contact administrator.', 'error');
                    hideLoadingState();
                    return;
                }
                
                // Verify password
                if (password !== employeeData.password) {
                    showMessage('Invalid password. Please try again.', 'error');
                    hideLoadingState();
                    return;
                }
            } else {
                // For regular employees, clear any password that might have been entered
                passwordInput.value = '';
            }
            
            // Store employee data
            const employeeInfo = {
                id: employeeId,
                name: employeeData.name,
                department: employeeData.department || 'Not specified',
                position: employeeData.position,
                role: employeeData.role || 'employee',
                userType: userType,
                email: employeeData.email || '',
                phone: employeeData.phone || '',
                empid: employeeData.empid || employeeId,
                lastLogin: new Date().toISOString()
            };
            
            sessionStorage.setItem('currentEmployee', JSON.stringify(employeeInfo));
            localStorage.setItem('employeeData', JSON.stringify(employeeInfo));
            
            showSuccess(`Welcome back, ${employeeData.name}! (${userType})`, true);
        } else {
            showMessage('Employee ID not found. Please check your credentials.', 'error');
            hideLoadingState();
        }
    } catch (error) {
        console.error('Authentication error:', error);
        showMessage('Authentication failed. Please check your connection and try again.', 'error');
        hideLoadingState();
    }
}

// Determine user type based on position or role
function determineUserType(position, role) {
    const positionLower = (position || '').toLowerCase();
    const roleLower = (role || '').toLowerCase();
    
    if (roleLower.includes('admin')) {
        return 'admin';
    } else if (roleLower.includes('program_manager') || positionLower.includes('program manager')) {
        return 'program_manager';
    } else if (roleLower.includes('account_manager') || positionLower.includes('account manager')) {
        return 'account_manager';
    } else if (roleLower.includes('assignee') || positionLower.includes('support') || positionLower.includes('technician')) {
        return 'assignee';
    } else {
        return 'employee';
    }
}

// Random welcome messages
const welcomeMessages = [
    "Great to see you again! Your workspace is being prepared with the latest updates.",
    "Welcome back! We've missed your presence. Getting everything ready for you...",
    "Hello again! Your dashboard is loading with all the tools you need.",
    "Good to have you back! We're preparing your personalized workspace.",
    "Welcome back! Loading your recent activities and updates...",
    "Hello! Your helpdesk portal is being initialized with the latest features.",
    "Great to see you! We're setting up your workspace with all your preferences.",
    "Welcome back! Preparing your dashboard with today's priorities.",
    "Hello! We're loading your workspace with enhanced productivity tools.",
    "Welcome back! Your helpdesk environment is being optimized for you."
];

// Random welcome titles
const welcomeTitles = [
    "Welcome Back!",
    "Great to See You!",
    "Hello Again!",
    "Welcome Back!",
    "Ready to Work?",
    "Hello There!",
    "Welcome Back!",
    "Good to Have You!",
    "Welcome Back!",
    "Hello Champion!"
];

// Show welcome modal
function showWelcomeModal(employeeData) {
    const modal = document.getElementById('welcomeModal');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userName = document.getElementById('userName');
    const userPosition = document.getElementById('userPosition');
    const userType = document.getElementById('userType');
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    // Select random welcome message and title
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    const randomTitle = welcomeTitles[Math.floor(Math.random() * welcomeTitles.length)];

    // Update modal content
    welcomeTitle.textContent = randomTitle;
    welcomeMessage.textContent = randomMessage;
    userName.textContent = employeeData.name;
    userPosition.textContent = employeeData.position;
    userType.textContent = `${employeeData.userType.replace('_', ' ').toUpperCase()}`;

    // Show modal
    modal.classList.add('active');

    // Simulate loading progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 100) progress = 100;
        
        progressFill.style.width = `${progress}%`;
        
        // Update progress text
        if (progress < 30) {
            progressText.textContent = 'Initializing workspace...';
        } else if (progress < 60) {
            progressText.textContent = 'Loading modules...';
        } else if (progress < 90) {
            progressText.textContent = 'Finalizing setup...';
        } else {
            progressText.textContent = 'Ready!';
        }

        if (progress >= 100) {
            clearInterval(progressInterval);
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
        }
    }, 200);
}

// Show success message
function showSuccess(message, redirect = false) {
    statusMessage.style.display = 'block';
    statusMessage.style.background = 'rgba(16, 185, 129, 0.1)';
    statusMessage.style.borderColor = 'rgba(16, 185, 129, 0.2)';
    messageText.textContent = message;
    messageText.style.color = '#059669';
    
    const messageIcon = statusMessage.querySelector('.message-icon');
    messageIcon.style.background = 'linear-gradient(135deg, #10b981, #34d399)';
    messageIcon.innerHTML = '<i class="fas fa-check"></i>';
    
    hideLoadingState();
    
    if (redirect) {
        // Get employee data from storage
        const employeeData = JSON.parse(sessionStorage.getItem('currentEmployee') || localStorage.getItem('employeeData'));
        if (employeeData) {
            // Show welcome modal instead of immediate redirect
            setTimeout(() => {
                showWelcomeModal(employeeData);
            }, 1000);
        } else {
            // Fallback redirect
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        }
    }
}

// Show error message
function showMessage(message, type = 'error') {
    statusMessage.style.display = 'block';
    
    if (type === 'error') {
        statusMessage.style.background = 'rgba(239, 68, 68, 0.1)';
        statusMessage.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        messageText.textContent = message;
        messageText.style.color = '#dc2626';
        
        const messageIcon = statusMessage.querySelector('.message-icon');
        messageIcon.style.background = 'linear-gradient(135deg, #ef4444, #f87171)';
        messageIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
    }
    
    hideLoadingState();
}
