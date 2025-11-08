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

// Password required roles
const PASSWORD_REQUIRED_ROLES = ['admin', 'assignee', 'account_manager', 'program_manager'];

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    await testFirestoreConnection();
    
    // Set placeholder with random demo ID
    const sampleIds = ['EMP001', 'EMP002', 'EMP003', 'EMP004', 'EMP005', 'ASSIGNEE001', 'ADMIN001'];
    employeeIdInput.placeholder = `e.g., ${sampleIds[Math.floor(Math.random() * sampleIds.length)]}`;
    employeeIdInput.focus();
    
    // Hide password field by default
    passwordGroup.style.display = 'none';
    passwordInput.required = false;
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

// Login form submission - MAIN LOGIN LOGIC
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const employeeId = employeeIdInput.value.trim().toUpperCase();
    const password = passwordInput.value.trim();
    
    if (!employeeId) {
        showMessage('Please enter your Employee ID', 'error');
        employeeIdInput.focus();
        return;
    }
    
    showLoadingState();
    await authenticateEmployee(employeeId, password);
});

// Real-time role detection as user types - ONLY for showing password field
let roleCheckTimeout;
employeeIdInput.addEventListener('input', function() {
    const employeeId = this.value.trim().toUpperCase();
    
    // Clear previous timeout
    clearTimeout(roleCheckTimeout);
    
    // Hide password field while typing (will show again if privileged role)
    passwordGroup.style.display = 'none';
    passwordInput.required = false;
    passwordInput.value = '';
    
    // Check role after user stops typing (700ms delay) - ONLY for password field
    if (employeeId.length >= 3) {
        roleCheckTimeout = setTimeout(async () => {
            await checkUserRoleForPasswordField(employeeId);
        }, 700);
    }
});

// Also check on blur for password field
employeeIdInput.addEventListener('blur', async function() {
    const employeeId = this.value.trim().toUpperCase();
    if (employeeId) {
        await checkUserRoleForPasswordField(employeeId);
    }
});

// Check user role ONLY for password field display
async function checkUserRoleForPasswordField(employeeId) {
    try {
        const docRef = doc(db, "employees", employeeId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const employeeData = docSnap.data();
            const userType = determineUserType(employeeData.position, employeeData.role);
            
            // Show password field only for privileged roles
            const isPasswordRequired = PASSWORD_REQUIRED_ROLES.includes(userType);
            
            if (isPasswordRequired) {
                passwordGroup.style.display = 'block';
                passwordInput.required = true;
                passwordInput.placeholder = `Enter password for ${userType.replace('_', ' ')} access`;
                passwordInput.focus();
            } else {
                passwordGroup.style.display = 'none';
                passwordInput.required = false;
                passwordInput.value = '';
            }
        } else {
            // Employee not found - keep password hidden
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

// MAIN AUTHENTICATION FUNCTION - Called only on "Access Portal" click
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
            const isPasswordRequired = PASSWORD_REQUIRED_ROLES.includes(userType);
            
            // Password validation logic - ONLY CHECKED ON SUBMIT
            if (isPasswordRequired) {
                // Privileged roles require password
                if (!password) {
                    showMessage(`Password is required for ${userType.replace('_', ' ')} role`, 'error');
                    passwordInput.focus();
                    hideLoadingState();
                    return;
                }
                
                // Check if password is configured
                if (!employeeData.password) {
                    showMessage('Password not configured. Please contact administrator.', 'error');
                    hideLoadingState();
                    return;
                }
                
                // Verify password
                if (password !== employeeData.password) {
                    showMessage('Invalid password. Please try again.', 'error');
                    passwordInput.focus();
                    passwordInput.select();
                    hideLoadingState();
                    return;
                }
            }
            // For regular employees, no password needed - proceed directly to welcome message
            
            // Store employee data and proceed to success
            await handleSuccessfulLogin(employeeId, employeeData, userType);
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

// Handle successful login - SHOW WELCOME MESSAGE FOR ALL USERS
async function handleSuccessfulLogin(employeeId, employeeData, userType) {
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
    
    // Show welcome modal for ALL users after successful authentication
    showWelcomeModal(employeeInfo);
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

// Random welcome messages and titles
const welcomeMessages = [
    "Great to see you again! Your workspace is being prepared with the latest updates.",
    "Welcome back! We've missed your presence. Getting everything ready for you...",
    "Hello again! Your dashboard is loading with all the tools you need.",
    "Good to have you back! We're preparing your personalized workspace.",
    "Welcome back! Loading your recent activities and updates..."
];

const welcomeTitles = [
    "Welcome Back!",
    "Great to See You!",
    "Hello Again!",
    "Ready to Work?",
    "Hello Champion!"
];

// Show welcome modal - FOR ALL USERS AFTER CLICKING "ACCESS PORTAL"
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
    
    // Hide loading state since we're showing the modal
    hideLoadingState();
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
