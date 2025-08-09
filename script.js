// Initialize socket.io client connection
const socket = io();

// Get references to HTML elements for UI manipulation
const joinScreen = document.getElementById("join-screen");
const chatScreen = document.getElementById("chat-screen");
const usernameInput = document.getElementById("username");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");
const chatContainer = document.getElementById("chat-container");
const imageInput = document.getElementById("imageInput");
const userList = document.getElementById("userList");
const emojiPicker = document.getElementById("emojiPicker");

// Store current logged-in username
let currentUser = "";

// List of emojis to display in the emoji picker
const emojis = ["😊", "😂", "😍", "👍", "🎉", "❤️", "😢", "😡", "🔥", "😎"];

// Dynamically create emoji buttons in the emoji picker
emojis.forEach(e => {
  const emojiBtn = document.createElement("span");
  emojiBtn.classList.add("emoji"); // Add styling class
  emojiBtn.textContent = e;        // Set emoji character as text
  // When clicked, append emoji to message input and hide picker
  emojiBtn.onclick = () => {
    messageInput.value += e;
    messageInput.focus();
    toggleEmojiPicker();
  };
  emojiPicker.appendChild(emojiBtn);
});

// Function to toggle emoji picker visibility
function toggleEmojiPicker() {
  emojiPicker.classList.toggle("hidden");
}

// Function to handle user joining the chat
function joinChat() {
  const name = usernameInput.value.trim(); // Get trimmed username input
  if (name) {
    currentUser = name;          // Set current user
    socket.emit("join", name);   // Notify server about new user joining
    joinScreen.classList.add("hidden");    // Hide join screen
    chatScreen.classList.remove("hidden"); // Show chat screen
    messageInput.focus();        // Focus on message input for typing
  } else {
    alert("Please enter your name"); // Alert if username is empty
  }
}

// Handle message form submission
messageForm.addEventListener("submit", (e) => {
  e.preventDefault(); // Prevent form default submission (page reload)

  const text = messageInput.value.trim(); // Get message text

  // If text exists, emit message event to server
  if (text) {
    socket.emit("message", { user: currentUser, text });
    messageInput.value = ""; // Clear input after sending
  }

  // If image file selected, read and send it
  if (imageInput.files.length > 0) {
    const file = imageInput.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      // Emit image data as base64 string to server
      socket.emit("image", { user: currentUser, image: reader.result });
      imageInput.value = ""; // Clear file input
    };

    // Read selected file as data URL (base64)
    reader.readAsDataURL(file);
  }
});

// Function to display a chat message in the chat container
function showMessage({ user, text, image, time, self, ticks }) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");
  // Add different styles depending on whether message is from self or others
  msgDiv.classList.add(self ? "my-message" : "other-message");

  // Show sender name only for other users' messages
  if (!self) {
    const nameDiv = document.createElement("div");
    nameDiv.className = "name";
    nameDiv.textContent = user;
    msgDiv.appendChild(nameDiv);
  }

  // Display message text if available
  if (text) {
    const textDiv = document.createElement("div");
    textDiv.textContent = text;
    msgDiv.appendChild(textDiv);
  }

  // Display image if available
  if (image) {
    const img = document.createElement("img");
    img.src = image;
    msgDiv.appendChild(img);
  }

  // Metadata container for timestamp and ticks (delivery/read indicators)
  const metaDiv = document.createElement("div");
  metaDiv.className = "meta";

  // Show message sent time
  const timeSpan = document.createElement("span");
  timeSpan.className = "time";
  timeSpan.textContent = time;

  // Show single or double ticks for self messages based on delivery/read status
  const ticksSpan = document.createElement("span");
  ticksSpan.className = "ticks";
  ticksSpan.textContent = self ? (ticks ? "✓✓" : "✓") : "";

  // Append time and ticks to metadata
  metaDiv.appendChild(timeSpan);
  metaDiv.appendChild(ticksSpan);

  // Append metadata to message container
  msgDiv.appendChild(metaDiv);

  // Add message to chat container
  chatContainer.appendChild(msgDiv);
  // Auto-scroll chat to the bottom when new message arrives
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to display alert messages (like user join/leave notifications)
function showAlert(text) {
  const alertDiv = document.createElement("div");
  alertDiv.className = "alert";
  alertDiv.textContent = text;
  chatContainer.appendChild(alertDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Update the list of online users when server sends user list
socket.on("userList", (users) => {
  userList.innerHTML = ""; // Clear existing list
  users.forEach(u => {
    const li = document.createElement("li");
    // Add a colored dot and username for each online user
    li.innerHTML = `<span class="user-dot"></span>${u}`;
    userList.appendChild(li);
  });
});

// Show alert when a user joins the chat
socket.on("join", (user) => {
  showAlert(`${user} joined the chat.`);
});

// Show alert when a user leaves the chat
socket.on("leave", (user) => {
  showAlert(`${user} left the chat.`);
});

// Display incoming text messages
socket.on("message", (msg) => {
  showMessage({
    ...msg,
    self: msg.user === currentUser, // Mark messages from self
    ticks: true                     // Mark messages as delivered (ticks)
  });
});

// Display incoming image messages
socket.on("image", (data) => {
  showMessage({
    ...data,
    self: data.user === currentUser,
    ticks: true
  });
});

// When connecting, display chat history received from server
socket.on("messageHistory", (history) => {
  history.forEach(msg => {
    showMessage({
      ...msg,
      self: msg.user === currentUser,
      ticks: true
    });
  });
});
