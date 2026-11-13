document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById('sacco-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const name = formData.get('name');
            const loanType = formData.get('loanType');
            const phone = formData.get('phone');
            const amount = formData.get('amount');
            const months = formData.get('months');
            const signature = formData.get('signature');
            const userId = formData.get('userId');
            
            const button = form.querySelector('button');
            const originalText = button.innerText;
            
            button.innerText = "Sending...";
            button.disabled = true;

            fetch('/api/apply-loan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    name: name,
                    loanType: loanType,
                    phone: phone,
                    amount: amount,
                    months: months,
                    signature: signature
                })
            }).then(response => {
                if (response.ok) {
                    alert(`Thank you, ${name}! Your application for ${loanType} has been received.`);
                    form.reset();
                } else {
                    alert("Oops! There was a problem submitting your form.");
                }
            }).catch(error => {
                console.error("Error:", error);
                alert("Network error. Please try again.");
            }).finally(() => {
                button.innerText = originalText;
                button.disabled = false;
            });
        });
    }
});

function calculateLoan() {
    const amount = document.getElementById('loanAmount').value;
    const months = document.getElementById('loanTerm').value;
    const resultDiv = document.getElementById('result');
    if (amount === "" || months === "" || amount <= 0 || months <= 0) {
        alert("Please enter valid numbers.");
        return;
    }
    const monthlyRate = 0.01; 
    const totalInterest = amount * monthlyRate * months;
    const totalRepayment = parseFloat(amount) + totalInterest;
    const monthlyPayment = totalRepayment / months;
    const formatKES = (num) => "KES " + num.toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    resultDiv.style.display = "block";
    resultDiv.innerHTML = `
        Monthly Repayment: <br><span style="font-size: 1.5rem;">${formatKES(monthlyPayment)}</span><br><br>
        Total Repayment: ${formatKES(totalRepayment)}<br>
        <span style="font-size: 0.9rem; color: #666; font-weight: normal;">(Includes 1% monthly interest)</span>
    `;
}

function selectLoan(loanName) {
    const dropdown = document.getElementById('loanType');
    if (dropdown) {
        dropdown.value = loanName;
    }
}