/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

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
// Array to keep track of selected products (restored from localStorage if available)
let selectedProducts = [];
const SELECTED_PRODUCTS_KEY = "selectedProducts";

// Load selected products from localStorage
function loadSelectedProducts() {
  const saved = localStorage.getItem(SELECTED_PRODUCTS_KEY);
  if (saved) {
    try {
      selectedProducts = JSON.parse(saved);
    } catch {
      selectedProducts = [];
    }
  }
}

// Save selected products to localStorage
function saveSelectedProducts() {
  localStorage.setItem(SELECTED_PRODUCTS_KEY, JSON.stringify(selectedProducts));
}

// Display product cards and handle selection
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      // Check if product is selected
      const isSelected = selectedProducts.some((p) => p.name === product.name);
      return `
    <div class="product-card${
      isSelected ? " selected" : ""
    }" data-product-name="${product.name}" tabindex="0">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <div class="product-desc-overlay" aria-live="polite">
        <strong>Description</strong>
        ${
          product.description
            ? product.description
            : "No description available."
        }
      </div>
    </div>
  `;
    })
    .join("");

  // Add click event listeners to each product card
  const cards = document.querySelectorAll(".product-card");
  cards.forEach((card, idx) => {
    card.addEventListener("click", () => {
      const product = products[idx];
      const alreadySelected = selectedProducts.some(
        (p) => p.name === product.name
      );
      if (alreadySelected) {
        // Remove from selected
        selectedProducts = selectedProducts.filter(
          (p) => p.name !== product.name
        );
      } else {
        // Add to selected
        selectedProducts.push(product);
      }
      displayProducts(products); // Refresh grid highlight
      updateSelectedProductsList();
      saveSelectedProducts();
    });
  });
}

// Update the Selected Products section
function updateSelectedProductsList() {
  const selectedList = document.getElementById("selectedProductsList");
  if (!selectedProducts.length) {
    selectedList.innerHTML = `<div style="color:#888;">No products selected.</div>`;
    // Hide clear all button if present
    const clearBtn = document.getElementById("clearSelectedBtn");
    if (clearBtn) clearBtn.style.display = "none";
    return;
  }
  selectedList.innerHTML = selectedProducts
    .map(
      (product, idx) => `
      <div class="selected-product-item" data-index="${idx}" style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f5f5f5;border-radius:6px;">
        <img src="${product.image}" alt="${product.name}" style="width:36px;height:36px;object-fit:contain;border-radius:4px;">
        <span style="font-size:15px;">${product.name}</span>
        <button class="remove-selected-btn" title="Remove" style="margin-left:4px;background:none;border:none;color:#c00;font-size:18px;cursor:pointer;">&times;</button>
      </div>
    `
    )
    .join("");

  // Add event listeners to remove buttons
  const removeBtns = document.querySelectorAll(".remove-selected-btn");
  removeBtns.forEach((btn, idx) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      selectedProducts.splice(idx, 1);
      updateSelectedProductsList();
      saveSelectedProducts();
      // Also update grid highlight if visible
      const currentCategory = categoryFilter.value;
      if (currentCategory) {
        loadProducts().then((products) => {
          const filtered = products.filter(
            (p) => p.category === currentCategory
          );
          displayProducts(filtered);
        });
      }
    });
  });

  // Show clear all button if there are items
  let clearBtn = document.getElementById("clearSelectedBtn");
  if (!clearBtn) {
    clearBtn = document.createElement("button");
    clearBtn.id = "clearSelectedBtn";
    clearBtn.textContent = "Clear All";
    clearBtn.className = "generate-btn";
    clearBtn.style.background = "#c00";
    clearBtn.style.marginTop = "10px";
    clearBtn.style.fontSize = "16px";
    clearBtn.style.fontWeight = "400";
    clearBtn.style.width = "auto";
    clearBtn.style.display = "block";
    clearBtn.style.padding = "10px 20px";
    clearBtn.style.borderRadius = "6px";
    clearBtn.style.color = "#fff";
    clearBtn.style.cursor = "pointer";
    clearBtn.addEventListener("click", () => {
      selectedProducts = [];
      updateSelectedProductsList();
      saveSelectedProducts();
      // Also update grid highlight if visible
      const currentCategory = categoryFilter.value;
      if (currentCategory) {
        loadProducts().then((products) => {
          const filtered = products.filter(
            (p) => p.category === currentCategory
          );
          displayProducts(filtered);
        });
      }
    });
    selectedList.parentElement.appendChild(clearBtn);
  }
  clearBtn.style.display = "block";
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );
  displayProducts(filteredProducts);
});

// Initial call to show selected products (empty)
loadSelectedProducts();
updateSelectedProductsList();

// Store the full chat history for context
let chatHistory = [
  {
    role: "system",
    content:
      "You are a helpful beauty assistant. Create routines and answer questions about skincare, haircare, makeup, fragrance, and beauty routines. Use clear, friendly, and beginner-friendly language.",
  },
];

// Helper to render the chat history in the chat window
function renderChatHistory() {
  chatWindow.innerHTML = chatHistory
    .filter((msg) => msg.role !== "system")
    .filter(
      (msg) =>
        !(
          msg.role === "user" &&
          msg.content.startsWith("Here are my selected products as JSON:")
        )
    )
    .map((msg) => {
      if (msg.role === "user") {
        return `<div style='margin-bottom:10px;'><strong style='color:#0072ce;'>You:</strong> <span>${msg.content.replace(
          /\n/g,
          "<br>"
        )}</span></div>`;
      } else {
        return `<div style='margin-bottom:16px;'><strong style='color:#111;'>Marie:</strong> <span>${msg.content.replace(
          /\n/g,
          "<br>"
        )}</span></div>`;
      }
    })
    .join("");
  // Scroll to bottom after rendering
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

const generateBtn = document.getElementById("generateRoutine");
generateBtn.addEventListener("click", async () => {
  if (!selectedProducts.length) {
    chatWindow.innerHTML =
      "Please select at least one product to generate a routine.";
    return;
  }
  // Prepare product data for the AI
  const productData = selectedProducts.map((p) => ({
    name: p.name,
    brand: p.brand,
    category: p.category,
    description: p.description || "",
  }));

  // Show loading message before rendering chat history
  chatWindow.innerHTML = "<em>Creating your routine...</em>";

  chatHistory = chatHistory.slice(0, 1); // Keep only system message for new routine
  chatHistory.push({
    role: "user",
    content: `Here are my selected products as JSON: ${JSON.stringify(
      productData,
      null,
      2
    )}\nPlease build my routine.`,
  });
  try {
    const requestBody = {
      model: "gpt-4o",
      messages: chatHistory,
    };
    const response = await fetch(
      "https://odd-star-5a20.evan24207.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );
    const data = await response.json();
    const aiMessage = data.choices[0].message.content;
    chatHistory.push({ role: "assistant", content: aiMessage });
    renderChatHistory();
  } catch (error) {
    chatWindow.innerHTML =
      "Sorry, there was a problem generating your routine.";
  }
});

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById("userInput");
  const message = userInput.value.trim();
  if (!message) return;

  // Add user's message to chat history
  chatHistory.push({ role: "user", content: message });
  renderChatHistory();
  try {
    const requestBody = {
      model: "gpt-4o",
      messages: chatHistory,
    };
    const response = await fetch(
      "https://odd-star-5a20.evan24207.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );
    const data = await response.json();
    const aiMessage = data.choices[0].message.content;
    chatHistory.push({ role: "assistant", content: aiMessage });
    renderChatHistory();
  } catch (error) {
    chatWindow.innerHTML =
      "Sorry, there was a problem connecting to the assistant.";
  }
  userInput.value = "";
});

// On page load, render any chat history (if needed)
renderChatHistory();
