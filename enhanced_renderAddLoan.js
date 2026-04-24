// This file contains the enhanced renderAddLoan function that supports edit mode
// It should replace the existing renderAddLoan function in js/ui.js

async renderAddLoan(param = null) {
    let editLoan = null;
    let preSelectedBorrowerId = null;
    
    // Try to determine if param is a loan ID (edit mode) or borrower ID (create mode)
    if (param) {
      // First, try to load as a loan (edit mode)
      editLoan = await window.db.get("loans", param);
      if (!editLoan) {
        // If not found, treat as borrowerId (create mode)
        preSelectedBorrowerId = param;
      }
    }

    // Set title based on mode
    const isEditMode = !!editLoan;
    this.setTitle(isEditMode ? "Edit Loan" : "Create New Loan");
    this.hideFab();

    const borrowers = await window.db.getAll("borrowers");

    const borrowerOptions = borrowers
      .map((b) => {
        const selected = isEditMode 
          ? b.id === editLoan.borrowerId 
          : b.id === preSelectedBorrowerId;
        return `<option value="${b.id}" ${selected ? "selected" : ""}>${b.name} (${b.mobile})</option>`;
      })
      .join("");

    this.container.innerHTML = `
<div class="card">
  <form id="add-loan-form">
    <div class="form-group">
      <label>Select Customer</label>
      <select class="form-control" name="borrowerId" required ${isEditMode ? "disabled" : ""}>
        <option value="">-- Select Customer --</option>
        ${borrowerOptions}
      </select>
    </div>

    <div class="form-group">
      <label style="margin-bottom:0.75rem; display:block;">Collection Frequency</label>
      <div style="display:flex; gap:1.5rem;">
        <label style="display:flex; align-items:center; gap:0.5rem; font-weight:400; color:var(--text-main); cursor:pointer;">
          <input type="radio" name="frequency" value="Daily" ${(!isEditMode || editLoan.frequency === "Daily") ? "checked" : ""}> Daily
        </label>
        <label style="display:flex; align-items:center; gap:0.5rem; font-weight:400; color:var(--text-main); cursor:pointer;">
          <input type="radio" name="frequency" value="Weekly" ${isEditMode && editLoan.frequency === "Weekly" ? "checked" : ""}> Weekly
        </label>
        <label style="display:flex; align-items:center; gap:0.5rem; font-weight:400; color:var(--text-main); cursor:pointer;">
          <input type="radio" name="frequency" value="Monthly" ${isEditMode && editLoan.frequency === "Monthly" ? "checked" : ""}> Monthly
        </label>
      </div>
    </div>

    <div class="form-group">
      <label>Loan Amount (Principal)</label>
      <input type="number" class="form-control" name="principal" id="input-principal" value="${isEditMode ? editLoan.principalAmount : ""}" required>
    </div>

    <div class="form-group">
      <label>Interest (Total Amount)</label>
      <input type="number" class="form-control" name="interest" id="input-interest" placeholder="e.g. 2000" value="${isEditMode ? editLoan.interestAmount : ""}">
    </div>

    <div class="grid-2">
      <div class="form-group">
        <label>Installments (Count)</label>
        <input type="number" class="form-control" name="installments" id="input-installments" value="${isEditMode ? editLoan.installmentsCount : "100"}">
      </div>
      <div class="form-group">
        <label>Loan Per Installment</label>
        <input type="number" class="form-control" name="installmentAmount" id="input-per-installment" value="${isEditMode ? editLoan.installmentAmount : ""}" readonly style="background:#f8fafc;">
      </div>
    </div>

    <div class="grid-2">
      <div class="form-group">
        <label>Start Date</label>
        <input type="date" class="form-control" name="startDate" id="input-start-date" value="${isEditMode ? editLoan.startDate : new Date().toISOString().split("T")[0]}" required>
      </div>
      <div class="form-group">
        <label>End Date</label>
        <input type="date" class="form-control" name="endDate" id="input-end-date" value="${isEditMode ? editLoan.endDate : ""}" readonly style="background:#f8fafc;">
      </div>
    </div>

    <div class="form-group">
      <label>Amount Disbursed</label>
      <input type="number" class="form-control" name="disbursed" id="input-disbursed" value="${isEditMode ? editLoan.disbursedAmount : ""}">
    </div>

    <div class="form-group">
      <label>If Already Paid Amount</label>
      <input type="number" class="form-control" name="alreadyPaid" value="${isEditMode ? editLoan.paidAmount : "0"}">
    </div>

    <button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding: 1rem; margin-top:1rem; font-size:1rem; border-radius: 30px;">
      ${isEditMode ? "UPDATE LOAN" : "APPROVE"}
    </button>
  </form>
</div>
`;

    const form = document.getElementById("add-loan-form");
    const pInput = document.getElementById("input-principal");
    const iInput = document.getElementById("input-interest");
    const nInput = document.getElementById("input-installments");
    const perInput = document.getElementById("input-per-installment");
    const dateInput = document.getElementById("input-start-date");
    const endInput = document.getElementById("input-end-date");
    const disInput = document.getElementById("input-disbursed");

    const calculate = () => {
      const p = parseFloat(pInput.value) || 0;
      const i = parseFloat(iInput.value) || 0;
      const n = parseFloat(nInput.value) || 1;
      const total = p + i;
      const per = total / n;
      perInput.value = Math.ceil(per);
      if (!disInput.value) disInput.value = p;

      if (dateInput.value) {
        const start = new Date(dateInput.value);
        const freq = form.querySelector('input[name="frequency"]:checked').value;
        let daysToAdd = n;
        if (freq === "Weekly") daysToAdd = n * 7;
        if (freq === "Monthly") daysToAdd = n * 30;
        start.setDate(start.getDate() + daysToAdd);
        endInput.value = start.toISOString().split("T")[0];
      }
    };

    [pInput, iInput, nInput, dateInput].forEach((el) =>
      el.addEventListener("input", calculate)
    );

    form.querySelectorAll('input[name="frequency"]').forEach((el) =>
      el.addEventListener("change", calculate)
    );

    form.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      if (isEditMode) {
        // Update existing loan
        const updatedLoan = {
          ...editLoan,
          frequency: data.frequency,
          principalAmount: data.principal,
          interestAmount: data.interest,
          totalAmount: (parseFloat(data.principal) + parseFloat(data.interest)).toString(),
          installmentsCount: data.installments,
          installmentAmount: data.installmentAmount,
          startDate: data.startDate,
          endDate: data.endDate,
          disbursedAmount: data.disbursed,
          paidAmount: data.alreadyPaid || 0,
          updatedAt: new Date().toISOString(),
        };

        await window.db.add("loans", updatedLoan);

        Swal.fire({
          icon: "success",
          title: "Loan Updated!",
          text: "Loan details updated successfully.",
          timer: 1500,
          showConfirmButton: false,
        });

        window.app.navigate("loan-detail", editLoan.id);
      } else {
        // Create new loan
        const loan = {
          id: crypto.randomUUID(),
          borrowerId: data.borrowerId,
          loanNo: Math.floor(1000 + Math.random() * 9000).toString(),
          frequency: data.frequency,
          principalAmount: data.principal,
          interestAmount: data.interest,
          totalAmount: (parseFloat(data.principal) + parseFloat(data.interest)).toString(),
          installmentsCount: data.installments,
          installmentAmount: data.installmentAmount,
          startDate: data.startDate,
          endDate: data.endDate,
          disbursedAmount: data.disbursed,
          paidAmount: data.alreadyPaid || 0,
          status: "active",
          createdAt: new Date().toISOString(),
        };

        await window.db.add("loans", loan);

        Swal.fire({
          icon: "success",
          title: "Loan Approved!",
          text: "New loan created successfully.",
          timer: 1500,
          showConfirmButton: false,
        });

        window.app.navigate("borrower-detail", data.borrowerId);
      }
    };

    // Trigger calculation if in edit mode
    if (isEditMode) {
      calculate();
    }
  }
