// Base URLs for API routes
const BASE_URL = 'https://us-central1-khrs-project.cloudfunctions.net';
const getPatientsRoute = `${BASE_URL}/getPatients`;
const updatePatientRoute = `${BASE_URL}/updatePatient`;
const deletePatientRoute = `${BASE_URL}/deletePatient`;
const getNursesRoute = `${BASE_URL}/getNurses`;

// State
let allPatients = [];
let nurses = [];

// Fetch and populate patients
async function fetchPatients() {
    try {
        const response = await fetch(getPatientsRoute);
        const data = await response.json();
        allPatients = data.patients || [];

        // Update UI
        populatePatientTable(allPatients, nurses);
        updatePatientChart(allPatients);
        document.getElementById('total-patients').textContent = `Total Patients: ${allPatients.length}`;
    } catch (error) {
        console.error('Error fetching patients:', error);
    }
}

// Populate patient table
function populatePatientTable(patients, nurses = []) {
    const tableBody = document.getElementById('patients-table-body');
    tableBody.innerHTML = patients.map(patient => {
        // Find the assigned nurse
        const assignedNurse = nurses.find(nurse => nurse.id === patient.assignedNurse);
        console.log(assignedNurse);
        
        return `
        <tr>
            <td>
                <button class="btn btn-success py-0 px-1 text-sm" onclick="openPatientModal(${JSON.stringify(patient).replace(/"/g, '&quot;')})">
                    View
                </button>
                ${patient.firstName} ${patient.lastName}
            </td>
            
            <td>${patient.idNumber || 'N/A'}</td>
            <td>${patient.address.city}, ${patient.address.province}, ${patient.address.streetName}, ${patient.address.suburb}, ${patient.address.zip}</td>
            <td>
                <div class="text-${
                    patient.admissionStatus === 'Admitted' ? 'success' : 
                    patient.admissionStatus === 'Nurse Assigned' ? 'warning' : 
                    'secondary'
                }">
                    ${patient.admissionStatus || 'Unknown'}
                </div>
                ${assignedNurse ? `<small class="text-muted fst-italic">Nurse: ${assignedNurse.name}</small>` : ''}
            </td>
        </tr>
    `}).join('');
}

// Resize chart dynamically based on its container
let chartInstance = null;

function updatePatientChart(patients) {
    const statusCounts = patients.reduce((counts, patient) => {
        counts[patient.admissionStatus] = (counts[patient.admissionStatus] || 0) + 1;
        return counts;
    }, {});

    const ctx = document.getElementById('patientsChart').getContext('2d');

    if (chartInstance) {
        chartInstance.destroy(); // Destroy the previous chart
    }

    // Dynamically adjust chart size
    ctx.canvas.height = 50; // Adjust height as needed
    ctx.canvas.width = 50;  // Adjust width as needed

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
            }],
        },
    });
}

// Open patient modal
function openPatientModal(patientData) {
    const patient = typeof patientData === 'string' 
        ? JSON.parse(patientData) 
        : patientData;

    // Populate patient fields
    document.getElementById("patient-id").value = patient.id || '';
    document.getElementById("patient-verify").value = patient.verified || '';
    document.getElementById("patient-first-name").value = patient.firstName || '';
    document.getElementById("patient-last-name").value = patient.lastName || '';
    document.getElementById("patient-file-number").value = patient.idNumber || '';
    document.getElementById("patient-address").value = patient.physicalAddress || '';
    document.getElementById("patient-gender").value = patient.gender || '';
    document.getElementById("patient-contact").value = patient.contactNumber || '';
    document.getElementById("patient-email").value = patient.email || '';
    document.getElementById("patient-admission-status").value = patient.admissionStatus || '';
    document.getElementById("patient-race").value = patient.race || '';
    document.getElementById("patient-assigned-nurse").value = patient.assignedNurse || '';

    // Prepopulate the assigned nurse
    const nurseDropdown = document.getElementById("patient-assigned-nurse");
    nurseDropdown.innerHTML = '<option value="">Select Nurse</option>'; // Clear existing options
    nurses.forEach(nurse => {
        const option = document.createElement('option');
        option.value = nurse.id;
        option.textContent = nurse.name;
        if (nurse.id === patient.assignedNurse) {
            option.selected = true; // Select the assigned nurse
        }
        nurseDropdown.appendChild(option);
    });

    // Populate Next of Kin fields
    const nextOfKin = patient.nextOfKin || {};
    document.getElementById("next-of-kin-first-name").value = nextOfKin.firstName || '';
    document.getElementById("next-of-kin-last-name").value = nextOfKin.lastName || '';
    document.getElementById("next-of-kin-contact").value = nextOfKin.contactNumber || '';
    document.getElementById("next-of-kin-email").value = nextOfKin.email || '';
    document.getElementById("next-of-kin-address").value = nextOfKin.physicalAddress || '';

    // quill.root.innerHTML = patient.medicalNotes || ''; // Populate medical notes
    // Prepopulate medical notes (if applicable)
    if (typeof quill !== 'undefined') {
        quill.root.innerHTML = patient.medicalNotes || '';
    }


    // Show the modal using Bootstrap's modal method
    const modalElement = document.getElementById('patientModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    // Attach modal actions with the patient ID
    attachPatientModalActions(patient.id);
}

// Attach actions to the modal
function attachPatientModalActions(patientId) {
    const spinner = document.getElementById('spinner');
    const saveButton = document.getElementById('save-patient-button');
    const deleteButton = document.getElementById('delete-patient-button');

    // Populate nurses dropdown
    const nurseDropdown = document.getElementById('patient-assigned-nurse');
    nurseDropdown.innerHTML = '<option value="">Select Nurse</option>' + 
        nurses.map(nurse => `<option value="${nurse.id}">${nurse.name}</option>`).join('');

    // When a nurse is selected, automatically change status to "Nurse Assigned"
    nurseDropdown.addEventListener('change', (e) => {
        const admissionStatusField = document.getElementById('patient-admission-status');
        if (e.target.value) {
            admissionStatusField.value = 'Nurse Assigned';
        }
    });

    // Show spinner while editing or deleting
    function toggleSpinner(show) {
        spinner.style.display = show ? 'block' : 'none';
        saveButton.disabled = show;
        deleteButton.disabled = show;
    }

    // Save changes
    document.getElementById('patient-form').onsubmit = async (event) => {
        event.preventDefault();
        toggleSpinner(true);
    
        const patientId = document.getElementById('patient-id').value;
    
        const updatedPatient = {
            verified: document.getElementById('patient-verify').value,
            firstName: document.getElementById('patient-first-name').value,
            lastName: document.getElementById('patient-last-name').value,
            idNumber: document.getElementById('patient-file-number').value,
            physicalAddress: document.getElementById('patient-address').value,
            gender: document.getElementById('patient-gender').value,
            contactNumber: document.getElementById('patient-contact').value,
            email: document.getElementById('patient-email').value,
            admissionStatus: document.getElementById('patient-admission-status').value,
            race: document.getElementById('patient-race').value,
            assignedNurse: document.getElementById('patient-assigned-nurse').value || null,
            nextOfKin: {
                firstName: document.getElementById('next-of-kin-first-name').value,
                lastName: document.getElementById('next-of-kin-last-name').value,
                contactNumber: document.getElementById('next-of-kin-contact').value,
                email: document.getElementById('next-of-kin-email').value,
                physicalAddress: document.getElementById('next-of-kin-address').value,
            },
            medicalNotes: quill.root.innerHTML, // Save medical notes
        };
    
        try {
            const response = await fetch(`${updatePatientRoute}?id=${patientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedPatient),
            });
    
            const responseBody = await response.text();
            console.log('Response status:', response.status);
            console.log('Response body:', responseBody);
    
            if (response.ok) {
                await fetchPatients(); // Refresh data
                alert('Patient updated successfully!');
                const modal = bootstrap.Modal.getInstance(document.getElementById('patientModal'));
                modal.hide();
            } else {
                throw new Error(`Failed to update patient: ${responseBody}`);
            }
        } catch (error) {
            console.error('Error updating patient:', error);
            alert(error.message);
        } finally {
            toggleSpinner(false);
        }
    };

    // Delete patient
    deleteButton.onclick = async () => {
        if (confirm('Are you sure you want to delete this patient?')) {
            toggleSpinner(true);

            try {
                const response = await fetch(`${deletePatientRoute}?id=${patientId}`, { method: 'DELETE' });
                if (response.ok) {
                    await fetchPatients(); // Refresh data
                    alert('Patient deleted successfully!');
                    const modal = bootstrap.Modal.getInstance(document.getElementById('patientModal'));
                    modal.hide();
                } else {
                    const errorText = await response.text();
                    throw new Error(`Failed to delete patient: ${errorText}`);
                }
            } catch (error) {
                console.error('Error deleting patient:', error);
                alert(error.message);
            } finally {
                toggleSpinner(false);
            }
        }
    };
}

// Filter patients with case-insensitive comparison
function filterPatients() {
    const statusFilter = document.getElementById('statusFilter').value;
    const genderFilter = document.getElementById('genderFilter').value;

    const filteredPatients = allPatients.filter(patient => {
        const admissionStatus = patient.admissionStatus || ''; // default to empty string if undefined
        const gender = patient.gender || ''; // default to empty string if undefined

        return (!statusFilter || admissionStatus.toLowerCase() === statusFilter.toLowerCase()) &&
               (!genderFilter || gender.toLowerCase() === genderFilter.toLowerCase());
    });

    populatePatientTable(filteredPatients, nurses);
    updatePatientChart(filteredPatients);
}

// Fetch nurses
async function fetchNurses() {
    try {
        const response = await fetch(getNursesRoute);
        const data = await response.json();
        nurses = data.nurses || [];

        // Update UI
        document.getElementById('total-nurses').textContent = `Total Nurses: ${nurses.length}`;
        const tableBody = document.getElementById('nurses-table-body');
        tableBody.innerHTML = nurses.map(nurse => `
            <tr>
                <td>${nurse.name || 'N/A'}</td>
                <td>${nurse.department || 'N/A'}</td>
                <td>${nurse.contactNumber || 'N/A'}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error fetching nurses:', error);
    }
}

// Event listeners
document.getElementById('statusFilter').addEventListener('change', filterPatients);
document.getElementById('genderFilter').addEventListener('change', filterPatients);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchPatients();
    fetchNurses();
});