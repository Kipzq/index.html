document.addEventListener("DOMContentLoaded", function() {
    // --- FORM SUBMISSION LOGIC ---
    const form = document.getElementById('sacco-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // Stop the page from refreshing
        
        const formData = new FormData(form);
        const name = formData.get('name');
        
        const button = form.querySelector('button');
        const originalText = button.innerText;
        
        // Show a "sending" message
        button.innerText = "Sending...";
        button.disabled = true;

        // Send data to Formspree
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            if (response.ok) {
                alert(`Thank you, ${name}! Your application has been sent to our team.`);
                form.reset();
            } else {
                alert("Oops! There was a problem submitting your form. Please check your connection.");
            }
        }).catch(error => {
            alert("Network error. Please try again.");
        }).finally(() => {
            button.innerText = originalText;
            button.disabled = false;
        });
    });
});

// --- LOAN CALCULATOR LOGIC ---
function calculateLoan() {
    const amount = document.getElementById('loanAmount').value;
    const months = document.getElementById('loanTerm').value;
    const resultDiv = document.getElementById('result');

    // Basic validation
    if (amount === "" || months === "" || amount <= 0 || months <= 0) {
        alert("Please enter valid numbers for amount and months.");
        return;
    }

    // SmartLife SACCO Interest Rate (12% per year = 1% per month)
    const monthlyRate = 0.01; 
    
    // Simple Interest calculation: (Principal * Rate * Time) + Principal
    const totalInterest = amount * monthlyRate * months;
    const totalRepayment = parseFloat(amount) + totalInterest;
    const monthlyPayment = totalRepayment / months;

    // Format numbers with commas (e.g., KES 5,000.00)
    const formatKES = (num) => "KES " + num.toLocaleString('en-KE', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    // Display result
    resultDiv.style.display = "block";
    resultDiv.innerHTML = `
        Monthly Repayment: <br><span style="font-size: 1.5rem;">${formatKES(monthlyPayment)}</span><br><br>
        Total Repayment: ${formatKES(totalRepayment)}<br>
        <span style="font-size: 0.9rem; color: #666; font-weight: normal;">(Includes 1% monthly interest)</span>
    `;
}