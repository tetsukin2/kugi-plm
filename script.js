let originalData = {};
let modifiedData = {};
let currentApi = "api1";

const proxyUrl = "http://localhost:8080/proxy?url=";
const apiUrls = {
  api1:
    proxyUrl +
    encodeURIComponent(
      "https://imei-mrp-dev.topfuntek.com/kugi_plm/material_version_data/品豆-芝麻糊(測試)/"
    ),
  api2:
    proxyUrl +
    encodeURIComponent(
      "https://imei-mrp-dev.topfuntek.com/kugi_plm/material_version_data/topfuntest/"
    ),
};

async function fetchData() {
  const apiUrl = apiUrls[currentApi];
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    document.getElementById("product-title").innerText =
      data.data_title.product_name;
    populateTable(data.data_list);
    console.log("response from backend:", data);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function switchAPI() {
  const selectedApi = document.getElementById("api-selector").value;
  currentApi = selectedApi;
  fetchData();
}

function populateTable(data) {
  const tableBody = document.getElementById("data-table");
  const tableHeader = document.getElementById("table-header");
  tableBody.innerHTML = "";

  let versionSet = new Set();
  data.forEach((item) => versionSet.add(item[0]));
  const versions = Array.from(versionSet).sort();

  tableHeader.innerHTML =
    "<th>Material</th>" +
    versions.map((version) => `<th>${version}</th>`).join("");

  let materialMap = {};
  data.forEach((item) => {
    const [version, material, value] = item;
    if (!materialMap[material]) {
      materialMap[material] = {};
    }
    materialMap[material][version] = value;
  });

  Object.entries(materialMap).forEach(([material, values], index) => {
    originalData[index] = { material, ...values };
    const row = document.createElement("tr");
    row.innerHTML =
      `<td>${material}</td>` +
      versions
        .map(
          (version) => `
            <td contenteditable="true" onfocus="startEditing(this, ${index}, '${version}')"
                data-placeholder="${values[version] || "0"}">
                ${values[version] || "0"}
            </td>
        `
        )
        .join("");
    tableBody.appendChild(row);
  });
}

function startEditing(cell, index, field) {
  cell.classList.add("editing");
  const originalValue = originalData[index]?.[field] || "0";

  cell.onblur = function () {
    let newValue = cell.innerText.trim();

    if (newValue === "") {
      newValue = "0";
      cell.innerText = "0";
    }

    if (newValue !== originalValue) {
      if (!modifiedData[index]) {
        modifiedData[index] = { material: originalData[index].material };
      }
      modifiedData[index][field] = newValue;
      cell.classList.add("modified");
    } else {
      if (modifiedData[index]) {
        delete modifiedData[index][field];

        if (Object.keys(modifiedData[index]).length === 1) {
          delete modifiedData[index];
        }
      }
      cell.classList.remove("modified");
    }

    cell.classList.remove("editing");
  };
}

async function submitChanges() {
  if (Object.keys(modifiedData).length === 0) {
    alert("No changes made.");
    return;
  }

  let confirmationMessage = "Confirm the following changes:\n\n";
  let adjustList = [];

  for (let index in modifiedData) {
    confirmationMessage += `Material: ${modifiedData[index].material}\n`;

    let sortedKeys = Object.keys(modifiedData[index])
      .filter((key) => key !== "material")
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    sortedKeys.forEach((key) => {
      let oldValue = originalData[index][key] || "0";
      let newValue = modifiedData[index][key];
      confirmationMessage += `  ${key}: ${oldValue} → ${newValue}\n`;

      adjustList.push([key, modifiedData[index].material, newValue]);
    });

    confirmationMessage += "\n";
  }

  document.getElementById("modal-text").innerText = confirmationMessage;
  document.getElementById("confirmation-modal").style.display = "flex";

  const requestBody = {
    data_title: {
      product_name: document.getElementById("product-title").innerText,
    },
    adjust_list: adjustList,
  };

  console.log("Request data that will be sent:", requestBody);

  const confirmButton = document.getElementById("confirm-btn");
  confirmButton.removeEventListener("click", sendDataToBackend);
  confirmButton.addEventListener("click", sendDataToBackend);
}

async function sendDataToBackend() {
  try {
    const requestBody = {
      data_title: {
        product_name: document.getElementById("product-title").innerText,
      },
      adjust_list: Object.keys(modifiedData).flatMap((index) =>
        Object.keys(modifiedData[index])
          .filter((key) => key !== "material")
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
          .map((key) => [
            key,
            modifiedData[index].material,
            modifiedData[index][key],
          ])
      ),
    };

    console.log("Sending data to backend:", requestBody);

    const response = await fetch(
      proxyUrl +
        encodeURIComponent(
          "https://imei-mrp-dev.topfuntek.com/kugi_plm/material_version_adjust/"
        ),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const responseData = await response.json();
    console.log("Response from backend:", responseData);

    if (response.ok) {
      alert("Changes submitted successfully!");
      modifiedData = {};
      fetchData();
      document.getElementById("confirmation-modal").style.display = "none";
    } else {
      alert("Failed to submit changes. Please try again.");
    }
  } catch (error) {
    console.error("Error submitting data:", error);
    alert("An error occurred while submitting changes.");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("confirm-btn")
    .addEventListener("click", sendDataToBackend);
  document.getElementById("cancel-btn").addEventListener("click", function () {
    document.getElementById("confirmation-modal").style.display = "none";
  });
});

fetchData();
