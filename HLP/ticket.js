// Employee data retrieval function
function getEmployeeData() {
    try {
        const localStorageData = localStorage.getItem('employeeData');
        const sessionStorageData = sessionStorage.getItem('currentEmployee');
        
        let employeeData = null;
        
        if (localStorageData) {
            employeeData = JSON.parse(localStorageData);
        } else if (sessionStorageData) {
            employeeData = JSON.parse(sessionStorageData);
        }
        
        if (employeeData && employeeData.id && employeeData.name) {
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

// Main application logic
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('helplineForm');
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = uploadArea.querySelector('.browse-btn');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const urlContainer = document.getElementById('urlContainer');
    const urlInput = document.getElementById('urlInput');
    const screenshotUrlInput = document.getElementById('screenshotUrl');
    const copyBtn = document.getElementById('copyBtn');
    const uploadLoading = document.getElementById('uploadLoading');
    const loading = document.getElementById('loading');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const clearBtn = document.getElementById('clearForm');
    
    // Auto-fill EMPID and Name
    const empidInput = document.getElementById('empid');
    const nameInput = document.getElementById('name');
    
    // Get employee data and auto-fill fields
    const employeeData = getEmployeeData();
    if (employeeData) {
        // Fill EMPID (try different possible fields)
        const empid = employeeData.empid || employeeData.id || employeeData.EMPID;
        if (empid) {
            empidInput.value = empid;
            empidInput.readOnly = true;
        }
        
        // Fill Name
        if (employeeData.name) {
            nameInput.value = employeeData.name;
            nameInput.readOnly = true;
        }
    }

    // ImgBB API Key
    const IMGBB_API_KEY = '29a736ebd8c9d8ef3f662c8dbef54025';

    // Upload area click handlers
    uploadArea.addEventListener('click', () => fileInput.click());
    browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });

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

    // Handle file upload to ImgBB
    function handleFileUpload(file) {
        if (!file.type.match('image.*')) {
            alert('Please upload an image file (JPEG, PNG, GIF, etc.)');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);

        // Upload to ImgBB
        uploadLoading.style.display = 'block';

        const formData = new FormData();
        formData.append('image', file);

        fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            uploadLoading.style.display = 'none';

            if (data.success) {
                const imageUrl = data.data.url;
                urlInput.value = imageUrl;
                screenshotUrlInput.value = imageUrl;
                urlContainer.style.display = 'block';
            } else {
                alert('Upload failed: ' + (data.error?.message || 'Unknown error'));
            }
        })
        .catch(error => {
            uploadLoading.style.display = 'none';
            alert('Upload failed. Please try again.');
            console.error('Upload error:', error);
        });
    }

    // Copy URL to clipboard
    copyBtn.addEventListener('click', function() {
        urlInput.select();
        document.execCommand('copy');

        const originalText = copyBtn.querySelector('span').textContent;
        copyBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.querySelector('span').textContent = originalText;
        }, 2000);
    });

    // Category selection
    const categoryCards = document.querySelectorAll('.category-card');
    const categoryInput = document.getElementById('category');
    const issuesContainer = document.getElementById('issuesContainer');
    const issuesGrid = document.getElementById('issuesGrid');
    
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
    
    // Issue selection
    function showIssuesForCategory(category) {
        const issues = issueData[category] || [];
        
        // Clear previous issues
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
                const issueInput = document.getElementById('issue');
                issueInput.value = this.getAttribute('data-issue');
                
                showSelectedIssue(issue.text);
            });
            
            issuesGrid.appendChild(issueCard);
        });
        
        // Show issues container with animation
        issuesContainer.style.display = 'block';
        issuesContainer.classList.add('section-transition');
        
        // Hide selected issue display initially
        document.getElementById('selectedIssueDisplay').style.display = 'none';
    }
    
    // Show selected issue
    function showSelectedIssue(issueText) {
        const selectedIssueDisplay = document.getElementById('selectedIssueDisplay');
        const selectedIssueValue = document.getElementById('selectedIssueValue');
        
        selectedIssueValue.textContent = issueText;
        selectedIssueDisplay.style.display = 'block';
        selectedIssueDisplay.classList.add('section-transition');
    }
    
    // Change issue selection
    document.getElementById('changeIssueBtn').addEventListener('click', function() {
        document.getElementById('selectedIssueDisplay').style.display = 'none';
        document.querySelectorAll('.issue-card').forEach(card => {
            card.classList.remove('active');
        });
    });
    
    // Priority selection
    const priorityCards = document.querySelectorAll('.priority-card');
    const priorityInput = document.getElementById('priority');
    
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

    // Clear form - preserve auto-filled data
    clearBtn.addEventListener('click', function() {
        // Store current auto-filled values
        const currentEmpid = empidInput.value;
        const currentName = nameInput.value;
        
        form.reset();
        
        // Restore auto-filled values
        if (currentEmpid) {
            empidInput.value = currentEmpid;
            empidInput.readOnly = true;
        }
        if (currentName) {
            nameInput.value = currentName;
            nameInput.readOnly = true;
        }
        
        // Clear category selection
        categoryCards.forEach(card => card.classList.remove('active'));
        categoryInput.value = '';
        
        // Clear issue selection
        document.querySelectorAll('.issue-card').forEach(card => card.classList.remove('active'));
        document.getElementById('issue').value = '';
        document.getElementById('selectedIssueDisplay').style.display = 'none';
        issuesContainer.style.display = 'none';
        
        // Clear priority selection
        priorityCards.forEach(card => card.classList.remove('active'));
        priorityInput.value = '';
        
        previewContainer.style.display = 'none';
        urlContainer.style.display = 'none';
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';
    });

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Validate required fields
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = 'var(--error)';
            } else {
                field.style.borderColor = '';
            }
        });

        if (!isValid) {
            errorMessage.textContent = 'Please fill all required fields';
            errorMessage.style.display = 'block';
            return;
        }

        // Submit to Google Forms
        loading.style.display = 'block';

        const formData = new FormData(form);
        const formAction = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSd4uLHDE4qP9BTAorYPVLPMGc-e-hhNeeM35Q4SF0ZzPQkKXg/formResponse';

        // Convert FormData to URL encoded string
        const urlEncodedData = new URLSearchParams(formData).toString();

        console.log('Submitting data:', urlEncodedData);

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
            loading.style.display = 'none';
            successMessage.style.display = 'block';
            
            // Store current auto-filled values before reset
            const currentEmpid = empidInput.value;
            const currentName = nameInput.value;
            
            form.reset();
            
            // Restore auto-filled values after reset
            if (currentEmpid) {
                empidInput.value = currentEmpid;
                empidInput.readOnly = true;
            }
            if (currentName) {
                nameInput.value = currentName;
                nameInput.readOnly = true;
            }
            
            // Clear selections
            categoryCards.forEach(card => card.classList.remove('active'));
            categoryInput.value = '';
            document.querySelectorAll('.issue-card').forEach(card => card.classList.remove('active'));
            document.getElementById('issue').value = '';
            document.getElementById('selectedIssueDisplay').style.display = 'none';
            issuesContainer.style.display = 'none';
            priorityCards.forEach(card => card.classList.remove('active'));
            priorityInput.value = '';
            
            previewContainer.style.display = 'none';
            urlContainer.style.display = 'none';

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        })
        .catch(error => {
            loading.style.display = 'none';
            errorMessage.textContent = 'Submission failed. Please try again.';
            errorMessage.style.display = 'block';
            console.error('Submission error:', error);
        });
    });
});
