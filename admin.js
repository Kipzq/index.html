document.addEventListener("DOMContentLoaded", function() {
    fetchLoans();
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(el => el.value = today);
});

let allLoans = []; 

function fetchLoans() {
    fetch('/api/loans').then(res => res.json()).then(loans => {
        allLoans = loans;
        const tableBody = document.getElementById('loanTableBody');
        tableBody.innerHTML = loans.length === 0 ? '<tr><td colspan="6" style="text-align:center;">No applications yet.</td></tr>' : '';
        
        loans.forEach(loan => {
            const statusClass = `status-${loan.status.toLowerCase()}`;
            let btns = `<button class="action-btn" style="background:#1a2b5e;" onclick="appraise('${loan._id}')">Appraise & Print</button>`;
            if (loan.status === 'Pending') {
                btns += `
                    <button class="action-btn btn-approve" onclick="updateLoanStatus('${loan._id}', 'Approved')">Approve</button>
                    <button class="action-btn btn-decline" onclick="updateLoanStatus('${loan._id}', 'Declined')">Decline</button>
                `;
            }
            tableBody.innerHTML += `<tr>
                <td>${new Date(loan.date).toLocaleDateString()}</td>
                <td>${loan.fullName || 'Unknown'} <br><small>${loan.phone || ''}</small></td>
                <td>${loan.loanType || 'N/A'}</td>
                <td>KES ${loan.amountRequested?.toLocaleString() || '0'}</td>
                <td class="${statusClass}">${loan.status}</td>
                <td style="display: flex; gap: 5px; flex-wrap: wrap;">${btns}</td>
            </tr>`;
        });
    });
}

function recalculate() {
    const basic = parseFloat(document.getElementById('editBasic').value) || 0;
    const shares = parseFloat(document.getElementById('editShares').value) || 0;

    const thirdBasic = basic / 3;
    const ability = basic - thirdBasic;
    const shareLimit = shares * 3;
    const recommended = Math.min(ability, shareLimit);

    document.getElementById('editThird').value = thirdBasic.toLocaleString(undefined, {maximumFractionDigits: 2});
    document.getElementById('editAbility').value = ability.toLocaleString(undefined, {maximumFractionDigits: 2});
    document.getElementById('editShareLimit').value = shareLimit.toLocaleString(undefined, {maximumFractionDigits: 2});

    document.getElementById('amountApproved').value = recommended;
    document.getElementById('committeeAmount').value = recommended;
}

async function appraise(loanId) {
    const loan = allLoans.find(l => l._id === loanId);
    if (!loan) return alert("Loan not found");
    if (!loan.userId) return alert("No user linked to this loan.");

    const res = await fetch(`/api/appraise/${loan.userId}`);
    const data = await res.json();
    
    if (res.ok) {
        // 1. Fill Member's Form (Top)
        document.getElementById('replicaPartA').innerHTML = `
            <div class="replica-item"><strong>Full Name:</strong> ${loan.fullName || 'N/A'}</div>
            <div class="replica-item"><strong>Account No:</strong> ${loan.accountNo || 'N/A'}</div>
            <div class="replica-item"><strong>Employer:</strong> ${loan.employer || 'N/A'}</div>
            <div class="replica-item"><strong>Station:</strong> ${loan.station || 'N/A'}</div>
            <div class="replica-item"><strong>Payroll No:</strong> ${loan.payrollNo || 'N/A'}</div>
            <div class="replica-item"><strong>ID No:</strong> ${loan.idNo || 'N/A'}</div>
            <div class="replica-item"><strong>Phone:</strong> ${loan.phone || 'N/A'}</div>
            <div class="replica-item"><strong>Email:</strong> ${loan.email || 'N/A'}</div>
        `;

        document.getElementById('replicaPartB').innerHTML = `
            I <strong>${loan.fullName}</strong> hereby apply for a loan of <strong>KShs. ${loan.amountRequested?.toLocaleString()}</strong> 
            for a period of <strong>${loan.periodMonths} Months</strong>.
        `;

        document.getElementById('replicaPartCD').innerHTML = `
            <div class="replica-item"><strong>Loan Type:</strong> ${loan.loanType || 'N/A'}</div>
            <div class="replica-item"><strong>Purpose:</strong> ${loan.purpose || 'N/A'}</div>
        `;

        // Populate all 10 Guarantors
        let guarantorHTML = '';
        for (let i = 1; i <= 10; i++) {
            if (loan[`guarantor${i}Name`]) {
                guarantorHTML += `
                    <div class="replica-item">
                        <strong>Guarantor ${i}:</strong> ${loan[`guarantor${i}Name`]} (Payroll: ${loan[`guarantor${i}Payroll`]}) - KES ${loan[`guarantor${i}Amount`]?.toLocaleString()}
                    </div>
                `;
            }
        }
        document.getElementById('replicaPartE').innerHTML = guarantorHTML || '<p>No guarantors provided.</p>';

        document.getElementById('replicaSignature').innerText = loan.applicantSignature;
        document.getElementById('replicaDate').innerText = loan.dateSigned;

        // 2. Pre-fill the Financial Inputs (Bottom)
        document.getElementById('editBasic').value = data.basicSalary || 0;
        document.getElementById('editShares').value = data.shares || 0;
        document.getElementById('recoverableMonths').value = loan.periodMonths || 48;
        
        // 3. Run the calculation
        recalculate();
        document.getElementById('appraisalModal').style.display = 'flex';
    } else { 
        alert(data.error); 
    }
}

function updateLoanStatus(id, status) {
    if (!confirm(`Mark as ${status}?`)) return;
    fetch(`/api/loans/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
        .then(() => { alert(`Loan ${status}`); fetchLoans(); });
}