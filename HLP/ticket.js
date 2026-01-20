// Firebase configuration and employee data retrieval
async function getEmployeeDataFromFirebase(employeeId) {
    try {
        if (!employeeId) {
            console.log('No employee ID provided for Firebase lookup');
            return null;
        }

        console.log('Fetching employee data from Firebase for:', employeeId);

        // Initialize Firebase if not already initialized
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded. Make sure to include Firebase scripts in your HTML.');
            return null;
        }

        if (!firebase.apps.length) {
            // Firebase config - replace with your actual config
            const firebaseConfig = {
                apiKey: "your-api-key",
                authDomain: "your-project.firebaseapp.com",
                projectId: "your-project-id",
                storageBucket: "your-project.appspot.com",
                messagingSenderId: "your-sender-id",
                appId: "your-app-id"
            };
            firebase.initializeApp(firebaseConfig);
        }

        // Get employee data from Firestore
        const db = firebase.firestore();
        const employeeDoc = await db.collection('employees').doc(employeeId).get();
        
        if (employeeDoc.exists) {
            const employeeData = employeeDoc.data();
            console.log('Employee data fetched from Firebase:', employeeData);
            return employeeData;
        } else {
            console.log('No employee found with ID:', employeeId);
            return null;
        }
        
    } catch (error) {
        console.error('Error fetching employee data from Firebase:', error);
        return null;
    }
}

// Enhanced employee data retrieval function
async function getEmployeeData() {
    try {
        // First try to get data from dashboard storage
        console.log('Attempting to fetch employee data from dashboard...');
        
        // Get employee data from localStorage (set by dashboard)
        const localStorageData = localStorage.getItem('employeeData');
        const sessionStorageData = sessionStorage.getItem('currentEmployee');
        
        let employeeData = null;
        
        if (localStorageData) {
            employeeData = JSON.parse(localStorageData);
            console.log('Found employee data in localStorage:', employeeData);
        } else if (sessionStorageData) {
            employeeData = JSON.parse(sessionStorageData);
            console.log('Found employee data in sessionStorage:', employeeData);
        }
        
        // If we have employee data but no school/location, try to fetch from Firebase
        if (employeeData && (employeeData.id || employeeData.empid) && employeeData.name) {
            // Check if we need to fetch school/location from Firebase
            if (!employeeData.school || !employeeData.location) {
                console.log('School or location missing, fetching from Firebase...');
                const firebaseData = await getEmployeeDataFromFirebase(employeeData.empid || employeeData.id);
                if (firebaseData) {
                    // Merge Firebase data with existing employee data
                    employeeData = {
                        ...employeeData,
                        school: firebaseData.school || employeeData.school,
                        location: firebaseData.location || employeeData.location,
                        // Preserve other Firebase data if available
                        ...firebaseData
                    };
                    // Update localStorage with complete data
                    localStorage.setItem('employeeData', JSON.stringify(employeeData));
                }
            }
            return employeeData;
        }
    } catch (error) {
        console.error('Error parsing employee data:', error);
    }
    return null;
}

// Issue data mapping
const issueData = {
    'Platform': [
        { number: '1', text: 'Platform not working' },
        { number: '2', text: 'User Management - Platform' },
        { number: '3', text: 'Missed Class / Rescheduling Sessions - Platform' },
        { number: '4', text: 'Resetting the Student password - Platform' },
        { number: '5', text: 'Batch enrollment of additional students post batch creation - Platform' },
        { number: '6', text: 'Enhancements - Platform' }
    ],
    'Hardware': [
        { number: '7', text: 'Configuration Issue - Hardware' },
        { number: '8', text: 'Troubleshooting Hardware - Hardware' },
        { number: '9', text: 'Loss of Hardware - Hardware' }
    ],
    'Infrastructure': [
        { number: '10', text: 'WiFi / Router is not working - Infrastructure' },
        { number: '11', text: 'ISP Down - Infrastructure' },
        { number: '12', text: 'Frequent Power Shutdown - Infrastructure' },
        { number: '13', text: 'System not working - Infrastructure' },
        { number: '14', text: 'Electrical Ports (Switch Box) & Wiring - Infrastructure' },
        { number: '15', text: 'Projector unavailability Issue - Infrastructure' },
        { number: '16', text: 'Shared Lab - Infrastructure' },
        { number: '17', text: 'Lab Assigned for other purpose during scheduled hours - Infrastructure' },
        { number: '18', text: 'During Exams (Eg. Saffal) - Infrastructure' },
        { number: '19', text: 'Computer Peripheral not working (Eg. Keyboard, Mouse) - Infrastructure' },
        { number: '20', text: 'CPU Load Issue - Infrastructure' }
    ],
    'Curriculum': [
        { number: '21', text: 'Guide & Session are not matching - Curriculum' },
        { number: '22', text: 'Assessment Parameters & timeline - Curriculum' },
        { number: '23', text: 'Session Topic Correction + Image - Curriculum' },
        { number: '24', text: 'Duration of Session - Curriculum' },
        { number: '25', text: 'Assessment questions and options are not relevant - Curriculum' }
    ],
    'Content Delivery': [
        { number: '26', text: 'Topic Retraining - Content Delivery' }
    ]
};

// Helper functions for location handling
function handleSingleLocation(locationValue, singleLocationContainer, multipleLocationContainer, locationInput, selectedLocationInput) {
    if (singleLocationContainer) singleLocationContainer.style.display = 'block';
    if (multipleLocationContainer) multipleLocationContainer.style.display = 'none';
    
    const finalValue = typeof locationValue === 'string' ? locationValue : (locationValue.name || locationValue.value || locationValue.location || JSON.stringify(locationValue));
    locationInput.value = finalValue;
    locationInput.readOnly = false; // Changed to false for manual entry
    if (selectedLocationInput) selectedLocationInput.value = finalValue;
    
    console.log('Single location detected, set as editable:', finalValue);
}

function handleNoLocation(singleLocationContainer, multipleLocationContainer, locationInput, selectedLocationInput) {
    if (singleLocationContainer) singleLocationContainer.style.display = 'block';
    if (multipleLocationContainer) multipleLocationContainer.style.display = 'none';
    locationInput.value = '';
    locationInput.placeholder = 'Please enter your location manually';
    locationInput.readOnly = false;
    if (selectedLocationInput) selectedLocationInput.value = '';
    console.log('No valid location data found - manual entry required');
}

// Enhanced location handling function
function handleLocationData(locationData, singleLocationContainer, multipleLocationContainer, locationInput, locationSelect, selectedLocationInput) {
    console.log('Handling location data:', locationData);
    
    if (!locationInput) {
        console.log('Location input not found, skipping location auto-fill');
        return;
    }
    
    // Check if locationData exists and is not empty
    if (!locationData) {
        console.log('No location data provided');
        handleNoLocation(singleLocationContainer, multipleLocationContainer, locationInput, selectedLocationInput);
        return;
    }
    
    // Handle array of locations
    if (Array.isArray(locationData)) {
        if (locationData.length > 1) {
            // Multiple locations - show dropdown
            if (singleLocationContainer) singleLocationContainer.style.display = 'none';
            if (multipleLocationContainer) multipleLocationContainer.style.display = 'block';
            
            // Populate dropdown options
            if (locationSelect) {
                locationSelect.innerHTML = '<option value="">Select your location</option>';
                locationData.forEach(loc => {
                    const locationValue = typeof loc === 'string' ? loc : (loc.name || loc.value || loc.location || JSON.stringify(loc));
                    const option = document.createElement('option');
                    option.value = locationValue;
                    option.textContent = locationValue;
                    locationSelect.appendChild(option);
                });
                
                // Add change event listener
                locationSelect.addEventListener('change', function() {
                    if (selectedLocationInput) {
                        selectedLocationInput.value = this.value;
                        locationInput.value = this.value;
                    }
                    console.log('Selected location:', this.value);
                });
            }
        } else if (locationData.length === 1) {
            // Single location in array
            handleSingleLocation(locationData[0], singleLocationContainer, multipleLocationContainer, locationInput, selectedLocationInput);
        } else {
            handleNoLocation(singleLocationContainer, multipleLocationContainer, locationInput, selectedLocationInput);
        }
    } 
    // Handle string location
    else if (typeof locationData === 'string' && locationData.trim() !== '') {
        handleSingleLocation(locationData, singleLocationContainer, multipleLocationContainer, locationInput, selectedLocationInput);
    }
    // Handle object location
    else if (typeof locationData === 'object' && locationData !== null) {
        const locationValue = locationData.name || locationData.value || locationData.location || JSON.stringify(locationData);
        handleSingleLocation(locationValue, singleLocationContainer, multipleLocationContainer, locationInput, selectedLocationInput);
    }
    // Handle all other cases
    else {
        handleNoLocation(singleLocationContainer, multipleLocationContainer, locationInput, selectedLocationInput);
    }
}

// Safe element getter with null check
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
}

// Main application logic
document.addEventListener('DOMContentLoaded', async function() {
    // Get all elements with null checks
    const form = getElement('helplineForm');
    
    // Check if required form exists
    if (!form) {
        console.error('Main form element not found! Check if HTML has element with id="helplineForm"');
        return;
    }

    // Get form elements
    const empidInput = getElement('empid');
    const nameInput = getElement('name');
    const schoolInput = getElement('school');
    const locationInput = getElement('location');
    const locationSelect = getElement('locationSelect');
    const selectedLocationInput = getElement('selectedLocation');
    const singleLocationContainer = getElement('singleLocationContainer');
    const multipleLocationContainer = getElement('multipleLocationContainer');

    // Get other UI elements
    const uploadArea = getElement('uploadArea');
    const fileInput = getElement('fileInput');
    const browseBtn = uploadArea ? uploadArea.querySelector('.browse-btn') : null;
    const previewContainer = getElement('previewContainer');
    const imagePreview = getElement('imagePreview');
    const urlContainer = getElement('urlContainer');
    const urlInput = getElement('urlInput');
    const screenshotUrlInput = getElement('screenshotUrl');
    const copyBtn = getElement('copyBtn');
    const uploadLoading = getElement('uploadLoading');
    const loading = getElement('loading');
    const successMessage = getElement('successMessage');
    const errorMessage = getElement('errorMessage');
    const clearBtn = getElement('clearForm');

    // Show loading state while fetching data
    if (loading) {
        loading.style.display = 'block';
        loading.querySelector('p').textContent = 'Loading employee data...';
    }

    // Get employee data and auto-fill fields
    try {
        const employeeData = await getEmployeeData();
        
        if (loading) {
            loading.style.display = 'none';
        }

        if (employeeData) {
            console.log('Employee data found, auto-filling form...');
            console.log('Available employee data fields:', Object.keys(employeeData));
            
            // Fill EMPID
            const empid = employeeData.empid || employeeData.id || employeeData.EMPID || employeeData.employeeId;
            if (empid && empidInput) {
                empidInput.value = empid;
                empidInput.readOnly = true;
                console.log('EMPID filled:', empid);
            }
            
            // Fill Name
            const name = employeeData.name || employeeData.fullName || employeeData.employeeName;
            if (name && nameInput) {
                nameInput.value = name;
                nameInput.readOnly = true;
                console.log('Name filled:', name);
            }
            
            // School - Always manual entry
            if (schoolInput) {
                schoolInput.value = '';
                schoolInput.placeholder = 'Please enter your school name';
                schoolInput.readOnly = false;
                console.log('School set for manual entry');
            }

            // Location - Always manual entry
            if (locationInput) {
                locationInput.value = '';
                locationInput.placeholder = 'Please enter your location manually';
                locationInput.readOnly = false;
                console.log('Location set for manual entry');
            }
            
            // Hide multiple location container if it exists
            if (multipleLocationContainer) {
                multipleLocationContainer.style.display = 'none';
            }
            if (singleLocationContainer) {
                singleLocationContainer.style.display = 'block';
            }
        } else {
            console.log('No employee data found from dashboard');
            if (loading) loading.style.display = 'none';
            
            // Set manual entry for all fields
            if (locationInput) {
                locationInput.placeholder = 'Please enter your location manually';
                locationInput.readOnly = false;
            }
            if (schoolInput) {
                schoolInput.placeholder = 'Please enter your school manually';
                schoolInput.readOnly = false;
            }
        }
    } catch (error) {
        console.error('Error loading employee data:', error);
        if (loading) loading.style.display = 'none';
        
        // Set manual entry on error
        if (locationInput) {
            locationInput.placeholder = 'Please enter your location manually';
            locationInput.readOnly = false;
        }
        if (schoolInput) {
            schoolInput.placeholder = 'Please enter your school manually';
            schoolInput.readOnly = false;
        }
    }

    // ImgBB API Key
    const IMGBB_API_KEY = '29a736ebd8c9d8ef3f662c8dbef54025';

    // Upload area functionality (only if elements exist)
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        
        if (browseBtn) {
            browseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.click();
            });
        }

        // File input change
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                handleFileUpload(this.files[0]);
            }
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.background = 'rgba(102, 126, 234, 0.1)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.background = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.background = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });
    }

    // Handle file upload to ImgBB
    function handleFileUpload(file) {
        if (!file.type.match('image.*')) {
            alert('Please upload an image file (JPEG, PNG, GIF, etc.)');
            return;
        }

        // Show preview
        if (imagePreview && previewContainer) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }

        // Upload to ImgBB
        if (uploadLoading) uploadLoading.style.display = 'block';

        const formData = new FormData();
        formData.append('image', file);

        fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (uploadLoading) uploadLoading.style.display = 'none';

            if (data.success) {
                const imageUrl = data.data.url;
                if (urlInput) urlInput.value = imageUrl;
                if (screenshotUrlInput) screenshotUrlInput.value = imageUrl;
                if (urlContainer) urlContainer.style.display = 'block';
            } else {
                alert('Upload failed: ' + (data.error?.message || 'Unknown error'));
            }
        })
        .catch(error => {
            if (uploadLoading) uploadLoading.style.display = 'none';
            alert('Upload failed. Please try again.');
            console.error('Upload error:', error);
        });
    }

    // Copy URL to clipboard
    if (copyBtn && urlInput) {
        copyBtn.addEventListener('click', function() {
            urlInput.select();
            document.execCommand('copy');

            const originalText = copyBtn.querySelector('span').textContent;
            copyBtn.querySelector('span').textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.querySelector('span').textContent = originalText;
            }, 2000);
        });
    }

    // Category selection
    const categoryCards = document.querySelectorAll('.category-card');
    const categoryInput = getElement('category');
    const issuesContainer = getElement('issuesContainer');
    const issuesGrid = getElement('issuesGrid');
    
    if (categoryCards.length > 0 && categoryInput) {
        categoryCards.forEach(card => {
            card.addEventListener('click', function() {
                // Remove active class from all cards
                categoryCards.forEach(c => c.classList.remove('active'));
                // Add active class to clicked card
                this.classList.add('active');
                
                const selectedCategory = this.getAttribute('data-category');
                categoryInput.value = selectedCategory;
                
                // Show issues for selected category
                showIssuesForCategory(selectedCategory);
            });
        });
    }
    
    // Issue selection
    function showIssuesForCategory(category) {
        const issues = issueData[category] || [];
        
        // Clear previous issues
        if (issuesGrid) {
            issuesGrid.innerHTML = '';
            
            if (issues.length === 0) {
                issuesGrid.innerHTML = '<div class="no-issues">No issues found for this category.</div>';
                return;
            }
            
            // Add issues to grid
            issues.forEach(issue => {
                const issueCard = document.createElement('div');
                issueCard.className = 'issue-card';
                issueCard.setAttribute('data-issue', issue.text);
                issueCard.innerHTML = `
                    <div class="issue-number">${issue.number}</div>
                    <div class="issue-text">${issue.text}</div>
                `;
                
                issueCard.addEventListener('click', function() {
                    // Remove active class from all issue cards
                    document.querySelectorAll('.issue-card').forEach(card => {
                        card.classList.remove('active');
                    });
                    
                    // Add active class to clicked card
                    this.classList.add('active');
                    
                    // Update hidden input and show selected issue
                    const issueInput = getElement('issue');
                    if (issueInput) issueInput.value = this.getAttribute('data-issue');
                    
                    showSelectedIssue(issue.text);
                });
                
                issuesGrid.appendChild(issueCard);
            });
        }
        
        // Show issues container with animation
        if (issuesContainer) {
            issuesContainer.style.display = 'block';
            issuesContainer.classList.add('section-transition');
        }
        
        // Hide selected issue display initially
        const selectedIssueDisplay = getElement('selectedIssueDisplay');
        if (selectedIssueDisplay) selectedIssueDisplay.style.display = 'none';
    }
    
    // Show selected issue
    function showSelectedIssue(issueText) {
        const selectedIssueDisplay = getElement('selectedIssueDisplay');
        const selectedIssueValue = getElement('selectedIssueValue');
        
        if (selectedIssueValue) selectedIssueValue.textContent = issueText;
        if (selectedIssueDisplay) {
            selectedIssueDisplay.style.display = 'block';
            selectedIssueDisplay.classList.add('section-transition');
        }
    }
    
    // Change issue selection
    const changeIssueBtn = getElement('changeIssueBtn');
    if (changeIssueBtn) {
        changeIssueBtn.addEventListener('click', function() {
            const selectedIssueDisplay = getElement('selectedIssueDisplay');
            if (selectedIssueDisplay) selectedIssueDisplay.style.display = 'none';
            document.querySelectorAll('.issue-card').forEach(card => {
                card.classList.remove('active');
            });
        });
    }
    
    // Priority selection
    const priorityCards = document.querySelectorAll('.priority-card');
    const priorityInput = getElement('priority');
    
    if (priorityCards.length > 0 && priorityInput) {
        priorityCards.forEach(card => {
            card.addEventListener('click', function() {
                // Remove active class from all priority cards
                priorityCards.forEach(c => c.classList.remove('active'));
                // Add active class to clicked card
                this.classList.add('active');
                
                const selectedPriority = this.getAttribute('data-priority');
                priorityInput.value = selectedPriority;
            });
        });
    }

    // Clear form - preserve auto-filled data
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            // Store current auto-filled values
            const currentEmpid = empidInput ? empidInput.value : '';
            const currentName = nameInput ? nameInput.value : '';
            
            if (form) form.reset();
            
            // Restore auto-filled values
            if (currentEmpid && empidInput) {
                empidInput.value = currentEmpid;
                empidInput.readOnly = true;
            }
            if (currentName && nameInput) {
                nameInput.value = currentName;
                nameInput.readOnly = true;
            }

            // Clear category selection
            categoryCards.forEach(card => card.classList.remove('active'));
            if (categoryInput) categoryInput.value = '';
            
            // Clear issue selection
            document.querySelectorAll('.issue-card').forEach(card => card.classList.remove('active'));
            const issueInput = getElement('issue');
            if (issueInput) issueInput.value = '';
            const selectedIssueDisplay = getElement('selectedIssueDisplay');
            if (selectedIssueDisplay) selectedIssueDisplay.style.display = 'none';
            if (issuesContainer) issuesContainer.style.display = 'none';
            
            // Clear priority selection
            priorityCards.forEach(card => card.classList.remove('active'));
            if (priorityInput) priorityInput.value = '';
            
            if (previewContainer) previewContainer.style.display = 'none';
            if (urlContainer) urlContainer.style.display = 'none';
            if (successMessage) successMessage.style.display = 'none';
            if (errorMessage) errorMessage.style.display = 'none';
        });
    }

    // Form submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            // Validate required fields
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            // Add this right before the validation loop:
// Exclude issue field from validation (make it optional)
            const issueInput = getElement('issue');
            if (issueInput) {
                 issueInput.required = false; // Remove required attribute
            }
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = 'var(--error)';
                } else {
                    field.style.borderColor = '';
                }
            });

            // Validate location
            const finalLocation = locationInput ? locationInput.value : '';
            if (!finalLocation || finalLocation.trim() === '') {
                isValid = false;
                if (locationInput) {
                    locationInput.style.borderColor = 'var(--error)';
                }
            }

            // Validate school
            const finalSchool = schoolInput ? schoolInput.value : '';
            if (!finalSchool || finalSchool.trim() === '') {
                isValid = false;
                if (schoolInput) {
                    schoolInput.style.borderColor = 'var(--error)';
                }
            }

            if (!isValid) {
                if (errorMessage) {
                    errorMessage.textContent = 'Please fill all required fields';
                    errorMessage.style.display = 'block';
                }
                return;
            }

            // Submit to Google Forms
            if (loading) loading.style.display = 'block';

            const formData = new FormData(form);
            const formAction = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSd4uLHDE4qP9BTAorYPVLPMGc-e-hhNeeM35Q4SF0ZzPQkKXg/formResponse';

            // Convert FormData to URL encoded string
            const urlEncodedData = new URLSearchParams(formData).toString();

            console.log('Submitting data:', urlEncodedData);
            console.log('Location being submitted:', finalLocation);
            console.log('School being submitted:', finalSchool);

            // Submit using fetch
            fetch(formAction, {
                method: 'POST',
                body: urlEncodedData,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                mode: 'no-cors'
            })
            .then(() => {
                // Since we're using no-cors, we can't read the response
                // But we assume success if the request was sent
                if (loading) loading.style.display = 'none';
                if (successMessage) successMessage.style.display = 'block';
                
                // Store current auto-filled values before reset
                const currentEmpid = empidInput ? empidInput.value : '';
                const currentName = nameInput ? nameInput.value : '';
                
                if (form) form.reset();
                
                // Restore auto-filled values after reset
                if (currentEmpid && empidInput) {
                    empidInput.value = currentEmpid;
                    empidInput.readOnly = true;
                }
                if (currentName && nameInput) {
                    nameInput.value = currentName;
                    nameInput.readOnly = true;
                }
                
                // Clear selections
                categoryCards.forEach(card => card.classList.remove('active'));
                if (categoryInput) categoryInput.value = '';
                document.querySelectorAll('.issue-card').forEach(card => card.classList.remove('active'));
                const issueInput = getElement('issue');
                if (issueInput) issueInput.value = '';
                const selectedIssueDisplay = getElement('selectedIssueDisplay');
                if (selectedIssueDisplay) selectedIssueDisplay.style.display = 'none';
                if (issuesContainer) issuesContainer.style.display = 'none';
                priorityCards.forEach(card => card.classList.remove('active'));
                if (priorityInput) priorityInput.value = '';
                
                if (previewContainer) previewContainer.style.display = 'none';
                if (urlContainer) urlContainer.style.display = 'none';

                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Redirect to dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            })
            .catch(error => {
                if (loading) loading.style.display = 'none';
                if (errorMessage) {
                    errorMessage.textContent = 'Submission failed. Please try again.';
                    errorMessage.style.display = 'block';
                }
                console.error('Submission error:', error);
            });
        });
    }

});
