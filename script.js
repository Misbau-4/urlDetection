/**
 * Phishing URL Detector - Vanilla JavaScript
 *
 * This front-end implementation now integrates with the real
 * phishing-detection API and handles all exemplar responses.
 */

// Get DOM elements (preserved from your original script) :contentReference[oaicite:0]{index=0}
const urlInput = document.getElementById("urlInput");
const checkButton = document.getElementById("checkButton");
const buttonText = document.getElementById("buttonText");
const loadingSpinner = document.getElementById("loadingSpinner");
const resultArea = document.getElementById("resultArea");
const resultBody = document.getElementById("resultBody");

// Event listener
processButton.addEventListener("click", handleCsvProcessing);

/**
 * Main function to handle URL checking
 */
async function handleUrlCheck() {
  const url = urlInput.value.trim();

  // Basic validation
  if (!url) {
    showError("Please enter a URL to check");
    return;
  }
  if (!isValidUrl(url)) {
    showError("Please enter a valid URL (e.g., https://example.com)");
    return;
  }

  setLoadingState(true);
  resultBody.innerHTML = ""; // clear previous

  try {
    const text = await file.text();
    const urls = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line);

    // Fire all requests in parallel
    const promises = urls.map((u) => classifyUrl(u));
    const results = await Promise.all(promises);

    // Populate table
    for (const { url, status, isLegit } of results) {
      const tr = document.createElement("tr");

      const tdUrl = document.createElement("td");
      tdUrl.className = "px-4 py-2 text-sm text-gray-700";
      tdUrl.textContent = url;
      tr.appendChild(tdUrl);

      const tdStatus = document.createElement("td");
      tdStatus.className = `px-4 py-2 text-sm font-medium ${
        status === "Legitimate"
          ? "text-green-800 bg-green-100"
          : status === "Illegitimate"
          ? "text-red-800 bg-red-100"
          : "text-yellow-800 bg-yellow-100"
      } rounded-lg`;
      tdStatus.textContent = status;
      tr.appendChild(tdStatus);

      resultBody.appendChild(tr);
    }

    resultArea.classList.remove("hidden");
  } catch (err) {
    alert("Error processing file: " + err.message);
  } finally {
    setLoadingState(false);
  }
}

/**
 * Calls API for a single URL, maps errors, returns a uniform result object.
 */
async function classifyUrl(url) {
  try {
    const { prediction, url: normalized } = await checkUrl(url);
    return {
      url: normalized,
      status: prediction === 1 ? "Legitimate" : "Illegitimate",
      isLegit: prediction === 1,
    };
  } catch (error) {
    const msg = error.message || "";
    if (/^Failed to fetch URL:.*NameResolutionError/.test(msg)) {
      return { url, status: "Website is not active", isLegit: false };
    }
    return { url, status: msg, isLegit: false };
  }
}

/**
 * Same single-URL POST logic as before.
 */
async function checkUrl(url) {
  const res = await fetch(
    "https://phishing-backend-qcte.onrender.com/predict",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }
  );

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Invalid JSON (status ${res.status})`);
  }
  if (data.error) {
    throw new Error(data.error);
  }
  if (
    typeof data.prediction !== "number" ||
    (data.prediction !== 0 && data.prediction !== 1) ||
    typeof data.url !== "string"
  ) {
    throw new Error("Unexpected response format");
  }
  return data;
}

/**
 * Toggle button + spinner.
 */
function setLoadingState(isLoading) {
  processButton.disabled = isLoading;
  buttonText.textContent = isLoading ? "Processing..." : "Classify URLs";
  loadingSpinner.classList.toggle("hidden", !isLoading);
}
