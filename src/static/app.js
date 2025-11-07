document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      // Clear loading message and reset select to avoid duplicate options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        const participants = Array.isArray(details.participants) ? details.participants : [];
        let participantsHTML = '<div class="participants-section">';
        participantsHTML += '<strong>Participants:</strong>';
        if (participants.length === 0) {
          participantsHTML += '<p class="no-participants">No participants yet</p>';
        } else {
          participantsHTML += '<div class="participants-list">';
          participants.forEach((p) => {
            participantsHTML += `
              <span class="participant-item" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(p)}">
                <span class="participant-email">${p}</span>
                <button class="delete-participant" title="Remove participant" aria-label="Remove participant">&times;</button>
              </span>
            `;
          });
          participantsHTML += '</div>';
        }
        participantsHTML += '</div>';
  // Delegate click for delete icons
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-participant")) {
      const participantItem = event.target.closest(".participant-item");
      if (!participantItem) return;
      const activity = decodeURIComponent(participantItem.getAttribute("data-activity"));
      const email = decodeURIComponent(participantItem.getAttribute("data-email"));
      if (!activity || !email) return;

      // Optionally confirm
      if (!confirm(`Remove ${email} from ${activity}?`)) return;

      try {
        const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
          method: "DELETE",
        });
        const result = await response.json();
        if (response.ok) {
          // Refresh activities list
          fetchActivities();
        } else {
          alert(result.detail || "Failed to remove participant.");
        }
      } catch (error) {
        alert("Error removing participant. Please try again.");
        console.error("Error removing participant:", error);
      }
    }
  });

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();


      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities list to show new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
