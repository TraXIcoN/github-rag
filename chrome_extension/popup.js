document.getElementById("processRepo").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const repoName = document.getElementById("repoName").value;

  if (!username || !repoName) {
    alert("Please enter both the GitHub username and repository name.");
    return;
  }

  document.getElementById("loader").style.display = "block";

  // Send the data to the backend for processing
  try {
    const response = await fetch("http://localhost:3000/process-repo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, repoName }),
    });

    const data = await response.json();
    if (data.success) {
      document.getElementById("loader").style.display = "none";
      document.getElementById("chatInterface").style.display = "block";
    } else {
      document.getElementById("loader").style.display = "none";
      alert("Error processing repository.");
    }
  } catch (error) {
    document.getElementById("loader").style.display = "none";
    alert("Error processing repository.");
  }
});

document.getElementById("askQuestion").addEventListener("click", async () => {
  const question = document.getElementById("userQuestion").value;

  if (!question) {
    alert("Please enter a question.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/process-query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: question }),
    });

    const data = await response.json();
    if (data.success) {
      const chatOutput = document.getElementById("chatOutput");
      chatOutput.innerHTML += `<p><strong>You:</strong> ${question}</p>`;
      chatOutput.innerHTML += `<p><strong>Answer:</strong> ${data.response}</p>`;
    } else {
      alert("Error processing query.");
    }
  } catch (error) {
    alert("Error processing query.");
  }
});
