/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");
const chatForm = document.getElementById("chatForm");
const generateRoutineButton = document.getElementById("generateRoutine");
const selectedProductsList = document.getElementById("selectedProductsList");
const clearSelectionsButton = document.getElementById("clearSelections");

// Array to store selected products
let selectedProducts = [];

// Array to store the conversation history
let conversationHistory = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="select-product-btn" data-name="${product.name}" data-brand="${product.brand}" data-category="${product.category}" data-description="${product.description}">
          Select
        </button>
      </div>
    </div>
  `
    )
    .join("");

  // Add event listeners to "Select" buttons
  const selectButtons = document.querySelectorAll(".select-product-btn");
  selectButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const product = {
        name: button.dataset.name,
        brand: button.dataset.brand,
        category: button.dataset.category,
        description: button.dataset.description,
      };

      // Add the product to the selected products list
      addProduct(product);
    });
  });
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  // Filter products by the selected category
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Handle "Generate Routine" button click */
generateRoutineButton.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    // Display an error message if no products are selected
    chatWindow.innerHTML += `
      <div class="chat-message error-message">
        <p>Please select at least one product to generate a routine.</p>
      </div>
    `;
    return;
  }

  // Display a loading message in the chat window
  chatWindow.innerHTML += `
    <div class="chat-message">
      <p>Generating your routine... Please wait!</p>
    </div>
  `;

  try {
    // Add the user's request to the conversation history
    conversationHistory.push({
      role: "user",
      content: `Create a skincare or beauty routine using these products: ${JSON.stringify(
        selectedProducts
      )}`,
    });

    // Send the conversation history to the Cloudflare Worker
    const response = await fetch("https://broken-dream-d761.haymuir.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    // Parse the response from the Cloudflare Worker
    const data = await response.json();

    // Add the AI's response to the conversation history
    conversationHistory.push({
      role: "assistant",
      content: data.choices[0].message.content,
    });

    // Display the AI-generated routine in the chat window
    chatWindow.innerHTML += `
      <div class="chat-message ai-message">
        <p>${data.choices[0].message.content}</p>
      </div>
    `;
  } catch (error) {
    console.error("Error connecting to the API:", error);
    chatWindow.innerHTML += `
      <div class="chat-message error-message">
        <p>Sorry, something went wrong. Please try again later.</p>
      </div>
    `;
  }
});

/* Handle chat form submission for follow-up questions */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Display the user's message in the chat window
  chatWindow.innerHTML += `
    <div class="chat-message user-message">
      <p>${userMessage}</p>
    </div>
  `;

  // Clear the input field
  userInput.value = "";

  try {
    // Add the user's message to the conversation history
    conversationHistory.push({ role: "user", content: userMessage });

    // Send the updated conversation history to the Cloudflare Worker
    const response = await fetch("https://<your-cloudflare-worker-url>", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversationHistory }),
    });

    // Parse the response from the Cloudflare Worker
    const data = await response.json();

    // Add the AI's response to the conversation history
    conversationHistory.push({
      role: "assistant",
      content: data.choices[0].message.content,
    });

    // Display the AI's response in the chat window
    chatWindow.innerHTML += `
      <div class="chat-message ai-message">
        <p>${data.choices[0].message.content}</p>
      </div>
    `;
  } catch (error) {
    console.error("Error connecting to the API:", error);
    chatWindow.innerHTML += `
      <div class="chat-message error-message">
        <p>Sorry, something went wrong. Please try again later.</p>
      </div>
    `;
  }
});

/* Load selected products from localStorage */
function loadSelectedProducts() {
  const savedProducts = localStorage.getItem("selectedProducts");
  if (savedProducts) {
    selectedProducts = JSON.parse(savedProducts);
    displaySelectedProducts();
  }
}

/* Save selected products to localStorage */
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Display selected products in the "Selected Products" section */
function displaySelectedProducts() {
  selectedProductsList.innerHTML = ""; // Clear the list first
  selectedProducts.forEach((product, index) => {
    const productElement = document.createElement("div");
    productElement.classList.add("selected-product");
    productElement.innerHTML = `
      <p><strong>${product.name}</strong> by ${product.brand}</p>
      <button class="remove-product-btn" data-index="${index}">Remove</button>
    `;
    selectedProductsList.appendChild(productElement);
  });

  // Add event listeners to "Remove" buttons
  const removeButtons = document.querySelectorAll(".remove-product-btn");
  removeButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const index = e.target.dataset.index;
      removeProduct(index);
    });
  });
}

/* Add a product to the selected products list */
function addProduct(product) {
  selectedProducts.push(product);
  saveSelectedProducts();
  displaySelectedProducts();
}

/* Remove a product from the selected products list */
function removeProduct(index) {
  selectedProducts.splice(index, 1);
  saveSelectedProducts();
  displaySelectedProducts();
}

/* Clear all selected products */
function clearAllSelections() {
  selectedProducts = [];
  saveSelectedProducts();
  displaySelectedProducts();
}

/* Event listener for the "Clear All" button */
clearSelectionsButton.addEventListener("click", clearAllSelections);

/* Example: Add a product when a "Select" button is clicked */
document.addEventListener("DOMContentLoaded", () => {
  const selectButtons = document.querySelectorAll(".select-product-btn");
  selectButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const product = {
        name: button.dataset.name,
        brand: button.dataset.brand,
        category: button.dataset.category,
        description: button.dataset.description,
      };
      addProduct(product);
    });
  });

  // Load selected products from localStorage on page load
  loadSelectedProducts();
});
