document.addEventListener("DOMContentLoaded", function() {
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