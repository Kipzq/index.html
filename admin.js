document.addEventListener("DOMContentLoaded", function() {
    fetchLoans();
});

// 1. Fetch loans from the database and display them
function fetchLoans() {
    const tableBody = document.getElementById('loanTableBody');
    
    fetch('http://localhost:3000/api/loans')
        .then(response => response.json())
        .then(loans => {
            tableBody.innerHTML = ''; // Clear existing rows
            
            if (loans.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No loan applications yet.</td></tr>';
                return;
            }

            loans.forEach(loan => {
                const date = new Date(loan.date).toLocaleDateString();
                const statusClass = `status-${loan.status.toLowerCase()}`;
                
                let actionButtons = '';
                if (loan.status === 'Pending') {
                    actionButtons = `
                        <button class="action-btn btn-approve" onclick="updateStatus('${loan._id}', 'Approved')">Approve</button>
                        <button class="action-btn btn-decline" onclick="updateStatus('${loan._id}', 'Declined')">Decline</button>
                    `;
                } else {
                    actionButtons = `<span style="font-size:0.8rem; color:#666;">Processed</span>`;
                }

                const row = `
                    <tr>
                        <td>${date}</td>
                        <td>${loan.memberName}</td>
                        <td>${loan.phone}</td>
                        <td>${loan.amount.toLocaleString()}</td>
                        <td>${loan.months}</td>
                        <td class="${statusClass}">${loan.status}</td>
                        <td>${actionButtons}</td>
                    </tr>
                `;
                tableBody.innerHTML += row;
            });
        })
        .catch(error => {
            console.error('Error fetching loans:', error);
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Error loading data. Is the server running?</td></tr>';
        });
}

// 2. Function to update the status (Approve/Decline)
function updateStatus(loanId, newStatus) {
    if (!confirm(`Are you sure you want to mark this loan as ${newStatus}?`)) return;

    fetch(`http://localhost:3000/api/loans/${loanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Loan successfully ${newStatus}!`);
            fetchLoans(); // Refresh the table
        } else {
            alert("Failed to update status.");
        }
    })
    .catch(error => {
        console.error('Error updating status:', error);
        alert("Network error. Please check your server.");
    });
}