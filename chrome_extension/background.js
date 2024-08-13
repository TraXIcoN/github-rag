chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "processRepo") {
    try {
      const response = await fetch("http://localhost:3000/process-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: message.username,
          repoName: message.repoName,
        }),
      });

      const data = await response.json();
      sendResponse({ success: data.success });
    } catch (error) {
      sendResponse({ success: false });
    }
    return true; // Indicates that the response is asynchronous
  }

  if (message.type === "processQuery") {
    try {
      const response = await fetch("http://localhost:3000/process-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: message.query }),
      });

      const data = await response.json();
      sendResponse({ success: data.success, response: data.response });
    } catch (error) {
      sendResponse({ success: false });
    }
    return true; // Indicates that the response is asynchronous
  }
});
