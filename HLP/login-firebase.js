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
    
    if (employeeId) {
        showLoadingState();
        await authenticateEmployee(employeeId);
    } else {
        showMessage('Please enter your Employee ID', 'error');
    }
});

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

// Authenticate employee with Firebase - REAL DATA ONLY
async function authenticateEmployee(employeeId) {
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
            
            // Determine user type based on position or role
            const userType = determineUserType(employeeData.position, employeeData.role);
            
            // Store employee data in both sessionStorage and localStorage for dashboard
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
// Determine user type based on position or role
function determineUserType(position, role) {
    const positionLower = (position || '').toLowerCase();
    const roleLower = (role || '').toLowerCase();
    
    if (roleLower.includes('admin')) {
        return 'admin';
    } else if (roleLower.includes('program_manager') || positionLower.includes('program manager')) {
        return 'program_manager';
    } else if (roleLower.includes('area_manager') || positionLower.includes('area manager')) {
        return 'area_manager';
    } else if (roleLower.includes('assignee') || positionLower.includes('support') || positionLower.includes('technician')) {
        return 'assignee';
    } else {
        return 'employee';
    }
}

// Show success message and redirect
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
        startRedirectCountdown();
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

// Countdown and redirect
function startRedirectCountdown() {
    let countdown = 3;
    
    const countdownInterval = setInterval(() => {
        countdownElement.textContent = `Redirecting in ${countdown} seconds...`;
        countdown--;
        
        if (countdown < 0) {
            clearInterval(countdownInterval);
            window.location.href = 'dashboard.html';
        }
    }, 1000);
}