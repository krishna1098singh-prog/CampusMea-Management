
const STORAGE = {
  meals: "lpu_campusbite_meals",
  bookings: "lpu_campusbite_bookings",
  student: "lpu_campusbite_student"
};

const defaultMeals = [
  { id: 1, name: "Aloo Paratha", category: "Breakfast", price: 35, time: "7:30 AM - 10:00 AM", description: "Fresh parathas served with curd and pickle.", emoji: "🫓" },
  { id: 2, name: "Masala Dosa", category: "Breakfast", price: 45, time: "7:30 AM - 10:00 AM", description: "Crispy dosa with potato masala and chutney.", emoji: "🥞" },
  { id: 3, name: "Rajma Rice", category: "Lunch", price: 60, time: "12:00 PM - 2:30 PM", description: "Homestyle rajma served with steamed rice.", emoji: "🍛" },
  { id: 4, name: "Paneer Thali", category: "Lunch", price: 85, time: "12:00 PM - 2:30 PM", description: "Complete meal with paneer, dal, roti and rice.", emoji: "🍱" },
  { id: 5, name: "Veg Sandwich", category: "Snacks", price: 40, time: "4:00 PM - 6:00 PM", description: "Grilled sandwich with fresh vegetables.", emoji: "🥪" },
  { id: 6, name: "Chole Bhature", category: "Snacks", price: 55, time: "4:00 PM - 6:00 PM", description: "Popular North Indian snack with chole.", emoji: "🫓" },
  { id: 7, name: "Dal Makhani Meal", category: "Dinner", price: 75, time: "7:00 PM - 9:30 PM", description: "Dal makhani served with roti and rice.", emoji: "🍲" },
  { id: 8, name: "Veg Pulao", category: "Dinner", price: 65, time: "7:00 PM - 9:30 PM", description: "Aromatic vegetable pulao with raita.", emoji: "🍚" }
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

let meals = readStorage(STORAGE.meals, defaultMeals);
let bookings = readStorage(STORAGE.bookings, []);
let student = readStorage(STORAGE.student, {
  name: "Student",
  regNo: "Not provided"
});

let currentRole = "student";
let activeCategory = "all";
let lastGeneratedToken = "";

function saveData() {
  localStorage.setItem(STORAGE.meals, JSON.stringify(meals));
  localStorage.setItem(STORAGE.bookings, JSON.stringify(bookings));
  localStorage.setItem(STORAGE.student, JSON.stringify(student));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function money(amount) {
  return "₹" + Number(amount).toFixed(0);
}

function todayString() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function displayDate(value) {
  if (!value) return "—";
  return new Date(value + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

function statusBadge(status) {
  const className = String(status).toLowerCase();
  return `<span class="status ${className}">${escapeHTML(status)}</span>`;
}

function showEmpty(message, columns) {
  return `<tr><td colspan="${columns}" class="empty-state">${escapeHTML(message)}</td></tr>`;
}

// NAVIGATION

const pageTitles = {
  dashboard: "Dashboard",
  menu: "Explore Meals",
  bookings: "My Bookings",
  admin: "Admin Dashboard",
  manage: "Manage Meals"
};

function navigate(page) {
  if (page === "admin" || page === "manage") {
    if (currentRole !== "admin") {
      showToast("Switch to Admin view to access this section.", "error");
      return;
    }
  }

  document.querySelectorAll(".page").forEach(section => {
    section.classList.toggle("active", section.id === page);
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  document.getElementById("pageTitle").textContent = pageTitles[page];
  document.getElementById("breadcrumbPage").textContent = pageTitles[page].toUpperCase();

  document.getElementById("sidebar").classList.remove("open");

  renderAll();
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => navigate(button.dataset.go));
});

document.getElementById("mobileMenu").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// ROLE SWITCH

function updateRole() {
  const isAdmin = currentRole === "admin";

  document.querySelectorAll(".admin-only").forEach(item => {
    item.style.display = isAdmin ? "flex" : "none";
  });

  document.getElementById("profileName").textContent =
    isAdmin ? "Campus Admin" : student.name;

  document.getElementById("profileRole").textContent =
    isAdmin ? "Administrator (Demo)" : "LPU Student";

  document.getElementById("profileAvatar").textContent =
    isAdmin ? "A" : (student.name.charAt(0).toUpperCase() || "S");

  if (!isAdmin && ["admin", "manage"].includes(
    document.querySelector(".page.active")?.id
  )) {
    navigate("dashboard");
  }
}

document.getElementById("roleSelect").addEventListener("change", event => {
  currentRole = event.target.value;
  updateRole();

  if (currentRole === "admin") {
    navigate("admin");
  } else {
    navigate("dashboard");
  }

  showToast(currentRole === "admin" ? "Admin demo view enabled." : "Student view enabled.");
});

// MEAL CARDS

function mealCard(meal) {
  return `
    <article class="meal-card">
      <div class="meal-visual">
        <span class="meal-category">${escapeHTML(meal.category)}</span>
        ${escapeHTML(meal.emoji || "🍽")}
      </div>
      <div class="meal-content">
        <h3>${escapeHTML(meal.name)}</h3>
        <p>${escapeHTML(meal.description || "Freshly prepared campus meal.")}</p>
        <div class="meal-meta">◷ ${escapeHTML(meal.time)}</div>
        <div class="meal-bottom">
          <div class="meal-price">${money(meal.price)} <small>/ meal</small></div>
          <button class="book-btn" data-book="${meal.id}">Book token +</button>
        </div>
      </div>
    </article>
  `;
}

function renderDashboardMeals() {
  const available = meals.slice(0, 3);
  document.getElementById("dashboardMeals").innerHTML = available.length
    ? available.map(mealCard).join("")
    : `<div class="empty-state">No meals available right now.</div>`;
}

function renderMenu() {
  const search = document.getElementById("mealSearch").value.toLowerCase();
  const category = document.getElementById("mealCategory").value;

  const filtered = meals.filter(meal => {
    const matchesSearch =
      meal.name.toLowerCase().includes(search) ||
      meal.description.toLowerCase().includes(search);

    const matchesCategory = category === "all" || meal.category === category;
    const matchesTab = activeCategory === "all" || meal.category === activeCategory;

    return matchesSearch && matchesCategory && matchesTab;
  });

  document.getElementById("allMeals").innerHTML = filtered.length
    ? filtered.map(mealCard).join("")
    : `<div class="empty-state">No meals found. Try another search or category.</div>`;
}

document.getElementById("mealSearch").addEventListener("input", renderMenu);
document.getElementById("mealCategory").addEventListener("change", renderMenu);

document.getElementById("categoryTabs").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  activeCategory = button.dataset.category;

  document.querySelectorAll(".category-tab").forEach(tab => {
    tab.classList.toggle("active", tab === button);
  });

  renderMenu();
});

// BOOKING MODAL

function openBooking(mealId) {
  const meal = meals.find(item => item.id === Number(mealId));
  if (!meal) return;

  document.getElementById("selectedMealId").value = meal.id;
  document.getElementById("selectedMealDetails").innerHTML = `
    <span>${escapeHTML(meal.emoji)} ${escapeHTML(meal.name)}</span>
    <strong>${money(meal.price)}</strong>
  `;

  document.getElementById("studentName").value =
    student.name === "Student" ? "" : student.name;

  document.getElementById("studentId").value =
    student.regNo === "Not provided" ? "" : student.regNo;

  const dateInput = document.getElementById("bookingDate");
  dateInput.min = todayString();
  dateInput.value = todayString();

  document.getElementById("bookingModal").classList.add("show");
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-book]");
  if (button) openBooking(button.dataset.book);
});

document.getElementById("closeBookingModal").addEventListener("click", () => {
  document.getElementById("bookingModal").classList.remove("show");
});

document.getElementById("bookingModal").addEventListener("click", event => {
  if (event.target.id === "bookingModal") {
    event.currentTarget.classList.remove("show");
  }
});

function createTokenId() {
  return "LPU-" + Date.now().toString().slice(-8);
}

document.getElementById("bookingForm").addEventListener("submit", event => {
  event.preventDefault();

  const mealId = Number(document.getElementById("selectedMealId").value);
  const meal = meals.find(item => item.id === mealId);
  const name = document.getElementById("studentName").value.trim();
  const regNo = document.getElementById("studentId").value.trim();
  const date = document.getElementById("bookingDate").value;

  if (!meal) {
    showToast("Selected meal is no longer available.", "error");
    return;
  }

  if (name.length < 2 || regNo.length < 3) {
    showToast("Please enter valid student details.", "error");
    return;
  }

  if (!date || date < todayString()) {
    showToast("Please choose a valid meal date.", "error");
    return;
  }

  const duplicate = bookings.some(booking =>
    booking.regNo.toLowerCase() === regNo.toLowerCase() &&
    booking.mealId === mealId &&
    booking.date === date &&
    !["Cancelled", "Rejected"].includes(booking.status)
  );

  if (duplicate) {
    showToast("You already have a booking for this meal and date.", "error");
    return;
  }

  student = { name, regNo };

  const booking = {
    id: createTokenId(),
    mealId: meal.id,
    mealName: meal.name,
    category: meal.category,
    emoji: meal.emoji,
    price: Number(meal.price),
    studentName: name,
    regNo,
    date,
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  bookings.unshift(booking);
  lastGeneratedToken = booking.id;
  saveData();

  document.getElementById("bookingModal").classList.remove("show");
  document.getElementById("bookingForm").reset();

  document.getElementById("generatedToken").textContent = booking.id;
  document.getElementById("successModal").classList.add("show");

  updateRole();
  renderAll();
});

document.getElementById("closeSuccessModal").addEventListener("click", () => {
  document.getElementById("successModal").classList.remove("show");
});

document.getElementById("viewMyBookings").addEventListener("click", () => {
  document.getElementById("successModal").classList.remove("show");
  navigate("bookings");
});

// STUDENT BOOKINGS

function getMyBookings() {
  return bookings.filter(booking =>
    booking.regNo.toLowerCase() === student.regNo.toLowerCase()
  );
}

function renderStudentBookings() {
  const mine = getMyBookings();
  const filter = document.getElementById("bookingFilter").value;

  const approved = mine.filter(b => b.status === "Approved").length;
  const completed = mine.filter(b => b.status === "Completed").length;

  document.getElementById("bookingCount").textContent = mine.length;
  document.getElementById("bookingApproved").textContent = approved;
  document.getElementById("bookingCompleted").textContent = completed;

  const filtered = mine.filter(b => filter === "all" || b.status === filter);

  document.getElementById("myBookings").innerHTML = filtered.length
    ? filtered.map(booking => `
      <tr>
        <td class="token-text">${escapeHTML(booking.id)}</td>
        <td>${escapeHTML(booking.mealName)}</td>
        <td>${escapeHTML(booking.category)}</td>
        <td>${displayDate(booking.date)}</td>
        <td>${money(booking.price)}</td>
        <td>${statusBadge(booking.status)}</td>
        <td>
          ${booking.status === "Pending" || booking.status === "Approved"
            ? `<button class="small-action delete" data-cancel="${escapeHTML(booking.id)}">Cancel</button>`
            : "—"}
        </td>
      </tr>
    `).join("")
    : showEmpty("No bookings found. Explore the menu to reserve a meal.", 7);

  const recent = mine.slice(0, 4);

  document.getElementById("recentBookings").innerHTML = recent.length
    ? recent.map(booking => `
      <tr>
        <td class="token-text">${escapeHTML(booking.id)}</td>
        <td>${escapeHTML(booking.mealName)}</td>
        <td>${displayDate(booking.date)}</td>
        <td>${money(booking.price)}</td>
        <td>${statusBadge(booking.status)}</td>
      </tr>
    `).join("")
    : showEmpty("You have not booked any meals yet.", 5);

  document.getElementById("studentTotal").textContent = mine.length;
  document.getElementById("studentApproved").textContent = approved;
  document.getElementById("studentPending").textContent =
    mine.filter(b => b.status === "Pending").length;
  document.getElementById("studentCompleted").textContent = completed;
}

document.getElementById("bookingFilter").addEventListener("change", renderStudentBookings);

document.getElementById("myBookings").addEventListener("click", event => {
  const button = event.target.closest("[data-cancel]");
  if (!button) return;

  const booking = bookings.find(b => b.id === button.dataset.cancel);
  if (!booking || !["Pending", "Approved"].includes(booking.status)) return;

  if (!confirm("Are you sure you want to cancel this booking?")) return;

  booking.status = "Cancelled";
  saveData();
  renderAll();
  showToast("Booking cancelled successfully.");
});

// ADMIN DASHBOARD

function renderAdmin() {
  document.getElementById("adminTotal").textContent = bookings.length;
  document.getElementById("adminPending").textContent =
    bookings.filter(b => b.status === "Pending").length;
  document.getElementById("adminApproved").textContent =
    bookings.filter(b => b.status === "Approved").length;
  document.getElementById("adminMeals").textContent = meals.length;

  const search = document.getElementById("adminSearch").value.toLowerCase();
  const filter = document.getElementById("adminStatusFilter").value;

  const filtered = bookings.filter(booking => {
    const matchesSearch =
      booking.id.toLowerCase().includes(search) ||
      booking.studentName.toLowerCase().includes(search) ||
      booking.regNo.toLowerCase().includes(search);

    return matchesSearch && (filter === "all" || booking.status === filter);
  });

  document.getElementById("adminBookings").innerHTML = filtered.length
    ? filtered.map(booking => `
      <tr>
        <td class="token-text">${escapeHTML(booking.id)}</td>
        <td>
          <strong>${escapeHTML(booking.studentName)}</strong><br>
          <small>${escapeHTML(booking.regNo)}</small>
        </td>
        <td>${escapeHTML(booking.mealName)}</td>
        <td>${displayDate(booking.date)}</td>
        <td>${money(booking.price)}</td>
        <td>${statusBadge(booking.status)}</td>
        <td>
          <select class="status-select" data-status="${escapeHTML(booking.id)}">
            ${["Pending", "Approved", "Completed", "Rejected", "Cancelled"].map(status =>
              `<option value="${status}" ${booking.status === status ? "selected" : ""}>${status}</option>`
            ).join("")}
          </select>
        </td>
      </tr>
    `).join("")
    : showEmpty("No bookings match your search.", 7);
}

document.getElementById("adminSearch").addEventListener("input", renderAdmin);
document.getElementById("adminStatusFilter").addEventListener("change", renderAdmin);

document.getElementById("adminBookings").addEventListener("change", event => {
  const select = event.target.closest("[data-status]");
  if (!select) return;

  const booking = bookings.find(b => b.id === select.dataset.status);
  if (!booking) return;

  booking.status = select.value;
  saveData();
  renderAll();
  showToast("Booking status updated.");
});

// MEAL MANAGEMENT

function renderManageMeals() {
  document.getElementById("manageMealCount").textContent = `${meals.length} meals`;

  document.getElementById("manageMealList").innerHTML = meals.length
    ? meals.map(meal => `
      <div class="manage-meal-item">
        <div class="manage-meal-emoji">${escapeHTML(meal.emoji || "🍽")}</div>
        <div class="manage-meal-info">
          <strong>${escapeHTML(meal.name)}</strong>
          <small>${escapeHTML(meal.category)} · ${money(meal.price)} · ${escapeHTML(meal.time)}</small>
        </div>
        <div class="manage-actions">
          <button class="small-action" data-edit="${meal.id}">Edit</button>
          <button class="small-action delete" data-delete="${meal.id}">Delete</button>
        </div>
      </div>
    `).join("")
    : `<div class="empty-state">No meals added yet.</div>`;
}

function clearMealForm() {
  document.getElementById("mealForm").reset();
  document.getElementById("editMealId").value = "";
  document.getElementById("mealFormTitle").textContent = "Add a new meal";
  document.getElementById("mealSubmitBtn").textContent = "Add meal";
}

document.getElementById("cancelEdit").addEventListener("click", clearMealForm);

document.getElementById("mealForm").addEventListener("submit", event => {
  event.preventDefault();

  const editId = Number(document.getElementById("editMealId").value);
  const name = document.getElementById("mealName").value.trim();
  const category = document.getElementById("newMealCategory").value;
  const price = Number(document.getElementById("mealPrice").value);
  const time = document.getElementById("mealTime").value.trim();
  const description = document.getElementById("mealDescription").value.trim();
  const emoji = document.getElementById("mealEmoji").value.trim() || "🍽";

  if (!name || !category || !time || !Number.isFinite(price) || price <= 0) {
    showToast("Please enter valid meal details.", "error");
    return;
  }

  if (editId) {
    const meal = meals.find(item => item.id === editId);
    if (!meal) return;

    Object.assign(meal, { name, category, price, time, description, emoji });

    // Update snapshots only for future display consistency.
    showToast("Meal updated successfully.");
  } else {
    meals.push({
      id: Date.now(),
      name,
      category,
      price,
      time,
      description,
      emoji
    });

    showToast("New meal added successfully.");
  }

  saveData();
  clearMealForm();
  renderAll();
});

document.getElementById("manageMealList").addEventListener("click", event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");

  if (editButton) {
    const meal = meals.find(item => item.id === Number(editButton.dataset.edit));
    if (!meal) return;

    document.getElementById("editMealId").value = meal.id;
    document.getElementById("mealName").value = meal.name;
    document.getElementById("newMealCategory").value = meal.category;
    document.getElementById("mealPrice").value = meal.price;
    document.getElementById("mealTime").value = meal.time;
    document.getElementById("mealDescription").value = meal.description;
    document.getElementById("mealEmoji").value = meal.emoji;

    document.getElementById("mealFormTitle").textContent = "Edit meal";
    document.getElementById("mealSubmitBtn").textContent = "Save changes";

    document.getElementById("mealForm").scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  if (deleteButton) {
    const id = Number(deleteButton.dataset.delete);

    if (!confirm("Delete this meal from the menu?")) return;

    meals = meals.filter(item => item.id !== id);
    saveData();
    renderAll();
    showToast("Meal deleted successfully.");
  }
});

// RENDER ALL

function renderAll() {
  renderDashboardMeals();
  renderMenu();
  renderStudentBookings();
  renderAdmin();
  renderManageMeals();
}

// INITIALIZATION

function initialize() {
  document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });

  document.getElementById("menuDate").textContent =
    new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

  document.getElementById("bookingDate").min = todayString();

  saveData();
  updateRole();
  renderAll();
}

initialize();
