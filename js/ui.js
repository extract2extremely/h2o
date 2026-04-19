class UI {
  constructor() {
    this.container = document.getElementById("view-container");

    this.pageTitle = document.getElementById("current-page-title");

    this.fab = document.getElementById("fab-add");
  }
  clear() {
    this.container.innerHTML = "";
  }
  setTitle(title) {
    this.pageTitle.innerText = title;
  }
  showFab(action) {
    this.fab.style.display = "flex";

    this.fab.onclick = action;
  }
  hideFab() {
    this.fab.style.display = "none";

    this.fab.onclick = null;
  }

  async renderDashboard() {
    this.setTitle("Dashboard");

    this.hideFab();

    const borrowers = await window.db.getAll("borrowers");

    const loans = await window.db.getAll("loans");

    const txns = await window.db.getAll("transactions");

    const today = new Date().toISOString().split("T")[0];

    const now = new Date();

    const activeLoans = loans.filter((l) => l.status === "active");

    const closedLoans = loans.filter((l) => l.status !== "active");

    const totalLent = loans.reduce(
      (s, l) => s + parseFloat(l.totalAmount || 0),
      0,
    );

    const totalCollected = loans.reduce(
      (s, l) => s + parseFloat(l.paidAmount || 0),
      0,
    );

    const totalOutstanding = Math.max(0, totalLent - totalCollected);

    const recoveryPct =
      totalLent > 0
        ? Math.min(100, Math.round((totalCollected / totalLent) * 100))
        : 0;

    this._dashboardData = { borrowers, loans, txns, activeLoans };
    this._collectionState = { date: today, search: "", filter: "all" };

    const overdueItems = [];

    activeLoans.forEach((l) => {
      if (!l.schedule) return;

      l.schedule.forEach((s) => {
        if (s.dueDate < today && s.status !== "PAID") {
          const b = borrowers.find((b) => b.id === l.borrowerId);

          overdueItems.push({ loan: l, schedule: s, borrower: b });
        }
      });
    });

    overdueItems.sort((a, b) =>
      a.schedule.dueDate.localeCompare(b.schedule.dueDate),
    );

    const borrowerStats = borrowers
      .map((b) => {
        const bLoans = loans.filter((l) => l.borrowerId === b.id);

        const lent = bLoans.reduce(
          (s, l) => s + parseFloat(l.totalAmount || 0),
          0,
        );

        const paid = bLoans.reduce(
          (s, l) => s + parseFloat(l.paidAmount || 0),
          0,
        );

        return {
          b,
          lent,
          paid,
          outstanding: Math.max(0, lent - paid),
          activeCount: bLoans.filter((l) => l.status === "active").length,
        };
      })
      .filter((x) => x.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 5);

    const recentTxns = [...txns]
      .sort(
        (a, b) =>
          new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date),
      )
      .slice(0, 5);

    const hour = now.getHours();

    const greeting =
      hour < 12
        ? "Good Morning"
        : hour < 17
          ? "Good Afternoon"
          : "Good Evening";

    const dayStr = now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const ring = (pct, color, size = 64, stroke = 6) => {
      const r = (size - stroke) / 2;

      const circ = 2 * Math.PI * r;

      const dash = (pct / 100) * circ;

      return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)">



<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#f1f5f9" stroke-width="${stroke}"/>



<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"




stroke-dasharray="${dash} ${circ}" stroke-linecap="round"/>


</svg>`;
    };

    this.container.innerHTML = `

<!-- ── Greeting Banner ── -->

<div style="background:linear-gradient(135deg, var(--primary-color) 0%, #7c3aed 100%); border-radius:20px; padding:1.25rem 1.5rem; margin-bottom:1.25rem; color:white; position:relative; overflow:hidden;">


<div style="position:absolute; top:-20px; right:-20px; width:100px; height:100px; background:rgba(255,255,255,0.08); border-radius:50%;"></div>


<div style="position:absolute; bottom:-30px; right:40px; width:70px; height:70px; background:rgba(255,255,255,0.06); border-radius:50%;"></div>


<div style="font-size:0.8rem; opacity:0.8; margin-bottom:0.2rem;">${dayStr}</div>


<div style="font-size:1.3rem; font-weight:700;">${greeting} 👋</div>


<div style="font-size:0.82rem; opacity:0.75; margin-top:0.3rem;">${borrowers.length} borrowers · ${activeLoans.length} active loans · ${overdueItems.length > 0 ? `<span style="color:#fca5a5;">${overdueItems.length} overdue</span>` : "no overdue"}</div>

</div>

<!-- ── KPI Cards ── -->

<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:0.75rem;">


<div style="background:white; border-radius:16px; padding:1rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #f1f5f9;">



<div style="display:flex; justify-content:space-between; align-items:flex-start;">




<div>





<div style="font-size:0.68rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Total Lent</div>





<div style="font-size:1.3rem; font-weight:800; color:var(--text-main); margin-top:0.2rem;"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:0.9em; margin-right:4px; vertical-align:middle;"></i>${(totalLent / 1000).toFixed(1)}K</div>





<div style="font-size:0.72rem; color:#94a3b8; margin-top:0.2rem;">${loans.length} loans total</div>




</div>




<div style="width:38px; height:38px; background:#eff6ff; border-radius:10px; display:flex; align-items:center; justify-content:center;">





<i class="fa-solid fa-hand-holding-dollar" style="color:#3b82f6; font-size:1rem;"></i>




</div>



</div>


</div>


<div style="background:white; border-radius:16px; padding:1rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #f1f5f9;">



<div style="display:flex; justify-content:space-between; align-items:flex-start;">




<div>





<div style="font-size:0.68rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Collected</div>





<div style="font-size:1.3rem; font-weight:800; color:var(--success); margin-top:0.2rem;"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:0.9em; margin-right:4px; vertical-align:middle;"></i>${(totalCollected / 1000).toFixed(1)}K</div>





<div style="font-size:0.72rem; color:#94a3b8; margin-top:0.2rem;">${recoveryPct}% recovered</div>




</div>




<div style="width:38px; height:38px; background:#f0fdf4; border-radius:10px; display:flex; align-items:center; justify-content:center;">





<i class="fa-solid fa-circle-check" style="color:var(--success); font-size:1rem;"></i>




</div>



</div>


</div>


<div style="background:white; border-radius:16px; padding:1rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #f1f5f9;">



<div style="display:flex; justify-content:space-between; align-items:flex-start;">




<div>





<div style="font-size:0.68rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Outstanding</div>





<div style="font-size:1.3rem; font-weight:800; color:var(--danger); margin-top:0.2rem;"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:0.9em; margin-right:4px; vertical-align:middle;"></i>${(totalOutstanding / 1000).toFixed(1)}K</div>





<div style="font-size:0.72rem; color:#94a3b8; margin-top:0.2rem;">${activeLoans.length} active loans</div>




</div>




<div style="width:38px; height:38px; background:#fff1f2; border-radius:10px; display:flex; align-items:center; justify-content:center;">





<i class="fa-solid fa-triangle-exclamation" style="color:var(--danger); font-size:1rem;"></i>




</div>



</div>


</div>


<div style="background:white; border-radius:16px; padding:1rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #f1f5f9;">



<div style="display:flex; justify-content:space-between; align-items:flex-start;">




<div>





<div style="font-size:0.68rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Recovery</div>





<div style="font-size:1.3rem; font-weight:800; color:var(--primary-color); margin-top:0.2rem;">${recoveryPct}%</div>





<div style="font-size:0.72rem; color:#94a3b8; margin-top:0.2rem;">${closedLoans.length} closed</div>




</div>




<div style="position:relative; width:38px; height:38px;">





${ring(recoveryPct, "var(--primary-color)", 38, 4)}





<div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:0.55rem; font-weight:700; color:var(--primary-color);">${recoveryPct}%</div>




</div>



</div>


</div>

</div>

<!-- ── Today's Collection Widget Container ── -->
<div id="dashboard-collection-widget"></div>

<!-- ── Overdue Installments ── -->

${
  overdueItems.length > 0
    ? `

<div style="background:white; border-radius:16px; padding:1rem 1.25rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #fee2e2; margin-bottom:0.75rem;">


<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">



<div style="font-size:0.9rem; font-weight:700; color:#dc2626; display:flex; align-items:center; gap:0.5rem;">




<i class="fa-solid fa-circle-exclamation"></i> Overdue (${overdueItems.length})



</div>



<span style="background:#fee2e2; color:#dc2626; padding:0.2rem 0.6rem; border-radius:20px; font-size:0.68rem; font-weight:700;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${overdueItems.reduce((s, i) => s + parseFloat(i.schedule.amount || 0) - parseFloat(i.schedule.paidAmount || 0), 0).toLocaleString()} pending</span>


</div>


${overdueItems
  .slice(0, 4)
  .map((item) => {
    const daysAgo = Math.floor(
      (now - new Date(item.schedule.dueDate)) / 86400000,
    );

    const b = item.borrower;

    const bal =
      parseFloat(item.schedule.amount || 0) -
      parseFloat(item.schedule.paidAmount || 0);

    return `



<div onclick="window.app.navigate('loan-detail', '${item.loan.id}')" style="display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0; border-bottom:1px solid #fef2f2; cursor:pointer;">




<img src="${b?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(b?.name || "?")}&background=fee2e2&color=dc2626&bold=true&size=40`}" style="width:36px; height:36px; border-radius:8px; object-fit:cover; flex-shrink:0;">




<div style="flex:1; min-width:0;">





<div style="font-size:0.85rem; font-weight:600; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b?.name || "Unknown"}</div>





<div style="font-size:0.72rem; color:#94a3b8;">Inst. #${item.schedule.no} · ${item.schedule.dueDate}</div>




</div>




<div style="text-align:right; flex-shrink:0;">





<div style="font-size:0.85rem; font-weight:700; color:#dc2626;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${bal.toLocaleString()}</div>





<div style="font-size:0.65rem; color:#f87171;">${daysAgo}d ago</div>




</div>



</div>`;
  })
  .join("")}


${overdueItems.length > 4 ? `<div style="text-align:center; font-size:0.78rem; color:#94a3b8; padding-top:0.5rem;">+${overdueItems.length - 4} more overdue</div>` : ""}

</div>`
    : ""
}

<!-- ── Top Borrowers by Outstanding ── -->

${
  borrowerStats.length > 0
    ? `

<div style="background:white; border-radius:16px; padding:1rem 1.25rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #f1f5f9; margin-bottom:0.75rem;">


<div style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem;">



<i class="fa-solid fa-ranking-star" style="color:#f59e0b;"></i> Top Outstanding


</div>


${borrowerStats
  .map((item, idx) => {
    const pct = item.lent > 0 ? Math.round((item.paid / item.lent) * 100) : 0;

    const colors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e"];

    return `



<div onclick="window.app.navigate('borrower-detail', '${item.b.id}')" style="display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0; cursor:pointer; ${idx < borrowerStats.length - 1 ? "border-bottom:1px solid #f8fafc;" : ""}">




<div style="width:24px; height:24px; background:${colors[idx]}22; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:800; color:${colors[idx]}; flex-shrink:0;">${idx + 1}</div>




<img src="${item.b.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.b.name)}&background=6366f1&color=fff&bold=true&size=40`}" style="width:32px; height:32px; border-radius:8px; object-fit:cover; flex-shrink:0;">




<div style="flex:1; min-width:0;">





<div style="font-size:0.82rem; font-weight:600; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.b.name}</div>





<div style="height:3px; background:#f1f5f9; border-radius:99px; margin-top:0.3rem; overflow:hidden;">






<div style="height:100%; width:${pct}%; background:${colors[idx]}; border-radius:99px;"></div>





</div>




</div>




<div style="text-align:right; flex-shrink:0;">





<div style="font-size:0.82rem; font-weight:700; color:var(--danger);"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${item.outstanding.toLocaleString()}</div>





<div style="font-size:0.65rem; color:#94a3b8;">${pct}% paid</div>




</div>



</div>`;
  })
  .join("")}

</div>`
    : ""
}

<!-- ── Recent Transactions ── -->

${
  recentTxns.length > 0
    ? `

<div style="background:white; border-radius:16px; padding:1rem 1.25rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #f1f5f9; margin-bottom:0.75rem;">


<div style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem;">



<i class="fa-solid fa-clock-rotate-left" style="color:#6366f1;"></i> Recent Transactions


</div>


${recentTxns
  .map((t) => {
    const loan = loans.find((l) => l.id === t.loanId);

    const b = borrowers.find((b) => b.id === t.borrowerId);

    const dt = new Date(t.timestamp || t.date);

    const timeStr = t.timestamp
      ? dt.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "";

    return `



<div style="display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0; border-bottom:1px solid #f8fafc;">




<div style="width:36px; height:36px; background:#f0fdf4; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">





<i class="fa-solid fa-arrow-down-left" style="color:var(--success); font-size:0.85rem;"></i>




</div>




<div style="flex:1; min-width:0;">





<div style="font-size:0.82rem; font-weight:600; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b?.name || "Unknown"}</div>





<div style="font-size:0.7rem; color:#94a3b8;">${t.date}${timeStr ? " · " + timeStr : ""}</div>




</div>




<div style="font-size:0.9rem; font-weight:700; color:var(--success); flex-shrink:0;">+<i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${parseFloat(t.amount).toLocaleString()}</div>



</div>`;
  })
  .join("")}

</div>`
    : ""
}

<!-- ── Quick Actions ── -->

<div style="background:white; border-radius:16px; padding:1rem 1.25rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); border:1px solid #f1f5f9; margin-bottom:5rem;">


<div style="font-size:0.9rem; font-weight:700; color:var(--text-main); margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem;">



<i class="fa-solid fa-bolt" style="color:#f59e0b;"></i> Quick Actions


</div>


<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:0.5rem; text-align:center;">



<button onclick="window.app.navigate('add-borrower')" style="background:#eff6ff; border:none; border-radius:12px; padding:0.75rem 0.25rem; cursor:pointer; transition:background 0.15s;" onmouseenter="this.style.background='#dbeafe'" onmouseleave="this.style.background='#eff6ff'">




<i class="fa-solid fa-user-plus" style="color:#3b82f6; font-size:1.1rem; display:block; margin-bottom:0.3rem;"></i>




<span style="font-size:0.65rem; font-weight:600; color:#3b82f6;">New User</span>



</button>



<button onclick="window.app.navigate('add-loan')" style="background:#f0fdf4; border:none; border-radius:12px; padding:0.75rem 0.25rem; cursor:pointer; transition:background 0.15s;" onmouseenter="this.style.background='#dcfce7'" onmouseleave="this.style.background='#f0fdf4'">




<i class="fa-solid fa-file-circle-plus" style="color:var(--success); font-size:1.1rem; display:block; margin-bottom:0.3rem;"></i>




<span style="font-size:0.65rem; font-weight:600; color:var(--success);">New Loan</span>



</button>



<button onclick="window.app.navigate('fast-collection')" style="background:#fdf4ff; border:none; border-radius:12px; padding:0.75rem 0.25rem; cursor:pointer; transition:background 0.15s;" onmouseenter="this.style.background='#f3e8ff'" onmouseleave="this.style.background='#fdf4ff'">




<i class="fa-solid fa-bolt-lightning" style="color:#a855f7; font-size:1.1rem; display:block; margin-bottom:0.3rem;"></i>




<span style="font-size:0.65rem; font-weight:600; color:#a855f7;">Fast Input</span>



</button>



<button onclick="window.app.navigate('borrowers')" style="background:#fff7ed; border:none; border-radius:12px; padding:0.75rem 0.25rem; cursor:pointer; transition:background 0.15s;" onmouseenter="this.style.background='#ffedd5'" onmouseleave="this.style.background='#fff7ed'">




<i class="fa-solid fa-user-group" style="color:#f97316; font-size:1.1rem; display:block; margin-bottom:0.3rem;"></i>




<span style="font-size:0.65rem; font-weight:600; color:#f97316;">Users</span>



</button>


</div>

</div>

`;
    this.renderCollectionWidget();
  }

  renderCollectionWidget() {
    const container = document.getElementById("dashboard-collection-widget");
    if (!container) return;

    const { date, search, filter } = this._collectionState || {
      date: new Date().toISOString().split("T")[0],
      search: "",
      filter: "all",
    };
    const { borrowers = [], activeLoans = [] } = this._dashboardData || {};

    let dueCount = 0,
      dueAmount = 0,
      paidCount = 0;
    const collectionItems = [];

    activeLoans.forEach((l) => {
      if (!l.schedule) return;
      l.schedule.forEach((s) => {
        if (s.dueDate === date) {
          const b = borrowers.find((b) => b.id === l.borrowerId);
          if (
            search &&
            b &&
            !b.name.toLowerCase().includes(search.toLowerCase())
          )
            return;

          if (filter === "paid" && s.status !== "PAID") return;
          if (filter === "pending" && s.status === "PAID") return;

          dueCount++;
          dueAmount += parseFloat(s.amount || 0);
          if (s.status === "PAID") paidCount++;

          collectionItems.push({ loan: l, schedule: s, borrower: b });
        }
      });
    });

    const collectionPct =
      dueCount > 0 ? Math.round((paidCount / dueCount) * 100) : 0;
    const isToday = date === new Date().toISOString().split("T")[0];
    const sectionTitle = isToday ? "Today's Collection" : "Daily Collection";

    container.innerHTML = `
    <div style="background:white; border-radius:16px; padding:1.25rem; box-shadow:0 4px 12px rgba(0,0,0,0.03); border:1px solid #f1f5f9; margin-bottom:1rem;">

        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; flex-wrap:wrap; gap:0.5rem;">
            <div style="font-size:1rem; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:0.5rem;">
                <i class="fa-solid fa-calendar-day" style="color:var(--primary-color);"></i> ${sectionTitle}
            </div>
            
            <div style="display:flex; gap:0.6rem; flex:1; justify-content:flex-end;">
                 <input type="date" id="collection-date-input" value="${date}" style="padding:0.4rem 0.75rem; border:1px solid #cbd5e1; border-radius:8px; font-size:0.8rem; outline:none; font-family:inherit; color:var(--text-main); font-weight:600; cursor:pointer;">
            </div>
        </div>
        
        <!-- Controls: Search & Filter -->
        <div style="display:flex; gap:0.6rem; margin-bottom:1.25rem;">
            <div style="position:relative; flex:1;">
                <i class="fa-solid fa-search" style="position:absolute; left:0.8rem; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.8rem;"></i>
                <input type="text" id="collection-search-input" value="${search.replace(/"/g, "&quot;")}" placeholder="Search borrower..." style="width:100%; padding:0.6rem 0.6rem 0.6rem 2.2rem; border:1px solid #e2e8f0; border-radius:10px; font-size:0.85rem; outline:none; transition:border-color 0.2s;">
            </div>
            <select id="collection-filter-select" style="padding:0.6rem; border:1px solid #e2e8f0; border-radius:10px; font-size:0.85rem; outline:none; background:white; color:var(--text-main); font-weight:500; cursor:pointer;">
                <option value="all" ${filter === "all" ? "selected" : ""}>All Status</option>
                <option value="pending" ${filter === "pending" ? "selected" : ""}>Pending</option>
                <option value="paid" ${filter === "paid" ? "selected" : ""}>Paid</option>
            </select>
        </div>

        <!-- Summary Cards -->
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.75rem; margin-bottom:1.25rem; text-align:center;">
            <div style="background:#f8fafc; padding:0.8rem; border-radius:12px; border:1px solid #f1f5f9;">
                <div style="font-size:1.15rem; font-weight:800; color:var(--text-main);">${dueCount}</div>
                <div style="font-size:0.65rem; color:#64748b; font-weight:600; text-transform:uppercase; margin-top:0.2rem;">Records</div>
            </div>
            <div style="background:#f0fdf4; padding:0.8rem; border-radius:12px; border:1px solid #dcfce7;">
                <div style="font-size:1.15rem; font-weight:800; color:var(--success);">${paidCount}</div>
                <div style="font-size:0.65rem; color:#166534; font-weight:600; text-transform:uppercase; margin-top:0.2rem;">Paid</div>
            </div>
            <div style="background:#eff6ff; padding:0.8rem; border-radius:12px; border:1px solid #dbeafe;">
                <div style="font-size:1.15rem; font-weight:800; color:var(--primary-color);"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${dueAmount.toLocaleString()}</div>
                <div style="font-size:0.65rem; color:#1e3a8a; font-weight:600; text-transform:uppercase; margin-top:0.2rem;">Total Val</div>
            </div>
        </div>

        <!-- Progress Bar -->
        ${
          dueCount > 0
            ? `
        <div style="height:6px; background:#f1f5f9; border-radius:99px; overflow:hidden; margin-bottom:0.5rem;">
            <div style="height:100%; width:${collectionPct}%; background:linear-gradient(90deg, var(--primary-color), var(--success)); border-radius:99px; transition:width 0.5s ease;"></div>
        </div>
        <div style="font-size:0.75rem; color:#64748b; text-align:right; margin-bottom:1.25rem; font-weight:500;">${collectionPct}% Collected</div>`
            : ""
        }

        <!-- Item List -->
        <div style="border-top:1px solid #f1f5f9; padding-top:1.25rem; display:flex; flex-direction:column; gap:0.6rem; max-height: 280px; overflow-y:auto; padding-right:0.4rem;">
            ${
              collectionItems.length > 0
                ? collectionItems
                    .map((item) => {
                      const b = item.borrower;
                      const isPaid = item.schedule.status === "PAID";
                      return `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:0.75rem; border-radius:12px; background:${isPaid ? "#f8fafc" : "white"}; border:1px solid ${isPaid ? "#f1f5f9" : "#e2e8f0"}; cursor:pointer; transition:all 0.2s; box-shadow: ${isPaid ? "none" : "0 1px 3px rgba(0,0,0,0.02)"};" onclick="window.app.navigate('loan-detail', '${item.loan.id}')" onmouseenter="this.style.borderColor='var(--primary-color)'; this.style.transform='translateY(-1px)'" onmouseleave="this.style.borderColor='${isPaid ? "#f1f5f9" : "#e2e8f0"}'; this.style.transform='none'">
                    <div style="display:flex; align-items:center; gap:0.85rem;">
                        <img src="${b?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(b?.name || "?")}&background=random&color=fff&bold=true&size=40`}" style="width:38px; height:38px; border-radius:10px; object-fit:cover;">
                        <div>
                            <div style="font-size:0.85rem; font-weight:700; color:${isPaid ? "#64748b" : "var(--text-main)"};">${b?.name || "Unknown"}</div>
                            <div style="font-size:0.7rem; color:#94a3b8; font-weight:500; margin-top:0.1rem;">Inst. #${item.schedule.no}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:0.9rem; font-weight:800; color:${isPaid ? "var(--success)" : "var(--text-main)"};"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${parseFloat(item.schedule.amount || 0).toLocaleString()}</div>
                        <div style="display:inline-block; font-size:0.65rem; font-weight:700; margin-top:0.25rem; padding: 0.1rem 0.4rem; border-radius:4px; ${isPaid ? "background:#dcfce7; color:#166534;" : "background:#fef3c7; color:#b45309;"}">${isPaid ? "PAID" : "PENDING"}</div>
                    </div>
                </div>`;
                    })
                    .join("")
                : `<div style="text-align:center; padding:2rem 0; color:#94a3b8; font-size:0.85rem; font-weight:500;"><i class="fa-regular fa-folder-open" style="font-size:2rem; color:#cbd5e1; display:block; margin-bottom:0.5rem;"></i>No collections found for this criteria.</div>`
            }
        </div>

    </div>
    `;

    document
      .getElementById("collection-date-input")
      .addEventListener("change", (e) => {
        this._collectionState.date = e.target.value;
        this.renderCollectionWidget();
      });

    const searchInput = document.getElementById("collection-search-input");
    searchInput.addEventListener("input", (e) => {
      this._collectionState.search = e.target.value;
      this.renderCollectionWidget();
      setTimeout(() => {
        const el = document.getElementById("collection-search-input");
        if (el) {
          el.focus();
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      }, 0);
    });

    document
      .getElementById("collection-filter-select")
      .addEventListener("change", (e) => {
        this._collectionState.filter = e.target.value;
        this.renderCollectionWidget();
      });
  }

  renderBorrowerListItems(items, containerId) {
    const listContainer = document.getElementById(containerId);

    if (!listContainer) return;

    if (items.length === 0) {
      listContainer.innerHTML = `



<div style="text-align:center; color:#94a3b8; padding:4rem 2rem;">




<div style="width:72px; height:72px; background:#f1f5f9; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 1rem;">





<i class="fa-solid fa-users" style="font-size:1.75rem; color:#cbd5e1;"></i>




</div>




<p style="font-weight:600; color:#64748b; margin-bottom:0.25rem;">No users found</p>




<p style="font-size:0.85rem;">Try a different search term.</p>



</div>`;

      return;
    }

    listContainer.innerHTML = items
      .map(({ b, loans }) => {
        const activeLoans = loans.filter((l) => l.status === "active");

        const totalLent = loans.reduce(
          (s, l) => s + parseFloat(l.totalAmount || 0),
          0,
        );

        const totalPaid = loans.reduce(
          (s, l) => s + parseFloat(l.paidAmount || 0),
          0,
        );

        const outstanding = Math.max(0, totalLent - totalPaid);

        const progressPct =
          totalLent > 0
            ? Math.min(100, Math.round((totalPaid / totalLent) * 100))
            : 0;

        const loanStatusColor =
          activeLoans.length > 0 ? "var(--success)" : "#94a3b8";

        const loanStatusBg =
          activeLoans.length > 0 ? "rgba(16,185,129,0.08)" : "#f1f5f9";

        const addrParts = [
          b.doorNo,
          b.street,
          b.address,
          b.post,
          b.taluk,
          b.district,
        ].filter(Boolean);

        const addressStr = addrParts.join(", ") || "-";

        const avatarUrl =
          b.photo ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=6366f1&color=fff&bold=true&size=80`;

        return `


<div onclick="window.app.navigate('borrower-detail', '${b.id}')" style="background:white; border-radius:16px; border:1px solid #f1f5f9; box-shadow:0 2px 8px rgba(0,0,0,0.04); margin-bottom:0.875rem; overflow:hidden; cursor:pointer; transition:box-shadow 0.2s, transform 0.15s;"



onmouseenter="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.09)'; this.style.transform='translateY(-1px)'"



onmouseleave="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'; this.style.transform='translateY(0)'">



<!-- Top: Photo + Name + Badges -->



<div style="display:flex; gap:1rem; align-items:flex-start; padding:1rem 1rem 0.75rem;">




<div style="position:relative; flex-shrink:0;">





<img src="${avatarUrl}" style="width:58px; height:58px; border-radius:12px; object-fit:cover; border:2px solid #e2e8f0;">





<span style="position:absolute; bottom:-4px; right:-4px; background:${loanStatusColor}; width:14px; height:14px; border-radius:50%; border:2px solid white;"></span>




</div>




<div style="flex:1; min-width:0;">





<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">






<div>







<div style="font-size:1.05rem; font-weight:700; color:var(--text-main); line-height:1.2; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.name}</div>







${b.fatherName ? `<div style="font-size:0.78rem; color:#94a3b8; margin-top:0.1rem;">S/o ${b.fatherName}</div>` : ""}






</div>






<span style="background:${loanStatusBg}; color:${loanStatusColor}; padding:0.25rem 0.6rem; border-radius:20px; font-size:0.68rem; font-weight:700; white-space:nowrap; flex-shrink:0;">







${activeLoans.length > 0 ? `${activeLoans.length} ACTIVE` : "NO LOANS"}






</span>





</div>





<!-- Tags row -->





<div style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-top:0.5rem;">






${b.serialNo ? `<span style="background:#eff6ff; color:#3b82f6; padding:0.15rem 0.5rem; border-radius:5px; font-size:0.68rem; font-weight:600;">📖 #${b.serialNo}</span>` : ""}






${b.gender ? `<span style="background:#f5f3ff; color:#7c3aed; padding:0.15rem 0.5rem; border-radius:5px; font-size:0.68rem; font-weight:600;">${b.gender === "Male" ? "♂" : b.gender === "Female" ? "♀" : "⚧"} ${b.gender}</span>` : ""}






${b.married ? `<span style="background:#fdf4ff; color:#a21caf; padding:0.15rem 0.5rem; border-radius:5px; font-size:0.68rem; font-weight:600;">💍 ${b.married}</span>` : ""}






${b.occupation ? `<span style="background:#f0fdf4; color:#16a34a; padding:0.15rem 0.5rem; border-radius:5px; font-size:0.68rem; font-weight:600;">💼 ${b.occupation}</span>` : ""}





</div>




</div>



</div>



<!-- Contact + Address row -->



<div style="padding:0 1rem 0.75rem; display:flex; flex-direction:column; gap:0.3rem;">




<div style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:#64748b;">





<i class="fa-solid fa-phone" style="width:14px; color:#94a3b8;"></i>





<span>${b.mobile}${b.mobile2 ? ` • ${b.mobile2}` : ""}</span>




</div>




${
  b.work
    ? `




<div style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:#64748b;">





<i class="fa-solid fa-store" style="width:14px; color:#94a3b8;"></i>





<span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${b.work}</span>




</div>`
    : ""
}




<div style="display:flex; align-items:flex-start; gap:0.5rem; font-size:0.8rem; color:#64748b;">





<i class="fa-solid fa-location-dot" style="width:14px; color:#94a3b8; margin-top:0.1rem;"></i>





<span style="overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical;">${addressStr}</span>




</div>




${
  b.aadhar
    ? `




<div style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:#64748b;">





<i class="fa-solid fa-id-card" style="width:14px; color:#94a3b8;"></i>





<span style="letter-spacing:0.5px;">${b.aadhar.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")}</span>




</div>`
    : ""
}




${
  b.income
    ? `




<div style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:#64748b;">





<i class="fa-solid fa-taka-sign" style="width:14px; color:#94a3b8;"></i>





<span>Monthly Income: <i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${parseFloat(b.income).toLocaleString()}</span>




</div>`
    : ""
}




${
  b.refName
    ? `




<div style="display:flex; align-items:center; gap:0.5rem; font-size:0.8rem; color:#64748b;">





<i class="fa-solid fa-user-check" style="width:14px; color:#94a3b8;"></i>





<span>Ref: ${b.refName}${b.refMobile ? ` (${b.refMobile})` : ""}</span>




</div>`
    : ""
}



</div>



<!-- Loan Summary Footer -->



${
  loans.length > 0
    ? `



<div style="border-top:1px solid #f1f5f9; padding:0.75rem 1rem;">




<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.5rem; margin-bottom:0.6rem; text-align:center;">





<div>






<div style="font-size:0.9rem; font-weight:700; color:var(--text-main);"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalLent.toLocaleString()}</div>






<div style="font-size:0.65rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.4px;">Total Lent</div>





</div>





<div>






<div style="font-size:0.9rem; font-weight:700; color:var(--success);"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalPaid.toLocaleString()}</div>






<div style="font-size:0.65rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.4px;">Collected</div>





</div>





<div>






<div style="font-size:0.9rem; font-weight:700; color:${outstanding > 0 ? "var(--danger)" : "var(--success)"};"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${outstanding.toLocaleString()}</div>






<div style="font-size:0.65rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.4px;">Outstanding</div>





</div>




</div>




<div style="height:4px; background:#f1f5f9; border-radius:99px; overflow:hidden;">





<div style="height:100%; width:${progressPct}%; background:linear-gradient(90deg, var(--primary-color), var(--success)); border-radius:99px; transition:width 0.4s ease;"></div>




</div>




<div style="font-size:0.68rem; color:#94a3b8; text-align:right; margin-top:0.2rem;">${progressPct}% recovered • ${loans.length} loan${loans.length !== 1 ? "s" : ""}</div>



</div>`
    : `



<div style="border-top:1px solid #f1f5f9; padding:0.6rem 1rem; text-align:center; font-size:0.78rem; color:#94a3b8;">




<i class="fa-solid fa-file-circle-plus" style="margin-right:0.3rem;"></i> No loans yet — tap to add



</div>`
}


</div>`;
      })
      .join("");
  }
  async renderBorrowerList() {
    this.setTitle("All Users");

    this.showFab(() => window.app.navigate("add-borrower"));

    const borrowers = await window.db.getAll("borrowers");

    const allLoans = await window.db.getAll("loans");

    const buildItems = (bList) =>
      bList.map((b) => ({
        b,

        loans: allLoans.filter((l) => l.borrowerId === b.id),
      }));

    const allItems = buildItems(borrowers);

    const totalActive = allLoans.filter((l) => l.status === "active").length;

    const totalBorrowers = borrowers.length;

    this.container.innerHTML = `


<!-- Stats Bar -->


<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.75rem; margin-bottom:1rem;">



<div style="background:white; border-radius:12px; padding:0.75rem; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.06); border:1px solid #f1f5f9;">




<div style="font-size:1.3rem; font-weight:700; color:var(--text-main);">${totalBorrowers}</div>




<div style="font-size:0.68rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.4px;">Users</div>



</div>



<div style="background:white; border-radius:12px; padding:0.75rem; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.06); border:1px solid #f1f5f9;">




<div style="font-size:1.3rem; font-weight:700; color:var(--success);">${totalActive}</div>




<div style="font-size:0.68rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.4px;">Active Loans</div>



</div>



<div style="background:white; border-radius:12px; padding:0.75rem; text-align:center; box-shadow:0 1px 3px rgba(0,0,0,0.06); border:1px solid #f1f5f9;">




<div style="font-size:1.3rem; font-weight:700; color:var(--primary-color);">${allLoans.length}</div>




<div style="font-size:0.68rem; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.4px;">Total Loans</div>



</div>


</div>


<!-- Search -->


<div class="search-box" style="margin-bottom:1rem;">



<i class="fa-solid fa-search"></i>



<input type="text" id="borrower-search" placeholder="Search name, mobile, Aadhar, serial...">


</div>


<div id="borrower-list-container"></div>

`;

    this.renderBorrowerListItems(allItems, "borrower-list-container");

    document
      .getElementById("borrower-search")
      .addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();

        const filtered = allItems.filter(
          ({ b }) =>
            b.name.toLowerCase().includes(term) ||
            (b.mobile || "").includes(term) ||
            (b.mobile2 || "").includes(term) ||
            (b.aadhar || "").includes(term) ||
            (b.serialNo || "").toLowerCase().includes(term) ||
            (b.address || "").toLowerCase().includes(term) ||
            (b.work || "").toLowerCase().includes(term) ||
            (b.occupation || "").toLowerCase().includes(term),
        );

        this.renderBorrowerListItems(filtered, "borrower-list-container");
      });
  }
  async renderLoanList() {
    this.setTitle("All Loans");

    this.showFab(() => window.app.navigate("add-loan"));

    const loans = await window.db.getAll("loans");

    const loansWithNames = await Promise.all(
      loans.map(async (l) => {
        const b = await window.db.get("borrowers", l.borrowerId);

        return {
          ...l,
          borrowerName: b ? b.name : "Unknown",
          borrowerMobile: b ? b.mobile : "",
        };
      }),
    );

    this.container.innerHTML = `


<div class="search-box">



<i class="fa-solid fa-search"></i>



<input type="text" id="loan-search" placeholder="Search loan no, borrower name...">


</div>





<div class="filter-tabs" style="display:flex; gap:0.5rem; margin-bottom:1rem; overflow-x:auto;">



<button class="btn btn-primary btn-sm" onclick="window.ui.filterLoans('active')">Active</button>



<button class="btn btn-secondary btn-sm" onclick="window.ui.filterLoans('closed')">Closed</button>



<button class="btn btn-secondary btn-sm" onclick="window.ui.filterLoans('all')">All</button>


</div>


<div id="loan-list-container"></div>

`;

    this.currentLoans = loansWithNames;
    this.filterLoans("active");

    document.getElementById("loan-search").addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();

      const filtered = this.currentLoans.filter(
        (l) =>
          l.borrowerName.toLowerCase().includes(term) ||
          l.id.includes(term) ||
          (l.loanNo && l.loanNo.includes(term)),
      );

      this.renderLoanListItems(filtered);
    });
  }
  filterLoans(status) {
    if (status === "all") {
      this.renderLoanListItems(this.currentLoans);
    } else {
      const filtered = this.currentLoans.filter((l) => {
        if (status === "active") return l.status === "active";

        if (status === "closed") return l.status !== "active";
      });

      this.renderLoanListItems(filtered);
    }
  }
  renderLoanListItems(loans) {
    const list = document.getElementById("loan-list-container");

    if (loans.length === 0) {
      list.innerHTML =
        '<div style="text-align:center;color:#aaa;padding:2rem;">No loans found</div>';
      return;
    }

    list.innerHTML = loans
      .map(
        (l) => `


<div class="card" style="border-left: 4px solid ${l.status === "active" ? "var(--success)" : "#cbd5e1"}; position:relative;">



<div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;" onclick="window.app.navigate('loan-detail', '${l.id}')">




<div style="flex:1; cursor:pointer;">





<div style="font-weight:600; font-size:1rem;">${l.borrowerName}</div>





<div style="font-size:0.8rem; color:var(--text-muted);">Loan #${l.loanNo || l.id.substring(0, 6)} • ${l.frequency || "Daily"}</div>




</div>




<div style="text-align:right;">





<button onclick="event.stopPropagation(); window.ui.openEditLoanModal('${l.id}')" style="background:none; border:none;  margin-bottom:0.25rem; color:#64748b; cursor:pointer; padding:0.25rem 0.5rem; border-radius:4px;">






<i class="fa-solid fa-pen-to-square"></i>





</button>





<div style="font-weight:700; color:var(--primary-color);"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:0.9em; margin-right:4px; vertical-align:middle;"></i>${l.totalAmount}</div>




</div>



</div>



<div style="display:flex; justify-content:space-between; border-top:1px solid #f1f5f9; padding-top:0.5rem; font-size:0.85rem;" onclick="window.app.navigate('loan-detail', '${l.id}')">




<span>Due: <i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:0.8em; vertical-align:middle; margin-right:3px;"></i>${parseFloat(l.totalAmount) - parseFloat(l.paidAmount)}</span>




<span style="color:${l.status === "active" ? "var(--success)" : "gray"}">${l.status.toUpperCase()}</span>



</div>


</div>

`,
      )
      .join("");
  }
  async renderAddBorrower(editId = null) {
    this.setTitle(editId ? "Edit User" : "New User");

    this.hideFab();

    let borrower = {};

    if (editId) {
      borrower = await window.db.get("borrowers", editId);
    }

    const renderImageInput = (label, id, currentVal) => `


<div style="margin-bottom: 1.5rem;">



<label style="display:block; margin-bottom:0.5rem; font-weight:500;">${label}</label>



<div style="display:flex; gap:1rem; align-items:center;">




<div style="display:flex; gap:1rem;">





<input type="file" id="${id}-cam" accept="image/*" capture="environment" style="display:none" onchange="window.ui.handleImagePreview(this, '${id}-preview', '${id}-val')">





<button type="button" onclick="document.getElementById('${id}-cam').click()" style="width:50px; height:50px; border:1px solid #cbd5e1; border-radius:8px; background:white; color:#64748b; display:flex; align-items:center; justify-content:center; cursor:pointer;">






<i class="fa-solid fa-camera fa-lg"></i>





</button>











<input type="file" id="${id}-file" accept="image/*" style="display:none" onchange="window.ui.handleImagePreview(this, '${id}-preview', '${id}-val')">





<button type="button" onclick="document.getElementById('${id}-file').click()" style="width:50px; height:50px; border:1px solid #cbd5e1; border-radius:8px; background:white; color:#64748b; display:flex; align-items:center; justify-content:center; cursor:pointer;">






<i class="fa-regular fa-image fa-lg"></i>





</button>




</div>




<div id="${id}-preview">





${currentVal ? `<img src="${currentVal}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; border:1px solid #e2e8f0;">` : ""}




</div>




<input type="hidden" id="${id}-val" name="${id}" value="${currentVal || ""}">



</div>


</div>

`;

    this.container.innerHTML = `


<div class="card">



<form id="add-borrower-form">




<div class="form-group">





<label>Serial No (Book)</label>





<input type="text" class="form-control" name="serialNo" placeholder="Enter Serial No" value="${borrower.serialNo || ""}">




</div>




<div class="form-group">





<label>Aadhar Number</label>





<input type="text" class="form-control" name="aadhar" placeholder="12 digit number" value="${borrower.aadhar || ""}">




</div>




<div class="form-group">





<label>Full Name <span style="color:red">*</span></label>





<input type="text" class="form-control" name="name" required placeholder="Enter name" value="${borrower.name || ""}">




</div>









<div class="form-group">





<label>Father Name</label>





<input type="text" class="form-control" name="fatherName" placeholder="Father Name" value="${borrower.fatherName || ""}">




</div>




<div class="grid-2">





<div class="form-group">






<label>Mobile <span style="color:red">*</span></label>






<input type="tel" class="form-control" name="mobile" required placeholder="Mobile 1" value="${borrower.mobile || ""}">





</div>





<div class="form-group">






<label>Mobile 2</label>






<input type="tel" class="form-control" name="mobile2" placeholder="Mobile 2" value="${borrower.mobile2 || ""}">





</div>




</div>




<div class="form-group">





<label>Shop / Work</label>





<input type="text" class="form-control" name="work" placeholder="Shop or Work details" value="${borrower.work || ""}">




</div>




<div class="grid-2">





 <div class="form-group">






<label>Door No</label>






<input type="text" class="form-control" name="doorNo" value="${borrower.doorNo || ""}">





</div>





 <div class="form-group">






<label>Street</label>






<input type="text" class="form-control" name="street" value="${borrower.street || ""}">





</div>




</div>




<div class="form-group">





<label>Address (Full)</label>





<textarea class="form-control" name="address" rows="2" placeholder="Full address">${borrower.address || ""}</textarea>




</div>




<div class="grid-2">





 <div class="form-group">






<label>Post</label>






<input type="text" class="form-control" name="post" value="${borrower.post || ""}">





</div>





 <div class="form-group">






<label>Taluk</label>






<input type="text" class="form-control" name="taluk" value="${borrower.taluk || ""}">





</div>




</div>




<div class="grid-2">





 <div class="form-group">






<label>District</label>






<input type="text" class="form-control" name="district" value="${borrower.district || ""}">





</div>





 <div class="form-group">






<label>Landmark</label>






<input type="text" class="form-control" name="landmark" value="${borrower.landmark || ""}">





</div>




</div>




<div class="grid-2">





 <div class="form-group">






<label>Gender</label>






<select class="form-control" name="gender">







<option value="Male" ${borrower.gender === "Male" ? "selected" : ""}>Male</option>







<option value="Female" ${borrower.gender === "Female" ? "selected" : ""}>Female</option>







<option value="Other" ${borrower.gender === "Other" ? "selected" : ""}>Other</option>






</select>





</div>





 <div class="form-group">






<label>Married</label>






<select class="form-control" name="married">







<option value="Married" ${borrower.married === "Married" ? "selected" : ""}>Married</option>







<option value="Unmarried" ${borrower.married === "Unmarried" ? "selected" : ""}>Unmarried</option>






</select>





</div>




</div>




<div class="grid-2">





<div class="form-group">






<label>Reference Name</label>






<input type="text" class="form-control" name="refName" value="${borrower.refName || ""}">





</div>





<div class="form-group">






<label>Reference Mobile</label>






<input type="tel" class="form-control" name="refMobile" value="${borrower.refMobile || ""}">





</div>




</div>




<div class="grid-2">





<div class="form-group">






<label>Occupation</label>






<input type="text" class="form-control" name="occupation" value="${borrower.occupation || ""}">





</div>





<div class="form-group">






 <label>Monthly Income</label>






<input type="number" class="form-control" name="income" value="${borrower.income || ""}">





</div>




 </div>









${renderImageInput("Aadhar Card Front", "aadharFront", borrower.aadharFront)}




${renderImageInput("Aadhar Card Rear", "aadharBack", borrower.aadharBack)}




${renderImageInput("User Photo", "photo", borrower.photo)}




<button type="submit" class="btn btn-primary" style="width:100%">${editId ? "UPDATE USER" : "CREATE USER"}</button>



</form>


</div>

`;

    document.getElementById("add-borrower-form").onsubmit = async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);

      const data = Object.fromEntries(formData.entries());

      if (editId) {
        const updated = {
          ...borrower,
          ...data,
          updatedAt: new Date().toISOString(),
        };

        await window.db.add("borrowers", updated);

        Swal.fire({
          icon: "success",

          title: "Updated!",

          text: "User details updated successfully.",

          timer: 1500,

          showConfirmButton: false,
        });

        window.app.navigate("borrower-detail", editId);
      } else {
        data.id = crypto.randomUUID();

        data.createdAt = new Date().toISOString();

        data.activeLoans = 0;

        await window.db.add("borrowers", data);

        Swal.fire({
          icon: "success",

          title: "Created!",

          text: "New user added successfully.",

          timer: 1500,

          showConfirmButton: false,
        });

        window.app.navigate("borrowers");
      }
    };
  }
  handleImagePreview(input, previewId, hiddenInputId) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();

      reader.onload = function (e) {
        document.getElementById(previewId).innerHTML =
          `<img src="${e.target.result}" style="width:50px; height:50px; object-fit:cover; border-radius:8px; border:1px solid #e2e8f0;">`;

        document.getElementById(hiddenInputId).value = e.target.result;
      };

      reader.readAsDataURL(input.files[0]);
    }
  }
  async renderAddLoan(preSelectedBorrowerId = null) {
    this.setTitle("Create New Loan");

    this.hideFab();

    const borrowers = await window.db.getAll("borrowers");

    const borrowerOptions = borrowers
      .map(
        (b) =>
          `<option value="${b.id}" ${b.id === preSelectedBorrowerId ? "selected" : ""}>${b.name} (${b.mobile})</option>`,
      )
      .join("");

    this.container.innerHTML = `


<div class="card">



<form id="add-loan-form">









<div class="form-group">





<label>Select Customer</label>





<select class="form-control" name="borrowerId" required>






<option value="">-- Select Customer --</option>






${borrowerOptions}





</select>




</div>




<div class="form-group">





<label style="margin-bottom:0.75rem; display:block;">Collection Frequency</label>





<div style="display:flex; gap:1.5rem;">






<label style="display:flex; align-items:center; gap:0.5rem; font-weight:400; color:var(--text-main); cursor:pointer;">







<input type="radio" name="frequency" value="Daily" checked> Daily






</label>






<label style="display:flex; align-items:center; gap:0.5rem; font-weight:400; color:var(--text-main); cursor:pointer;">







<input type="radio" name="frequency" value="Weekly"> Weekly






</label>






<label style="display:flex; align-items:center; gap:0.5rem; font-weight:400; color:var(--text-main); cursor:pointer;">







<input type="radio" name="frequency" value="Monthly"> Monthly






</label>





</div>




</div>




<div class="form-group">





<label>Loan Amount (Principal)</label>





<input type="number" class="form-control" name="principal" id="input-principal" required>




</div>




<div class="form-group">





<label>Interest (Total Amount)</label>





<input type="number" class="form-control" name="interest" id="input-interest" placeholder="e.g. 2000">




</div>




<div class="grid-2">





<div class="form-group">






<label>Installments (Count)</label>






<input type="number" class="form-control" name="installments" id="input-installments" value="100">





</div>





<div class="form-group">






<label>Loan Per Installment</label>






<input type="number" class="form-control" name="installmentAmount" id="input-per-installment" readonly style="background:#f8fafc;">





</div>




</div>




<div class="grid-2">





<div class="form-group">






<label>Start Date</label>






<input type="date" class="form-control" name="startDate" id="input-start-date" value="${new Date().toISOString().split("T")[0]}" required>





</div>





<div class="form-group">






<label>End Date</label>






<input type="date" class="form-control" name="endDate" id="input-end-date" readonly style="background:#f8fafc;">





</div>




</div>




<div class="form-group">





<label>Amount Disbursed</label>





<input type="number" class="form-control" name="disbursed" id="input-disbursed">




</div>




<div class="form-group">





<label>If Already Paid Amount</label>





<input type="number" class="form-control" name="alreadyPaid" value="0">




</div>




<button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; padding: 1rem; margin-top:1rem; font-size:1rem; border-radius: 30px;">





APPROVE




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
      disInput.value = p;

      if (dateInput.value) {
        const start = new Date(dateInput.value);

        const freq = form.querySelector(
          'input[name="frequency"]:checked',
        ).value;

        let daysToAdd = n;

        if (freq === "Weekly") daysToAdd = n * 7;

        if (freq === "Monthly") daysToAdd = n * 30;

        start.setDate(start.getDate() + daysToAdd);

        endInput.value = start.toISOString().split("T")[0];
      }
    };

    [pInput, iInput, nInput, dateInput].forEach((el) =>
      el.addEventListener("input", calculate),
    );

    form
      .querySelectorAll('input[name="frequency"]')
      .forEach((el) => el.addEventListener("change", calculate));

    form.onsubmit = async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);

      const data = Object.fromEntries(formData.entries());

      const loan = {
        id: crypto.randomUUID(),

        borrowerId: data.borrowerId,

        loanNo: Math.floor(1000 + Math.random() * 9000).toString(),

        frequency: data.frequency,

        principalAmount: data.principal,

        interestAmount: data.interest,

        totalAmount: (
          parseFloat(data.principal) + parseFloat(data.interest)
        ).toString(),

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
    };
  }
  async renderFastCollection() {
    this.setTitle("Fast Input Collection");
    this.hideFab();

    if (!this.fastInputState) {
      this.fastInputState = {
        date: new Date().toISOString().split("T")[0],
        tab: "Daily",
        search: "",
        mode: "loans",
        statusFilter: "all",
      };
    }

    // â”€â”€ Loan list renderer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const renderLoanList = async () => {
      const listContainer = document.getElementById("fast-collection-list");
      if (!listContainer) return;
      listContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem;"></i><p style="margin-top:0.75rem;font-size:0.9rem;">Loading collections...</p></div>';

      const selectedDate = this.fastInputState.date;
      const allLoans = await window.db.getAll("loans");
      const allTxns  = await window.db.getAll("transactions");
      const activeLoans = allLoans.filter(
        (l) => l.status === "active" && (l.frequency || "Daily") === this.fastInputState.tab,
      );

      const displayItems = await Promise.all(
        activeLoans.map(async (l) => {
          const b = await window.db.get("borrowers", l.borrowerId);
          let scheduleItem = null, scheduleIndex = -1;
          if (l.schedule && l.schedule.length > 0) {
            scheduleIndex = l.schedule.findIndex((s) => s.dueDate === selectedDate);
            if (scheduleIndex !== -1) scheduleItem = l.schedule[scheduleIndex];
            else return null;
          } else {
            const selDate   = new Date(selectedDate);
            const startDate = new Date(l.startDate);
            if (startDate > selDate) return null;
            const tab = this.fastInputState.tab;
            if (tab === "Weekly"  && startDate.getDay()  !== selDate.getDay())  return null;
            if (tab === "Monthly" && startDate.getDate() !== selDate.getDate()) return null;
          }
          const txn = allTxns.find((t) => t.loanId === l.id && t.date === selectedDate);
          return { loan: l, borrower: b, scheduleItem, scheduleIndex, existingTxn: txn };
        }),
      );

      const search = this.fastInputState.search.toLowerCase();
      const allFinalItems = displayItems.filter((item) => {
        if (!item || !item.borrower) return false;
        if (!search) return true;
        const b = item.borrower;
        return (
          b.name.toLowerCase().includes(search) ||
          (b.mobile  || "").includes(search) ||
          (b.serialNo || "").includes(search) ||
          (item.loan.loanNo || "").includes(search)
        );
      });

      if (allFinalItems.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center;color:#94a3b8;margin-top:4rem;padding:2rem;"><div style="width:72px;height:72px;background:#f1f5f9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;"><i class="fa-solid fa-calendar-xmark" style="font-size:1.75rem;color:#cbd5e1;"></i></div><p style="font-weight:600;color:#64748b;margin-bottom:0.25rem;">No loan collections for this date</p><p style="font-size:0.85rem;">Try a different date or check the schedule.</p></div>`;
        return;
      }

      // Compute pill amounts for Loan
      let paidPillAmt = 0, duePillAmt = 0;
      allFinalItems.forEach((item) => {
        const s = item.scheduleItem, txn = item.existingTxn, l = item.loan;
        const dueAmt  = parseFloat(s?.amount || l.installmentAmount || 0);
        const paidAmt = parseFloat(s?.paidAmount || (txn ? txn.amount : 0));
        const done = (paidAmt >= dueAmt && dueAmt > 0) || s?.status === "PAID" || (!!txn && !s);
        if (done) paidPillAmt += paidAmt; else duePillAmt += Math.max(0, dueAmt - paidAmt);
      });
      const paidPillCnt = allFinalItems.filter((item) => {
        const s = item.scheduleItem, txn = item.existingTxn, l = item.loan;
        const dueAmt  = parseFloat(s?.amount || l.installmentAmount || 0);
        const paidAmt = parseFloat(s?.paidAmount || (txn ? txn.amount : 0));
        return (paidAmt >= dueAmt && dueAmt > 0) || s?.status === "PAID" || (!!txn && !s);
      }).length;
      const duePillCnt = allFinalItems.length - paidPillCnt;

      // Inject filter pills
      const pillBarL = document.getElementById("filter-pill-bar");
      if (pillBarL) {
        const sfL = this.fastInputState.statusFilter;
        pillBarL.innerHTML = `<div style="display:flex;gap:0.5rem;padding:0.85rem 0 0.25rem 0;">
  <button onclick="window.ui.fastInputState.statusFilter='all';window.ui.renderFastCollection();" style="flex:1;padding:0.5rem 0.4rem;border-radius:12px;border:2px solid ${sfL==="all"?"var(--primary-color)":"#e2e8f0"};background:${sfL==="all"?"var(--primary-color)":"white"};color:${sfL==="all"?"white":"#64748b"};font-weight:700;font-size:0.73rem;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">
    <div style="font-size:0.6rem;opacity:0.8;letter-spacing:0.4px;">ALL</div>
    <div style="font-size:0.9rem;font-weight:800;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${(paidPillAmt+duePillAmt).toLocaleString()}</div>
    <div style="font-size:0.6rem;opacity:0.7;">${allFinalItems.length} loans</div>
  </button>
  <button onclick="window.ui.fastInputState.statusFilter='paid';window.ui.renderFastCollection();" style="flex:1;padding:0.5rem 0.4rem;border-radius:12px;border:2px solid ${sfL==="paid"?"var(--success)":"#e2e8f0"};background:${sfL==="paid"?"rgba(16,185,129,0.1)":"white"};color:${sfL==="paid"?"var(--success)":"#64748b"};font-weight:700;font-size:0.73rem;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">
    <div style="display:flex;align-items:center;justify-content:center;gap:3px;font-size:0.6rem;opacity:0.8;letter-spacing:0.4px;"><i class="fa-solid fa-check-circle" style="font-size:0.55rem;"></i> PAID</div>
    <div style="font-size:0.9rem;font-weight:800;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${paidPillAmt.toLocaleString()}</div>
    <div style="font-size:0.6rem;opacity:0.7;">${paidPillCnt} loans</div>
  </button>
  <button onclick="window.ui.fastInputState.statusFilter='due';window.ui.renderFastCollection();" style="flex:1;padding:0.5rem 0.4rem;border-radius:12px;border:2px solid ${sfL==="due"?"var(--danger)":"#e2e8f0"};background:${sfL==="due"?"rgba(239,68,68,0.08)":"white"};color:${sfL==="due"?"var(--danger)":"#64748b"};font-weight:700;font-size:0.73rem;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">
    <div style="display:flex;align-items:center;justify-content:center;gap:3px;font-size:0.6rem;opacity:0.8;letter-spacing:0.4px;"><i class="fa-solid fa-clock" style="font-size:0.55rem;"></i> DUE</div>
    <div style="font-size:0.9rem;font-weight:800;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${duePillAmt.toLocaleString()}</div>
    <div style="font-size:0.6rem;opacity:0.7;">${duePillCnt} loans</div>
  </button>
</div>`;
      }

      // Apply status filter
      const sfL2 = this.fastInputState.statusFilter;
      const finalItems = allFinalItems.filter((item) => {
        if (sfL2 === "all") return true;
        const s = item.scheduleItem, txn = item.existingTxn, l = item.loan;
        const dueAmt  = parseFloat(s?.amount || l.installmentAmount || 0);
        const paidAmt = parseFloat(s?.paidAmount || (txn ? txn.amount : 0));
        const done = (paidAmt >= dueAmt && dueAmt > 0) || s?.status === "PAID" || (!!txn && !s);
        return sfL2 === "paid" ? done : !done;
      });

      if (finalItems.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center;color:#94a3b8;margin-top:3rem;padding:2rem;"><div style="width:60px;height:60px;background:#f1f5f9;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;"><i class="fa-solid fa-filter" style="font-size:1.3rem;color:#cbd5e1;"></i></div><p style="font-weight:600;color:#64748b;margin-bottom:0.25rem;">No ${sfL2==="paid"?"paid":"due"} items</p><p style="font-size:0.85rem;">Switch filter above.</p></div>`;
        return;
      }

      const paidCount = finalItems.filter((i) => i.scheduleItem?.status === "PAID" || i.existingTxn).length;
      let totalExpected = 0, totalCollected = 0;
      finalItems.forEach((item) => {
        const s = item.scheduleItem, txn = item.existingTxn, l = item.loan;
        totalExpected  += parseFloat(s?.amount || l.installmentAmount || 0);
        totalCollected += parseFloat(s?.paidAmount || (txn ? txn.amount : 0));
      });
      const totalRemaining = Math.max(0, totalExpected - totalCollected);
      const collectionPct  = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
      const chartId = "loanChart_" + Math.random().toString(36).substr(2, 9);

      listContainer.innerHTML = `
<div style="background:white;border-radius:16px;border:1px solid #f1f5f9;box-shadow:0 4px 12px rgba(0,0,0,0.05);padding:1.25rem;margin-top:2.25rem;margin-bottom:1.5rem;display:flex;gap:1.5rem;flex-wrap:wrap;align-items:center;">
  <div style="width:120px;height:120px;position:relative;flex-shrink:0;margin:0 auto;"><canvas id="${chartId}"></canvas>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;"><div style="font-size:0.75rem;color:#94a3b8;font-weight:600;">Collected</div><div style="font-size:1.1rem;font-weight:700;color:var(--success);">${collectionPct}%</div></div>
  </div>
  <div style="flex:1;min-width:200px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
    <div><div style="font-size:0.75rem;color:#94a3b8;font-weight:600;text-transform:uppercase;">Total Expected</div><div style="font-size:1.25rem;font-weight:700;color:var(--text-main);"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalExpected.toLocaleString()}</div><div style="font-size:0.8rem;color:#64748b;margin-top:0.2rem;"><i class="fa-solid fa-users"></i> ${finalItems.length} Loans</div></div>
    <div><div style="font-size:0.75rem;color:#94a3b8;font-weight:600;text-transform:uppercase;">Total Collected</div><div style="font-size:1.25rem;font-weight:700;color:var(--success);"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalCollected.toLocaleString()}</div><div style="font-size:0.8rem;color:#64748b;margin-top:0.2rem;"><i class="fa-solid fa-check-circle"></i> ${paidCount} Paid</div></div>
    <div style="grid-column:span 2;background:#f8fafc;padding:0.75rem 1rem;border-radius:10px;display:flex;justify-content:space-between;align-items:center;"><div style="font-size:0.85rem;color:#64748b;font-weight:600;">Remaining Due</div><div style="font-size:1.15rem;font-weight:700;color:var(--danger);"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalRemaining.toLocaleString()}</div></div>
  </div></div>
</div>

${finalItems.map((item) => {
  const l = item.loan, b = item.borrower, s = item.scheduleItem, txn = item.existingTxn;
  const dueAmt      = parseFloat(s?.amount || l.installmentAmount || 0);
  const paidAmt     = parseFloat(s?.paidAmount || (txn ? txn.amount : 0));
  const remaining   = Math.max(0, dueAmt - paidAmt);
  const progressPct = dueAmt > 0 ? Math.min(100, Math.round((paidAmt / dueAmt) * 100)) : 0;
  const isPaid      = s ? s.status === "PAID"    : !!txn;
  const isPartial   = s ? s.status === "PARTIAL" : false;
  const statusColor = isPaid ? "var(--success)" : isPartial ? "#f59e0b" : "var(--danger)";
  const statusBg    = isPaid ? "rgba(16,185,129,0.08)" : isPartial ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";
  const statusText  = isPaid ? "PAID" : isPartial ? "PARTIAL" : "DUE";
  const statusIcon  = isPaid ? "fa-check-circle" : isPartial ? "fa-circle-half-stroke" : "fa-clock";
  const inputVal    = txn ? txn.amount : s ? remaining : dueAmt;
  return `
<div style="background:white;border-radius:16px;border:1px solid #f1f5f9;box-shadow:0 2px 8px rgba(0,0,0,0.04);margin-bottom:0.875rem;overflow:hidden;position:relative;">
  <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${statusColor};border-radius:4px 0 0 4px;"></div>
  <div style="padding:1rem 1rem 1rem 1.25rem;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.6rem;">
      <div>
        <div style="font-size:1rem;font-weight:700;color:var(--text-main);line-height:1.2;">${b.name}</div>
        <div style="display:flex;gap:0.4rem;align-items:center;margin-top:0.3rem;flex-wrap:wrap;">
          <span style="background:#f1f5f9;color:#64748b;padding:0.1rem 0.45rem;border-radius:5px;font-size:0.7rem;font-weight:600;">&#128218; #${b.serialNo || "N/A"}</span>
          <span style="color:#cbd5e1;font-size:0.7rem;">&bull;</span>
          <span style="color:#64748b;font-size:0.78rem;">&#128222; ${b.mobile || "-"}</span>
          ${s ? `<span style="color:#cbd5e1;font-size:0.7rem;">&bull;</span><span style="color:#94a3b8;font-size:0.75rem;">Inst. #${s.no}</span>` : ""}
        </div>
      </div>
      <span style="background:${statusBg};color:${statusColor};padding:0.3rem 0.65rem;border-radius:20px;font-size:0.72rem;font-weight:700;display:inline-flex;align-items:center;gap:0.3rem;white-space:nowrap;flex-shrink:0;"><i class="fa-solid ${statusIcon}" style="font-size:0.65rem;"></i> ${statusText}</span>
    </div>
    <div style="display:flex;gap:1rem;margin-bottom:0.75rem;padding:0.6rem 0.75rem;background:#f8fafc;border-radius:10px;">
      <div style="flex:1;text-align:center;"><div style="font-size:0.68rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Due</div><div style="font-size:1rem;font-weight:700;color:var(--text-main);"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${dueAmt.toLocaleString()}</div></div>
      <div style="width:1px;background:#e2e8f0;"></div>
      <div style="flex:1;text-align:center;"><div style="font-size:0.68rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Paid</div><div style="font-size:1rem;font-weight:700;color:var(--success);"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:0.9em; margin-right:4px; vertical-align:middle;"></i>${paidAmt.toLocaleString()}</div></div>
      <div style="width:1px;background:#e2e8f0;"></div>
      <div style="flex:1;text-align:center;"><div style="font-size:0.68rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Balance</div><div style="font-size:1rem;font-weight:700;color:${remaining > 0 ? "var(--danger)" : "var(--success)"};"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${remaining.toLocaleString()}</div></div>
    </div>
    ${dueAmt > 0 ? `<div style="margin-bottom:0.75rem;"><div style="height:5px;background:#f1f5f9;border-radius:99px;overflow:hidden;"><div style="height:100%;width:${progressPct}%;background:${statusColor};border-radius:99px;transition:width 0.4s ease;"></div></div><div style="font-size:0.68rem;color:#94a3b8;text-align:right;margin-top:0.2rem;">${progressPct}% collected</div></div>` : ""}
    <div style="display:flex;gap:0.75rem;align-items:center;">
      <div style="flex:1;position:relative;">
        <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:${statusColor};font-weight:700;font-size:1rem;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span></span>
        <input type="number" id="input-${l.id}"
          style="width:100%;padding:0.7rem 0.75rem 0.7rem 1.75rem;border-radius:10px;border:2px solid ${isPaid ? statusColor : "#e2e8f0"};font-size:1.05rem;font-weight:700;color:var(--text-main);background:${isPaid ? "#f0fdf4" : "#fff"};outline:none;transition:border-color 0.2s;"
          value="${inputVal}"
          onfocus="this.style.borderColor='var(--primary-color)'"
          onblur="this.style.borderColor='${isPaid ? statusColor : "#e2e8f0"}'"
          placeholder="Amount...">
      </div>
      <button
        style="background:${isPaid ? "#1e293b" : "var(--primary-color)"};color:white;border:none;border-radius:10px;padding:0 1.25rem;height:46px;font-weight:700;font-size:0.85rem;cursor:pointer;box-shadow:0 4px 6px -1px rgba(0,0,0,0.12);transition:transform 0.1s,opacity 0.1s;white-space:nowrap;display:inline-flex;align-items:center;gap:0.4rem;flex-shrink:0;"
        onclick="window.ui.saveFastEntry('${l.id}','${l.borrowerId}','${txn ? txn.id : null}',${item.scheduleIndex})"
        onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">
        <i class="fa-solid ${isPaid ? "fa-pen" : "fa-floppy-disk"}" style="font-size:0.8rem;"></i> ${isPaid ? "UPDATE" : "SAVE"}
      </button>
    </div>
  </div>
</div>`;
}).join("")}`;

      const ctx = document.getElementById(chartId);
      if (ctx && typeof Chart !== "undefined") {
        new Chart(ctx, {
          type: "doughnut",
          data: { labels: ["Collected","Remaining"], datasets: [{ data: [totalCollected, totalRemaining], backgroundColor: ["#10b981","#f1f5f9"], borderWidth: 0, cutout: "75%" }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => " ৳ " + c.raw.toLocaleString() } } } },
        });
      }
    };

    // â”€â”€ Savings list renderer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const renderSavingsList = async () => {
      const listContainer = document.getElementById("fast-collection-list");
      if (!listContainer) return;
      listContainer.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;"><i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem;"></i><p style="margin-top:0.75rem;font-size:0.9rem;">Loading savings deposits...</p></div>';

      const selectedDate = this.fastInputState.date;
      const allSavings   = await window.db.getAll("savings");
      const allTxns      = await window.db.getAll("savingsTransactions");

      const displayItems = await Promise.all(
        allSavings.filter((sav) => sav.status === "active" && (sav.frequency || "Daily") === this.fastInputState.tab).map(async (sav) => {
          const user = await window.db.get("borrowers", sav.userId);
          let scheduleItem = null, scheduleIndex = -1;

          if (sav.schedule && sav.schedule.length > 0) {
            scheduleIndex = sav.schedule.findIndex((it) => it.dueDate === selectedDate);
            if (scheduleIndex !== -1) scheduleItem = sav.schedule[scheduleIndex];
            else return null;
          } else {
            if (!sav.startDate) return null;
            const selDate   = new Date(selectedDate);
            const startDate = new Date(sav.startDate);
            if (startDate > selDate) return null;
            const freq = sav.frequency || "Flexible";
            if (freq === "Daily") { /* every day */ }
            else if (freq === "Weekly")  { if (selDate.getDay() !== 5) return null; }
            else if (freq === "Monthly") { if (startDate.getDate() !== selDate.getDate()) return null; }
            else return null;
          }

          const txn = allTxns.find((t) => t.savingsId === sav.id && t.date === selectedDate);
          return { savings: sav, user, scheduleItem, scheduleIndex, existingTxn: txn };
        }),
      );

      const search = this.fastInputState.search.toLowerCase();
      const allFinalItems = displayItems.filter((item) => {
        if (!item || !item.user) return false;
        if (!search) return true;
        const u = item.user;
        return (
          u.name.toLowerCase().includes(search) ||
          (u.mobile   || "").includes(search) ||
          (u.serialNo || "").includes(search) ||
          (item.savings.accountNo || "").includes(search)
        );
      });

      if (allFinalItems.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center;color:#94a3b8;margin-top:4rem;padding:2rem;"><div style="width:72px;height:72px;background:#faf5ff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;"><i class="fa-solid fa-piggy-bank" style="font-size:1.75rem;color:#c4b5fd;"></i></div><p style="font-weight:600;color:#64748b;margin-bottom:0.25rem;">No savings deposits for this date</p><p style="font-size:0.85rem;">Try a different date or check the savings schedule.</p></div>`;
        return;
      }

      // Compute pill amounts for Savings
      let paidPillAmt = 0, duePillAmt = 0;
      allFinalItems.forEach((item) => {
        const s = item.scheduleItem, sav = item.savings;
        const dueAmt  = parseFloat(s?.amount || sav.installmentAmount || 0);
        const paidAmt = parseFloat(s?.paidAmount || (item.existingTxn ? item.existingTxn.amount : 0));
        const done = (paidAmt >= dueAmt && dueAmt > 0) || s?.status === "PAID" || (!!item.existingTxn && !s);
        if (done) paidPillAmt += paidAmt; else duePillAmt += Math.max(0, dueAmt - paidAmt);
      });
      const paidPillCnt = allFinalItems.filter((item) => {
        const s = item.scheduleItem, sav = item.savings;
        const dueAmt  = parseFloat(s?.amount || sav.installmentAmount || 0);
        const paidAmt = parseFloat(s?.paidAmount || (item.existingTxn ? item.existingTxn.amount : 0));
        return (paidAmt >= dueAmt && dueAmt > 0) || s?.status === "PAID" || (!!item.existingTxn && !s);
      }).length;
      const duePillCnt = allFinalItems.length - paidPillCnt;

      // Inject filter pills
      const pillBarS = document.getElementById("filter-pill-bar");
      if (pillBarS) {
        const sfS = this.fastInputState.statusFilter;
        pillBarS.innerHTML = `<div style="display:flex;gap:0.5rem;padding:0.85rem 0 0.25rem 0;">
  <button onclick="window.ui.fastInputState.statusFilter='all';window.ui.renderFastCollection();" style="flex:1;padding:0.5rem 0.4rem;border-radius:12px;border:2px solid ${sfS==="all"?"#7c3aed":"#e2e8f0"};background:${sfS==="all"?"#7c3aed":"white"};color:${sfS==="all"?"white":"#64748b"};font-weight:700;font-size:0.73rem;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">
    <div style="font-size:0.6rem;opacity:0.8;letter-spacing:0.4px;">ALL</div>
    <div style="font-size:0.9rem;font-weight:800;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${(paidPillAmt+duePillAmt).toLocaleString()}</div>
    <div style="font-size:0.6rem;opacity:0.7;">${allFinalItems.length} accounts</div>
  </button>
  <button onclick="window.ui.fastInputState.statusFilter='paid';window.ui.renderFastCollection();" style="flex:1;padding:0.5rem 0.4rem;border-radius:12px;border:2px solid ${sfS==="paid"?"var(--success)":"#e2e8f0"};background:${sfS==="paid"?"rgba(16,185,129,0.1)":"white"};color:${sfS==="paid"?"var(--success)":"#64748b"};font-weight:700;font-size:0.73rem;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">
    <div style="display:flex;align-items:center;justify-content:center;gap:3px;font-size:0.6rem;opacity:0.8;letter-spacing:0.4px;"><i class="fa-solid fa-check-circle" style="font-size:0.55rem;"></i> DEPOSITED</div>
    <div style="font-size:0.9rem;font-weight:800;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${paidPillAmt.toLocaleString()}</div>
    <div style="font-size:0.6rem;opacity:0.7;">${paidPillCnt} accounts</div>
  </button>
  <button onclick="window.ui.fastInputState.statusFilter='due';window.ui.renderFastCollection();" style="flex:1;padding:0.5rem 0.4rem;border-radius:12px;border:2px solid ${sfS==="due"?"var(--danger)":"#e2e8f0"};background:${sfS==="due"?"rgba(239,68,68,0.08)":"white"};color:${sfS==="due"?"var(--danger)":"#64748b"};font-weight:700;font-size:0.73rem;cursor:pointer;transition:all 0.2s;text-align:center;line-height:1.4;">
    <div style="display:flex;align-items:center;justify-content:center;gap:3px;font-size:0.6rem;opacity:0.8;letter-spacing:0.4px;"><i class="fa-solid fa-clock" style="font-size:0.55rem;"></i> DUE</div>
    <div style="font-size:0.9rem;font-weight:800;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${duePillAmt.toLocaleString()}</div>
    <div style="font-size:0.6rem;opacity:0.7;">${duePillCnt} accounts</div>
  </button>
</div>`;
      }

      // Apply status filter
      const sfS2 = this.fastInputState.statusFilter;
      const finalItems = allFinalItems.filter((item) => {
        if (sfS2 === "all") return true;
        const s = item.scheduleItem, sav = item.savings;
        const dueAmt  = parseFloat(s?.amount || sav.installmentAmount || 0);
        const paidAmt = parseFloat(s?.paidAmount || (item.existingTxn ? item.existingTxn.amount : 0));
        const done = (paidAmt >= dueAmt && dueAmt > 0) || s?.status === "PAID" || (!!item.existingTxn && !s);
        return sfS2 === "paid" ? done : !done;
      });

      if (finalItems.length === 0) {
        listContainer.innerHTML = `<div style="text-align:center;color:#94a3b8;margin-top:3rem;padding:2rem;"><div style="width:60px;height:60px;background:#faf5ff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;"><i class="fa-solid fa-filter" style="font-size:1.3rem;color:#c4b5fd;"></i></div><p style="font-weight:600;color:#64748b;margin-bottom:0.25rem;">No ${sfS2==="paid"?"deposited":"due"} items</p><p style="font-size:0.85rem;">Switch filter above.</p></div>`;
        return;
      }

      const paidCount = allFinalItems.filter((i) => i.scheduleItem?.status === "PAID" || i.existingTxn).length;
      let totalExpected = 0, totalDeposited = 0;
      finalItems.forEach((item) => {
        const s = item.scheduleItem, sav = item.savings;
        totalExpected  += parseFloat(s?.amount || sav.installmentAmount || 0);
        totalDeposited += parseFloat(s?.paidAmount || (item.existingTxn ? item.existingTxn.amount : 0));
      });
      const totalRemaining = Math.max(0, totalExpected - totalDeposited);
      const depositPct     = totalExpected > 0 ? Math.round((totalDeposited / totalExpected) * 100) : 0;
      const chartId = "savChart_" + Math.random().toString(36).substr(2, 9);

      listContainer.innerHTML = `
<div style="background:white;border-radius:16px;border:1px solid #ede9fe;box-shadow:0 4px 12px rgba(139,92,246,0.08);padding:1.25rem;margin-top:2.25rem;margin-bottom:1.5rem;display:flex;gap:1.5rem;flex-wrap:wrap;align-items:center;">
  <div style="width:120px;height:120px;position:relative;flex-shrink:0;margin:0 auto;"><canvas id="${chartId}"></canvas>
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;"><div style="font-size:0.75rem;color:#94a3b8;font-weight:600;">Deposited</div><div style="font-size:1.1rem;font-weight:700;color:#8b5cf6;">${depositPct}%</div></div>
  </div>
  <div style="flex:1;min-width:200px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
    <div><div style="font-size:0.75rem;color:#94a3b8;font-weight:600;text-transform:uppercase;">Total Expected</div><div style="font-size:1.25rem;font-weight:700;color:var(--text-main);"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalExpected.toLocaleString()}</div><div style="font-size:0.8rem;color:#64748b;margin-top:0.2rem;"><i class="fa-solid fa-piggy-bank"></i> ${finalItems.length} Accounts</div></div>
    <div><div style="font-size:0.75rem;color:#94a3b8;font-weight:600;text-transform:uppercase;">Total Deposited</div><div style="font-size:1.25rem;font-weight:700;color:#8b5cf6;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalDeposited.toLocaleString()}</div><div style="font-size:0.8rem;color:#64748b;margin-top:0.2rem;"><i class="fa-solid fa-check-circle"></i> ${paidCount} Done</div></div>
    <div style="grid-column:span 2;background:#faf5ff;padding:0.75rem 1rem;border-radius:10px;display:flex;justify-content:space-between;align-items:center;"><div style="font-size:0.85rem;color:#7c3aed;font-weight:600;">Remaining Due</div><div style="font-size:1.15rem;font-weight:700;color:var(--danger);"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalRemaining.toLocaleString()}</div></div>
  </div></div>
</div>

${finalItems.map((item) => {
  const sav = item.savings, user = item.user, s = item.scheduleItem, txn = item.existingTxn;
  const dueAmt      = parseFloat(s?.amount || sav.installmentAmount || 0);
  const paidAmt     = parseFloat(s?.paidAmount || (txn ? txn.amount : 0));
  const remaining   = Math.max(0, dueAmt - paidAmt);
  const progressPct = dueAmt > 0 ? Math.min(100, Math.round((paidAmt / dueAmt) * 100)) : 0;
  const isPaid      = (paidAmt > 0 && paidAmt >= dueAmt) || (s ? s.status === "PAID" : !!txn);
  const isPartial   = !isPaid && paidAmt > 0;
  const statusColor = isPaid ? "var(--success)" : isPartial ? "#f59e0b" : "var(--danger)";
  const statusBg    = isPaid ? "rgba(16,185,129,0.08)" : isPartial ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)";
  const statusText  = isPaid ? "DEPOSITED" : isPartial ? "PARTIAL" : "DUE";
  const statusIcon  = isPaid ? "fa-check-circle" : isPartial ? "fa-circle-half-stroke" : "fa-clock";
  const inputVal    = txn ? txn.amount : s ? remaining : dueAmt;
  const acctNo      = sav.accountNo || sav.id.substr(0, 6).toUpperCase();
  const freq        = sav.frequency || "Flexible";
  return `
<div style="background:white;border-radius:16px;border:1px solid #f3e8ff;box-shadow:0 2px 8px rgba(139,92,246,0.06);margin-bottom:0.875rem;overflow:hidden;position:relative;">
  <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${statusColor};border-radius:4px 0 0 4px;"></div>
  <div style="padding:1rem 1rem 1rem 1.25rem;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.6rem;">
      <div>
        <div style="font-size:1rem;font-weight:700;color:var(--text-main);line-height:1.2;">${user.name}</div>
        <div style="display:flex;gap:0.4rem;align-items:center;margin-top:0.3rem;flex-wrap:wrap;">
          <span style="background:#f3e8ff;color:#7c3aed;padding:0.1rem 0.45rem;border-radius:5px;font-size:0.7rem;font-weight:600;">&#127974; #${acctNo}</span>
          <span style="color:#cbd5e1;font-size:0.7rem;">&bull;</span>
          <span style="color:#64748b;font-size:0.78rem;">&#128222; ${user.mobile || "-"}</span>
          <span style="color:#cbd5e1;font-size:0.7rem;">&bull;</span>
          <span style="background:#f1f5f9;color:#64748b;padding:0.1rem 0.45rem;border-radius:5px;font-size:0.7rem;font-weight:600;">${freq}</span>
          ${s ? `<span style="color:#cbd5e1;font-size:0.7rem;">&bull;</span><span style="color:#94a3b8;font-size:0.75rem;">Inst. #${s.no}</span>` : ""}
        </div>
      </div>
      <span style="background:${statusBg};color:${statusColor};padding:0.3rem 0.65rem;border-radius:20px;font-size:0.72rem;font-weight:700;display:inline-flex;align-items:center;gap:0.3rem;white-space:nowrap;flex-shrink:0;"><i class="fa-solid ${statusIcon}" style="font-size:0.65rem;"></i> ${statusText}</span>
    </div>
    <div style="display:flex;gap:1rem;margin-bottom:0.75rem;padding:0.6rem 0.75rem;background:#faf5ff;border-radius:10px;">
      <div style="flex:1;text-align:center;"><div style="font-size:0.68rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Due</div><div style="font-size:1rem;font-weight:700;color:var(--text-main);"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${dueAmt.toLocaleString()}</div></div>
      <div style="width:1px;background:#e9d5ff;"></div>
      <div style="flex:1;text-align:center;"><div style="font-size:0.68rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Deposited</div><div style="font-size:1rem;font-weight:700;color:#8b5cf6;"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:0.9em; margin-right:4px; vertical-align:middle;"></i>${paidAmt.toLocaleString()}</div></div>
      <div style="width:1px;background:#e9d5ff;"></div>
      <div style="flex:1;text-align:center;"><div style="font-size:0.68rem;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Balance</div><div style="font-size:1rem;font-weight:700;color:${remaining > 0 ? "var(--danger)" : "var(--success)"};"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${remaining.toLocaleString()}</div></div>
    </div>
    ${dueAmt > 0 ? `<div style="margin-bottom:0.75rem;"><div style="height:5px;background:#f3e8ff;border-radius:99px;overflow:hidden;"><div style="height:100%;width:${progressPct}%;background:${statusColor};border-radius:99px;transition:width 0.4s ease;"></div></div><div style="font-size:0.68rem;color:#94a3b8;text-align:right;margin-top:0.2rem;">${progressPct}% deposited</div></div>` : ""}
    <div style="display:flex;gap:0.75rem;align-items:center;">
      <div style="flex:1;position:relative;">
        <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:${statusColor};font-weight:700;font-size:1rem;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span></span>
        <input type="number" id="sav-input-${sav.id}"
          style="width:100%;padding:0.7rem 0.75rem 0.7rem 1.75rem;border-radius:10px;border:2px solid ${isPaid ? statusColor : "#e2e8f0"};font-size:1.05rem;font-weight:700;color:var(--text-main);background:${isPaid ? "#f0fdf4" : "#fff"};outline:none;transition:border-color 0.2s;"
          value="${inputVal}"
          onfocus="this.style.borderColor='var(--primary-color)'"
          onblur="this.style.borderColor='${isPaid ? statusColor : "#e2e8f0"}'"
          placeholder="Amount...">
      </div>
      <button
        style="background:${isPaid ? "#1e293b" : "var(--primary-color)"};color:white;border:none;border-radius:10px;padding:0 1.25rem;height:46px;font-weight:700;font-size:0.85rem;cursor:pointer;box-shadow:0 4px 6px -1px rgba(0,0,0,0.12);transition:transform 0.1s,opacity 0.1s;white-space:nowrap;display:inline-flex;align-items:center;gap:0.4rem;flex-shrink:0;"
        onclick="window.ui.saveFastSavingsEntry('${sav.id}','${user.id}','${txn ? txn.id : null}',${item.scheduleIndex})"
        onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'">
        <i class="fa-solid ${isPaid ? "fa-pen" : "fa-piggy-bank"}" style="font-size:0.8rem;"></i> ${isPaid ? "UPDATE" : "SAVE"}
      </button>
    </div>
  </div>
</div>`;
}).join("")}`;

      const ctx = document.getElementById(chartId);
      if (ctx && typeof Chart !== "undefined") {
        new Chart(ctx, {
          type: "doughnut",
          data: { labels: ["Deposited","Remaining"], datasets: [{ data: [totalDeposited, totalRemaining], backgroundColor: ["#8b5cf6","#f3e8ff"], borderWidth: 0, cutout: "75%" }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => " ৳ " + c.raw.toLocaleString() } } } },
        });
      }
    };

    // â”€â”€ Shell HTML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this.container.innerHTML = `
<div class="card" style="position:sticky;top:0;z-index:99;border-radius:0 0 16px 16px;margin:-1rem -1rem 1rem -1rem;padding:1.25rem 1rem 1rem 1rem;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">

  <!-- Mode Switcher -->
  <div style="display:flex;background:#f1f5f9;padding:0.25rem;border-radius:12px;gap:0;margin-bottom:1rem;">
    <button id="mode-loans" style="flex:1;padding:0.65rem 0.5rem;border:none;border-radius:10px;font-size:0.85rem;font-weight:700;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:0.4rem;">
      <i class="fa-solid fa-file-contract" style="font-size:0.8rem;"></i> Loan Collection
    </button>
    <button id="mode-savings" style="flex:1;padding:0.65rem 0.5rem;border:none;border-radius:10px;font-size:0.85rem;font-weight:700;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:0.4rem;">
      <i class="fa-solid fa-piggy-bank" style="font-size:0.8rem;"></i> Savings Deposit
    </button>
  </div>

  <!-- Date + Search -->
  <div style="display:flex;gap:0.75rem;margin-bottom:1rem;">
    <div style="flex:1;"><input type="date" id="collection-date" class="form-control" value="${this.fastInputState.date}" style="font-weight:500;"></div>
    <div style="flex:1.5;"><div style="position:relative;"><i class="fa-solid fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;"></i><input type="text" id="fast-search" class="form-control" placeholder="Search Name, Serial, Mobile..." value="${this.fastInputState.search}" style="padding-left:2.2rem;"></div></div>
  </div>

  <!-- Frequency Tabs -->
  <div id="freq-tabs-container" class="segmented-control" style="display:flex;background:#f1f5f9;padding:0.3rem;border-radius:12px;gap:0;">
    <button class="segment-btn" id="tab-Daily"   style="flex:1;">Daily</button>
    <button class="segment-btn" id="tab-Weekly"  style="flex:1;">Weekly</button>
    <button class="segment-btn" id="tab-Monthly" style="flex:1;">Monthly</button>
  </div>

</div>

<div id="filter-pill-bar" style="padding:0 0.1rem;"></div>

<div id="fast-collection-list" style="padding-bottom:6rem;"></div>`;

    // â”€â”€ Wire controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const updateModeButtons = () => {
      const isLoans = this.fastInputState.mode === "loans";
      const btnL = document.getElementById("mode-loans");
      const btnS = document.getElementById("mode-savings");
      const freqC = document.getElementById("freq-tabs-container");
      if (!btnL || !btnS) return;
      btnL.style.cssText = `flex:1;padding:0.65rem 0.5rem;border:none;border-radius:10px;font-size:0.85rem;font-weight:700;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:0.4rem;${isLoans ? "background:var(--primary-color);color:white;box-shadow:0 2px 8px rgba(37,99,235,0.3);" : "background:transparent;color:#64748b;"}`;
      btnS.style.cssText = `flex:1;padding:0.65rem 0.5rem;border:none;border-radius:10px;font-size:0.85rem;font-weight:700;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:0.4rem;${!isLoans ? "background:#7c3aed;color:white;box-shadow:0 2px 8px rgba(124,58,237,0.3);" : "background:transparent;color:#64748b;"}`;
      if (freqC) freqC.style.display = "flex";
    };

    const updateTabs = () => {
      ["Daily","Weekly","Monthly"].forEach((t) => {
        const btn = document.getElementById(`tab-${t}`);
        if (!btn) return;
        if (t === this.fastInputState.tab) btn.classList.add("active");
        else btn.classList.remove("active");
      });
    };

    const renderCurrent = () => {
      if (this.fastInputState.mode === "loans") renderLoanList();
      else renderSavingsList();
    };

    updateModeButtons();
    updateTabs();

    document.getElementById("mode-loans").onclick = () => {
      this.fastInputState.mode = "loans";
      this.fastInputState.statusFilter = "all";
      updateModeButtons();
      renderCurrent();
    };
    document.getElementById("mode-savings").onclick = () => {
      this.fastInputState.mode = "savings";
      this.fastInputState.statusFilter = "all";
      updateModeButtons();
      renderCurrent();
    };

    document.getElementById("collection-date").addEventListener("change", (e) => {
      this.fastInputState.date = e.target.value;
      this.fastInputState.statusFilter = "all";
      renderCurrent();
    });
    document.getElementById("fast-search").addEventListener("input", (e) => {
      this.fastInputState.search = e.target.value;
      renderCurrent();
    });
    ["Daily","Weekly","Monthly"].forEach((tab) => {
      document.getElementById(`tab-${tab}`).onclick = () => {
        this.fastInputState.tab = tab;
        this.fastInputState.statusFilter = "all";
        updateTabs();
        renderCurrent();
      };
    });

    renderCurrent();
  }

  async _ensureSchedulePersisted(loan) {
    if (loan.schedule && loan.schedule.length > 0) return loan;

    if (!loan.installmentsCount || !loan.startDate) return loan;

    const schedule = [];

    let currentDate = new Date(loan.startDate);

    let totalPaidTracker = parseFloat(loan.paidAmount || 0);

    for (let i = 1; i <= parseInt(loan.installmentsCount); i++) {
      const installmentAmt = parseFloat(loan.installmentAmount);

      let paidAmt = 0;

      let paidDate = "";

      let status = "DUE";

      let paymentHistory = [];

      if (totalPaidTracker >= installmentAmt) {
        paidAmt = installmentAmt;

        totalPaidTracker -= installmentAmt;

        status = "PAID";

        paidDate = loan.startDate;

        paymentHistory = [
          {
            amount: paidAmt,
            timestamp: `${paidDate}T00:00:00.000Z`,
            note: "initial",
          },
        ];
      } else if (totalPaidTracker > 0) {
        paidAmt = totalPaidTracker;

        totalPaidTracker = 0;

        status = "PARTIAL";

        paidDate = new Date().toISOString().split("T")[0];

        paymentHistory = [
          {
            amount: paidAmt,
            timestamp: new Date().toISOString(),
            note: "initial",
          },
        ];
      }

      schedule.push({
        no: i,

        dueDate: currentDate.toISOString().split("T")[0],

        amount: installmentAmt,

        paidAmount: paidAmt,

        paidDate: paidDate,

        paymentHistory: paymentHistory,

        status: status,
      });

      if (loan.frequency === "Weekly")
        currentDate.setDate(currentDate.getDate() + 7);
      else if (loan.frequency === "Monthly")
        currentDate.setMonth(currentDate.getMonth() + 1);
      else currentDate.setDate(currentDate.getDate() + 1);
    }

    loan.schedule = schedule;

    await window.db.add("loans", loan);

    return loan;
  }
  async saveFastEntry(loanId, borrowerId, existingTxnId, scheduleIndex = -1) {
    const inputEl = document.getElementById(`input-${loanId}`);

    if (!inputEl) return;

    const val = parseFloat(inputEl.value);

    const date = document.getElementById("collection-date").value;

    if (!val || val <= 0) {
      Swal.fire({
        icon: "error",

        title: "Invalid Amount",

        text: "Please enter a valid amount greater than 0",

        timer: 2000,

        showConfirmButton: false,
      });

      return;
    }

    const btn = inputEl.closest("div[style]")?.nextElementSibling;

    if (btn) {
      btn.disabled = true;
      btn.style.opacity = "0.6";
    }

    try {
      let loan = await window.db.get("loans", loanId);

      if (!loan) throw new Error("Loan not found");

      loan = await this._ensureSchedulePersisted(loan);

      let resolvedIndex = scheduleIndex;

      if (loan.schedule && loan.schedule.length > 0) {
        const byDate = loan.schedule.findIndex((s) => s.dueDate === date);

        if (byDate !== -1) {
          resolvedIndex = byDate;
        } else if (resolvedIndex === -1) {
          resolvedIndex = loan.schedule.findIndex((s) => s.status !== "PAID");
        }
      }

      if (existingTxnId && existingTxnId !== "null") {
        const txn = await window.db.get("transactions", existingTxnId);

        if (!txn) throw new Error("Transaction not found");

        const oldAmount = parseFloat(txn.amount || 0);

        const diff = val - oldAmount;

        txn.amount = val;

        txn.date = date;

        txn.timestamp = `${date}T${new Date().toISOString().split("T")[1]}`;

        await window.db.add("transactions", txn);

        loan.paidAmount = Math.max(
          0,
          parseFloat(loan.paidAmount || 0) + diff,
        ).toFixed(2);

        if (
          resolvedIndex >= 0 &&
          loan.schedule &&
          loan.schedule[resolvedIndex]
        ) {
          const item = loan.schedule[resolvedIndex];

          const newPaid = Math.max(0, parseFloat(item.paidAmount || 0) + diff);

          item.paidAmount = parseFloat(newPaid.toFixed(2));

          item.status =
            item.paidAmount >= item.amount
              ? "PAID"
              : item.paidAmount > 0
                ? "PARTIAL"
                : "DUE";

          if (diff !== 0) {
            this._appendPaymentHistory(
              item,
              diff,
              `Fast Input Edit (${date})`,
              date,
            );
          }
        }

        if (parseFloat(loan.paidAmount) >= parseFloat(loan.totalAmount))
          loan.status = "closed";

        await window.db.add("loans", loan);

        Swal.fire({
          icon: "success",

          title: "Updated!",

          text: `Payment on ${date} updated to <i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${val.toLocaleString()}`,

          timer: 1800,

          showConfirmButton: false,

          position: "top-end",

          toast: true,
        });
      } else {
        const txn = {
          id: crypto.randomUUID(),

          loanId,

          borrowerId,

          amount: val,

          date: date,

          timestamp: `${date}T${new Date().toISOString().split("T")[1]}`,
        };

        await window.db.add("transactions", txn);

        loan.paidAmount = (parseFloat(loan.paidAmount || 0) + val).toFixed(2);

        if (
          resolvedIndex >= 0 &&
          loan.schedule &&
          loan.schedule[resolvedIndex]
        ) {
          const item = loan.schedule[resolvedIndex];

          item.paidAmount = parseFloat(
            (parseFloat(item.paidAmount || 0) + val).toFixed(2),
          );

          item.status =
            item.paidAmount >= item.amount
              ? "PAID"
              : item.paidAmount > 0
                ? "PARTIAL"
                : "DUE";

          this._appendPaymentHistory(item, val, `Fast Input (${date})`, date);
        }

        if (parseFloat(loan.paidAmount) >= parseFloat(loan.totalAmount))
          loan.status = "closed";

        await window.db.add("loans", loan);

        Swal.fire({
          icon: "success",

          title: "Saved!",

          text: `<i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${val.toLocaleString()} collected on ${date}`,

          timer: 1800,

          showConfirmButton: false,

          position: "top-end",

          toast: true,
        });
      }

      this.renderFastCollection();
    } catch (e) {
      console.error("saveFastEntry error:", e);

      Swal.fire({
        icon: "error",

        title: "Error",

        text: "Failed to save. Please try again.",

        timer: 3000,
      });
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = "1";
      }
    }
  }


  async saveFastSavingsEntry(savingsId, userId, existingTxnId, scheduleIndex = -1) {
    const inputEl = document.getElementById(`sav-input-${savingsId}`);
    if (!inputEl) return;

    const val  = parseFloat(inputEl.value);
    const date = document.getElementById("collection-date").value;

    if (!val || val <= 0) {
      Swal.fire({ icon: "error", title: "Invalid Amount", text: "Please enter a valid amount greater than 0", timer: 2000, showConfirmButton: false });
      return;
    }

    const btn = inputEl.parentElement?.nextElementSibling;
    if (btn) { btn.disabled = true; btn.style.opacity = "0.6"; }

    try {
      let savings = await window.db.get("savings", savingsId);
      if (!savings) throw new Error("Savings account not found");

      let resolvedIndex = scheduleIndex;
      if (savings.schedule && savings.schedule.length > 0) {
        const byDate = savings.schedule.findIndex((s) => s.dueDate === date);
        if (byDate !== -1) resolvedIndex = byDate;
        else if (resolvedIndex === -1)
          resolvedIndex = savings.schedule.findIndex((s) => s.status !== "PAID");
      }

      if (existingTxnId && existingTxnId !== "null") {
        // â”€â”€ Update existing deposit â”€â”€
        const txn = await window.db.get("savingsTransactions", existingTxnId);
        if (!txn) throw new Error("Transaction not found");

        const oldAmount = parseFloat(txn.amount || 0);
        const diff      = val - oldAmount;
        txn.amount = val;
        txn.date   = date;
        txn.timestamp = `${date}T${new Date().toISOString().split("T")[1]}`;
        await window.db.add("savingsTransactions", txn);

        if (resolvedIndex >= 0 && savings.schedule && savings.schedule[resolvedIndex]) {
          const item   = savings.schedule[resolvedIndex];
          const newPaid = Math.max(0, parseFloat(item.paidAmount || 0) + diff);
          item.paidAmount = parseFloat(newPaid.toFixed(2));
          item.status = item.paidAmount >= item.amount ? "PAID" : item.paidAmount > 0 ? "PARTIAL" : "DUE";
          if (diff !== 0) {
            if (!item.paymentHistory) item.paymentHistory = [];
            item.paymentHistory.push({
              amount: diff,
              timestamp: new Date().toISOString(),
              note: `Fast Input Edit (${date})`,
              receivedBy: localStorage.getItem('fincollect_user') || 'Admin'
            });
          }
        }

        await window.db.add("savings", savings);

        Swal.fire({ icon: "success", title: "Updated!", text: `Deposit on ${date} updated to \u20B9${val.toLocaleString()}`, timer: 1800, showConfirmButton: false, position: "top-end", toast: true });
      } else {
        // â”€â”€ New deposit â”€â”€
        const txn = {
          id: crypto.randomUUID(),
          savingsId,
          userId,
          amount: val,
          date,
          timestamp: `${date}T${new Date().toISOString().split("T")[1]}`,
          note: `Fast Input (${date})`,
        };
        await window.db.add("savingsTransactions", txn);

        if (resolvedIndex >= 0 && savings.schedule && savings.schedule[resolvedIndex]) {
          const item = savings.schedule[resolvedIndex];
          item.paidAmount = parseFloat((parseFloat(item.paidAmount || 0) + val).toFixed(2));
          item.status = item.paidAmount >= item.amount ? "PAID" : item.paidAmount > 0 ? "PARTIAL" : "DUE";
          if (!item.paymentHistory) item.paymentHistory = [];
          item.paymentHistory.push({
            amount: val,
            timestamp: new Date().toISOString(),
            note: `Fast Input (${date})`,
            receivedBy: localStorage.getItem('fincollect_user') || 'Admin'
          });
        }

        await window.db.add("savings", savings);

        Swal.fire({ icon: "success", title: "Saved!", text: `\u20B9${val.toLocaleString()} deposited on ${date}`, timer: 1800, showConfirmButton: false, position: "top-end", toast: true });
      }

      this.renderFastCollection();
    } catch (e) {
      console.error("saveFastSavingsEntry error:", e);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to save deposit. Please try again.", timer: 3000 });
    } finally {
      if (btn) { btn.disabled = false; btn.style.opacity = "1"; }
    }
  }


  async openEditLoanModal(loanId) {
    const loan = await window.db.get("loans", loanId);

    const borrower = await window.db.get("borrowers", loan.borrowerId);

    const existing = document.getElementById("edit-loan-modal");

    if (existing) existing.remove();

    const modalHtml = `


<div id="edit-loan-modal" class="modal-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; display:flex; align-items:center; justify-content:center; padding:1rem;">



<div class="modal-content" style="background:white; width:100%; max-width:500px; max-height:90vh; overflow-y:auto; border-radius:16px; padding:1.5rem; position:relative; animation: slideUp 0.3s ease-out;">




<button onclick="document.getElementById('edit-loan-modal').remove()" style="position:absolute; right:1.5rem; top:1.5rem; background:none; border:none; font-size:1.5rem; color:#94a3b8; cursor:pointer;">





<i class="fa-solid fa-xmark"></i>




</button>









<h3 style="margin-top:0; margin-bottom:0.5rem; font-size:1.25rem;">Edit Loan</h3>




<p style="color:#64748b; font-size:0.9rem; margin-bottom:1.5rem;">${borrower.name} • #${loan.loanNo || loan.id.substr(0, 4)}</p>




<form id="edit-loan-form">





<input type="hidden" name="id" value="${loan.id}">











<div class="grid-2">






 <div class="form-group">







<label>Total Amount</label>







<input type="number" class="form-control" name="totalAmount" value="${loan.totalAmount}">






</div>






<div class="form-group">







<label>Installment Amount</label>







<input type="number" class="form-control" name="installmentAmount" value="${loan.installmentAmount}">






</div>





</div>





 <div class="grid-2">






 <div class="form-group">







<label>Frequency</label>







<select class="form-control" name="frequency">








<option value="Daily" ${loan.frequency === "Daily" ? "selected" : ""}>Daily</option>








<option value="Weekly" ${loan.frequency === "Weekly" ? "selected" : ""}>Weekly</option>








<option value="Monthly" ${loan.frequency === "Monthly" ? "selected" : ""}>Monthly</option>







</select>






</div>






<div class="form-group">







<label>Status</label>







<select class="form-control" name="status">








<option value="active" ${loan.status === "active" ? "selected" : ""}>Active</option>








<option value="closed" ${loan.status === "closed" ? "selected" : ""}>Closed</option>







</select>






</div>





</div>





<div class="grid-2">






<div class="form-group">







<label>Start Date</label>







<input type="date" class="form-control" name="startDate" value="${loan.startDate}">






</div>






<div class="form-group">







<label>End Date</label>







<input type="date" class="form-control" name="endDate" value="${loan.endDate}">






</div>





</div>





<button type="submit" class="btn btn-primary" style="width:100%; justify-content:center; margin-top:1rem;">UPDATE LOAN</button>




</form>



</div>


</div>

`;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    document.getElementById("edit-loan-form").onsubmit = async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);

      const data = Object.fromEntries(formData.entries());

      const updatedLoan = { ...loan, ...data };

      try {
        await window.db.add("loans", updatedLoan);

        document.getElementById("edit-loan-modal").remove();

        Swal.fire({
          icon: "success",

          title: "Loan Updated",

          timer: 1500,

          showConfirmButton: false,
        });

        if (document.getElementById("loan-list-container")) {
          this.renderLoanList();
        } else if (document.getElementById("loan-details-view")) {
          this.renderLoanDetail(loan.id);
        }
      } catch (err) {
        console.error(err);

        Swal.fire("Error", "Failed to update loan", "error");
      }
    };
  }
  async renderBorrowerDetail(id) {
    this.setTitle("Borrower Details");

    this.hideFab();

    const b = await window.db.get("borrowers", id);

    if (!b) {
      this.container.innerHTML = "Borrower not found";
      return;
    }

    const allLoans = await window.db.getAll("loans");

    const userLoans = allLoans.filter((l) => l.borrowerId === id);

    const addLoanBtn = `


<button class="btn btn-primary" onclick="window.app.navigate('add-loan', '${id}')" style="margin-top:1rem;">



<i class="fa-solid fa-plus"></i> Add New Loan


</button>

`;

    this.container.innerHTML = `


<div class="card">



 <div style="display:flex; gap:1rem; align-items:center;">




 <img src="${b.photo || "https://ui-avatars.com/api/?name=" + b.name}" style="width:80px;height:80px;border-radius:12px;object-fit:cover; background:#eee;">




 <div>





<h3 style="margin-bottom:0.25rem;">${b.name}</h3>





<p style="color:var(--text-muted); font-size:0.9rem;">${b.address}</p>





<div style="margin-top:0.5rem; display:flex; gap:0.5rem;">






<a href="tel:${b.mobile}" class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.8rem;"><i class="fa-solid fa-phone"></i> Call</a>





</div>




 </div>




 <div style="margin-left:auto;">





 <button class="btn btn-secondary btn-sm" onclick="window.app.navigate('add-borrower', '${b.id}')">






<i class="fa-solid fa-pen"></i> Edit





 </button>




 </div>



</div>



 <div style="margin-top:1.5rem; border-top:1px solid #f1f5f9; padding-top:1rem;">




<div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">





 <div><small style="color:var(--text-muted)">Aadhar</small><div>${b.aadhar || "-"}</div></div>




</div>




${
  b.aadharFront || b.aadharBack
    ? `





<div style="margin-top:1rem;">






  <small style="color:var(--text-muted)">Documents</small>






  <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">







   ${b.aadharFront ? `<img src="${b.aadharFront}" style="width:40px;height:40px;border-radius:4px;cursor:pointer;" onclick="Swal.fire({imageUrl: '${b.aadharFront}', imageAlt: 'Aadhar Front'})">` : ""}







   ${b.aadharBack ? `<img src="${b.aadharBack}" style="width:40px;height:40px;border-radius:4px;cursor:pointer;" onclick="Swal.fire({imageUrl: '${b.aadharBack}', imageAlt: 'Aadhar Back'})">` : ""}






  </div>





</div>




`
    : ""
}



</div>


</div>


<div style="display:flex; justify-content:space-between; align-items:center; margin-top:2rem; margin-bottom:1rem;">



<h3>Active Loans (${userLoans.length})</h3>



${addLoanBtn}


</div>


${userLoans
  .map(
    (l) => `



<div class="card" onclick="window.app.navigate('loan-detail', '${l.id}')" style="cursor:pointer; border-left: 4px solid ${l.status === "active" ? "var(--success)" : "#cbd5e1"};">




 <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; border-bottom:1px solid #f1f5f9; padding-bottom:0.5rem;">





<span style="font-weight:600;">Loan #${l.loanNo || l.id.substr(0, 4)} (${l.frequency || "Daily"})</span>





<span class="status-badge status-active">${l.status}</span>




 </div>









  <div class="grid-2" style="margin-bottom:1rem;">





<div>






<div style="font-size:0.75rem; color:var(--text-muted);">Start Date</div>






<div style="font-size:0.9rem;">${l.startDate}</div>





</div>





<div>






<div style="font-size:0.75rem; color:var(--text-muted);">End Date</div>






<div style="font-size:0.9rem;">${l.endDate}</div>





</div>




 </div>




 <div class="grid-3" style="text-align:center; background:#f8fafc; padding:0.75rem; border-radius:8px;">





<div>






<div style="font-size:0.75rem; color:var(--text-muted);">Total Loan</div>






<div style="font-weight:700;"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:0.9em; margin-right:4px; vertical-align:middle;"></i>${parseInt(l.totalAmount).toLocaleString()}</div>





</div>





<div>






<div style="font-size:0.75rem; color:var(--text-muted);">Paid</div>






<div style="font-weight:700; color:var(--success);"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:0.9em; margin-right:4px; vertical-align:middle;"></i>${parseInt(l.paidAmount).toLocaleString()}</div>





</div>





<div>






<div style="font-size:0.75rem; color:var(--text-muted);">Balance</div>






<div style="font-weight:700; color:var(--danger);"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:0.9em; margin-right:4px; vertical-align:middle;"></i>${(parseFloat(l.totalAmount) - parseFloat(l.paidAmount)).toLocaleString()}</div>





</div>




 </div>









 <div style="margin-top:1rem;">





<div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.5rem;">Installment Details</div>





 <table style="width:100%; font-size:0.85rem;">






<tr>







<td style="padding:0.25rem 0;">EMI Amount</td>







<td style="text-align:right; font-weight:600;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${l.installmentAmount}</td>






</tr>






<tr>







<td style="padding:0.25rem 0;">Total Installments</td>







<td style="text-align:right;">${l.installmentsCount}</td>






</tr>






<tr>







<td style="padding:0.25rem 0;">Dues Paid</td>







<!-- Simple calc for dues paid count -->







<td style="text-align:right;">${Math.floor(l.paidAmount / l.installmentAmount)} / ${l.installmentsCount}</td>






</tr>





 </table>




 </div>




 <div style="margin-top:1rem; text-align:center;">





<button class="btn btn-secondary btn-sm" onclick="alert('View Transaction History functionality coming soon!')" style="width:100%; justify-content:center; font-size:0.8rem;">






View Statement / History





</button>




 </div>



</div>


`,
  )
  .join("")}

`;
  }
  async renderLoanDetail(id) {
    this.setTitle("Loan Details");

    this.showFab(() => {
      window.ui.showPayModal(id);
    });

    const loan = await window.db.get("loans", id);

    if (!loan) return;

    const borrower = await window.db.get("borrowers", loan.borrowerId);

    const balance = parseFloat(loan.totalAmount) - parseFloat(loan.paidAmount);

    const progressPercent = Math.min(
      100,
      Math.round(
        (parseFloat(loan.paidAmount) / parseFloat(loan.totalAmount)) * 100,
      ),
    );

    let scheduleData = loan.schedule || [];

    if (scheduleData.length === 0 && loan.installmentsCount) {
      let currentDate = new Date(loan.startDate);

      let totalPaidTracker = parseFloat(loan.paidAmount || 0);

      for (let i = 1; i <= parseInt(loan.installmentsCount); i++) {
        const installmentAmt = parseFloat(loan.installmentAmount);

        let paidAmt = 0;

        let paidDate = "";

        let status = "DUE";

        let paymentHistory = [];

        if (totalPaidTracker >= installmentAmt) {
          paidAmt = installmentAmt;

          totalPaidTracker -= installmentAmt;

          status = "PAID";

          paidDate = loan.startDate;
        } else if (totalPaidTracker > 0) {
          paidAmt = totalPaidTracker;

          totalPaidTracker = 0;

          status = "PARTIAL";

          paidDate = new Date().toISOString().split("T")[0];
        }

        if (paidAmt > 0) {
          paymentHistory = [
            {
              amount: paidAmt,
              timestamp: `${paidDate}T00:00:00.000Z`,
              note: "initial",
            },
          ];
        }

        scheduleData.push({
          no: i,

          dueDate: currentDate.toISOString().split("T")[0],

          amount: installmentAmt,

          paidAmount: paidAmt,

          paidDate: paidDate,

          paymentHistory: paymentHistory,

          status: status,
        });

        if (loan.frequency === "Weekly")
          currentDate.setDate(currentDate.getDate() + 7);
        else if (loan.frequency === "Monthly")
          currentDate.setMonth(currentDate.getMonth() + 1);
        else currentDate.setDate(currentDate.getDate() + 1);
      }

      loan.schedule = scheduleData;

      await window.db.add("loans", loan);
    }

    const paidCount = scheduleData.filter((s) => s.status === "PAID").length;

    const rows = scheduleData
      .map((item, index) => {
        const ratio = item.paidAmount / item.amount;

        let statusBadge = "";

        if (ratio >= 1)
          statusBadge = `<span class="status-badge status-active">PAID</span>`;
        else if (ratio > 0)
          statusBadge = `<span class="status-badge" style="background:#fef3c7; color:#d97706;">PARTIAL</span>`;
        else
          statusBadge = `<span class="status-badge" style="background:#fee2e2; color:#ef4444;">DUE</span>`;

        const history = item.paymentHistory || [];

        const historyHtml =
          history.length > 0
            ? history
                .map((h) => {
                  const dt = new Date(h.timestamp);

                  const dateStr = dt.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                  });

                  const timeStr = dt.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });

                  return `<span class="pay-history-entry" title="${h.note || ""} • ${dt.toLocaleString()}">





<span class="entry-dot"></span>





<span class="entry-amount"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${h.amount}</span>





<span style="color:#64748b; font-weight:500;">${dateStr} ${timeStr}</span>




</span>`;
                })
                .join("")
            : `<span class="pay-history-empty">No payments yet</span>`;

        const _lLastEntry = history.length > 0 ? history[history.length - 1] : null;
        const receivedByHtml = _lLastEntry && _lLastEntry.receivedBy
          ? (() => {
              const rDt = new Date(_lLastEntry.timestamp);
              const rDate = rDt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
              const rTime = rDt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
              return `<div class="received-by-cell">
                <div class="rb-name-badge"><i class="fa-solid fa-user-shield"></i> ${_lLastEntry.receivedBy}</div>
                <div class="rb-timestamp">${rDate} · ${rTime}</div>
              </div>`;
            })()
          : `<span class="received-by-empty">—</span>`;

        return `



<tr class="schedule-row"




data-index="${index}"




data-due-date="${item.dueDate}"




data-amount="${item.amount}"




data-no="${item.no}">




<td style="padding:0.75rem 0.5rem; text-align:center; color:#64748b; font-weight:600;">${item.no}</td>




<td style="padding:0.75rem 0.5rem; font-weight:500;">${item.dueDate}</td>




<td style="padding:0.75rem 0.5rem;">${statusBadge}</td>




<td style="padding:0.75rem 0.5rem; font-weight:600;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${item.amount}</td>




<!-- Payment History -->




<td style="padding:0.5rem 0.75rem;">





<div class="payment-history-cell">






${historyHtml}






<button class="log-payment-btn" onclick="window.ui.logManualPayment('${id}', ${index})">







<i class="fa-solid fa-plus" style="font-size:0.65rem;"></i> Log






</button>





</div>




</td>




<!-- Received By -->
<td style="padding:0.5rem 0.75rem;">
  ${receivedByHtml}
</td>




<td style="padding:0.5rem;">





<input type="number"






class="form-control schedule-amount"






value="${item.paidAmount}"






data-prev-paid="${item.paidAmount}"






style="font-size:0.9rem; padding:0.4rem; font-weight:600; width:100px;">




</td>



</tr>


`;
      })
      .join("");

    const scheduleHtml = `


<div style="display:flex; justify-content:space-between; align-items:center; margin:2rem 0 1rem;">



<h4 style="margin:0; display:flex; align-items:center; gap:0.5rem;">




<i class="fa-solid fa-list-ol" style="color:var(--primary-color);"></i> Installment Schedule



</h4>



<button class="btn btn-primary btn-sm" onclick="window.ui.saveSchedule('${id}')">




<i class="fa-solid fa-cloud-arrow-up"></i> Save Schedule



</button>


</div>





<div class="card" style="padding:0; overflow:hidden; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); overflow-x:auto;">



<table class="modern-table" style="width:100%; min-width:640px; border-collapse:collapse;">




<thead style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">





<tr>






<th style="text-align:center; width:50px;">No</th>






<th>Due Date</th>






<th>Status</th>






<th>Due Amount</th>






<th>Payment History</th>






<th style="min-width:150px;">Received By</th>






<th>Paid Amount</th>





</tr>




</thead>




<tbody>





${rows}




</tbody>



</table>


</div>

`;

    this.container.innerHTML = `


<div class="card" style="border-radius:16px; margin-bottom:1.5rem; position:relative;">



 <div style="display:flex; gap:1.5rem; flex-wrap:wrap;">




 <div style="position:relative; flex-shrink:0;">





<img src="${borrower.photo || "https://ui-avatars.com/api/?name=" + borrower.name}" style="width:100px;height:100px;border-radius:12px; object-fit:cover; border:1px solid #e2e8f0; box-shadow:0 4px 6px rgba(0,0,0,0.05);">




 </div>




 <div style="flex:1; min-width:250px;">





<div style="display:flex; justify-content:space-between; align-items:start;">






<div>







<h2 style="margin:0; font-size:1.5rem; color:var(--text-main);">${borrower.name}</h2>







<div style="display:flex; gap:0.75rem; margin-top:0.5rem; flex-wrap:wrap;">








<span class="info-tag"><i class="fa-solid fa-book"></i> Book #${borrower.serialNo || "N/A"}</span>








<span class="info-tag"><i class="fa-solid fa-phone"></i> ${borrower.mobile}</span>








<span class="info-tag"><i class="fa-solid fa-mars-and-venus"></i> ${borrower.gender || "-"}</span>








<span class="info-tag"><i class="fa-solid fa-ring"></i> ${borrower.married || "-"}</span>







</div>






</div>






<button class="btn btn-secondary" onclick="window.ui.generateReport('${id}')" title="Download Report">







<i class="fa-solid fa-file-pdf" style="color:#ef4444;"></i> Report






</button>





</div>











<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:1rem; margin-top:1.5rem; padding-top:1.5rem; border-top:1px dashed #e2e8f0;">






<div>







<small style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Aadhar Number</small>







<div style="font-weight:600;">${borrower.aadhar || "-"}</div>






</div>






 <div>







<small style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Address</small>







<div style="font-weight:600; font-size:0.9rem;">${borrower.address || "-"}</div>






</div>






<div>







<small style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Loan ID</small>







<div style="font-weight:600; font-size:0.9rem;">#${loan.loanNo || loan.id.substr(0, 4)}</div>






</div>





</div>




 </div>



</div>


</div>


<div class="grid-4">



 <div class="card stat-card">




<span class="stat-label">Total Loan</span>




<span class="stat-value"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${parseInt(loan.totalAmount).toLocaleString()}</span>



</div>



 <div class="card stat-card">




<span class="stat-label">Total Paid</span>




<span class="stat-value text-success"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${parseInt(loan.paidAmount).toLocaleString()}</span>



</div>



 <div class="card stat-card">




<span class="stat-label">Balance</span>




<span class="stat-value text-danger"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${balance.toLocaleString()}</span>



</div>



 <div class="card stat-card">




<span class="stat-label">Installments</span>




<span class="stat-value" style="color:var(--primary-color)">${paidCount}/${loan.installmentsCount}</span>



</div>


</div>


${scheduleHtml}

`;
  }
  async saveSchedule(loanId) {
    const rows = document.querySelectorAll(".schedule-row");

    const loan = await window.db.get("loans", loanId);

    if (!loan) return;

    const existingSchedule = loan.schedule || [];

    let totalPaid = 0;

    let newSchedule = [];

    rows.forEach((row) => {
      const index = parseInt(row.dataset.index);

      const dueDate = row.dataset.dueDate;

      const amount = parseFloat(row.dataset.amount);

      const no = parseInt(row.dataset.no);

      const paidAmountInput = row.querySelector(".schedule-amount");

      const paidAmt = parseFloat(paidAmountInput.value) || 0;

      const prevPaid = parseFloat(paidAmountInput.dataset.prevPaid) || 0;

      const existing = existingSchedule[index] || {};

      let paymentHistory = existing.paymentHistory
        ? [...existing.paymentHistory]
        : [];

      if (paidAmt !== prevPaid) {
        const diff = paidAmt - prevPaid;

        if (diff !== 0) {
          paymentHistory.push({
            amount: parseFloat(diff.toFixed(2)),

            timestamp: new Date().toISOString(),

            note: diff > 0 ? "manual edit (+)" : "manual edit (-)",

            receivedBy: localStorage.getItem('fincollect_user') || 'Admin',
          });
        }
      }

      const lastEntry = paymentHistory[paymentHistory.length - 1];

      const paidDate = lastEntry
        ? lastEntry.timestamp.split("T")[0]
        : existing.paidDate || "";

      totalPaid += paidAmt;

      newSchedule.push({
        no: no,

        dueDate: dueDate,

        amount: amount,

        paidAmount: paidAmt,

        paidDate: paidDate,

        paymentHistory: paymentHistory,

        status: paidAmt >= amount ? "PAID" : paidAmt > 0 ? "PARTIAL" : "DUE",
      });
    });

    loan.schedule = newSchedule;

    loan.paidAmount = totalPaid.toFixed(2);

    if (parseFloat(loan.paidAmount) >= parseFloat(loan.totalAmount)) {
      loan.status = "closed";
    }

    await window.db.add("loans", loan);

    Swal.fire({
      icon: "success",

      title: "Schedule Saved",

      text: "Loan schedule updated and synced.",

      toast: true,

      position: "top-end",

      timer: 2000,

      showConfirmButton: false,
    });

    this.renderLoanDetail(loanId);
  }

  _appendPaymentHistory(
    scheduleItem,
    amount,
    note = "payment",
    customDate = null,
  ) {
    if (!scheduleItem.paymentHistory) scheduleItem.paymentHistory = [];

    let ts = new Date().toISOString();

    if (customDate) {
      ts = `${customDate}T${ts.split("T")[1]}`;
    }

    scheduleItem.paymentHistory.push({
      amount: parseFloat(amount.toFixed(2)),

      timestamp: ts,

      note,

      receivedBy: localStorage.getItem('fincollect_user') || 'Admin',
    });

    scheduleItem.paidDate = customDate ? customDate : ts.split("T")[0];

    return scheduleItem;
  }

  async logManualPayment(loanId, rowIndex) {
    const { value: amtStr } = await Swal.fire({
      title: "Log Payment",

      input: "number",

      inputLabel: "Payment Amount (৳)",

      inputPlaceholder: "0",

      inputAttributes: { min: "0", step: "0.01" },

      showCancelButton: true,

      confirmButtonText: "Log",

      confirmButtonColor: "var(--primary-color)",
    });

    if (!amtStr) return;

    const amt = parseFloat(amtStr);

    if (isNaN(amt) || amt <= 0) return;

    const loan = await window.db.get("loans", loanId);

    if (!loan || !loan.schedule) return;

    const item = loan.schedule[rowIndex];

    if (!item) return;

    this._appendPaymentHistory(item, amt, "manual log");

    item.paidAmount = parseFloat(item.paidAmount) + amt;

    item.status =
      item.paidAmount >= item.amount
        ? "PAID"
        : item.paidAmount > 0
          ? "PARTIAL"
          : "DUE";

    loan.paidAmount = (parseFloat(loan.paidAmount) + amt).toString();

    await window.db.add("loans", loan);

    Swal.fire({
      icon: "success",
      title: "Logged!",
      toast: true,
      position: "top-end",
      timer: 1500,
      showConfirmButton: false,
    });

    this.renderLoanDetail(loanId);
  }
  async generateReport(loanId) {
    const loan = await window.db.get("loans", loanId);
    if (!loan) return;
    const borrower = await window.db.get("borrowers", loan.borrowerId);
    
    // Fetch all transactions for this loan to build the Ledger
    const allTxns = await window.db.getAll("transactions");
    const loanTxns = allTxns.filter(t => t.loanId === loanId)
                            .sort((a, b) => new Date(a.date) - new Date(b.date));

    const totalAmt = parseFloat(loan.totalAmount || 0);
    const paidAmt  = parseFloat(loan.paidAmount || 0);
    const balance  = Math.max(0, totalAmt - paidAmt);
    const progress = totalAmt > 0 ? Math.min(100, ((paidAmt / totalAmt) * 100).toFixed(1)) : 0;
    
    const genDate = new Date().toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true });
    const generatedBy = localStorage.getItem('fincollect_user') || 'Admin';

    /* ── Schedule Rows ── */
    let scheduleRows = "";
    if (loan.schedule) {
      scheduleRows = loan.schedule.map((item) => {
        const history = item.paymentHistory || [];
        const lastEntry = history.length > 0 ? history[history.length - 1] : null;
        const lastPaidStr = lastEntry 
          ? new Date(lastEntry.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })
          : item.paidDate || "-";
        
        const receivedBy = lastEntry && lastEntry.receivedBy ? lastEntry.receivedBy : "-";
        const badgeStyle = item.status === 'PAID' 
          ? 'background:#dcfce7;color:#16a34a;' 
          : item.status === 'PARTIAL' ? 'background:#fef9c3;color:#ca8a04;' : 'background:#fee2e2;color:#dc2626;';

        return `<tr>
          <td style="text-align:center; font-weight:700; color:#64748b;">${item.no}</td>
          <td style="font-weight:600;">${new Date(item.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
          <td><span style="${badgeStyle}display:inline-block;padding:3px 9px;border-radius:12px;font-size:7pt;font-weight:700;">${item.status}</span></td>
          <td class="amt" style="text-align:right;"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:8pt; vertical-align:middle; margin-right:2px;"></i><span style="display:none"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span></span>${parseFloat(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td style="text-align:center; color:#64748b;">${lastPaidStr}</td>
          <td class="amt" style="text-align:right; color:${item.paidAmount > 0 ? "#16a34a" : "inherit"}; font-weight:700;"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:8pt; vertical-align:middle; margin-right:2px;"></i><span style="display:none"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span></span>${parseFloat(item.paidAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td style="color:#4338ca; font-weight:600; font-size:7.5pt;">${receivedBy}</td>
        </tr>`;
      }).join("");
    }

    /* ── Payment Ledger Rows ── */
    const ledgerRows = loanTxns.map((t, i) => `
      <tr>
        <td style="text-align:center; color:#64748b; font-weight:700;">${i + 1}</td>
        <td>${t.date}</td>
        <td class="amt" style="text-align:right; color:#16a34a; font-weight:700;"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:8pt; vertical-align:middle; margin-right:2px;"></i><span style="display:none"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span></span>${parseFloat(t.amount).toLocaleString('en-IN',{minimumFractionDigits:2})}</td>
        <td style="color:#4338ca; font-weight:600;">${t.collectedBy || t.receivedBy || 'Admin'}</td>
      </tr>`).join('');

    const styles = `
<style>
@page { margin: 12mm; size: A4; }
* { box-sizing: border-box; }
body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; color: #111827; background: white; -webkit-print-color-adjust: exact; margin: 0; }
.print-container { max-width: 750px; margin: 0 auto; }

/* ── Header ── */
.rpt-header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:12px; border-bottom:2px solid #111827; margin-bottom:20px; padding-right:15px; }
.rpt-brand-name { font-size:22pt; font-weight:900; color:#111827; letter-spacing:-0.5px; }
.rpt-brand-name span { color:#4338ca; }
.rpt-brand-sub { font-size:8pt; text-transform:uppercase; letter-spacing:2px; color:#4b5563; font-weight:700; margin-top:2px; }
.rpt-meta { text-align:right; font-size:8pt; color:#4b5563; line-height:1.6; }
.rpt-meta strong { color:#111827; }

/* ── Info Grid ── */
.info-grid { display:flex; gap:16px; margin-bottom:20px; }
.info-card { flex:1; background:none; padding:0; border:none; }
.info-card h3 { font-size:9pt; color:#111827; margin:0 0 8px 0; font-weight:800; text-transform:uppercase; letter-spacing:1px; border-bottom:1px solid #e5e7eb; padding-bottom:4px; }
.detail-table { width:100%; font-size:8.5pt; border-collapse:collapse; }
.detail-table td { padding:4px 0; border-bottom:1px solid #f3f4f6; }
.detail-table tr:last-child td { border-bottom:none; }
.detail-table td:first-child { color:#4b5563; width:45%; }
.detail-table td:last-child { font-weight:700; color:#111827; text-align:right; }

/* ── Summary KPIs ── */
.summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
.summary-box { background:none; border:1px solid #d1d5db; border-radius:4px; padding:12px 10px; text-align:center; }
.summary-box .label { font-size:7pt; color:#4b5563; text-transform:uppercase; font-weight:700; letter-spacing:0.5px; margin-bottom:4px; }
.summary-box .val { font-size:11pt; font-weight:900; color:#111827; }

/* ── Progress Bar ── */
.progress-section { margin-bottom:20px; border:1px solid #d1d5db; border-radius:4px; padding:10px 12px; }
.progress-label { display:flex; justify-content:space-between; font-size:8pt; color:#111827; font-weight:800; margin-bottom:6px; }
.progress-track { height:8px; background:#e5e7eb; border-radius:99px; overflow:hidden; }
.progress-fill  { height:100%; border-radius:99px; background:#4338ca; }

/* ── Tables ── */
.section-title { font-size:10pt; color:#111827; margin:0 0 10px 0; font-weight:800; text-transform:uppercase; border-bottom:1px solid #e5e7eb; padding-bottom:4px; }
.modern-table { width:100%; border-collapse:collapse; font-size:8pt; border:1px solid #d1d5db; margin-bottom:20px; }
.modern-table thead { display: table-header-group; }
.modern-table th { background:#f3f4f6; color:#111827; font-weight:800; text-align:left; padding:8px 10px; border-bottom:1px solid #d1d5db; border-right:1px solid #d1d5db; text-transform:uppercase; }
.modern-table td { padding:8px 10px; border-bottom:1px solid #e5e7eb; border-right:1px solid #e5e7eb; color:#1f2937; }
.modern-table th:last-child, .modern-table td:last-child { border-right:none; }
.modern-table tr:nth-child(even) td { background:#f9fafb; }
.amt { font-family:'Courier New',Courier,monospace; font-weight:700; letter-spacing:-0.5px; }

.rpt-footer { margin-top:20px; padding-top:10px; border-top:1px solid #d1d5db; display:flex; justify-content:space-between; font-size:7pt; color:#6b7280; }

@media print {
  .no-print { display:none !important; }
  body { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
}
</style>
`;

    const printArea = document.createElement("div");
    printArea.id = "print-area";
    printArea.className = "print-container";

    printArea.innerHTML = `
${styles}

<!-- Print UI Buttons -->
<div class="no-print" style="text-align:center;padding:18px 0 8px;display:flex;justify-content:center;gap:12px;">
  <button onclick="window.print()" style="background:linear-gradient(135deg,#2563eb,#3b82f6);color:white;border:none;border-radius:10px;padding:0.65rem 1.5rem;font-size:0.88rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.5rem;">
    <i class="fa-solid fa-print"></i> Print Statement
  </button>
  <button onclick="window.ui.downloadPDF('loan-report-content', 'Loan_Report_${borrower.name.replace(/\s+/g, '_')}.pdf')" style="background:linear-gradient(135deg,#10b981,#34d399);color:white;border:none;border-radius:10px;padding:0.65rem 1.5rem;font-size:0.88rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.5rem;">
    <i class="fa-solid fa-download"></i> Download PDF
  </button>
  <button onclick="document.getElementById('print-area').remove()" style="background:#f1f5f9;color:#475569;border:none;border-radius:10px;padding:0.65rem 1.25rem;font-size:0.88rem;font-weight:700;cursor:pointer;">
    <i class="fa-solid fa-xmark"></i> Close
  </button>
</div>

<div id="loan-report-content">
  <!-- ── Visual Header Area (Captured via Canvas) ── -->
  <div id="rpt-header-area">
    <div class="rpt-header">
      <div>
        <div class="rpt-brand-name">Fin<span>Collect</span></div>
        <div class="rpt-brand-sub">Loan Account Statement</div>
      </div>
      <div class="rpt-meta">
        <div><strong>Generated:</strong> ${genDate}</div>
        <div><strong>Prepared by:</strong> ${generatedBy}</div>
        <div><strong>Loan Ref:</strong> #${loan.loanNo || loanId.substr(0, 4)}</div>
        <div><strong>Status:</strong> <span style="color:${loan.status.toLowerCase()==='active'?'#16a34a':'#dc2626'};font-weight:800;">${loan.status.toUpperCase()}</span></div>
      </div>
    </div>

    <!-- ── Info Grid ── -->
    <div class="info-grid">
      <div class="info-card">
        <h3>Member Profile</h3>
        <table class="detail-table">
          <tr><td>Name</td><td>${borrower.name}</td></tr>
          <tr><td>Mobile No.</td><td>${borrower.mobile}</td></tr>
          <tr><td>Serial No.</td><td>${borrower.serialNo || '-'}</td></tr>
          <tr><td>Address</td><td>${borrower.address || '-'}</td></tr>
        </table>
      </div>
      <div class="info-card">
        <h3>Loan Particulars</h3>
        <table class="detail-table">
          <tr><td>Principal Amount</td><td><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalAmt.toLocaleString('en-IN')}</td></tr>
          <tr><td>Interest Rate</td><td>${loan.interestRate || '0'}%</td></tr>
          <tr><td>Installment Plan</td><td>${loan.installments || '0'} Inst. (${loan.frequency})</td></tr>
          <tr><td>Disbursement Date</td><td>${new Date(loan.startDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td></tr>
        </table>
      </div>
    </div>

    <!-- ── KPI Summary ── -->
    <div class="summary-grid">
      <div class="summary-box">
        <div class="label">Total Loan</div>
        <div class="val"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:10pt; vertical-align:middle; margin-right:4px;"></i>${totalAmt.toLocaleString('en-IN')}</div>
      </div>
      <div class="summary-box success">
        <div class="label">Total Paid</div>
        <div class="val"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:10pt; vertical-align:middle; margin-right:4px;"></i>${paidAmt.toLocaleString('en-IN')}</div>
      </div>
      <div class="summary-box danger">
        <div class="label">Balance Due</div>
        <div class="val"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:10pt; vertical-align:middle; margin-right:4px;"></i>${balance.toLocaleString('en-IN')}</div>
      </div>
      <div class="summary-box primary">
        <div class="label">Progress</div>
        <div class="val">${progress}%</div>
      </div>
    </div>

    <!-- ── Progress Bar ── -->
    <div class="progress-section">
      <div class="progress-label">
        <span>Repayment Progress</span>
        <span>${progress}% Recovered</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${progress}%;"></div>
      </div>
    </div>
  </div>

  <!-- ── Installment Schedule ── -->
  <div class="schedule-section">
    <div class="section-title">Installment Schedule</div>
    <table class="modern-table" id="loan-schedule-table">
      <thead>
        <tr>
          <th style="text-align:center;width:35px;">No</th>
          <th>Due Date</th>
          <th>Status</th>
          <th style="text-align:right;">Due Amount<th>
          <th style="text-align:center;">Last Collected</th>
          <th style="text-align:right;">Paid Amount</th>
          <th>Received By</th>
        </tr>
      </thead>
      <tbody>${scheduleRows}</tbody>
    </table>
  </div>

  <!-- ── Signature Block ── -->
  <div class="sig-grid" id="rpt-signature-area">
    <div class="sig-box"><span>Borrower</span>${borrower.name}</div>
    <div class="sig-box"><span>Officer</span>${generatedBy}</div>
    <div class="sig-box"><span>Authorised Signatory</span>Branch Manager</div>
  </div>

  <!-- ── Footer ── -->
  <div class="rpt-footer">
    <span>FinCollect Finance Management System — Loan Statement</span>
    <span>Member: <strong>${borrower.name}</strong> &nbsp;|&nbsp; Ref: <strong>#${loan.id.substr(0,4)}</strong> &nbsp;|&nbsp; Page 1 of 1</span>
  </div>
</div>
`;

    // Render in overlay
    const overlay = document.createElement('div');
    overlay.id = 'print-area';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.7);z-index:9999;overflow-y:auto;padding:2rem 1rem;backdrop-filter:blur(4px);';
    const inner = document.createElement('div');
    inner.style.cssText = 'max-width:860px;margin:0 auto;background:white;border-radius:16px;padding:2rem;box-shadow:0 25px 60px rgba(0,0,0,0.35); position:relative;';
    inner.innerHTML = printArea.innerHTML;
    overlay.appendChild(inner);
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  }

  /**
   * Prepare an element for PDF capture with consistent desktop layout
   * Creates a temporary print container with fixed A4 width to prevent responsive layout issues
   * @param {HTMLElement} element - The element to prepare
   * @returns {HTMLElement} - Temporary container ready for html2canvas capture
   */
  _createPrintContainer(element) {
    // Create temporary container with A4-equivalent width (210mm = ~794px at 96dpi)
    // Use display:none to hide from view but not from layout calculations
    const tempContainer = document.createElement('div');
    tempContainer.id = 'pdf-print-container-temp';
    tempContainer.style.cssText = `
      position: absolute;
      left: -999999px;
      top: -999999px;
      width: 794px;
      height: auto;
      background: white;
      padding: 20px;
      margin: 0;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
      color: #000;
      visibility: visible;
      opacity: 1;
    `;

    // Clone the element deeply
    const cloned = element.cloneNode(true);
    
    // Force desktop styles on cloned content
    const style = document.createElement('style');
    style.textContent = `
      #pdf-print-container-temp {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      #pdf-print-container-temp * {
        max-width: 100% !important;
        width: auto !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      #pdf-print-container-temp > div {
        page-break-inside: auto;
        break-inside: auto;
      }
      
      #pdf-print-container-temp .table-section {
        page-break-inside: auto;
        break-inside: auto;
        page-break-before: auto;
        break-before: auto;
      }
      
      #pdf-print-container-temp .modern-table {
        width: 100% !important;
        table-layout: auto;
        page-break-inside: auto;
        break-inside: auto;
      }
      
      #pdf-print-container-temp table {
        width: 100% !important;
        border-collapse: collapse;
        font-size: 11px;
        page-break-inside: auto;
        break-inside: auto;
      }
      
      #pdf-print-container-temp tbody {
        page-break-inside: auto;
        break-inside: auto;
      }
      
      #pdf-print-container-temp tr {
        page-break-inside: auto;
        break-inside: auto;
      }
      
      #pdf-print-container-temp td, 
      #pdf-print-container-temp th {
        padding: 8px !important;
        text-align: center !important;
        vertical-align: middle !important;
        border: 1px solid #e2e8f0;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      #pdf-print-container-temp th {
        background-color: #5B4FE5 !important;
        color: white !important;
        font-weight: bold !important;
        text-align: center !important;
      }
      
      #pdf-print-container-temp tr:nth-child(even) {
        background-color: #f8fafc !important;
      }
      
      #pdf-print-container-temp img {
        max-width: 100%;
        height: auto;
      }
      
      #pdf-print-container-temp .hidden-mobile,
      #pdf-print-container-temp [style*="display:none"],
      #pdf-print-container-temp .mobile-only {
        display: none !important;
      }
      
      #pdf-print-container-temp .section-title {
        font-size: 14px;
        font-weight: 600;
        margin: 12px 0 8px 0;
        color: #1e293b;
        page-break-after: avoid;
        break-after: avoid;
      }
      
      #pdf-print-container-temp #rpt-header-area {
        margin-bottom: 16px;
        page-break-after: avoid;
        break-after: avoid;
      }
      
      #pdf-print-container-temp .card,
      #pdf-print-container-temp [class*="card"] {
        box-shadow: none;
        border: 1px solid #e2e8f0;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      #pdf-print-container-temp .member-section,
      #pdf-print-container-temp .account-section,
      #pdf-print-container-temp .metrics-container,
      #pdf-print-container-temp .progress-container,
      #pdf-print-container-temp .footer-container {
        page-break-inside: auto;
        break-inside: auto;
      }
      
      #pdf-print-container-temp .row,
      #pdf-print-container-temp [class*="grid"],
      #pdf-print-container-temp [style*="display:flex"] {
        display: block !important;
        width: 100% !important;
      }
      
      #pdf-print-container-temp [class*="col-"] {
        width: 100% !important;
        display: block !important;
      }
      
      @media print {
        #pdf-print-container-temp { print-color-adjust: exact !important; }
        #pdf-print-container-temp * { print-color-adjust: exact !important; }
      }
    `;
    
    tempContainer.appendChild(style);
    tempContainer.appendChild(cloned);
    document.body.appendChild(tempContainer);
    
    // Force multiple layout recalculations to ensure proper rendering
    const _ = tempContainer.offsetHeight;
    const __ = tempContainer.offsetWidth;
    const ___ = tempContainer.scrollHeight;
    
    // Force browser to recalculate styles
    window.getComputedStyle(tempContainer);
    tempContainer.scrollTop;
    
    return tempContainer;
  }

  /**
   * Clean up temporary print container
   */
  _removePrintContainer(containerId = 'pdf-print-container-temp') {
    const container = document.getElementById(containerId);
    if (container) {
      container.remove();
    }
  }

  async downloadPDF(elementId, filename) {
    let btn, originalHtml;
    let tempContainer = null;
    
    try {
      // Show loading feedback immediately
      btn = window.event?.currentTarget || document.activeElement;
      originalHtml = btn?.innerHTML;
      if (btn && btn.tagName === 'BUTTON') btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Loading libraries...';

      // Ensure libraryManager exists
      if (!window.libraryManager) {
        throw new Error('Library Manager not initialized. Please reload the page.');
      }

      // Wait for all PDF libraries using Library Manager (increased timeout to 20 seconds)
      const pdfReady = await window.libraryManager.waitForPDF(20000);
      if (!pdfReady) {
        throw new Error('PDF libraries failed to load. Please check your internet connection and try again.');
      }

      if (btn && btn.tagName === 'BUTTON') btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';

      const { jsPDF } = window.jspdf;
      const h2c = window.html2canvas;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const container = document.getElementById(elementId);
      if (!container) throw new Error('Report content not found on page');

      // Create print-ready container with fixed layout
      tempContainer = this._createPrintContainer(container);
      
      const headerArea = tempContainer.querySelector('#rpt-header-area');
      const tables = tempContainer.querySelectorAll('.modern-table');
      const signatureArea = tempContainer.querySelector('#rpt-signature-area');
      
      let currentY = 10;
      
      // Generate a high-quality Taka icon image dynamically using the browser's native font rendering
      const takaCanvas = document.createElement('canvas');
      takaCanvas.width = 40;
      takaCanvas.height = 40;
      const tCtx = takaCanvas.getContext('2d');
      tCtx.fillStyle = '#4338ca'; // Indigo theme color
      // Rendering the specific Flaticon requested by drawing it properly to a canvas
      tCtx.font = 'bold 36px "uicons-solid-rounded", Arial, sans-serif'; 
      tCtx.textBaseline = 'middle';
      tCtx.textAlign = 'center';
      tCtx.fillText('৳', 20, 22);
      const takaImg = takaCanvas.toDataURL('image/png');

      // 1. Capture Visual Header
      if (headerArea) {
        const canvas = await h2c(headerArea, { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          backgroundColor: '#ffffff',
          width: 794,
          windowWidth: 794
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth() - 14; 
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        doc.addImage(imgData, 'JPEG', 7, currentY, pdfWidth, pdfHeight);
        currentY += pdfHeight + 8;
      }

      // 2. Render Tables with autoTable
      for (const table of tables) {
        const titleEl = table.parentElement.querySelector('.section-title');
        if (titleEl) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 41, 59);
          doc.text(titleEl.innerText, 10, currentY);
          currentY += 5;
        }

        doc.autoTable({
          html: table,
          startY: currentY,
          margin: { left: 10, right: 10, top: 20, bottom: 20 },
          theme: 'striped',
          headStyles: { 
            fillColor: [67, 56, 202],
            textColor: 255, 
            fontSize: 8, 
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle'
          },
          bodyStyles: {
            fontSize: 8,
            halign: 'left',
            valign: 'middle'
          },
          columnStyles: {
            0: { halign: 'left' }
          },
          styles: { 
            fontSize: 8, 
            cellPadding: 3,
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
            overflow: 'linebreak',
            cellWidth: 'wrap'
          },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          didDrawPage: (data) => {
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(148, 163, 184);
            const pageCount = doc.internal.getNumberOfPages();
            doc.text(`FinCollect Statement — Page ${pageCount}`, 10, doc.internal.pageSize.getHeight() - 10);
          },
          didDrawCell: (data) => {
            // High-fidelity Taka Symbol Drawing Hack
            // If the cell text contains the Taka character '<i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>', we draw it manually
            if (data.section === 'body' && data.cell.text && data.cell.text.some(t => t.includes('৳'))) {
               const text = data.cell.text[0];
               if (text.includes('৳')) {
                  // Clear the original text area so we can redraw
                  // Actually, AutoTable draws text after this. 
                  // So we replace '<i class="fi fi-sr-bangladeshi-taka-sign"></i><span style="display:none">৳</span>' with a space in the text array but draw the icon manually.
                  data.cell.text[0] = text.replace('৳', '  '); 
                  
                  const x = data.cell.x + 2.5; 
                  const y = data.cell.y + data.cell.height / 2 + 1;
                  // Replaced the manual circle/line drawing with the high-fidelity generated image
                  doc.addImage(takaImg, 'PNG', x, y - 2.5, 2.8, 2.8);
               }
            }
          }
        });
        currentY = doc.lastAutoTable.finalY + 10;
      }

      // 3. Signature Area
      if (signatureArea) {
        if (currentY > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          currentY = 20;
        }
        const canvasSig = await h2c(signatureArea, { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          width: 794,
          windowWidth: 794
        });
        const imgSig = canvasSig.toDataURL('image/jpeg', 0.9);
        const imgPropsSig = doc.getImageProperties(imgSig);
        const pdfWidthSig = doc.internal.pageSize.getWidth() - 20;
        const pdfHeightSig = (imgPropsSig.height * pdfWidthSig) / imgPropsSig.width;
        doc.addImage(imgSig, 'JPEG', 10, currentY, pdfWidthSig, pdfHeightSig);
      }

      doc.save(filename);
      if (btn && btn.tagName === 'BUTTON') btn.innerHTML = originalHtml;

    } catch (error) {
      console.error('PDF Generation Error:', error);
      
      // Restore button state
      if (btn && btn.tagName === 'BUTTON' && originalHtml) {
        btn.innerHTML = originalHtml;
      }
      
      // Show professional error with Print fallback and diagnostic info
      const errorMsg = error?.message || 'Unknown error';
      const libStatus = window.libraryManager?.getStatus() || {};
      const libDetails = Object.entries(libStatus)
        .map(([key, info]) => `${key}: ${info.loaded ? '✓' : '✗'}`)
        .join(' | ');
      
      Swal.fire({
        title: 'PDF Generation Unavailable',
        html: `<p>The PDF generation library is still loading or not available.</p>
<p style="margin-top:10px;font-size:0.85rem;color:#666;"><strong>Error:</strong> ${errorMsg}</p>
<p style="margin-top:8px;font-size:0.80rem;color:#888;"><strong>Status:</strong> ${libDetails}</p>
<p style="margin-top:10px;font-size:0.9rem;color:#666;">This may happen if:</p>
<ul style="text-align:left;margin:10px 0;font-size:0.9rem;">
  <li>Your internet connection is unstable</li>
  <li>The CDN is temporarily unavailable</li>
  <li>JavaScript libraries need to reload</li>
  <li>Firewall/proxy is blocking CDN access</li>
</ul>`,
        icon: 'info',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: 'Retry Download',
        denyButtonText: 'Use Print Instead',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#10b981',
        denyButtonColor: '#f59e0b',
        cancelButtonColor: '#6b7280'
      }).then((result) => {
        if (result.isConfirmed) {
          // Retry after a short delay
          setTimeout(() => {
            this.downloadPDF(elementId, filename);
          }, 1000);
        } else if (result.isDenied) {
          // Fallback to browser print
          const printContent = document.getElementById(elementId);
          if (printContent) {
            const printWindow = window.open('', '', 'width=1200,height=800');
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.close();
            printWindow.print();
          }
        }
      });
    } finally {
      // Always clean up temporary container
      if (tempContainer) {
        this._removePrintContainer('pdf-print-container-temp');
      }
    }
  }
  async renderReports() {
    this.setTitle("Database Management & Backups");

    this.hideFab();

    // Fetch all database collections for statistics
    const loans = await window.db.getAll("loans");
    const borrowers = await window.db.getAll("borrowers");
    const savings = await window.db.getAll("savings");
    const savingsTypes = await window.db.getAll("savingsTypes");
    const savingsTransactions = await window.db.getAll("savingsTransactions");
    const transactions = await window.db.getAll("transactions");
    const syncQueue = await window.db.getAll("syncQueue");


    // Calculate data size helper function
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const calculateSize = (data) => {
      return formatBytes(JSON.stringify(data).length);
    };

    // Calculate statistics with sizes
    const stats = {
      borrowers: borrowers.length,
      borrowersSize: calculateSize(borrowers),
      loans: loans.length,
      loansSize: calculateSize(loans),
      savings: savingsTypes.length,
      savingsSize: calculateSize(savingsTypes),
      savingsAccounts: savings.length,
      savingsAccountsSize: calculateSize(savings),
      savingsTransactions: savingsTransactions.length,
      savingsTransactionsSize: calculateSize(savingsTransactions),
      transactions: transactions.length,
      transactionsSize: calculateSize(transactions),
      syncQueue: syncQueue.length,
      totalLoans: loans.reduce((sum, l) => sum + parseFloat(l.totalAmount || 0), 0),
      totalReceived: loans.reduce((sum, l) => sum + parseFloat(l.paidAmount || 0), 0),
      totalSavings: savingsTransactions.reduce((sum, st) => sum + parseFloat(st.amount || 0), 0),
      totalDatabaseSize: calculateSize([...borrowers, ...loans, ...savings, ...savingsTypes, ...savingsTransactions, ...transactions, ...syncQueue])
    };

    const statisticsHTML = `
<style>
  .stat-card-title { font-size: 0.75rem; }
  .stat-card-number { font-size: 2rem; }
  .stat-card-subtitle { font-size: 0.875rem; }
  .stat-card-size { font-size: 0.75rem; }
  .stat-card-icon { width: 60px; height: 60px; font-size: 1.75rem; }
  .stat-card-container { padding: 1.5rem; gap: 1rem; }
  .stat-grid { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
  .backup-section { padding: 2rem; gap: 2rem; }
  .backup-header { font-size: 1.5rem; gap: 1rem; margin-bottom: 2rem; }
  .backup-icon { width: 50px; height: 50px; font-size: 1.5rem; }
  .export-icon { font-size: 3rem; }
  .export-title { font-size: 1.1rem; }
  .export-desc { font-size: 0.875rem; }
  .backup-btn { padding: 0.75rem 1.5rem; font-size: 0.875rem; }
  .info-section { padding: 1.25rem; font-size: 0.875rem; }

  /* Tablet (768px and below) */
  @media (max-width: 768px) {
    .stat-card-title { font-size: 0.7rem; }
    .stat-card-number { font-size: 1.5rem; }
    .stat-card-subtitle { font-size: 0.8rem; }
    .stat-card-size { font-size: 0.65rem; }
    .stat-card-icon { width: 50px; height: 50px; font-size: 1.3rem; }
    .stat-card-container { padding: 1.25rem; gap: 0.75rem; }
    .stat-grid { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; }
    .backup-section { padding: 1.5rem; gap: 1.5rem; }
    .backup-header { font-size: 1.2rem; gap: 0.75rem; margin-bottom: 1.5rem; }
    .backup-icon { width: 45px; height: 45px; font-size: 1.2rem; }
    .export-icon { font-size: 2.5rem; }
    .export-title { font-size: 1rem; }
    .export-desc { font-size: 0.8rem; }
    .backup-btn { padding: 0.65rem 1.25rem; font-size: 0.8rem; }
    .info-section { padding: 1rem; font-size: 0.8rem; }
  }

  /* Mobile (480px and below) */
  @media (max-width: 480px) {
    .stat-card-title { font-size: 0.65rem; }
    .stat-card-number { font-size: 1.25rem; }
    .stat-card-subtitle { font-size: 0.75rem; }
    .stat-card-size { font-size: 0.6rem; }
    .stat-card-icon { width: 45px; height: 45px; font-size: 1.1rem; }
    .stat-card-container { padding: 1rem; gap: 0.5rem; }
    .stat-grid { grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1.25rem; }
    .backup-section { padding: 1.25rem; gap: 1.25rem; }
    .backup-section > div:not(:first-child) { grid-template-columns: 1fr !important; }
    .backup-header { font-size: 1.1rem; gap: 0.5rem; margin-bottom: 1.25rem; }
    .backup-icon { width: 40px; height: 40px; font-size: 1rem; }
    .export-icon { font-size: 2rem; }
    .export-title { font-size: 0.9rem; }
    .export-desc { font-size: 0.75rem; }
    .backup-btn { padding: 0.6rem 1rem; font-size: 0.75rem; }
    .info-section { padding: 0.875rem; font-size: 0.75rem; }
  }
</style>

<div style="width: 100%; margin: 0;">
  <!-- Statistics Grid - Responsive -->
  <div class="stat-grid" style="display: grid;">
    
    <!-- Borrowers/Users Card -->
    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 5px solid #3b82f6; border-radius: 12px; box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1); transition: all 300ms ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(59, 130, 246, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(59, 130, 246, 0.1)'">
      <div class="stat-card-container" style="display: flex; align-items: flex-start; justify-content: space-between;">
        <div style="flex: 1;">
          <p class="stat-card-title" style="font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin: 0 0 0.5rem 0;">Active Users</p>
          <p class="stat-card-number" style="font-weight: 800; color: #3b82f6; margin: 0.5rem 0; line-height: 1;">${stats.borrowers}</p>
          <p class="stat-card-subtitle" style="color: #6b7280; margin: 0.5rem 0 0 0;"><i class="fa-solid fa-user-group" style="margin-right: 0.5rem;"></i>Registered</p>
          <p class="stat-card-size" style="color: #9ca3af; margin: 0.25rem 0 0 0;">${stats.borrowersSize}</p>
        </div>
        <div class="stat-card-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); flex-shrink: 0;">
          <i class="fa-solid fa-users"></i>
        </div>
      </div>
    </div>

    <!-- Loans Card -->
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #e0fce8 100%); border-left: 5px solid #10b981; border-radius: 12px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1); transition: all 300ms ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(16, 185, 129, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(16, 185, 129, 0.1)'">
      <div class="stat-card-container" style="display: flex; align-items: flex-start; justify-content: space-between;">
        <div style="flex: 1;">
          <p class="stat-card-title" style="font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin: 0 0 0.5rem 0;">Total Loans</p>
          <p class="stat-card-number" style="font-weight: 800; color: #10b981; margin: 0.5rem 0; line-height: 1;">${stats.loans}</p>
          <p class="stat-card-subtitle" style="color: #6b7280; margin: 0.5rem 0 0 0;"><i class="fa-solid fa-bangladeshi-taka-sign" style="margin-right: 0.25rem;"></i>${stats.totalLoans.toLocaleString('en-US', {maximumFractionDigits: 0})}</p>
          <p class="stat-card-size" style="color: #9ca3af; margin: 0.25rem 0 0 0;">${stats.loansSize}</p>
        </div>
        <div class="stat-card-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); flex-shrink: 0;">
          <i class="fa-solid fa-file-contract"></i>
        </div>
      </div>
    </div>

    <!-- Savings Card -->
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 5px solid #f59e0b; border-radius: 12px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1); transition: all 300ms ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(245, 158, 11, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(245, 158, 11, 0.1)'">
      <div class="stat-card-container" style="display: flex; align-items: flex-start; justify-content: space-between;">
        <div style="flex: 1;">
          <p class="stat-card-title" style="font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin: 0 0 0.5rem 0;">Savings Plans</p>
          <p class="stat-card-number" style="font-weight: 800; color: #d97706; margin: 0.5rem 0; line-height: 1;">${stats.savings}</p>
          <p class="stat-card-subtitle" style="color: #6b7280; margin: 0.5rem 0 0 0;"><i class="fa-solid fa-piggy-bank" style="margin-right: 0.25rem;"></i>${stats.savingsAccounts} active</p>
          <p class="stat-card-size" style="color: #9ca3af; margin: 0.25rem 0 0 0;">${stats.savingsSize}</p>
        </div>
        <div class="stat-card-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); flex-shrink: 0;">
          <i class="fa-solid fa-piggy-bank"></i>
        </div>
      </div>
    </div>

    <!-- Transactions Card -->
    <div style="background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%); border-left: 5px solid #8b5cf6; border-radius: 12px; box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1); transition: all 300ms ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(139, 92, 246, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(139, 92, 246, 0.1)'">
      <div class="stat-card-container" style="display: flex; align-items: flex-start; justify-content: space-between;">
        <div style="flex: 1;">
          <p class="stat-card-title" style="font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin: 0 0 0.5rem 0;">Transactions</p>
          <p class="stat-card-number" style="font-weight: 800; color: #8b5cf6; margin: 0.5rem 0; line-height: 1;">${stats.transactions}</p>
          <p class="stat-card-subtitle" style="color: #6b7280; margin: 0.5rem 0 0 0;"><i class="fa-solid fa-bangladeshi-taka-sign" style="margin-right: 0.25rem;"></i>${stats.totalReceived.toLocaleString('en-US', {maximumFractionDigits: 0})}</p>
          <p class="stat-card-size" style="color: #9ca3af; margin: 0.25rem 0 0 0;">${stats.transactionsSize}</p>
        </div>
        <div class="stat-card-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); flex-shrink: 0;">
          <i class="fa-solid fa-exchange"></i>
        </div>
      </div>
    </div>

    <!-- Savings Transactions Card -->
    <div style="background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%); border-left: 5px solid #ec4899; border-radius: 12px; box-shadow: 0 2px 8px rgba(236, 72, 153, 0.1); transition: all 300ms ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(236, 72, 153, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(236, 72, 153, 0.1)'">
      <div class="stat-card-container" style="display: flex; align-items: flex-start; justify-content: space-between;">
        <div style="flex: 1;">
          <p class="stat-card-title" style="font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin: 0 0 0.5rem 0;">Savings Saved</p>
          <p class="stat-card-number" style="font-weight: 800; color: #ec4899; margin: 0.5rem 0; line-height: 1;">${stats.savingsTransactions}</p>
          <p class="stat-card-subtitle" style="color: #6b7280; margin: 0.5rem 0 0 0;"><i class="fa-solid fa-bangladeshi-taka-sign" style="margin-right: 0.25rem;"></i>${stats.totalSavings.toLocaleString('en-US', {maximumFractionDigits: 0})}</p>
          <p class="stat-card-size" style="color: #9ca3af; margin: 0.25rem 0 0 0;">${stats.savingsTransactionsSize}</p>
        </div>
        <div class="stat-card-icon" style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3); flex-shrink: 0;">
          <i class="fa-solid fa-calculator"></i>
        </div>
      </div>
    </div>

    <!-- Total Database Size Card -->
    <div style="background: linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%); border-left: 5px solid #0ea5e9; border-radius: 12px; box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1); transition: all 300ms ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 20px rgba(14, 165, 233, 0.15)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(14, 165, 233, 0.1)'">
      <div class="stat-card-container" style="display: flex; align-items: flex-start; justify-content: space-between;">
        <div style="flex: 1;">
          <p class="stat-card-title" style="font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin: 0 0 0.5rem 0;">Database Size</p>
          <p class="stat-card-number" style="font-weight: 800; color: #0ea5e9; margin: 0.5rem 0; line-height: 1;">${stats.totalDatabaseSize}</p>
          <p class="stat-card-subtitle" style="color: #6b7280; margin: 0.5rem 0 0 0;"><i class="fa-solid fa-database" style="margin-right: 0.25rem;"></i>Total stored</p>
          <p class="stat-card-size" style="color: #9ca3af; margin: 0.25rem 0 0 0;">${stats.borrowers + stats.loans + stats.savings + stats.transactions + stats.savingsTransactions} records</p>
        </div>
        <div class="stat-card-icon" style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3); flex-shrink: 0;">
          <i class="fa-solid fa-database"></i>
        </div>
      </div>
    </div>
  </div>

  <!-- Backup & Restore Section -->
  <div class="backup-section" style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); margin-bottom: 2rem; display: flex; flex-direction: column;">
    <div class="backup-header" style="display: flex; align-items: center;">
      <div class="backup-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
        <i class="fa-solid fa-floppy-disk"></i>
      </div>
      <h3 style="font-weight: 700; color: #1f2937; margin: 0;">Database Backup & Restore</h3>
    </div>

    <!-- Backup/Restore Buttons Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
      <!-- Export Button -->
      <div style="background: linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(14, 165, 233, 0.02) 100%); border: 2px dashed #0ea5e9; border-radius: 14px; padding: 2rem; text-align: center; transition: all 300ms ease;" id="export-section" onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 8px 16px rgba(14, 165, 233, 0.15)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
        <div class="export-icon" style="color: #0ea5e9; margin-bottom: 1rem; line-height: 1;">
          <i class="fa-solid fa-cloud-arrow-down"></i>
        </div>
        <h4 class="export-title" style="font-weight: 700; color: #1f2937; margin: 0.5rem 0;">Export Complete Backup</h4>
        <p class="export-desc" style="color: #6b7280; margin: 0.5rem 0 1.5rem 0;">Download all database records as a JSON file</p>
        <button id="export-btn" class="backup-btn" style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 200ms ease; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 16px rgba(14, 165, 233, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(14, 165, 233, 0.3)'">
          <i class="fa-solid fa-download" style="margin-right: 0.5rem;"></i> Export Now
        </button>
      </div>

      <!-- Import Button -->
      <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%); border: 2px dashed #10b981; border-radius: 14px; padding: 2rem; text-align: center; transition: all 300ms ease;" id="import-section" onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 8px 16px rgba(16, 185, 129, 0.15)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'">
        <div class="export-icon" style="color: #10b981; margin-bottom: 1rem; line-height: 1;">
          <i class="fa-solid fa-cloud-arrow-up"></i>
        </div>
        <h4 class="export-title" style="font-weight: 700; color: #1f2937; margin: 0.5rem 0;">Restore from Backup</h4>
        <p class="export-desc" style="color: #6b7280; margin: 0.5rem 0 1.5rem 0;">Upload a backup file to restore all database records</p>
        <input type="file" id="import-file" accept=".json,.backup" style="display: none;">
        <button id="import-btn" class="backup-btn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 200ms ease; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 16px rgba(16, 185, 129, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.3)'">
          <i class="fa-solid fa-upload" style="margin-right: 0.5rem;"></i> Select File
        </button>
      </div>
    </div>

    <!-- Info Section -->
    <div class="info-section" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%); border-left: 4px solid #f59e0b; border-radius: 8px; display: flex; gap: 1rem;">
      <i class="fa-solid fa-circle-info" style="color: #d97706; flex-shrink: 0; margin-top: 0.125rem;"></i>
      <p style="margin: 0; color: #92400e;">
        <strong>Important:</strong> Backups include all your users, loans, savings, and transaction data. Import will merge with existing data. Always keep backups in a safe location.
      </p>
    </div>
  </div>
</div>
    `;

    this.container.innerHTML = statisticsHTML;

    // Attach export event handler
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        try {
          exportBtn.disabled = true;
          exportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 0.5rem;"></i> Exporting...';
          
          const backup = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            collections: {
              borrowers: await window.db.getAll('borrowers'),
              loans: await window.db.getAll('loans'),
              savings: await window.db.getAll('savings'),
              savingsTypes: await window.db.getAll('savingsTypes'),
              savingsTransactions: await window.db.getAll('savingsTransactions'),
              transactions: await window.db.getAll('transactions'),
              syncQueue: await window.db.getAll('syncQueue')
            }
          };

          const jsonString = JSON.stringify(backup, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `fincollect-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          exportBtn.disabled = false;
          exportBtn.innerHTML = '<i class="fa-solid fa-download" style="margin-right: 0.5rem;"></i> Export Now';

          Swal.fire({
            title: 'Export Successful!',
            text: 'Your complete database backup has been downloaded.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#0ea5e9'
          });
        } catch (error) {
          console.error('Export error:', error);
          exportBtn.disabled = false;
          exportBtn.innerHTML = '<i class="fa-solid fa-download" style="margin-right: 0.5rem;"></i> Export Now';
          Swal.fire({
            title: 'Export Failed',
            text: error.message,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ef4444'
          });
        }
      });
    }

    // Attach import event handler
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      
      importFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          const text = await file.text();
          const backup = JSON.parse(text);

          if (!backup.collections) {
            throw new Error('Invalid backup file format');
          }

          const result = await Swal.fire({
            title: 'Restore Database?',
            html: `<div style="text-align: left; margin: 1rem 0;">
              <p><strong>This will merge backup data with your current database.</strong></p>
              <p style="color: #6b7280; font-size: 0.875rem;">Data includes:</p>
              <ul style="text-align: left; color: #6b7280; margin: 0.5rem 0 0 1rem;">
                <li>${backup.collections.borrowers?.length || 0} Users</li>
                <li>${backup.collections.loans?.length || 0} Loans</li>
                <li>${backup.collections.savings?.length || 0} Savings Plans</li>
                <li>${backup.collections.transactions?.length || 0} Transactions</li>
              </ul>
            </div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, Restore',
            cancelButtonText: 'Cancel'
          });

          if (!result.isConfirmed) {
            importFile.value = '';
            return;
          }

          importBtn.disabled = true;
          importBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 0.5rem;"></i> Restoring...';

          // Import all collections
          const collections = ['borrowers', 'loans', 'savings', 'savingsTypes', 'savingsTransactions', 'transactions', 'syncQueue'];
          for (const collectionName of collections) {
            const items = backup.collections[collectionName] || [];
            for (const item of items) {
              await window.db.add(collectionName, item);
            }
          }

          importBtn.disabled = false;
          importBtn.innerHTML = '<i class="fa-solid fa-upload" style="margin-right: 0.5rem;"></i> Select File';
          importFile.value = '';

          Swal.fire({
            title: 'Restore Complete!',
            text: 'Your database has been successfully restored.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#10b981'
          }).then(() => {
            // Refresh the page to show updated stats
            window.ui.renderReports();
          });
        } catch (error) {
          console.error('Import error:', error);
          importBtn.disabled = false;
          importBtn.innerHTML = '<i class="fa-solid fa-upload" style="margin-right: 0.5rem;"></i> Select File';
          importFile.value = '';
          Swal.fire({
            title: 'Import Failed',
            text: error.message,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#ef4444'
          });
        }
      });
    }
  }

  async showPayModal(loanId) {
    let modal = document.getElementById("payment-modal");

    if (!modal) {
      modal = document.createElement("div");

      modal.id = "payment-modal";

      modal.style.cssText = `




position: fixed; top: 0; left: 0; width: 100%; height: 100%;




background: rgba(0,0,0,0.5); z-index: 1000;




display: flex; align-items: flex-end; justify-content: center;



`;

      if (window.innerWidth > 768) modal.style.alignItems = "center";

      document.body.appendChild(modal);
    }

    const loan = await window.db.get("loans", loanId);

    const borrower = await window.db.get("borrowers", loan.borrowerId);

    let nextInstallmentNo = 1;

    let nextDate = new Date(loan.startDate);

    let nextAmount = parseFloat(loan.installmentAmount);

    if (loan.schedule && loan.schedule.length > 0) {
      const firstUnpaid = loan.schedule.find((item) => item.status !== "PAID");

      if (firstUnpaid) {
        nextInstallmentNo = firstUnpaid.no;

        nextDate = new Date(firstUnpaid.dueDate);

        nextAmount =
          parseFloat(firstUnpaid.amount) -
          parseFloat(firstUnpaid.paidAmount || 0);
      } else {
        nextInstallmentNo = loan.schedule.length + 1;

        nextAmount = 0;
      }
    } else {
      const paidAmt = parseFloat(loan.paidAmount);

      const installmentAmt = parseFloat(loan.installmentAmount);

      const installmentsPaid = Math.floor(paidAmt / installmentAmt);

      nextInstallmentNo = installmentsPaid + 1;

      if (loan.frequency === "Weekly")
        nextDate.setDate(nextDate.getDate() + installmentsPaid * 7);
      else if (loan.frequency === "Monthly")
        nextDate.setMonth(nextDate.getMonth() + installmentsPaid);
      else nextDate.setDate(nextDate.getDate() + installmentsPaid);
    }

    const today = new Date().toISOString().split("T")[0];

    const frequency = loan.frequency || "Daily";

    const defFromDate = nextDate.toISOString().split("T")[0];

    modal.innerHTML = `


<style>



@keyframes pmSlideUp { from{transform:translateY(60px);opacity:0} to{transform:translateY(0);opacity:1} }



@keyframes pmFadeIn  { from{opacity:0} to{opacity:1} }



#payment-modal .pm-tab-btn {




flex:1; padding:0.65rem 0.5rem; border:none; background:transparent;




font-size:0.85rem; font-weight:600; color:#64748b; cursor:pointer;




border-bottom:2px solid transparent; transition:all 0.2s;



}



#payment-modal .pm-tab-btn.pm-active { color:#4f46e5; border-bottom:2px solid #4f46e5; }



#payment-modal .pm-tab-btn:hover:not(.pm-active) { color:#334155; background:#f8fafc; }



#payment-modal .pm-section { display:none; animation:pmFadeIn 0.2s ease; }



#payment-modal .pm-section.pm-active { display:block; }



#payment-modal .pm-input {




width:100%; padding:0.72rem 1rem; border:1.5px solid #e2e8f0; border-radius:10px;




font-size:0.95rem; font-family:inherit; color:#1e293b; background:#fff;




outline:none; box-sizing:border-box; transition:border-color 0.2s;



}



#payment-modal .pm-input:focus { border-color:#4f46e5; box-shadow:0 0 0 3px rgba(79,70,229,0.08); }



#payment-modal .pm-input[readonly] { background:#f8fafc; color:#64748b; }



#payment-modal .pm-label {




display:block; font-size:0.74rem; font-weight:700; color:#64748b;




text-transform:uppercase; letter-spacing:0.6px; margin-bottom:0.38rem;



}



#payment-modal .pm-btn-ok {




background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white;




border:none; border-radius:10px; padding:0.78rem 1.25rem; font-size:0.9rem;




font-weight:700; cursor:pointer; width:100%; box-shadow:0 4px 12px rgba(79,70,229,0.3);




transition:all 0.2s;



}



#payment-modal .pm-btn-ok:hover { transform:translateY(-1px); }



#payment-modal .pm-btn-cancel {




background:#f1f5f9; color:#475569; border:none; border-radius:10px;




padding:0.78rem 1.25rem; font-size:0.9rem; font-weight:700; cursor:pointer;




width:100%; transition:background 0.2s;



}



#payment-modal .pm-btn-cancel:hover { background:#e2e8f0; }



#payment-modal .pm-btn-show {




background:linear-gradient(135deg,#0ea5e9,#6366f1); color:white;




border:none; border-radius:10px; padding:0.72rem 1.25rem; font-size:0.88rem;




font-weight:700; cursor:pointer; width:100%;




box-shadow:0 3px 10px rgba(14,165,233,0.25); transition:all 0.2s;



}



#payment-modal .pm-btn-show:hover { transform:translateY(-1px); }



#payment-modal .me-table-wrap {




border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;




margin-top:0.9rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); max-height:38vh; overflow-y:auto;



}



#payment-modal .me-table { width:100%; border-collapse:collapse; font-size:0.83rem; }



#payment-modal .me-table thead tr { background:linear-gradient(135deg,#4f46e5,#7c3aed); position:sticky; top:0; z-index:1; }



#payment-modal .me-table thead th { color:white; padding:0.62rem 0.6rem; font-weight:700; text-align:left; font-size:0.71rem; text-transform:uppercase; letter-spacing:0.5px; }



#payment-modal .me-table tbody tr { border-bottom:1px solid #f1f5f9; transition:background 0.15s; }



#payment-modal .me-table tbody tr:last-child { border-bottom:none; }



#payment-modal .me-table tbody tr:hover { background:#f8fafc; }



#payment-modal .me-table td { padding:0.52rem 0.55rem; vertical-align:middle; }



#payment-modal .me-input-amt {




width:86px; padding:0.36rem 0.4rem 0.36rem 1.25rem; border:1.5px solid #e2e8f0;




border-radius:8px; font-size:0.9rem; font-weight:700; color:#1e293b;




text-align:right; outline:none; transition:border-color 0.2s; font-family:inherit;



}



#payment-modal .me-input-amt:focus { border-color:#4f46e5; }



#payment-modal .me-btn-save-row {




background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0;




border-radius:7px; padding:0.26rem 0.52rem; font-size:0.72rem;




font-weight:700; cursor:pointer; transition:all 0.15s; white-space:nowrap;



}



#payment-modal .me-btn-save-row:hover { background:#dcfce7; }



#payment-modal .me-btn-del-row {




background:#fff1f2; color:#e11d48; border:1px solid #fecdd3;




border-radius:7px; padding:0.26rem 0.52rem; font-size:0.72rem;




font-weight:700; cursor:pointer; transition:all 0.15s;



}



#payment-modal .me-btn-del-row:hover { background:#ffe4e6; }



#payment-modal .pm-save-all-btn {




background:linear-gradient(135deg,#10b981,#059669); color:white;




border:none; border-radius:10px; padding:0.82rem 1.25rem; font-size:0.93rem;




font-weight:700; cursor:pointer; width:100%;




box-shadow:0 4px 12px rgba(16,185,129,0.3); transition:all 0.2s;




margin-top:0.8rem; display:flex; align-items:center; justify-content:center; gap:0.45rem;



}



#payment-modal .pm-save-all-btn:hover { transform:translateY(-1px); }



#payment-modal .me-row-saved { background:#f0fdf4 !important; }


</style>



<div style="width:100%;max-width:520px;background:white;border-radius:20px 20px 0 0;



animation:pmSlideUp 0.35s cubic-bezier(.22,.68,0,1.2);



max-height:93vh;overflow-y:auto;box-shadow:0 -8px 40px rgba(0,0,0,0.2);">




<!-- HEADER -->



<div style="padding:1.35rem 1.35rem 0;position:relative;">




<button onclick="document.getElementById('payment-modal').remove()"





style="position:absolute;right:1rem;top:1rem;background:#f1f5f9;border:none;





width:30px;height:30px;border-radius:50%;font-size:0.9rem;color:#64748b;





cursor:pointer;display:flex;align-items:center;justify-content:center;">





<i class="fa-solid fa-xmark"></i>




</button>





<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">





<div style="width:40px;height:40px;background:linear-gradient(135deg,#4f46e5,#7c3aed);






border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">






<i class="fa-solid fa-hand-holding-dollar" style="color:white;font-size:1rem;"></i>





</div>





<div>






<div style="font-size:1.05rem;font-weight:800;color:#1e293b;">Make Payment</div>






<div style="font-size:0.74rem;color:#94a3b8;margin-top:0.05rem;">







${borrower.name}&nbsp;·&nbsp;







<span style="color:#4f46e5;font-weight:700;">${frequency}</span>&nbsp;·&nbsp;







Inst. <i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${parseFloat(loan.installmentAmount).toLocaleString("en-IN")}






</div>





</div>




</div>





<!-- Tabs -->




<div style="display:flex;border-bottom:1px solid #e2e8f0;">





<button class="pm-tab-btn pm-active" id="pm-tab-single"






onclick="window.ui._pmSwitchTab('single')">






<i class="fa-solid fa-pen-to-square" style="margin-right:0.28rem;font-size:0.77rem;"></i>Single Entry





</button>





<button class="pm-tab-btn" id="pm-tab-multiple"






onclick="window.ui._pmSwitchTab('multiple')">






<i class="fa-solid fa-layer-group" style="margin-right:0.28rem;font-size:0.77rem;"></i>Multiple Entry





</button>




</div>



</div>




<div style="padding:1.1rem 1.35rem 1.5rem;">





<!-- SINGLE ENTRY -->




<div id="pm-section-single" class="pm-section pm-active">





<form id="pay-single-form" autocomplete="off">






<div style="margin-bottom:0.85rem;">







<label class="pm-label">Borrower</label>







<input class="pm-input" type="text" value="${borrower.name}" readonly>






</div>






<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:0.85rem;">







<div>








<label class="pm-label">Due No.</label>








<input class="pm-input" type="text" value="${nextInstallmentNo}" readonly>







</div>







<div>








<label class="pm-label">Due Date</label>








<input class="pm-input" type="text" value="${nextDate.toLocaleDateString("en-IN")}" readonly style="color:#ef4444;font-weight:700;">







</div>






</div>






<div style="margin-bottom:0.85rem;">







<label class="pm-label">Payment Amount (<i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>)</label>







<div style="position:relative;">








<span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#4f46e5;font-weight:800;font-size:1.1rem;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span></span>








<input class="pm-input" type="number" name="amount" value="${nextAmount}"









style="padding-left:2.1rem;font-size:1.35rem;font-weight:800;color:#4f46e5;" step="0.01" required>







</div>






</div>






<div style="margin-bottom:0.85rem;">







<label class="pm-label">Payment Date</label>







<input class="pm-input" type="date" name="date" value="${today}" required>






</div>






<div style="margin-bottom:1.25rem;">







<label class="pm-label">Collected By</label>







<select class="pm-input" name="collectedBy">








<option>Admin</option><option>Staff</option>







</select>






</div>






<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;">







<button type="button" class="pm-btn-cancel"








onclick="document.getElementById('payment-modal').remove()">Cancel</button>







<button type="submit" class="pm-btn-ok" id="single-submit-btn">








<i class="fa-solid fa-check" style="margin-right:0.3rem;"></i>Confirm







</button>






</div>





</form>




</div>





<!-- MULTIPLE ENTRY -->




<div id="pm-section-multiple" class="pm-section">





<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;






padding:0.58rem 0.85rem;margin-bottom:0.95rem;






display:flex;align-items:center;gap:0.5rem;">






<i class="fa-solid fa-circle-info" style="color:#3b82f6;font-size:0.88rem;flex-shrink:0;"></i>






<span style="font-size:0.77rem;color:#1d4ed8;font-weight:500;">







Generates <strong>${frequency}</strong> dates between the two dates with the pre-filled amount.






</span>





</div>






<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:0.85rem;">






<div>







<label class="pm-label">








<i class="fa-solid fa-calendar-minus" style="color:#94a3b8;margin-right:0.22rem;"></i>Last Payment Date







</label>







<input class="pm-input" type="date" id="me-from-date" value="${defFromDate}">






</div>






<div>







<label class="pm-label">








<i class="fa-solid fa-calendar-check" style="color:#94a3b8;margin-right:0.22rem;"></i>Up To (Today)







</label>







<input class="pm-input" type="date" id="me-to-date" value="${today}">






</div>





</div>






<div style="margin-bottom:0.95rem;">






<label class="pm-label">Default Amount per Installment</label>






<div style="position:relative;">







<span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#10b981;font-weight:800;font-size:1rem;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span></span>







<input class="pm-input" type="number" id="me-default-amount"








value="${parseFloat(loan.installmentAmount)}"








style="padding-left:2rem;font-size:1.2rem;font-weight:800;color:#10b981;" step="0.01">






</div>






<div style="font-size:0.69rem;color:#94a3b8;margin-top:0.28rem;">







<i class="fa-solid fa-info-circle" style="margin-right:0.2rem;"></i>







Pre-filled for all rows &mdash; edit individually in the table.






</div>





</div>






<button class="pm-btn-show" onclick="window.ui._pmGenerateDates('${loanId}','${frequency}')">






<i class="fa-solid fa-table-list" style="margin-right:0.4rem;"></i>Show Payment Schedule





</button>






<div id="me-table-container"></div>




</div>




</div>


</div>


`;

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    document
      .getElementById("pay-single-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const btn = document.getElementById("single-submit-btn");

        btn.disabled = true;

        btn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

        try {
          const fd = new FormData(e.target);

          const val = parseFloat(fd.get("amount"));

          const date = fd.get("date");

          if (val > 0) {
            const freshLoan = await window.db.get("loans", loanId);

            await window.db.add("transactions", {
              id: crypto.randomUUID(),
              loanId,
              borrowerId: freshLoan.borrowerId,

              amount: val,
              date,
              timestamp: new Date().toISOString(),

              collectedBy: fd.get("collectedBy"),
            });

            freshLoan.paidAmount = (
              parseFloat(freshLoan.paidAmount || 0) + val
            ).toString();

            if (freshLoan.schedule) {
              let rem = val;

              for (const item of freshLoan.schedule) {
                if (item.status === "PAID" || rem <= 0) continue;

                const already = parseFloat(item.paidAmount || 0);

                const due = parseFloat(item.amount) - already;

                if (rem >= due) {
                  item.paidAmount = parseFloat(item.amount);
                  item.status = "PAID";
                  rem -= due;

                  this._appendPaymentHistory(item, due, "via Pay Modal", date);
                } else {
                  item.paidAmount = already + rem;
                  item.status = "PARTIAL";

                  this._appendPaymentHistory(item, rem, "via Pay Modal", date);
                  rem = 0;
                }
              }
            }

            if (
              parseFloat(freshLoan.paidAmount) >=
              parseFloat(freshLoan.totalAmount)
            )
              freshLoan.status = "closed";

            await window.db.add("loans", freshLoan);

            modal.remove();

            Swal.fire({
              icon: "success",
              title: "&#10003; Payment Received!",

              html: `<div style="font-size:1.5rem;font-weight:800;color:#10b981;margin:0.5rem 0;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${val.toLocaleString("en-IN")}</div>







   <div style="color:#64748b;font-size:0.87rem;">Collected on <strong>${date}</strong></div>`,

              timer: 2200,
              showConfirmButton: false,
            });

            window.ui.renderLoanDetail(loanId);
          }
        } catch (err) {
          console.error(err);

          btn.disabled = false;

          btn.innerHTML =
            '<i class="fa-solid fa-check" style="margin-right:0.3rem;"></i>Confirm';

          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Payment failed to save.",
          });
        }
      });
  }

  _pmSwitchTab(tab) {
    ["single", "multiple"].forEach((t) => {
      document
        .getElementById(`pm-tab-${t}`)
        ?.classList.toggle("pm-active", t === tab);

      const sec = document.getElementById(`pm-section-${t}`);

      if (sec) sec.classList.toggle("pm-active", t === tab);
    });
  }

  _pmGenerateDates(loanId, frequency) {
    const fromVal = document.getElementById("me-from-date").value;

    const toVal = document.getElementById("me-to-date").value;

    const defAmt =
      parseFloat(document.getElementById("me-default-amount").value) || 0;

    if (!fromVal || !toVal) {
      Swal.fire({
        icon: "warning",
        title: "Select Dates",
        text: "Please fill both date fields.",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    if (fromVal > toVal) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Range",
        text: '"Last Payment Date" must be on or before "Up To Date".',
        timer: 2200,
        showConfirmButton: false,
      });
      return;
    }

    const dates = [];

    let cur = new Date(fromVal);

    const end = new Date(toVal);

    while (cur <= end) {
      dates.push(cur.toISOString().split("T")[0]);

      if (frequency === "Weekly") cur.setDate(cur.getDate() + 7);
      else if (frequency === "Monthly") cur.setMonth(cur.getMonth() + 1);
      else cur.setDate(cur.getDate() + 1);
    }

    if (dates.length === 0) {
      document.getElementById("me-table-container").innerHTML =
        `<div style="text-align:center;padding:1.5rem;color:#94a3b8;font-size:0.87rem;">





<i class="fa-solid fa-calendar-xmark" style="font-size:2rem;color:#cbd5e1;display:block;margin-bottom:0.5rem;"></i>





No dates found in range.</div>`;

      return;
    }

    if (dates.length > 366) {
      Swal.fire({
        icon: "warning",
        title: "Too Many Dates",
        text: `${dates.length} dates — narrow the range.`,
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }

    const totalEst = (defAmt * dates.length).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

    const rows = dates
      .map(
        (d, i) => `



<tr id="me-row-${i}" data-date="${d}" data-index="${i}">




<td style="color:#64748b;font-weight:700;text-align:center;font-size:0.77rem;">${i + 1}</td>




<td style="font-weight:600;color:#1e293b;font-size:0.8rem;white-space:nowrap;">${d}</td>




<td>





<div style="position:relative;">






<span style="position:absolute;left:6px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:0.76rem;font-weight:700;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span></span>






<input class="me-input-amt" type="number" id="me-amt-${i}" value="${defAmt}" step="0.01" oninput="window.ui._updateMultipleEntryTotals()">





</div>




</td>




<td>





<div style="display:flex;gap:0.28rem;justify-content:flex-end;">






<button class="me-btn-save-row" onclick="window.ui._pmSaveRow('${loanId}',${i})">







<i class="fa-solid fa-floppy-disk" style="margin-right:0.18rem;"></i>Save






</button>






<button class="me-btn-del-row" onclick="window.ui._pmDeleteRow(${i})">







<i class="fa-solid fa-trash"></i>






</button>





</div>




</td>



</tr>`,
      )
      .join("");

    document.getElementById("me-table-container").innerHTML = `



<div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.9rem;margin-bottom:0.5rem;">




<div style="font-size:0.79rem;font-weight:700;color:#1e293b;" id="me-est-count">
<i class="fa-solid fa-list-check" style="color:#4f46e5;margin-right:0.28rem;"></i>





${dates.length} installment${dates.length !== 1 ? "s" : ""} found




</div>




<div style="font-size:0.74rem;color:#64748b;background:#f8fafc;padding:0.2rem 0.55rem;border-radius:20px;border:1px solid #e2e8f0;">





Est. Total: <strong style="color:#10b981;" id="me-est-total"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalEst}</strong>




</div>



</div>



<div class="me-table-wrap">




<table class="me-table">





<thead>






<tr>







<th style="width:30px;">#</th>







<th>Date</th>







<th>Amount</th>







<th style="text-align:right;">Actions</th>






</tr>





</thead>





<tbody id="me-table-body">${rows}</tbody>




</table>



</div>



<button class="pm-save-all-btn" id="me-save-all-btn" onclick="window.ui._pmSaveAll('${loanId}')">




<i class="fa-solid fa-cloud-arrow-up" style="font-size:1rem;"></i>




<span id="me-btn-save-all-text">Save All ${dates.length} Payments</span>



</button>


`;
  }

  _updateMultipleEntryTotals() {
    const tbody = document.getElementById("me-table-body");
    if (!tbody) return;
    const pendingRows = Array.from(
      tbody.querySelectorAll('tr[id^="me-row-"]'),
    ).filter((r) => r.dataset.saved !== "true");
    let count = pendingRows.length;
    let total = 0;
    pendingRows.forEach((row) => {
      const idx = row.dataset.index;
      const amtEl = document.getElementById(`me-amt-${idx}`);
      if (amtEl) total += parseFloat(amtEl.value) || 0;
    });
    const countEl = document.getElementById("me-est-count");
    if (countEl)
      countEl.innerHTML = `<i class="fa-solid fa-list-check" style="color:#4f46e5;margin-right:0.28rem;"></i>${count} installment${count !== 1 ? "s" : ""} found`;
    const totalEl = document.getElementById("me-est-total");
    if (totalEl)
      totalEl.innerHTML = `<i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    const btnText = document.getElementById("me-btn-save-all-text");
    if (btnText)
      btnText.innerHTML =
        count > 0 ? `Save All ${count} Payments` : `No Pending Payments`;
    const btn = document.getElementById("me-save-all-btn");
    if (btn) {
      btn.disabled = count === 0;
      btn.style.opacity = count === 0 ? "0.6" : "1";
    }
  }

  async _pmSaveRow(loanId, rowIndex) {
    const row = document.getElementById(`me-row-${rowIndex}`);

    if (!row || row.dataset.saved === "true") return;

    const date = row.dataset.date;

    const amtEl = document.getElementById(`me-amt-${rowIndex}`);

    const val = parseFloat(amtEl?.value);

    if (!val || val <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Amount",
        text: "Enter a value > 0.",
        timer: 1800,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
      return;
    }

    try {
      let loan = await window.db.get("loans", loanId);

      if (!loan) throw new Error("Loan not found");

      loan = await this._ensureSchedulePersisted(loan);

      await window.db.add("transactions", {
        id: crypto.randomUUID(),
        loanId,
        borrowerId: loan.borrowerId,

        amount: val,
        date,
        timestamp: `${date}T${new Date().toISOString().split("T")[1]}`,
        note: "Multiple Entry",
      });

      loan.paidAmount = (parseFloat(loan.paidAmount || 0) + val).toFixed(2);

      if (loan.schedule) {
        let si = loan.schedule.findIndex((s) => s.dueDate === date);

        if (si === -1) si = loan.schedule.findIndex((s) => s.status !== "PAID");

        if (si !== -1) {
          const it = loan.schedule[si];

          it.paidAmount = parseFloat(
            (parseFloat(it.paidAmount || 0) + val).toFixed(2),
          );

          it.status =
            it.paidAmount >= it.amount
              ? "PAID"
              : it.paidAmount > 0
                ? "PARTIAL"
                : "DUE";

          this._appendPaymentHistory(it, val, `Multiple Entry (${date})`, date);
        }
      }

      if (parseFloat(loan.paidAmount) >= parseFloat(loan.totalAmount))
        loan.status = "closed";

      await window.db.add("loans", loan);

      row.classList.add("me-row-saved");
      row.dataset.saved = "true";

      if (amtEl) {
        amtEl.disabled = true;
        amtEl.style.color = "#10b981";
      }

      const actCell = row.querySelector("td:last-child div");

      if (actCell)
        actCell.innerHTML = `<span style="color:#10b981;font-size:0.74rem;font-weight:700;"><i class="fa-solid fa-check-circle"></i> Saved</span>`;

      Swal.fire({
        icon: "success",
        title: `<i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${val.toLocaleString("en-IN")} saved`,
        text: date,
        toast: true,
        position: "top-end",
        timer: 1600,
        showConfirmButton: false,
      });
      window.ui._updateMultipleEntryTotals();
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err.message,
        timer: 2500,
      });
    }
  }

  _pmDeleteRow(rowIndex) {
    const row = document.getElementById(`me-row-${rowIndex}`);

    if (!row) return;

    if (row.dataset.saved === "true") {
      Swal.fire({
        icon: "info",
        title: "Already Saved",
        text: "This entry is committed to the database.",
        timer: 2200,
        showConfirmButton: false,
      });
      return;
    }

    row.style.transition = "all 0.2s";
    row.style.opacity = "0";
    row.style.transform = "translateX(20px)";

    setTimeout(() => {
      row.remove();
      window.ui._updateMultipleEntryTotals();
    }, 210);
  }

  async _pmSaveAll(loanId) {
    const tbody = document.getElementById("me-table-body");

    if (!tbody) return;

    const pending = Array.from(
      tbody.querySelectorAll('tr[id^="me-row-"]'),
    ).filter((r) => r.dataset.saved !== "true");

    if (pending.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Nothing to Save",
        text: "All entries already saved or removed.",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    const saveAllBtn = document.getElementById("me-save-all-btn");

    if (saveAllBtn) {
      saveAllBtn.disabled = true;
      saveAllBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    let saved = 0,
      failed = 0,
      totalSaved = 0;

    try {
      let loan = await window.db.get("loans", loanId);

      if (!loan) throw new Error("Loan not found");

      loan = await this._ensureSchedulePersisted(loan);

      for (const row of pending) {
        const idx = parseInt(row.dataset.index);

        const date = row.dataset.date;

        const amtEl = document.getElementById(`me-amt-${idx}`);

        const val = parseFloat(amtEl?.value);

        if (!val || val <= 0) {
          failed++;
          continue;
        }

        await window.db.add("transactions", {
          id: crypto.randomUUID(),
          loanId,
          borrowerId: loan.borrowerId,

          amount: val,
          date,
          timestamp: `${date}T${new Date().toISOString().split("T")[1]}`,
          note: "Multiple Entry batch",
        });

        loan.paidAmount = (parseFloat(loan.paidAmount || 0) + val).toFixed(2);

        totalSaved += val;

        if (loan.schedule) {
          let si = loan.schedule.findIndex((s) => s.dueDate === date);

          if (si === -1)
            si = loan.schedule.findIndex((s) => s.status !== "PAID");

          if (si !== -1) {
            const it = loan.schedule[si];

            it.paidAmount = parseFloat(
              (parseFloat(it.paidAmount || 0) + val).toFixed(2),
            );

            it.status =
              it.paidAmount >= it.amount
                ? "PAID"
                : it.paidAmount > 0
                  ? "PARTIAL"
                  : "DUE";

            this._appendPaymentHistory(
              it,
              val,
              `Multiple Entry Batch (${date})`,
              date,
            );
          }
        }

        row.classList.add("me-row-saved");
        row.dataset.saved = "true";

        if (amtEl) {
          amtEl.disabled = true;
          amtEl.style.color = "#10b981";
        }

        const actCell = row.querySelector("td:last-child div");

        if (actCell)
          actCell.innerHTML = `<span style="color:#10b981;font-size:0.74rem;font-weight:700;"><i class="fa-solid fa-check-circle"></i> Saved</span>`;

        saved++;
      }

      if (parseFloat(loan.paidAmount) >= parseFloat(loan.totalAmount))
        loan.status = "closed";

      await window.db.add("loans", loan);
    } catch (err) {
      console.error(err);
    }

    if (saveAllBtn) {
      saveAllBtn.disabled = false;
      saveAllBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Save All Payments`;
    }

    Swal.fire({
      icon: failed === 0 ? "success" : "warning",

      title:
        failed === 0
          ? "All Payments Saved!"
          : `Saved ${saved} of ${saved + failed}`,

      html: `




<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin:0.8rem 0;text-align:center;">





<div style="background:#f0fdf4;border-radius:12px;padding:0.8rem;">






<div style="font-size:1.5rem;font-weight:800;color:#10b981;">${saved}</div>






<div style="font-size:0.7rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-top:0.2rem;">Entries Saved</div>





</div>





<div style="background:#eff6ff;border-radius:12px;padding:0.8rem;">






<div style="font-size:1.5rem;font-weight:800;color:#3b82f6;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalSaved.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>






<div style="font-size:0.7rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-top:0.2rem;">Total Collected</div>





</div>




</div>




${failed > 0 ? `<div style="color:#ef4444;font-size:0.79rem;margin-top:0.4rem;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:0.25rem;"></i>${failed} row(s) skipped — invalid amount.</div>` : ""}`,

      confirmButtonColor: "#4f46e5",

      confirmButtonText:
        '<i class="fa-solid fa-eye" style="margin-right:0.3rem;"></i>View Loan',
    }).then(() => {
      document.getElementById("payment-modal")?.remove();

      window.ui.renderLoanDetail(loanId);
    });
  }

  showAddLoanModal(borrowerId) {
    window.app.navigate("add-loan", borrowerId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  COMPLETE RECORDS MODULE
  // ══════════════════════════════════════════════════════════════════════════

  async renderCompleteRecords() {
    this.setTitle("Complete Records");
    this.hideFab();

    if (!this.completeRecordsState) {
      this.completeRecordsState = {
        search: '',
        dateFrom: '',
        dateTo: '',
        borrowerId: 'all',
        receivedBy: 'all',
        minAmount: '',
        maxAmount: '',
        transactionType: 'all',
        sortBy: 'date',
        sortOrder: 'desc',
        pageSize: 20,
        currentPage: 1
      };
    }

    // Fetch all data (loans + savings)
    const borrowers = await window.db.getAll('borrowers');
    const loans = await window.db.getAll('loans');
    const transactions = await window.db.getAll('transactions');
    const savings = await window.db.getAll('savings');
    const savingsTransactions = await window.db.getAll('savingsTransactions');

    // Build comprehensive transaction records with enriched data (synced from Loan Details + Savings Details)
    // 1. LOAN TRANSACTIONS
    const loanRecords = transactions.map(txn => {
      const loan = loans.find(l => l.id === txn.loanId);
      const borrower = borrowers.find(b => b.id === (loan?.borrowerId || txn.borrowerId));
      
      // Dynamic sync with Loan Details: Get receivedBy from schedule paymentHistory
      let receivedBy = '';
      if (loan?.schedule && Array.isArray(loan.schedule)) {
        const matchingSchedule = loan.schedule.find(sch => {
          const payHistory = sch.paymentHistory || [];
          return payHistory.some(ph => 
            ph.timestamp?.split('T')[0] === txn.date && 
            ph.amount === txn.amount
          );
        });
        
        if (matchingSchedule?.paymentHistory?.length > 0) {
          const lastPayment = matchingSchedule.paymentHistory[matchingSchedule.paymentHistory.length - 1];
          receivedBy = lastPayment.receivedBy || '';
        }
      }
      
      if (!receivedBy) {
        receivedBy = txn.collectedBy || '';
      }
      
      return {
        ...txn,
        transactionType: 'loan',
        loanNo: loan?.loanNo || '-',
        borrowerName: borrower?.name || 'Unknown',
        borrowerId: borrower?.id || '',
        loanAmount: loan?.totalAmount || 0,
        installmentAmount: loan?.installmentAmount || 0,
        receivedBy: receivedBy
      };
    });

    // 2. SAVINGS TRANSACTIONS (Modern Sync Pattern - Direct Field Access)
    const savingsRecords = savingsTransactions.map(stxn => {
      const savingsAccount = savings.find(s => s.id === stxn.savingsId);
      const borrower = borrowers.find(b => b.id === savingsAccount?.userId);
      
      // Modern Sync Pattern: Use receivedBy directly from transaction (now stored with userId)
      // This eliminates expensive schedule matching and is more reliable
      const receivedBy = stxn.receivedBy || 'Admin';
      
      return {
        ...stxn,
        id: stxn.id,
        transactionType: 'savings',
        loanNo: savingsAccount?.accountNo || '-',
        borrowerName: borrower?.name || 'Unknown',
        borrowerId: stxn.userId || savingsAccount?.userId || '',
        loanAmount: savingsAccount?.goalAmount || 0,
        installmentAmount: savingsAccount?.installmentAmount || 0,
        receivedBy: receivedBy
      };
    });

    // 3. MERGE LOAN AND SAVINGS RECORDS
    const records = [...loanRecords, ...savingsRecords];

    // Apply filters
    let filteredRecords = [...records];
    const state = this.completeRecordsState;

    // Search filter
    if (state.search.trim()) {
      const search = state.search.toLowerCase();
      filteredRecords = filteredRecords.filter(r => {
        // Ensure data is properly synced and calculated
        const borrowerName = (r.borrowerName || '').toLowerCase();
        const loanNo = (r.loanNo || '').toLowerCase();
        const transactionId = (r.id || '').toLowerCase();
        const receivedBy = (r.receivedBy || '').toLowerCase();
        const date = (r.date || '').toLowerCase();
        const amount = String(r.amount || '').toLowerCase();
        const transactionType = (r.transactionType || '').toLowerCase();
        const note = (r.note || '').toLowerCase();
        const savingsId = (r.savingsId || '').toLowerCase();
        
        // Search across all relevant fields dynamically
        return borrowerName.includes(search) ||          // User name
               loanNo.includes(search) ||                 // Loan No or Savings Account
               transactionId.includes(search) ||          // Transaction ID
               receivedBy.includes(search) ||             // Received By person
               date.includes(search) ||                   // Date YYYY-MM-DD
               amount.includes(search) ||                 // Amount as string
               transactionType.includes(search) ||        // 'loan' or 'savings'
               note.includes(search) ||                   // Transaction note
               savingsId.includes(search);                // Savings ID if exists
      });
    }

    // Borrower filter
    if (state.borrowerId !== 'all') {
      filteredRecords = filteredRecords.filter(r => r.borrowerId === state.borrowerId);
    }

    // Received By filter
    if (state.receivedBy !== 'all') {
      filteredRecords = filteredRecords.filter(r => r.receivedBy === state.receivedBy);
    }

    // Date range filter
    if (state.dateFrom) {
      filteredRecords = filteredRecords.filter(r => r.date >= state.dateFrom);
    }
    if (state.dateTo) {
      filteredRecords = filteredRecords.filter(r => r.date <= state.dateTo);
    }

    // Amount range filter
    if (state.minAmount) {
      const minAmt = parseFloat(state.minAmount);
      filteredRecords = filteredRecords.filter(r => parseFloat(r.amount || 0) >= minAmt);
    }
    if (state.maxAmount) {
      const maxAmt = parseFloat(state.maxAmount);
      filteredRecords = filteredRecords.filter(r => parseFloat(r.amount || 0) <= maxAmt);
    }

    // Sort
    filteredRecords.sort((a, b) => {
      let aVal = a[state.sortBy];
      let bVal = b[state.sortBy];

      if (state.sortBy === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (state.sortBy === 'amount') {
        aVal = parseFloat(aVal || 0);
        bVal = parseFloat(bVal || 0);
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (state.sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    // Pagination
    const totalRecords = filteredRecords.length;
    const totalPages = Math.ceil(totalRecords / state.pageSize);
    const startIdx = (state.currentPage - 1) * state.pageSize;
    const endIdx = startIdx + state.pageSize;
    const paginatedRecords = filteredRecords.slice(startIdx, endIdx);

    // Store filtered data for dynamic PDF generation
    this.completeRecordsFilteredData = filteredRecords;
    this.completeRecordsState = state;

    // Calculate totals
    const totalAmount = filteredRecords.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const avgAmount = filteredRecords.length > 0 ? totalAmount / filteredRecords.length : 0;

    // Borrower options for filter
    const borrowerOptions = borrowers.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    // Received By options for filter (extract unique values from records)
    const uniqueReceivedBy = [...new Set(records.map(r => r.receivedBy).filter(rb => rb && rb.trim() !== ''))];
    const receivedByOptions = uniqueReceivedBy.map(rb => `<option value="${rb}">${rb}</option>`).join('');

    // Format date helper
    const formatDate = (dateStr) => {
      if (!dateStr) return '-';
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Format amount helper
    const formatAmount = (amt) => {
      return parseFloat(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    this.container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- Statistics Bar -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 0.5rem;">
        <div class="stat-card">
          <div class="stat-label">Total Records</div>
          <div class="stat-value">${filteredRecords.length}</div>
          <div class="stat-subtext">out of ${totalRecords}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Amount</div>
          <div class="stat-value" style="color: #2563eb;">৳${formatAmount(totalAmount)}</div>
          <div class="stat-subtext">collected</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Average Amount</div>
          <div class="stat-value" style="color: #7c3aed;">৳${formatAmount(avgAmount)}</div>
          <div class="stat-subtext">per transaction</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Date Range</div>
          <div class="stat-value" style="font-size: 0.85rem;">
            ${state.dateFrom ? formatDate(state.dateFrom) : 'All'}
          </div>
          <div class="stat-subtext">${state.dateTo ? ' to ' + formatDate(state.dateTo) : 'dates'}</div>
        </div>
      </div>

      <!-- Filter Panel -->
      <div class="filter-panel" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; padding: 1.5rem; background: linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0.02) 100%); border-radius: var(--radius-lg); border: 1px solid rgba(37, 99, 235, 0.1); backdrop-filter: blur(4px);">
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);"><i class="fa-solid fa-magnifying-glass" style="margin-right: 0.35rem; color: #2563eb;"></i>Search All Fields</label>
          <input type="text" class="form-control" placeholder="Search: user, amount, date, type, ID, collector..." value="${state.search}" style="padding: 0.75rem; border: 1px solid rgba(37, 99, 235, 0.15); border-radius: var(--radius-md);" onchange="window.ui.completeRecordsState.search = this.value; window.ui.completeRecordsState.currentPage = 1; window.ui.renderCompleteRecords();">
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">From Date</label>
          <input type="date" class="form-control" value="${state.dateFrom}" style="padding: 0.75rem; border: 1px solid rgba(37, 99, 235, 0.15); border-radius: var(--radius-md);" onchange="window.ui.completeRecordsState.dateFrom = this.value; window.ui.completeRecordsState.currentPage = 1; window.ui.renderCompleteRecords();">
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">To Date</label>
          <input type="date" class="form-control" value="${state.dateTo}" style="padding: 0.75rem; border: 1px solid rgba(37, 99, 235, 0.15); border-radius: var(--radius-md);" onchange="window.ui.completeRecordsState.dateTo = this.value; window.ui.completeRecordsState.currentPage = 1; window.ui.renderCompleteRecords();">
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);"><i class="fa-solid fa-users" style="margin-right: 0.35rem; color: #0891b2;"></i>User</label>
          <select class="form-control" style="padding: 0.75rem; border: 1px solid rgba(37, 99, 235, 0.15); border-radius: var(--radius-md);" onchange="window.ui.completeRecordsState.borrowerId = this.value; window.ui.completeRecordsState.currentPage = 1; window.ui.renderCompleteRecords();"><option value="all">All Users</option>${borrowerOptions}</select>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);"><i class="fa-solid fa-badge-check" style="margin-right: 0.35rem; color: #16a34a;"></i>Received By</label>
          <select class="form-control" style="padding: 0.75rem; border: 1px solid rgba(37, 99, 235, 0.15); border-radius: var(--radius-md); background: linear-gradient(135deg, rgba(22, 163, 74, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%);" onchange="window.ui.completeRecordsState.receivedBy = this.value; window.ui.completeRecordsState.currentPage = 1; window.ui.renderCompleteRecords();"><option value="all">All Recipients</option>${receivedByOptions}</select>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Min Amount (৳)</label>
          <input type="number" class="form-control" placeholder="Minimum" value="${state.minAmount}" style="padding: 0.75rem; border: 1px solid rgba(37, 99, 235, 0.15); border-radius: var(--radius-md);" onchange="window.ui.completeRecordsState.minAmount = this.value; window.ui.completeRecordsState.currentPage = 1; window.ui.renderCompleteRecords();">
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Max Amount (৳)</label>
          <input type="number" class="form-control" placeholder="Maximum" value="${state.maxAmount}" style="padding: 0.75rem; border: 1px solid rgba(37, 99, 235, 0.15); border-radius: var(--radius-md);" onchange="window.ui.completeRecordsState.maxAmount = this.value; window.ui.completeRecordsState.currentPage = 1; window.ui.renderCompleteRecords();">
        </div>
        <div style="display: flex; align-items: flex-end;">
          <button class="btn btn-secondary" onclick="window.ui.completeRecordsState = {search: '', dateFrom: '', dateTo: '', borrowerId: 'all', receivedBy: 'all', minAmount: '', maxAmount: '', transactionType: 'all', sortBy: 'date', sortOrder: 'desc', pageSize: 20, currentPage: 1}; window.ui.renderCompleteRecords();" style="width: 100%; padding: 0.75rem; cursor: pointer;"><i class="fa-solid fa-rotate-left" style="margin-right: 0.5rem;"></i>Clear Filters</button>
        </div>
      </div>

      <!-- Action Buttons (Top) -->
      <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-bottom: 1.5rem;">
        <button class="btn btn-secondary" onclick="window.ui._downloadCompleteRecordsReportPDF();" title="Download Professional PDF Report" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(239, 68, 68, 0.3)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none'"><i class="fa-solid fa-file-pdf"></i> Report</button>
        <button class="btn btn-primary" onclick="window.ui._exportCompleteRecords();" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, var(--primary) 0%, #1e40af 100%); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(37, 99, 235, 0.3)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none'"><i class="fa-solid fa-download"></i> Export to CSV</button>
      </div>

      <!-- Records Table -->
      <div class="records-table-wrapper" style="border-radius: var(--radius-lg); overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); border: 1px solid rgba(37, 99, 235, 0.08); background: white;">
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%); border-bottom: 2px solid rgba(37, 99, 235, 0.15);">
              <tr>
                <th onclick="window.ui._sortRecords('date')" style="padding: 1rem; text-align: center; font-weight: 700; cursor: pointer; border-right: 1px solid rgba(37, 99, 235, 0.1);">Date ${state.sortBy === 'date' ? (state.sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                <th onclick="window.ui._sortRecords('borrowerName')" style="padding: 1rem; text-align: center; font-weight: 700; cursor: pointer; border-right: 1px solid rgba(37, 99, 235, 0.1);">User ${state.sortBy === 'borrowerName' ? (state.sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                <th onclick="window.ui._sortRecords('loanNo')" style="padding: 1rem; text-align: center; font-weight: 700; cursor: pointer; border-right: 1px solid rgba(37, 99, 235, 0.1);">Type ${state.sortBy === 'loanNo' ? (state.sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                <th onclick="window.ui._sortRecords('amount')" style="padding: 1rem; text-align: center; font-weight: 700; cursor: pointer; border-right: 1px solid rgba(37, 99, 235, 0.1);">Amount ${state.sortBy === 'amount' ? (state.sortOrder === 'asc' ? '↑' : '↓') : ''}</th>
                <th style="padding: 1rem; text-align: center; font-weight: 700; border-right: 1px solid rgba(37, 99, 235, 0.1);">Received By</th>
                <th style="padding: 1rem; text-align: center; font-weight: 700; border-right: 1px solid rgba(37, 99, 235, 0.1);">Details</th>
              </tr>
            </thead>
            <tbody>
              ${paginatedRecords.length > 0 ? paginatedRecords.map((r, idx) => `<tr style="border-bottom: 1px solid rgba(37, 99, 235, 0.08); ${idx % 2 === 0 ? 'background: rgba(37, 99, 235, 0.02);' : 'background: white;'}"><td style="padding: 1rem; border-right: 1px solid rgba(37, 99, 235, 0.08); font-weight: 500; text-align: center;">${formatDate(r.date)}</td><td style="padding: 1rem; border-right: 1px solid rgba(37, 99, 235, 0.08); font-weight: 600; text-align: center;">${r.borrowerName}</td><td style="padding: 1rem; border-right: 1px solid rgba(37, 99, 235, 0.08); text-align: center;"><span style="background: linear-gradient(135deg, ${r.transactionType === 'savings' ? 'rgba(124, 58, 237, 0.12) 0%, rgba(147, 51, 234, 0.06)' : 'rgba(37, 99, 235, 0.12) 0%, rgba(59, 130, 246, 0.06)'} 100%); border: 1px solid ${r.transactionType === 'savings' ? 'rgba(147, 51, 234, 0.2)' : 'rgba(59, 130, 246, 0.2)'}; padding: 0.4rem 0.8rem; border-radius: var(--radius-md); font-size: 0.8rem; font-weight: 700; color: ${r.transactionType === 'savings' ? '#6d28d9' : '#1e40af'}; display: inline-flex; align-items: center; justify-content: center;">${r.transactionType === 'savings' ? 'Savings' : 'Loan'} (${r.loanNo})</span></td><td style="padding: 1rem; text-align: center; color: var(--success); font-weight: 700; border-right: 1px solid rgba(37, 99, 235, 0.08);">৳${formatAmount(r.amount)}</td><td style="padding: 1rem; border-right: 1px solid rgba(37, 99, 235, 0.08); text-align: center;">${r.receivedBy ? `<span style="background: linear-gradient(135deg, rgba(22, 163, 74, 0.15) 0%, rgba(34, 197, 94, 0.08) 100%); border: 1px solid rgba(34, 197, 94, 0.2); padding: 0.4rem 0.7rem; border-radius: var(--radius-md); font-size: 0.8rem; font-weight: 600; color: #16a34a; display: inline-block;">${r.receivedBy}</span>` : '<span style="font-size: 0.8rem; color: #cbd5e1; font-style: italic;">—</span>'}</td><td style="padding: 1rem; text-align: center;"><span style="font-size: 0.8rem; background: rgba(37, 99, 235, 0.08); padding: 0.4rem 0.6rem; border-radius: var(--radius-md); display: inline-block;">ID: ${r.id.substring(0, 8)}...</span></td></tr>`).join('') : '<tr><td colspan="6" style="padding: 3rem 1rem; text-align: center; color: #94a3b8;">No records found</td></tr>'}
            </tbody>
          </table>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: rgba(37, 99, 235, 0.02); border-top: 1px solid rgba(37, 99, 235, 0.1);">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Showing <strong>${startIdx + 1}-${Math.min(endIdx, totalRecords)}</strong> of <strong>${totalRecords}</strong></div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button class="btn btn-secondary" onclick="window.ui.completeRecordsState.currentPage > 1 && (window.ui.completeRecordsState.currentPage--, window.ui.renderCompleteRecords());" style="padding: 0.5rem 0.75rem; opacity: ${state.currentPage === 1 ? 0.5 : 1};"><i class="fa-solid fa-chevron-left"></i> Prev</button>
            <div style="display: flex; gap: 0.25rem;">
              ${Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
                const p = i + 1;
                return `<button onclick="window.ui.completeRecordsState.currentPage = ${p}; window.ui.renderCompleteRecords();" style="padding: 0.5rem 0.65rem; border: 1px solid ${p === state.currentPage ? 'var(--primary)' : 'rgba(37, 99, 235, 0.15)'}; background: ${p === state.currentPage ? 'var(--primary)' : 'white'}; color: ${p === state.currentPage ? 'white' : 'var(--text-primary)'}; border-radius: var(--radius-md); cursor: pointer; font-weight: ${p === state.currentPage ? '600' : '500'}; font-size: 0.85rem;">${p}</button>`;
              }).join('')}
            </div>
            <button class="btn btn-secondary" onclick="window.ui.completeRecordsState.currentPage < ${totalPages} && (window.ui.completeRecordsState.currentPage++, window.ui.renderCompleteRecords());" style="padding: 0.5rem 0.75rem; opacity: ${state.currentPage === totalPages ? 0.5 : 1};">Next <i class="fa-solid fa-chevron-right"></i></button>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Page <strong>${state.currentPage}</strong> of <strong>${totalPages || 1}</strong></div>
        </div>
      </div>
    </div>
    `;
  }

  _sortRecords(field) {
    if (!this.completeRecordsState) return;
    if (this.completeRecordsState.sortBy === field) {
      this.completeRecordsState.sortOrder = this.completeRecordsState.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.completeRecordsState.sortBy = field;
      this.completeRecordsState.sortOrder = 'desc';
    }
    this.completeRecordsState.currentPage = 1;
    this.renderCompleteRecords();
  }

  async _exportCompleteRecords() {
    const borrowers = await window.db.getAll('borrowers');
    const loans = await window.db.getAll('loans');
    const transactions = await window.db.getAll('transactions');
    const savings = await window.db.getAll('savings');
    const savingsTransactions = await window.db.getAll('savingsTransactions');

    // LOAN RECORDS
    const loanRecords = transactions.map(txn => {
      const loan = loans.find(l => l.id === txn.loanId);
      const borrower = borrowers.find(b => b.id === (loan?.borrowerId || txn.borrowerId));
      
      let receivedBy = '';
      if (loan?.schedule && Array.isArray(loan.schedule)) {
        const matchingSchedule = loan.schedule.find(sch => {
          const payHistory = sch.paymentHistory || [];
          return payHistory.some(ph => 
            ph.timestamp?.split('T')[0] === txn.date && 
            ph.amount === txn.amount
          );
        });
        if (matchingSchedule?.paymentHistory?.length > 0) {
          const lastPayment = matchingSchedule.paymentHistory[matchingSchedule.paymentHistory.length - 1];
          receivedBy = lastPayment.receivedBy || '';
        }
      }
      if (!receivedBy) {
        receivedBy = txn.collectedBy || '-';
      }
      
      return { 
        Date: txn.date || '-', 
        'User Name': borrower?.name || 'Unknown',
        'Type': 'Loan (' + (loan?.loanNo || '-') + ')',
        Amount: txn.amount || 0,
        'Received By': receivedBy,
        'Transaction ID': txn.id 
      };
    });

    // SAVINGS RECORDS (Modern Sync Pattern)
    const savingsRecords = savingsTransactions.map(stxn => {
      const savingsAccount = savings.find(s => s.id === stxn.savingsId);
      const borrower = borrowers.find(b => b.id === savingsAccount?.userId);
      
      // Use receivedBy directly from transaction (modern pattern - now stored with userId)
      const receivedBy = stxn.receivedBy || '-';
      
      return { 
        Date: stxn.date || '-', 
        'User Name': borrower?.name || 'Unknown',
        'Type': 'Savings (' + (savingsAccount?.accountNo || '-') + ')',
        Amount: stxn.amount || 0,
        'Received By': receivedBy,
        'Transaction ID': stxn.id 
      };
    });

    // MERGE RECORDS
    const records = [...loanRecords, ...savingsRecords];
    
    const headers = Object.keys(records[0] || {});
    const csv = [headers.join(','), ...records.map(r => headers.map(h => `"${r[h]}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complete-records-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    Swal.fire({ icon: 'success', title: 'Export Successful', text: `${records.length} records exported to CSV`, timer: 2000, showConfirmButton: false });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   * COMPLETE RECORDS PROFESSIONAL REPORT GENERATION
   * ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   * 
   * Generates a comprehensive, professionally-formatted PDF report containing:
   * ✓ Document header with company branding & metadata
   * ✓ Summary statistics (total transactions, amounts by type, collection metrics)
   * ✓ Dynamic transaction ledger with all loan and savings records
   * ✓ Collection performance breakdown (receipts by collector, amount distribution)
   * ✓ Professional typography, color schemes, and PDF-optimized styling
   * ✓ Signature block for authorized personnel
   * ✓ Automatic pagination and proper spacing for A4 print
   * 
   * Data Sync: Uses modern synchronization pattern from renderCompleteRecords()
   * ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
   */
  async generateCompleteRecordsReport() {
    try {
      // Gather all data sources
      const borrowers = await window.db.getAll('borrowers');
      const loans = await window.db.getAll('loans');
      const transactions = await window.db.getAll('transactions');
      const savings = await window.db.getAll('savings');
      const savingsTransactions = await window.db.getAll('savingsTransactions');

      // Build comprehensive transaction records (synced from Complete Records)
      // 1. LOAN TRANSACTIONS
      const loanRecords = transactions.map(txn => {
        const loan = loans.find(l => l.id === txn.loanId);
        const borrower = borrowers.find(b => b.id === (loan?.borrowerId || txn.borrowerId));
        
        let receivedBy = '';
        if (loan?.schedule && Array.isArray(loan.schedule)) {
          const matchingSchedule = loan.schedule.find(sch => {
            const payHistory = sch.paymentHistory || [];
            return payHistory.some(ph => 
              ph.timestamp?.split('T')[0] === txn.date && 
              ph.amount === txn.amount
            );
          });
          if (matchingSchedule?.paymentHistory?.length > 0) {
            const lastPayment = matchingSchedule.paymentHistory[matchingSchedule.paymentHistory.length - 1];
            receivedBy = lastPayment.receivedBy || '';
          }
        }
        if (!receivedBy) receivedBy = txn.collectedBy || 'Admin';
        
        return {
          ...txn,
          transactionType: 'loan',
          loanNo: loan?.loanNo || '-',
          borrowerName: borrower?.name || 'Unknown',
          loanAmount: loan?.totalAmount || 0,
          receivedBy: receivedBy
        };
      });

      // 2. SAVINGS TRANSACTIONS (Modern Sync Pattern)
      const savingsRecords = savingsTransactions.map(stxn => {
        const savingsAccount = savings.find(s => s.id === stxn.savingsId);
        const borrower = borrowers.find(b => b.id === savingsAccount?.userId);
        const receivedBy = stxn.receivedBy || 'Admin';
        
        return {
          ...stxn,
          transactionType: 'savings',
          loanNo: savingsAccount?.accountNo || '-',
          borrowerName: borrower?.name || 'Unknown',
          loanAmount: savingsAccount?.goalAmount || 0,
          receivedBy: receivedBy
        };
      });

      // 3. MERGE RECORDS & CALCULATE STATISTICS
      const records = [...loanRecords, ...savingsRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Summary Statistics
      const totalTransactions = records.length;
      const totalAmount = records.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const loanAmount = loanRecords.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const savingsAmount = savingsRecords.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      
      // Collection breakdown by collector
      const collectorMap = {};
      records.forEach(r => {
        const collector = r.receivedBy || 'Unassigned';
        if (!collectorMap[collector]) collectorMap[collector] = { count: 0, amount: 0 };
        collectorMap[collector].count++;
        collectorMap[collector].amount += parseFloat(r.amount || 0);
      });

      // Generate transaction ledger rows with detailed information
      const ledgerRows = records.slice(0, 50).map((r, i) => {
        const transactionType = r.transactionType === 'savings' ? 'Savings' : 'Loan';
        const typeColor = r.transactionType === 'savings' ? '#7c3aed' : '#2563eb';
        const refId = r.transactionType === 'savings' ? (r.loanNo || 'SAV-' + i) : (r.loanNo || 'LOAN-' + i);
        
        return `<tr>
          <td style="text-align:center;font-weight:700;color:#64748b;font-size:7pt;">${i + 1}</td>
          <td style="font-size:7pt;color:#374151;">${r.date || '-'}</td>
          <td style="font-weight:600;font-size:7.5pt;color:#111827;">${r.borrowerName}</td>
          <td style="font-size:7pt;color:#374151;">
            <span style="color:${typeColor};font-weight:700;">${transactionType}</span> <span style="color:#6b7280;">(Ref: ${refId})</span>
          </td>
          <td style="text-align:right;font-weight:700;color:#16a34a;font-size:7.5pt;">৳${parseFloat(r.amount || 0).toLocaleString('en-IN', {minimumFractionDigits:0})}</td>
          <td style="font-size:7pt;color:#374151;">${r.receivedBy || 'Admin'}</td>
        </tr>`;
      }).join('');

      // Generate collection performance rows (top 15 collectors)
      const collectorRows = Object.entries(collectorMap)
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 15)
        .map((entry, i) => {
          const [name, data] = entry;
          const percentage = ((data.amount / totalAmount) * 100).toFixed(1);
          return `<tr>
            <td style="text-align:center;font-weight:700;color:#64748b;font-size:7pt;">${i + 1}</td>
            <td style="font-weight:600;font-size:7.5pt;color:#111827;">${name}</td>
            <td style="text-align:center;font-weight:700;color:#2563eb;font-size:7pt;">${data.count}</td>
            <td style="text-align:right;font-weight:700;color:#16a34a;font-size:7.5pt;">৳${parseFloat(data.amount).toLocaleString('en-IN',{maximumFractionDigits:0})}</td>
            <td style="text-align:right;color:#4338ca;font-weight:700;font-size:7pt;">${percentage}%</td>
          </tr>`;
        }).join('');

      // Metadata
      const genDate = new Date().toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true });
      const generatedBy = localStorage.getItem('fincollect_user') || 'System Admin';

      // Create professional PDF layout
      const printArea = document.createElement('div');
      printArea.innerHTML = `
<style>
@media print {
  @page { margin: 8mm 10mm 12mm 10mm; size: A4; orphans: 3; widows: 3; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; }
  body { background: white; }
  button, .action-button, .btn { display: none !important; }
  div[style*="sticky"] { position: static !important; }
  table { page-break-inside: avoid; border-collapse: collapse; }
  thead { display: table-header-group; page-break-inside: avoid; }
  tbody { display: table-row-group; }
  tr { page-break-inside: avoid; }
  td, th { page-break-inside: avoid; }
  div[style*="page-break-inside: avoid"] { page-break-inside: avoid; }
  .page-break { page-break-after: always; }
}
</style>
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; color: #1f2937; background: white; line-height: 1.4; -webkit-print-color-adjust: exact;">

<!-- ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ DOCUMENT HEADER ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div style="margin-bottom: 12px; border-bottom: 2px solid #4338ca; padding-bottom: 8px;">
  <div style="display: flex; justify-content: space-between; align-items: center;">
    <div>
      <div style="font-size: 18pt; font-weight: 900; color: #111827; letter-spacing: -0.3px; margin: 0;">Fin<span style="color: #4338ca;">Collect</span></div>
      <div style="font-size: 7pt; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Daily Collection Manager</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 9pt; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">Complete Records</div>
      <div style="font-size: 6.5pt; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Professional Report</div>
    </div>
  </div>
</div>

<!-- ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ METADATA ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; margin-bottom: 14px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
  <div>
    <div style="font-size: 6.5pt; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px; margin-bottom: 2px;">Total</div>
    <div style="font-size: 10pt; color: #111827; font-weight: 900;">${totalTransactions}</div>
  </div>
  <div>
    <div style="font-size: 6.5pt; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px; margin-bottom: 2px;">Amount</div>
    <div style="font-size: 10pt; color: #16a34a; font-weight: 900;">৳${(totalAmount/100000).toFixed(1)}L</div>
  </div>
  <div>
    <div style="font-size: 6.5pt; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px; margin-bottom: 2px;">Generated</div>
    <div style="font-size: 8pt; color: #111827; font-weight: 600;">${genDate}</div>
  </div>
  <div>
    <div style="font-size: 6.5pt; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px; margin-bottom: 2px;">By</div>
    <div style="font-size: 8pt; color: #111827; font-weight: 600;">${generatedBy}</div>
  </div>
</div>

<!-- ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ KEY METRICS ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div style="margin-bottom: 14px; page-break-inside: avoid;">
  <h2 style="font-size: 8.5pt; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0; border-bottom: 2px solid #4338ca; padding-bottom: 4px;">Summary</h2>
  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
    <div style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%); border: 1px solid rgba(59, 130, 246, 0.2); border-left: 3px solid #2563eb; padding: 8px; border-radius: 4px;">
      <div style="font-size: 6.5pt; color: #1e40af; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px; margin-bottom: 2px;">Loan</div>
      <div style="font-size: 9pt; color: #1e40af; font-weight: 900;">৳${(loanAmount/100000).toFixed(1)}L</div>
      <div style="font-size: 6.5pt; color: #64748b; margin-top: 1px;">${loanRecords.length} entries</div>
    </div>
    <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%); border: 1px solid rgba(147, 51, 234, 0.2); border-left: 3px solid #7c3aed; padding: 8px; border-radius: 4px;">
      <div style="font-size: 6.5pt; color: #6d28d9; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px; margin-bottom: 2px;">Savings</div>
      <div style="font-size: 9pt; color: #6d28d9; font-weight: 900;">৳${(savingsAmount/100000).toFixed(1)}L</div>
      <div style="font-size: 6.5pt; color: #64748b; margin-top: 1px;">${savingsRecords.length} entries</div>
    </div>
  </div>
</div>

<!-- ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ TRANSACTION LEDGER ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div style="margin-bottom: 18px; page-break-inside: avoid;">
  <h2 style="font-size: 9pt; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; border-bottom: 2px solid #4338ca; padding-bottom: 5px;">Transaction Ledger (Latest 50)</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt;">
    <thead style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.12) 0%, rgba(37, 99, 235, 0.06) 100%); border-bottom: 2px solid rgba(37, 99, 235, 0.3); position: sticky; top: 0;">
      <tr>
        <th style="text-align: center; padding: 6px 3px; font-weight: 900; color: #111827; width: 4%;">No</th>
        <th style="text-align: center; padding: 6px 3px; font-weight: 900; color: #111827; width: 10%;">Date</th>
        <th style="text-align: left; padding: 6px 3px; font-weight: 900; color: #111827; width: 16%;">User</th>
        <th style="text-align: left; padding: 6px 3px; font-weight: 900; color: #111827; width: 28%;">Details (Type & Reference)</th>
        <th style="text-align: right; padding: 6px 3px; font-weight: 900; color: #111827; width: 14%;">Amount (৳)</th>
        <th style="text-align: left; padding: 6px 3px; font-weight: 900; color: #111827; width: 28%;">Collector</th>
      </tr>
    </thead>
    <tbody>
      ${ledgerRows}
    </tbody>
  </table>
  <div style="font-size: 6.5pt; color: #94a3b8; margin-top: 4px; padding-top: 4px;">
    ${records.length > 50 ? `<strong>${records.length - 50}</strong> additional transaction records not shown in this summary.` : 'All transaction records displayed.'}
  </div>
</div>

<!-- ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ COLLECTION PERFORMANCE ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div style="margin-bottom: 16px; page-break-inside: avoid;">
  <h2 style="font-size: 9pt; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; border-bottom: 2px solid #4338ca; padding-bottom: 5px;">Collector Performance</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt;">
    <thead style="background: linear-gradient(135deg, rgba(22, 163, 74, 0.12) 0%, rgba(22, 163, 74, 0.06) 100%); border-bottom: 2px solid rgba(22, 163, 74, 0.3); position: sticky; top: 0;">
      <tr>
        <th style="text-align: center; padding: 6px 3px; font-weight: 900; color: #111827; width: 6%;">Rank</th>
        <th style="text-align: left; padding: 6px 3px; font-weight: 900; color: #111827; width: 32%;">Collector Name</th>
        <th style="text-align: center; padding: 6px 3px; font-weight: 900; color: #111827; width: 14%;">Count</th>
        <th style="text-align: right; padding: 6px 3px; font-weight: 900; color: #111827; width: 24%;">Total Amount (৳)</th>
        <th style="text-align: right; padding: 6px 3px; font-weight: 900; color: #111827; width: 24%;">Share %</th>
      </tr>
    </thead>
    <tbody>
      ${collectorRows}
    </tbody>
  </table>
</div>

<!-- ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ FOOTER ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div style="margin-top: 16px; padding-top: 10px; border-top: 1px solid #cbd5e1; page-break-inside: avoid;">
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 10px;">
    <div style="text-align: center;">
      <div style="border-bottom: 1px solid #1f2937; height: 24px; margin-bottom: 3px;"></div>
      <div style="font-size: 6.5pt; font-weight: 700; color: #111827;">Authorized</div>
    </div>
    <div style="text-align: center;">
      <div style="border-bottom: 1px solid #1f2937; height: 24px; margin-bottom: 3px;"></div>
      <div style="font-size: 6.5pt; font-weight: 700; color: #111827;">Verified</div>
    </div>
    <div style="text-align: center;">
      <div style="border-bottom: 1px solid #1f2937; height: 24px; margin-bottom: 3px;"></div>
      <div style="font-size: 6.5pt; font-weight: 700; color: #111827;">Generated</div>
    </div>
  </div>
  
  <div style="background: #f0f9ff; padding: 7px 8px; border-radius: 4px; border-left: 2px solid #0284c7;">
    <div style="font-weight: 700; color: #075985; font-size: 6pt; margin-bottom: 1px;">CERTIFICATION</div>
    <div style="font-size: 6pt; color: #0c4a6e; line-height: 1.3;">
      ID: CR-${new Date().toISOString().split('-').slice(0,2).join('')} | Date: ${genDate} | Status: ✓<br/>
      Official financial record • All figures verified • Confidential
    </div>
  </div>
</div>

</div>
`;

      // Render in modal overlay
      const overlay = document.createElement('div');
      overlay.id = 'report-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.7);z-index:9999;overflow-y:auto;padding:2rem 1rem;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;';
      
      const inner = document.createElement('div');
      inner.style.cssText = 'max-width:900px;width:100%;background:white;border-radius:16px;box-shadow:0 25px 60px rgba(0,0,0,0.35);overflow:hidden;display:flex;flex-direction:column;max-height:85vh;';
      
      // ═════════════════════════════════════════════════════════════════════════
      // TOP ACTION BUTTONS - Sticky Positioned
      // ═════════════════════════════════════════════════════════════════════════
      const topButtonBar = document.createElement('div');
      topButtonBar.style.cssText = 'position:sticky;top:0;background:linear-gradient(135deg,#ffffff 0%,#f8fafc 100%);border-bottom:1px solid #e5e7eb;padding:1.25rem;display:flex;justify-content:center;align-items:center;gap:0.75rem;z-index:100;box-shadow:0 2px 8px rgba(0,0,0,0.08);';
      topButtonBar.innerHTML = `
        <button onclick="document.getElementById('report-overlay').remove();" class="action-button" style="padding:0.75rem 1.5rem;background:#e5e7eb;color:#111827;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:0.5rem;" onmouseover="this.style.background='#d1d5db'" onmouseout="this.style.background='#e5e7eb'"><i class="fa-solid fa-xmark"></i> Close</button>
        <button onclick="window.ui._downloadCompleteRecordsReportPDF();" class="action-button" style="padding:0.75rem 1.5rem;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;gap:0.5rem;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 12px rgba(16, 185, 129, 0.3)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none'" title="Automatically download PDF to your device"><i class="fa-solid fa-cloud-arrow-down"></i> Download PDF</button>
        <button onclick="window.ui._printCompleteRecordsReport();" class="action-button" style="padding:0.75rem 1.5rem;background:linear-gradient(135deg,#ef4444 0%,#dc2626 100%);color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;gap:0.5rem;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 12px rgba(239, 68, 68, 0.3)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none'" title="Open print dialog or save as PDF"><i class="fa-solid fa-print"></i> Print</button>
      `;
      inner.appendChild(topButtonBar);
      
      // Content area with scrolling
      const contentWrapper = document.createElement('div');
      contentWrapper.style.cssText = 'overflow-y:auto;padding:2.5rem;';
      contentWrapper.appendChild(printArea);
      inner.appendChild(contentWrapper);
      
      overlay.appendChild(inner);
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
      document.body.appendChild(overlay);
      
      // Store report data for download/print functionality BEFORE adding to DOM
      const reportHTML = printArea.innerHTML;
      window.lastCompleteRecordsReport = {
        title: `Complete-Records-${new Date().toISOString().split('T')[0]}`,
        html: reportHTML,
        element: inner
      };
      
      // Notify success
      Swal.fire({
        icon: 'success',
        title: 'Report Generated',
        text: `Professional report with ${totalTransactions} transactions ready for download`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error generating report:', error);
      Swal.fire({
        icon: 'error',
        title: 'Report Error',
        text: 'Failed to generate report. Please try again.'
      });
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   * COMPLETE RECORDS PDF DOWNLOAD - SIMPLIFIED, RELIABLE IMPLEMENTATION
   * ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   */
  async _downloadCompleteRecordsReportPDF() {
    try {
      // Check libraries first
      const jsPDFClass = window.jspdf?.jsPDF || window.jsPDF?.jsPDF;
      if (!jsPDFClass) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'jsPDF library not loaded. Please refresh the page.' });
        return;
      }

      Swal.fire({
        title: 'Generating PDF',
        html: '<div style="display:flex;align-items:center;gap:10px;"><i class="fa-solid fa-spinner fa-spin" style="color:#ef4444;"></i>Processing your report...</div>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false
      });

      // DYNAMIC DATA SYNC: Use filtered records from current table view if available
      let records;
      let state = this.completeRecordsState || {};
      
      if (this.completeRecordsFilteredData && this.completeRecordsFilteredData.length > 0) {
        // Use already filtered data from table
        records = [...this.completeRecordsFilteredData].sort((a, b) => new Date(b.date) - new Date(a.date));
      } else {
        // Fallback: Fetch fresh data from database
        const borrowers = await window.db.getAll('borrowers');
        const loans = await window.db.getAll('loans');
        const transactions = await window.db.getAll('transactions');
        const savings = await window.db.getAll('savings');
        const savingsTransactions = await window.db.getAll('savingsTransactions');

        // Build transaction records (exact same logic as report generation)
        const loanRecords = transactions.map(txn => {
          const loan = loans.find(l => l.id === txn.loanId);
          const borrower = borrowers.find(b => b.id === (loan?.borrowerId || txn.borrowerId));
          
          let receivedBy = '';
          if (loan?.schedule && Array.isArray(loan.schedule)) {
            const matchingSchedule = loan.schedule.find(sch => {
              const payHistory = sch.paymentHistory || [];
              return payHistory.some(ph => 
                ph.timestamp?.split('T')[0] === txn.date && 
                ph.amount === txn.amount
              );
            });
            if (matchingSchedule?.paymentHistory?.length > 0) {
              const lastPayment = matchingSchedule.paymentHistory[matchingSchedule.paymentHistory.length - 1];
              receivedBy = lastPayment.receivedBy || '';
            }
          }
          if (!receivedBy) receivedBy = txn.collectedBy || 'Admin';
          
          return {
            ...txn,
            transactionType: 'loan',
            loanNo: loan?.loanNo || '-',
            borrowerName: borrower?.name || 'Unknown',
            loanAmount: loan?.totalAmount || 0,
            receivedBy: receivedBy
          };
        });

        const savingsRecords = savingsTransactions.map(stxn => {
          const savingsAccount = savings.find(s => s.id === stxn.savingsId);
          const borrower = borrowers.find(b => b.id === savingsAccount?.userId);
          const receivedBy = stxn.receivedBy || 'Admin';
          
          return {
            ...stxn,
            transactionType: 'savings',
            loanNo: savingsAccount?.accountNo || '-',
            borrowerName: borrower?.name || 'Unknown',
            loanAmount: savingsAccount?.goalAmount || 0,
            receivedBy: receivedBy
          };
        });

        records = [...loanRecords, ...savingsRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      
      // Calculate statistics (works for both filtered and fresh data)
      const totalTransactions = records.length;
      const totalAmount = records.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const loanAmount = records.filter(r => r.transactionType === 'loan').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const savingsAmount = records.filter(r => r.transactionType === 'savings').reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const loanRecords = records.filter(r => r.transactionType === 'loan');
      const savingsRecords = records.filter(r => r.transactionType === 'savings');
      
      // Collection breakdown by collector (SAME LOGIC AS REPORT)
      const collectorMap = {};
      records.forEach(r => {
        const collector = r.receivedBy || 'Unassigned';
        if (!collectorMap[collector]) collectorMap[collector] = { count: 0, amount: 0 };
        collectorMap[collector].count++;
        collectorMap[collector].amount += parseFloat(r.amount || 0);
      });

      // Generate metadata
      const genDate = new Date().toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true });
      const generatedBy = localStorage.getItem('fincollect_user') || 'System Admin';
      // Use "Tk" prefix for Bengali Taka (most reliable for PDF)
      const takaPrefix = 'Tk ';

      // Create PDF with professional fonts and styling
      const pdf = new jsPDFClass('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);
      
      let yPosition = 10;
      
      // ===== PROFESSIONAL DOCUMENT HEADER (Modern & Simple) =====
      
      // 1. TOP ACCENT BAR
      pdf.setFillColor(37, 99, 235); // Professional blue
      pdf.rect(0, 0, pageWidth, 3, 'F'); // Full width accent bar
      
      // 2. MAIN HEADER SECTION
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(30, 41, 59);
      const logoX = margin + (contentWidth / 2);
      pdf.text('FinCollect', logoX, yPosition + 3, { align: 'center' });
      
      // 3. COMPANY TAGLINE
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Professional Financial Collection & Management System', logoX, yPosition + 7.5, { align: 'center' });
      
      // 4. HEADER DIVIDER LINE
      pdf.setDrawColor(220, 225, 235);
      pdf.setLineWidth(0.4);
      pdf.line(margin + 15, yPosition + 9, pageWidth - margin - 15, yPosition + 9);
      
      yPosition += 12;
      
      // 5. REPORT METADATA (Date & Generated By - in a professional style)
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Report Generated: ${genDate}`, margin + 5, yPosition + 1, { align: 'left' });
      pdf.text(`Generated By: ${generatedBy}`, pageWidth - margin - 35, yPosition + 1, { align: 'left' });
      
      // 5a. ACTIVE FILTERS INDICATOR (Professional dynamic display)
      const activeFilters = [];
      if (state.search?.trim()) activeFilters.push(`Search: "${state.search}"`);
      if (state.dateFrom) activeFilters.push(`From: ${state.dateFrom}`);
      if (state.dateTo) activeFilters.push(`To: ${state.dateTo}`);
      if (state.borrowerId !== 'all') activeFilters.push('Borrower Filter');
      if (state.receivedBy !== 'all') activeFilters.push(`Collector: ${state.receivedBy}`);
      if (state.minAmount) activeFilters.push(`Min: Tk ${state.minAmount}`);
      if (state.maxAmount) activeFilters.push(`Max: Tk ${state.maxAmount}`);
      
      if (activeFilters.length > 0) {
        pdf.setFont('Helvetica', 'italic');
        pdf.setFontSize(6);
        pdf.setTextColor(124, 58, 237); // Purple for filtered indicator
        const filterText = `Applied Filters: ${activeFilters.join(' • ')}`;
        pdf.text(filterText, margin + 5, yPosition + 4.5, { align: 'left', maxWidth: contentWidth - 10 });
        yPosition += 3; // Extra space if filters present
      }
      
      // 6. SUBTLE BOTTOM DIVIDER FOR HEADER
      pdf.setDrawColor(237, 242, 247);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition + 4, pageWidth - margin, yPosition + 4);
      
      yPosition += 8;
      
      // 7. KEY METRICS SECTION (Centered with professional background)
      const metricsBackgroundY = yPosition;
      const metricsPaddingX = 8;
      pdf.setFillColor(245, 248, 252); // Light professional blue
      pdf.rect(margin + metricsPaddingX, metricsBackgroundY - 1, contentWidth - (metricsPaddingX * 2), 9, 'F');
      
      // Metrics Border
      pdf.setDrawColor(219, 234, 254);
      pdf.setLineWidth(0.2);
      pdf.rect(margin + metricsPaddingX, metricsBackgroundY - 1, contentWidth - (metricsPaddingX * 2), 9);
      
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(30, 41, 59);
      
      const metricsText = `Total Transactions: ${totalTransactions}  |  Total Amount: ${takaPrefix}${parseFloat(totalAmount).toLocaleString('en-IN', {maximumFractionDigits:0})}`;
      pdf.text(metricsText, logoX, yPosition + 2.5, { align: 'center' });
      
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(6.5);
      pdf.setTextColor(71, 85, 105);
      const loanPercentage = totalAmount > 0 ? ((loanAmount / totalAmount) * 100).toFixed(1) : 0;
      const savingsPercentage = totalAmount > 0 ? ((savingsAmount / totalAmount) * 100).toFixed(1) : 0;
      const metricsSubText = `Loans: ${takaPrefix}${parseFloat(loanAmount).toLocaleString('en-IN', {maximumFractionDigits:0})} (${loanRecords.length} entries, ${loanPercentage}%)  •  Savings: ${takaPrefix}${parseFloat(savingsAmount).toLocaleString('en-IN', {maximumFractionDigits:0})} (${savingsRecords.length} entries, ${savingsPercentage}%)`;
      pdf.text(metricsSubText, logoX, yPosition + 5.5, { align: 'center' });
      
      yPosition += 10;
      
      // Helper function to format date to DD-MM-YY (compact format to prevent wrapping)
      const formatDateToDDMMYYYY = (dateStr) => {
        if (!dateStr) return '-';
        try {
          if (dateStr.includes('-') && dateStr.length === 10) {
            const [year, month, day] = dateStr.split('-');
            const shortYear = year.slice(-2); // Get last 2 digits of year
            return `${day}-${month}-${shortYear}`;
          }
          return dateStr;
        } catch (e) {
          return dateStr;
        }
      };

      // 4. TRANSACTION TABLE - Professional styling (Centered)
      const tableData = records.slice(0, 50).map((r, i) => {
        const transactionType = r.transactionType === 'savings' ? 'Savings' : 'Loan';
        const refId = r.loanNo || (r.transactionType === 'savings' ? 'SAV-' + i : 'LOAN-' + i);
        
        return [
          (i + 1).toString(),
          formatDateToDDMMYYYY(r.date),
          r.borrowerName || 'Unknown',
          `${transactionType}`,
          `${refId}`,
          `${takaPrefix}${parseFloat(r.amount || 0).toLocaleString('en-IN', {maximumFractionDigits:0})}`,
          r.receivedBy || 'Admin'
        ];
      });
      
      // Calculate table width and center margins
      const colWidths = [8, 25, 26, 14, 18, 24, 25];
      const totalColWidth = colWidths.reduce((a, b) => a + b, 0);
      const availableWidth = pageWidth - (margin * 2);
      const tableMargin = (availableWidth - totalColWidth) / 2 + margin;
      
      pdf.autoTable({
        startY: yPosition,
        head: [['#', 'Date', 'User Name', 'Type', 'Reference', 'Amount', 'Collector']],
        body: tableData,
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          font: 'Helvetica',
          fontSize: 7.5,
          halign: 'center',
          valign: 'middle',
          padding: 4,
          lineColor: [67, 56, 202],
          lineWidth: 0.4
        },
        bodyStyles: {
          font: 'Helvetica',
          fontSize: 7,
          textColor: [51, 65, 85],
          padding: 3.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          1: { halign: 'center', cellWidth: 25, overflow: 'hidden', padding: 2 },
          2: { halign: 'center', cellWidth: 26 },
          3: { halign: 'center', cellWidth: 14 },
          4: { halign: 'center', cellWidth: 18 },
          5: { halign: 'center', cellWidth: 24, textColor: [22, 163, 74] },
          6: { halign: 'center', cellWidth: 25 }
        },
        alternateRowStyles: {
          fillColor: [251, 253, 255],
          textColor: [51, 65, 85]
        },
        margin: { left: tableMargin, right: tableMargin, top: 16, bottom: 10 },
        didDrawPage: (data) => {
          // Professional page header for continuation pages (page 2+)
          if (data.pageNumber > 1) {
            const headerStartY = 5;
            
            // 1. TOP ACCENT BAR (continuation)
            pdf.setFillColor(37, 99, 235);
            pdf.rect(0, 0, pageWidth, 1.5, 'F');
            
            // 2. CONTINUATION HEADER with professional styling
            pdf.setFont('Helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(30, 41, 59);
            pdf.text('FinCollect', margin + 3, headerStartY + 2, { align: 'left' });
            
            // 3. PAGE IDENTIFICATION
            pdf.setFont('Helvetica', 'normal');
            pdf.setFontSize(6);
            pdf.setTextColor(107, 114, 128);
            const reportTitle = 'Complete Records Report';
            const refId = `CR-${new Date().toISOString().split('-').slice(0,2).join('')}`;
            pdf.text(`${reportTitle} | ${refId}`, pageWidth - margin - 50, headerStartY + 2, { align: 'left' });
            
            // 4. PAGE NUMBER in top-right
            pdf.setFont('Helvetica', 'normal');
            pdf.setFontSize(6);
            pdf.setTextColor(107, 114, 128);
            pdf.text(`Page ${data.pageNumber}`, pageWidth - margin - 3, headerStartY + 2, { align: 'right' });
            
            // 5. SEPARATOR LINE
            pdf.setDrawColor(220, 225, 235);
            pdf.setLineWidth(0.3);
            pdf.line(margin, headerStartY + 4, pageWidth - margin, headerStartY + 4);
          }
        },
        didDrawCell: (data) => {
          // Center align all cells
          data.cell.styles.halign = 'center';
          data.cell.styles.valign = 'middle';
          
          // Professional color coding
          if (data.column.index === 3 && data.row.section === 'body') {
            if (data.cell.text[0]?.includes('Loan')) {
              data.cell.styles.textColor = [37, 99, 235];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.text[0]?.includes('Savings')) {
              data.cell.styles.textColor = [124, 58, 237];
              data.cell.styles.fontStyle = 'bold';
            }
          }
          // Green for amounts
          if (data.column.index === 5 && data.row.section === 'body') {
            data.cell.styles.textColor = [34, 197, 94];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      yPosition = pdf.lastAutoTable.finalY + 8;

      // 5. SECTION DIVIDER (Centered)
      const dividerStartX = margin + 20;
      const dividerEndX = pageWidth - margin - 20;
      pdf.setDrawColor(100, 116, 139);
      pdf.setLineWidth(0.4);
      pdf.line(dividerStartX, yPosition - 2, dividerEndX, yPosition - 2);
      yPosition += 2;

      // 6. COLLECTOR PERFORMANCE SECTION
      const collectorTableData = Object.entries(collectorMap)
        .sort((a, b) => b[1].amount - a[1].amount)
        .slice(0, 15)
        .map((entry, i) => {
          const [name, data] = entry;
          const percentage = totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(1) : '0.0';
          return [
            (i + 1).toString(),
            name,
            data.count.toString(),
            `${takaPrefix}${parseFloat(data.amount).toLocaleString('en-IN', {maximumFractionDigits:0})}`,
            `${percentage}%`
          ];
        });

      // Section title (centered)
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text('COLLECTOR PERFORMANCE ANALYSIS', logoX, yPosition, { align: 'center' });
      yPosition += 5;

      // Calculate collector table width and center margins
      const collectorColWidths = [12, 65, 18, 30, 20];
      const totalCollectorColWidth = collectorColWidths.reduce((a, b) => a + b, 0);
      const collectorTableMargin = (availableWidth - totalCollectorColWidth) / 2 + margin;

      pdf.autoTable({
        startY: yPosition,
        head: [['Rank', 'Collector Name', 'Transactions', 'Total Amount', 'Share %']],
        body: collectorTableData,
        headStyles: {
          fillColor: [34, 197, 94],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          font: 'Helvetica',
          fontSize: 7.5,
          halign: 'center',
          valign: 'middle',
          padding: 4,
          lineColor: [22, 163, 74],
          lineWidth: 0.4
        },
        bodyStyles: {
          font: 'Helvetica',
          fontSize: 7,
          textColor: [51, 65, 85],
          padding: 3.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'center', cellWidth: 65 },
          2: { halign: 'center', cellWidth: 18 },
          3: { halign: 'center', cellWidth: 30, textColor: [67, 56, 202] },
          4: { halign: 'center', cellWidth: 20, textColor: [67, 56, 202] }
        },
        alternateRowStyles: {
          fillColor: [251, 253, 255],
          textColor: [51, 65, 85]
        },
        margin: { left: collectorTableMargin, right: collectorTableMargin, top: 16, bottom: 10 },
        didDrawPage: (data) => {
          // Professional page header for continuation pages (page 2+)
          if (data.pageNumber > 1) {
            const headerStartY = 5;
            
            // 1. TOP ACCENT BAR (continuation)
            pdf.setFillColor(37, 99, 235);
            pdf.rect(0, 0, pageWidth, 1.5, 'F');
            
            // 2. CONTINUATION HEADER with professional styling
            pdf.setFont('Helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(30, 41, 59);
            pdf.text('FinCollect', margin + 3, headerStartY + 2, { align: 'left' });
            
            // 3. PAGE IDENTIFICATION
            pdf.setFont('Helvetica', 'normal');
            pdf.setFontSize(6);
            pdf.setTextColor(107, 114, 128);
            const reportTitle = 'Complete Records Report';
            const refId = `CR-${new Date().toISOString().split('-').slice(0,2).join('')}`;
            pdf.text(`${reportTitle} | ${refId}`, pageWidth - margin - 50, headerStartY + 2, { align: 'left' });
            
            // 4. PAGE NUMBER in top-right
            pdf.setFont('Helvetica', 'normal');
            pdf.setFontSize(6);
            pdf.setTextColor(107, 114, 128);
            pdf.text(`Page ${data.pageNumber}`, pageWidth - margin - 3, headerStartY + 2, { align: 'right' });
            
            // 5. SEPARATOR LINE
            pdf.setDrawColor(220, 225, 235);
            pdf.setLineWidth(0.3);
            pdf.line(margin, headerStartY + 4, pageWidth - margin, headerStartY + 4);
          }
        },
        didDrawCell: (data) => {
          // Center align all cells
          data.cell.styles.halign = 'center';
          data.cell.styles.valign = 'middle';
          
          if ((data.column.index === 3 || data.column.index === 4) && data.row.section === 'body') {
            data.cell.styles.textColor = [67, 56, 202];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      // 7. PROFESSIONAL FOOTER on all pages (Centered with standard documentation)
      const totalPages = pdf.internal.pages.length - 1;
      const pageWidthCenter = pageWidth / 2;
      const refId = `CR-${new Date().toISOString().split('-').slice(0,2).join('')}-${new Date().toISOString().split('T')[1].replace(/:/g, '').substring(0, 4)}`;
      
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        
        // Footer background - Professional gradient effect
        pdf.setFillColor(241, 245, 249);
        pdf.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        
        // Footer top border - Accent line
        pdf.setDrawColor(37, 99, 235);
        pdf.setLineWidth(0.5);
        pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        
        // FOOTER LEFT - Document Reference
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(6);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Document ID: ${refId}`, margin + 3, pageHeight - 9.5, { align: 'left' });
        
        // FOOTER CENTER - Page number with total pages
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(6.5);
        pdf.setTextColor(30, 41, 59);
        const pageNumText = `Page ${i} of ${totalPages}`;
        pdf.text(pageNumText, pageWidthCenter, pageHeight - 9.5, { align: 'center' });
        
        // FOOTER RIGHT - Generation timestamp
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(6);
        pdf.setTextColor(107, 114, 128);
        const footerDate = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
        pdf.text(`Generated: ${footerDate}`, pageWidth - margin - 3, pageHeight - 9.5, { align: 'right' });
        
        // FOOTER SUB-TEXT - Certification information
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(5.5);
        pdf.setTextColor(34, 197, 94);
        pdf.text('✓ CERTIFIED FINANCIAL REPORT  |  OFFICIAL RECORD  |  CONFIDENTIAL', pageWidthCenter, pageHeight - 6.5, { align: 'center' });
        
        // Footer bottom border
        pdf.setDrawColor(219, 234, 254);
        pdf.setLineWidth(0.2);
        pdf.line(margin, pageHeight - 3.5, pageWidth - margin, pageHeight - 3.5);
      }

      // Save PDF
      const filename = `FinCollect-Records-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      Swal.close();

      // Success notification
      Swal.fire({
        icon: 'success',
        title: 'Professional PDF Generated!',
        html: `<div style="text-align:left;color:#475569;"><i class="fa-solid fa-check-circle" style="color:#22c55e;margin-right:8px;"></i><strong style="color:#111827;">Professional Report Ready</strong><br/><span style="font-size:13px;margin-top:6px;display:block;">${filename}</span><br/><span style="font-size:11px;color:#6b7280;margin-top:10px;display:block;line-height:1.6;">✓ Professional page headers on all pages<br/>✓ Standard documentation formatting<br/>✓ ${totalPages} page(s) | ${totalTransactions} transactions<br/>✓ Document ID & certification marks<br/>✓ Proper page breaks & footers</span></div>`,
        timer: 5000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('PDF error:', error);
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Generation Failed',
        html: '<div style="text-align:left;"><strong>Try these solutions:</strong><br/>• Refresh the page and try again<br/>• Check browser console (F12)<br/>• Use Print to PDF as alternative</div>',
        confirmButtonText: 'Use Print',
        confirmButtonColor: '#2563eb'
      }).then(() => {
        window.ui._printCompleteRecordsReport();
      });
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   * PRINT COMPLETE RECORDS REPORT - SIMPLE, RELIABLE IMPLEMENTATION
   * ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
   */
  _printCompleteRecordsReport() {
    try {
      if (!window.lastCompleteRecordsReport || !window.lastCompleteRecordsReport.html) {
        Swal.fire({ icon: 'warning', title: 'Error', text: 'Report not ready.' });
        return;
      }

      // Get report content
      const reportContent = window.lastCompleteRecordsReport.html;
      
      // Create print window
      const printWindow = window.open('', 'print', 'width=1000,height=600');
      
      if (!printWindow) {
        throw new Error('Pop-up blocked');
      }

      // Write content to print window with print styles
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Complete Records Report</title>
          <style>
            @media print {
              @page { margin: 10mm; size: A4; orphans: 3; widows: 3; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              body { background: white; margin: 0; padding: 10mm; }
              button, .action-button { display: none !important; }
              table { page-break-inside: avoid; }
              thead { display: table-header-group; }
              tr { page-break-inside: avoid; }
              div[style*="sticky"] { position: static !important; }
            }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; margin: 0; padding: 10mm; background: white; }
            button, .action-button { display: none; }
          </style>
        </head>
        <body>
          ${reportContent}
        </body>
        </html>
      `);
      
      printWindow.document.close();

      // Wait for content to render, then print
      printWindow.onload = function() {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 100);
      };

      // Fallback in case onload doesn't fire
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
      
      // Show notification
      Swal.fire({
        icon: 'info',
        title: 'Print Dialog Opening',
        html: '<div style="color:#475569;"><i class="fa-solid fa-print" style="margin-right:8px;color:#2563eb;"></i>Choose "Save as PDF" or your printer</div>',
        timer: 3000,
        showConfirmButton: false,
        position: 'bottom-end',
        toast: true
      });

    } catch (error) {
      console.error('Print error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Print Error',
        text: error.message === 'Pop-up blocked' 
          ? 'Please disable pop-up blocker and try again.' 
          : 'Unable to print. Please try again.',
        confirmButtonText: 'OK'
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SAVINGS MODULE
  // ══════════════════════════════════════════════════════════════════════════

  async renderSavingsList() {
    this.setTitle("Savings");
    this.showFab(() => window.app.navigate("add-savings"));

    const users = await window.db.getAll("borrowers");
    const savings = await window.db.getAll("savings");
    const allTxns = await window.db.getAll("savingsTransactions");

    const totalAccounts = savings.length;
    const activeAccounts = savings.filter((s) => s.status === "active").length;
    const totalSaved = allTxns.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0),
      0,
    );
    const totalGoal = savings.reduce(
      (sum, s) => sum + parseFloat(s.goalAmount || 0),
      0,
    );

    const buildItems = (list) =>
      list.map((s) => {
        const user = users.find((u) => u.id === s.userId);
        const txns = allTxns.filter((t) => t.savingsId === s.id);
        const saved = txns.reduce(
          (sum, t) => sum + parseFloat(t.amount || 0),
          0,
        );
        return { s, user, txns, saved };
      });

    this._savingsAllItems = buildItems(savings);

    this.container.innerHTML = `
    <div style="background:linear-gradient(135deg,#059669 0%,#10b981 60%,#34d399 100%);border-radius:20px;padding:1.25rem 1.5rem;margin-bottom:1.25rem;color:white;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-20px;right:-20px;width:110px;height:110px;background:rgba(255,255,255,0.08);border-radius:50%;"></div>
        <div style="position:absolute;bottom:-25px;right:50px;width:70px;height:70px;background:rgba(255,255,255,0.06);border-radius:50%;"></div>
        <div style="font-size:0.78rem;opacity:0.85;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.3rem;">Total Savings Pool</div>
        <div style="font-size:2rem;font-weight:800;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalSaved.toLocaleString()}</div>
        <div style="font-size:0.82rem;opacity:0.8;margin-top:0.4rem;">${activeAccounts} active &middot; ${totalAccounts} accounts</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;margin-bottom:1rem;">
        <div style="background:white;border-radius:14px;padding:0.9rem;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.05);border:1px solid #f1f5f9;">
            <div style="font-size:1.3rem;font-weight:800;color:#059669;">${totalAccounts}</div>
            <div style="font-size:0.65rem;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-top:0.2rem;">Accounts</div>
        </div>
        <div style="background:white;border-radius:14px;padding:0.9rem;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.05);border:1px solid #f1f5f9;">
            <div style="font-size:1.3rem;font-weight:800;color:#10b981;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${(totalSaved / 1000).toFixed(1)}K</div>
            <div style="font-size:0.65rem;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-top:0.2rem;">Saved</div>
        </div>
        <div style="background:white;border-radius:14px;padding:0.9rem;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.05);border:1px solid #f1f5f9;">
            <div style="font-size:1.3rem;font-weight:800;color:#059669;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${(totalGoal / 1000).toFixed(1)}K</div>
            <div style="font-size:0.65rem;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-top:0.2rem;">Goal</div>
        </div>
    </div>

    <div style="margin-bottom:1rem;display:flex;justify-content:flex-end;">
        <button onclick="window.app.navigate('savings-types')" style="background:white;border:1px solid #d1fae5;color:#059669;padding:0.5rem 1.1rem;border-radius:10px;font-size:0.82rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:0.5rem;box-shadow:0 1px 4px rgba(5,150,105,0.08);transition:all 0.2s;" onmouseenter="this.style.background='#ecfdf5'" onmouseleave="this.style.background='white'">
            <i class="fa-solid fa-tags"></i> Manage Savings Types
        </button>
    </div>

    <div style="display:flex;gap:0.5rem;margin-bottom:1rem;overflow-x:auto;">
        <button id="sav-tab-all" class="sav-tab-btn" onclick="window.ui.filterSavingsItems('all')" style="padding:0.5rem 1.1rem;border-radius:10px;border:none;background:#059669;color:white;font-size:0.83rem;font-weight:600;cursor:pointer;white-space:nowrap;">All</button>
        <button id="sav-tab-active" class="sav-tab-btn" onclick="window.ui.filterSavingsItems('active')" style="padding:0.5rem 1.1rem;border-radius:10px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:0.83rem;font-weight:600;cursor:pointer;white-space:nowrap;">Active</button>
        <button id="sav-tab-closed" class="sav-tab-btn" onclick="window.ui.filterSavingsItems('closed')" style="padding:0.5rem 1.1rem;border-radius:10px;border:1px solid #e2e8f0;background:white;color:#64748b;font-size:0.83rem;font-weight:600;cursor:pointer;white-space:nowrap;">Closed</button>
    </div>

    <div class="search-box" style="margin-bottom:1rem;">
        <i class="fa-solid fa-search"></i>
        <input type="text" id="savings-search" placeholder="Search user name, account no...">
    </div>

    <div id="savings-list-container"></div>
    `;

    this.renderSavingsListItems(
      this._savingsAllItems,
      "savings-list-container",
    );

    document.getElementById("savings-search").addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = (this._savingsAllItems || []).filter(
        ({ s, user }) =>
          (user && user.name ? user.name.toLowerCase() : "").includes(term) ||
          (s.accountNo || "").toLowerCase().includes(term) ||
          (s.savingsTypeName || "").toLowerCase().includes(term),
      );
      this.renderSavingsListItems(filtered, "savings-list-container");
    });
  }

  filterSavingsItems(status) {
    const items = this._savingsAllItems || [];
    const filtered =
      status === "all" ? items : items.filter(({ s }) => s.status === status);
    this.renderSavingsListItems(filtered, "savings-list-container");
    document.querySelectorAll(".sav-tab-btn").forEach((btn) => {
      const active = btn.id === "sav-tab-" + status;
      btn.style.background = active ? "#059669" : "white";
      btn.style.color = active ? "white" : "#64748b";
      btn.style.border = active ? "none" : "1px solid #e2e8f0";
    });
  }

  renderSavingsListItems(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;color:#94a3b8;padding:4rem 2rem;">
            <div style="width:72px;height:72px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
                <i class="fa-solid fa-piggy-bank" style="font-size:1.75rem;color:#10b981;"></i>
            </div>
            <p style="font-weight:600;color:#64748b;margin-bottom:0.25rem;">No savings accounts found</p>
            <p style="font-size:0.85rem;">Tap <strong>+</strong> to create a new savings account.</p>
        </div>`;
      return;
    }

    container.innerHTML = items
      .map(({ s, user, txns, saved }) => {
        const goalAmt = parseFloat(s.goalAmount || 0);
        const pct =
          goalAmt > 0 ? Math.min(100, Math.round((saved / goalAmt) * 100)) : 0;
        const isActive = s.status === "active";
        const avatarUrl =
          user && user.photo
            ? user.photo
            : "https://ui-avatars.com/api/?name=" +
              encodeURIComponent(user && user.name ? user.name : "?") +
              "&background=059669&color=fff&bold=true&size=80";
        const userName = user && user.name ? user.name : "Unknown";

        return `
        <div onclick="window.app.navigate('savings-detail','${s.id}')"
            style="background:white;border-radius:16px;border:1px solid #f1f5f9;box-shadow:0 2px 8px rgba(0,0,0,0.04);margin-bottom:0.875rem;overflow:hidden;cursor:pointer;transition:box-shadow 0.2s,transform 0.15s;"
            onmouseenter="this.style.boxShadow='0 8px 24px rgba(0,0,0,0.09)';this.style.transform='translateY(-1px)'"
            onmouseleave="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)';this.style.transform='translateY(0)'">

            <div style="display:flex;gap:1rem;align-items:center;padding:1rem 1rem 0.75rem;">
                <div style="position:relative;flex-shrink:0;">
                    <img src="${avatarUrl}" style="width:52px;height:52px;border-radius:12px;object-fit:cover;border:2px solid #e2e8f0;">
                    <span style="position:absolute;bottom:-4px;right:-4px;background:${isActive ? "#10b981" : "#94a3b8"};width:13px;height:13px;border-radius:50%;border:2px solid white;"></span>
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
                        <div>
                            <div style="font-size:1rem;font-weight:700;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${userName}</div>
                            <div style="font-size:0.75rem;color:#94a3b8;margin-top:0.1rem;">${s.savingsTypeName || "Savings"} &middot; #${s.accountNo || s.id.substring(0, 6).toUpperCase()}</div>
                        </div>
                        <span style="background:${isActive ? "rgba(16,185,129,0.08)" : "#f1f5f9"};color:${isActive ? "#10b981" : "#94a3b8"};padding:0.25rem 0.6rem;border-radius:20px;font-size:0.68rem;font-weight:700;white-space:nowrap;flex-shrink:0;">
                            ${isActive ? "ACTIVE" : "CLOSED"}
                        </span>
                    </div>
                </div>
            </div>

            <div style="padding:0 1rem 0.75rem;">
                <div style="display:flex;justify-content:space-between;font-size:0.78rem;font-weight:600;margin-bottom:0.4rem;">
                    <span style="color:#059669;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${saved.toLocaleString()} saved</span>
                    <span style="color:#94a3b8;">${goalAmt > 0 ? "Goal: <i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>" + goalAmt.toLocaleString() : "No goal set"}</span>
                </div>
                <div style="height:6px;background:#f1f5f9;border-radius:99px;overflow:hidden;">
                    <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#059669,#34d399);border-radius:99px;transition:width 0.4s ease;"></div>
                </div>
                <div style="font-size:0.68rem;color:#94a3b8;text-align:right;margin-top:0.25rem;">${pct}% of goal &middot; ${txns.length} deposits</div>
            </div>

            <div style="border-top:1px solid #f1f5f9;padding:0.65rem 1rem;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:0.76rem;color:#94a3b8;display:flex;align-items:center;gap:0.35rem;">
                    <i class="fa-regular fa-calendar" style="color:#10b981;"></i>
                    Started ${s.startDate || "&mdash;"}
                </span>
                <span style="font-size:0.76rem;color:#94a3b8;">${s.frequency || "Flexible"} deposits</span>
            </div>
        </div>`;
      })
      .join("");
  }

  // ── Savings Types ──────────────────────────────────────────────────────────

  async renderSavingsTypes() {
    this.setTitle("Savings Types");
    this.showFab(() => window.app.navigate("add-savings-type"));

    const types = await window.db.getAll("savingsTypes");

    this.container.innerHTML = `
    <div style="margin-bottom:1.25rem;">
        <p style="font-size:0.88rem;color:#64748b;line-height:1.6;">Define different savings plan types (e.g., Fixed Deposit, Recurring, Piggy Bank).<br>Each savings account is linked to a type.</p>
    </div>
    <div id="savings-types-list"></div>`;

    const listEl = document.getElementById("savings-types-list");

    if (types.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;color:#94a3b8;padding:3rem 2rem;background:white;border-radius:16px;border:1px solid #f1f5f9;">
            <i class="fa-solid fa-tags" style="font-size:2.5rem;color:#d1fae5;display:block;margin-bottom:0.75rem;"></i>
            <p style="font-weight:600;color:#64748b;">No savings types yet</p>
            <p style="font-size:0.84rem;">Tap <strong>+</strong> to create your first savings type.</p>
        </div>`;
      return;
    }

    listEl.innerHTML = types
      .map(
        (t) => `
    <div style="background:white;border-radius:14px;padding:1.1rem 1.25rem;margin-bottom:0.75rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);border:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;gap:1rem;">
        <div style="display:flex;align-items:center;gap:0.85rem;">
            <div style="width:42px;height:42px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                <i class="fa-solid fa-${t.icon || "piggy-bank"}" style="color:#059669;font-size:1.1rem;"></i>
            </div>
            <div>
                <div style="font-size:0.95rem;font-weight:700;color:var(--text-main);">${t.name}</div>
                <div style="font-size:0.75rem;color:#94a3b8;margin-top:0.1rem;">${t.interestRate ? t.interestRate + "% p.a." : "No interest"} &middot; ${t.depositFrequency || "Flexible"}</div>
            </div>
        </div>
        <div style="display:flex;gap:0.5rem;">
            <button onclick="event.stopPropagation();window.app.navigate('add-savings-type','${t.id}')" style="background:#f0fdf4;border:1px solid #d1fae5;color:#059669;padding:0.4rem 0.75rem;border-radius:8px;font-size:0.8rem;cursor:pointer;font-weight:600;" onmouseenter="this.style.background='#dcfce7'" onmouseleave="this.style.background='#f0fdf4'"><i class="fa-solid fa-pen"></i></button>
            <button onclick="event.stopPropagation();window.ui.deleteSavingsType('${t.id}')" style="background:#fff1f2;border:1px solid #fecdd3;color:#ef4444;padding:0.4rem 0.75rem;border-radius:8px;font-size:0.8rem;cursor:pointer;font-weight:600;" onmouseenter="this.style.background='#fee2e2'" onmouseleave="this.style.background='#fff1f2'"><i class="fa-solid fa-trash"></i></button>
        </div>
    </div>`,
      )
      .join("");
  }

  async deleteSavingsType(typeId) {
    const result = await Swal.fire({
      title: "Delete Type?",
      text: "This savings type will be deleted. Existing accounts will not be affected.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });
    if (result.isConfirmed) {
      await window.db.delete("savingsTypes", typeId);
      this.renderSavingsTypes();
    }
  }

  async renderAddSavingsType(editId = null) {
    this.setTitle(editId ? "Edit Savings Type" : "New Savings Type");
    this.hideFab();

    let type = {};
    if (editId) type = (await window.db.get("savingsTypes", editId)) || {};

    const icons = [
      "piggy-bank",
      "coins",
      "sack-dollar",
      "landmark-dome",
      "vault",
      "hand-holding-dollar",
      "money-bill-trend-up",
    ];
    const iconOptions = icons
      .map(
        (ic) =>
          '<option value="' +
          ic +
          '" ' +
          ((type.icon || "piggy-bank") === ic ? "selected" : "") +
          ">" +
          ic.replace(/-/g, " ") +
          "</option>",
      )
      .join("");

    this.container.innerHTML = `
    <div class="card">
        <form id="savings-type-form">
            <div class="form-group">
                <label>Type Name <span style="color:red">*</span></label>
                <input type="text" class="form-control" name="name" required placeholder="e.g. Fixed Deposit, Piggy Bank" value="${type.name || ""}">
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Interest Rate (% p.a.)</label>
                    <input type="number" step="0.01" class="form-control" name="interestRate" placeholder="e.g. 6.5" value="${type.interestRate || ""}">
                </div>
                <div class="form-group">
                    <label>Default Deposit Frequency</label>
                    <select class="form-control" name="depositFrequency">
                        <option value="Daily"    ${type.depositFrequency === "Daily" ? "selected" : ""}>Daily</option>
                        <option value="Weekly"   ${type.depositFrequency === "Weekly" ? "selected" : ""}>Weekly</option>
                        <option value="Monthly"  ${type.depositFrequency === "Monthly" ? "selected" : ""}>Monthly</option>
                        <option value="Flexible" ${!type.depositFrequency || type.depositFrequency === "Flexible" ? "selected" : ""}>Flexible</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Icon</label>
                <select class="form-control" name="icon">${iconOptions}</select>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea class="form-control" name="description" rows="2" placeholder="Optional description...">${type.description || ""}</textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:0.9rem;font-size:1rem;border-radius:30px;margin-top:0.5rem;background:linear-gradient(135deg,#059669,#10b981);">
                <i class="fa-solid fa-check" style="margin-right:0.4rem;"></i>
                ${editId ? "UPDATE TYPE" : "CREATE TYPE"}
            </button>
        </form>
    </div>`;

    document.getElementById("savings-type-form").onsubmit = async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      if (editId) {
        await window.db.add("savingsTypes", {
          ...type,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      } else {
        data.id = crypto.randomUUID();
        data.createdAt = new Date().toISOString();
        await window.db.add("savingsTypes", data);
      }
      Swal.fire({
        icon: "success",
        title: editId ? "Updated!" : "Created!",
        timer: 1200,
        showConfirmButton: false,
      });
      window.app.navigate("savings-types");
    };
  }

  // ── Add / Edit Savings Account ──────────────────────────────────────────────

  async renderAddSavings(editId = null) {
    this.setTitle(editId ? "Edit Savings Account" : "New Savings Account");
    this.hideFab();

    const users = await window.db.getAll("borrowers");
    const types = await window.db.getAll("savingsTypes");
    let savings = {};
    if (editId) savings = (await window.db.get("savings", editId)) || {};

    const userOptions = users
      .map(
        (u) =>
          '<option value="' +
          u.id +
          '" ' +
          (u.id === savings.userId ? "selected" : "") +
          ">" +
          u.name +
          " (" +
          u.mobile +
          ")</option>",
      )
      .join("");

    const typeOptions = types.length
      ? types
          .map(
            (t) =>
              '<option value="' +
              t.id +
              '" data-freq="' +
              (t.depositFrequency || "Flexible") +
              '" ' +
              (t.id === savings.savingsTypeId ? "selected" : "") +
              ">" +
              t.name +
              "</option>",
          )
          .join("")
      : '<option value="">-- No types yet (create one first) --</option>';

    this.container.innerHTML = `
    <div class="card">
        <form id="add-savings-form">
            <div class="form-group">
                <label>Select User <span style="color:red">*</span></label>
                <select class="form-control" name="userId" required>
                    <option value="">-- Select User --</option>
                    ${userOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Savings Type <span style="color:red">*</span></label>
                <select class="form-control" name="savingsTypeId" id="sav-type-sel" required>
                    <option value="">-- Select Type --</option>
                    ${typeOptions}
                </select>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Deposit Frequency</label>
                    <select class="form-control" name="frequency" id="sav-freq-sel" onchange="window.ui._autoCalculateSavingsGoal('date')">
                        <option value="Daily"    ${savings.frequency === "Daily" ? "selected" : ""}>Daily</option>
                        <option value="Weekly"   ${savings.frequency === "Weekly" ? "selected" : ""}>Weekly</option>
                        <option value="Monthly"  ${savings.frequency === "Monthly" ? "selected" : ""}>Monthly</option>
                        <option value="Flexible" ${!savings.frequency || savings.frequency === "Flexible" ? "selected" : ""}>Flexible</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Installment Amount (<i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>) <span style="color:red">*</span></label>
                    <input type="number" class="form-control" name="installmentAmount" id="sav-inst-amt" placeholder="Per deposit amount" value="${savings.installmentAmount || ""}" required oninput="window.ui._autoCalculateSavingsGoal('date')">
                </div>
            </div>
            

            <div class="grid-2">
                <div class="form-group">
                    <label>Goal Amount (<i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>)</label>
                    <input type="number" class="form-control" name="goalAmount" id="sav-goal-amt" placeholder="Target savings" value="${savings.goalAmount || ""}" oninput="window.ui._autoCalculateSavingsGoal('date')">
                </div>
                <div class="form-group">
                    <label>Installments (Count) <span style="color:red">*</span></label>
                    <input type="number" class="form-control" name="installmentsCount" id="sav-count" placeholder="e.g. 100" value="${savings.installmentsCount || ""}" required oninput="window.ui._autoCalculateSavingsGoal('count')">
                </div>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Start Date <span style="color:red">*</span></label>
                    <input type="date" class="form-control" name="startDate" id="sav-start" value="${savings.startDate || new Date().toISOString().split("T")[0]}" required oninput="window.ui._autoCalculateSavingsGoal('date')">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="date" class="form-control" name="endDate" id="sav-end" value="${savings.endDate || ""}" onchange="window.ui._autoCalculateSavingsGoal('date')">
                </div>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Notes</label>
                    <textarea class="form-control" name="notes" rows="2" placeholder="Optional notes...">${savings.notes || ""}</textarea>
                </div>
                <div class="form-group">
                    <label>Account Status</label>
                    <select class="form-control" name="status">
                        <option value="active" ${!savings.status || savings.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${savings.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="closed" ${savings.status === 'closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </div>
            </div>
            
            <div style="display:flex;gap:0.75rem;margin-top:0.75rem;">
                <button type="submit" class="btn btn-primary" style="flex:2;justify-content:center;padding:1rem;font-size:1rem;border-radius:30px;background:linear-gradient(135deg,#059669,#10b981);">
                    <i class="fa-solid fa-piggy-bank" style="margin-right:0.4rem;"></i>
                    ${editId ? "UPDATE ACCOUNT" : "OPEN ACCOUNT"}
                </button>
                ${editId ? `<button type="button" class="btn" style="flex:1;justify-content:center;padding:1rem;font-size:1rem;border-radius:30px;background:#fff1f2;color:#e11d48;border:1px solid #fecdd3;" onclick="window.ui._deleteSavings('${editId}')">
                    <i class="fa-solid fa-trash-can" style="margin-right:0.4rem;"></i>Delete
                </button>` : ""}
            </div>
        </form>
    </div>`;

    document
      .getElementById("sav-type-sel")
      .addEventListener("change", function () {
        const opt = this.options[this.selectedIndex];
        const freq = opt.dataset.freq || "Flexible";
        const sel = document.getElementById("sav-freq-sel");
        if (sel) {
          for (let o of sel.options) o.selected = o.value === freq;
        }
      });

    document.getElementById("add-savings-form").onsubmit = async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      const allTypes = await window.db.getAll("savingsTypes");
      const selType = allTypes.find((t) => t.id === data.savingsTypeId);

      if (editId) {
        await window.db.add("savings", {
          ...savings,
          ...data,
          savingsTypeName: selType ? selType.name : "",
          updatedAt: new Date().toISOString(),
        });
        Swal.fire({
          icon: "success",
          title: "Updated!",
          timer: 1200,
          showConfirmButton: false,
        });
        window.app.navigate("savings-detail", editId);
      } else {
        const acct = {
          id: crypto.randomUUID(),
          accountNo: Math.floor(10000 + Math.random() * 90000).toString(),
          userId: data.userId,
          savingsTypeId: data.savingsTypeId,
          savingsTypeName: selType ? selType.name : "",
          frequency: data.frequency,
          installmentAmount: data.installmentAmount,
          installmentsCount: data.installmentsCount,
          goalAmount: data.goalAmount,
          startDate: data.startDate,
          endDate: data.endDate,
          notes: data.notes,
          status: data.status || "active",
          createdAt: new Date().toISOString(),
        };
        await window.db.add("savings", acct);
        Swal.fire({
          icon: "success",
          title: "Account Opened!",
          text: "Savings account created.",
          timer: 1500,
          showConfirmButton: false,
        });
        window.app.navigate("savings-detail", acct.id);
      }
    };
  }

  _autoCalculateSavingsGoal(triggerSource = 'date') {
    const freqEl = document.getElementById("sav-freq-sel");
    const instAmtEl = document.getElementById("sav-inst-amt");
    const startEl = document.getElementById("sav-start");
    const endEl = document.getElementById("sav-end");
    const goalEl = document.getElementById("sav-goal-amt");
    const countEl = document.getElementById("sav-count");

    if (!freqEl || !instAmtEl || !startEl || !endEl || !goalEl || !countEl) return;

    const freq = freqEl.value;
    const instAmt = parseFloat(instAmtEl.value) || 0;
    const startVal = startEl.value;
    const countVal = parseInt(countEl.value) || 0;


    if (!startVal || freq === "Flexible") return;

    const s = new Date(startVal);

    if (triggerSource === 'count' && countVal > 0) {
      let e = new Date(s);
      if (freq === "Daily") {
        e.setDate(s.getDate() + countVal - 1);
      } else if (freq === "Weekly") {
        let day = s.getDay(); 
        let diff = (5 - day + 7) % 7;
        e.setDate(s.getDate() + diff); 
        e.setDate(e.getDate() + (countVal - 1) * 7); 
      } else if (freq === "Monthly") {
        e.setMonth(s.getMonth() + countVal - 1);
      }
      endEl.value = e.toISOString().split("T")[0];
      goalEl.value = countVal * instAmt;
    } else if (triggerSource === 'date') {
      const endVal = endEl.value;
      if (!endVal) {
        if (countVal > 0) {
           // If no end date but count exists, maybe calculate end date? 
           // Let's stick to the trigger sources.
        }
        return;
      }
      const e = new Date(endVal);
      if (s <= e) {
        let count = 0;
        if (freq === "Daily") {
          const diffMs = e.getTime() - s.getTime();
          count = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
        } else if (freq === "Weekly") {
          let dayS = s.getDay();
          let diffS = (5 - dayS + 7) % 7;
          let firstFri = new Date(s);
          firstFri.setDate(s.getDate() + diffS);

          let dayE = e.getDay();
          let diffE = (dayE - 5 + 7) % 7;
          let lastFri = new Date(e);
          lastFri.setDate(e.getDate() - diffE);

          if (firstFri <= lastFri) {
            count = Math.floor((lastFri.getTime() - firstFri.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
          } else {
            count = 0;
          }
        } else if (freq === "Monthly") {
          count = (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth() + 1;
        }

        if (count < 0) count = 0;
        countEl.value = count;
        goalEl.value = count * instAmt;
      }
    }
  }

  // ── Savings Detail ──────────────────────────────────────────────────────────

  async renderSavingsDetail(savingsId) {
    this.setTitle("Savings Details");

    this.showFab(() => {
      window.ui.openDepositModal(savingsId);
    });

    const savings = await window.db.get("savings", savingsId);
    if (!savings) {
      this.container.innerHTML = '<div style="padding:2rem;text-align:center;color:#94a3b8;">Account not found.</div>';
      return;
    }

    const user = await window.db.get("borrowers", savings.userId);
    const allTxns = await window.db.getAll("savingsTransactions");
    const txns = allTxns.filter((t) => t.savingsId === savingsId);
    
    const goalAmt = parseFloat(savings.goalAmount || 0);
    const savedAmt = txns.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const remaining = Math.max(0, goalAmt - savedAmt);
    const progressPercent = goalAmt > 0 ? Math.min(100, Math.round((savedAmt / goalAmt) * 100)) : 0;
    
    const isActive = savings.status === "active";
    const userName = user ? user.name : "Unknown User";

    let scheduleData = savings.schedule || [];

    if (scheduleData.length === 0 && savings.installmentsCount) {
      let currentDate = savings.startDate ? new Date(savings.startDate) : new Date();

      if (savings.frequency === "Weekly") {
        let day = currentDate.getDay();
        let diff = (5 - day + 7) % 7;
        currentDate.setDate(currentDate.getDate() + diff);
      }

      let totalSavedTracker = parseFloat(savedAmt || 0);

      for (let i = 1; i <= parseInt(savings.installmentsCount); i++) {
        const installmentAmt = parseFloat(savings.installmentAmount || 0);
        let paidAmt = 0;
        let paidDate = "";
        let status = "DUE";
        let paymentHistory = [];

        if (totalSavedTracker >= installmentAmt && installmentAmt > 0) {
          paidAmt = installmentAmt;
          totalSavedTracker -= installmentAmt;
          status = "PAID";
          paidDate = savings.startDate || new Date().toISOString().split("T")[0];
        } else if (totalSavedTracker > 0) {
          paidAmt = totalSavedTracker;
          totalSavedTracker = 0;
          status = "PARTIAL";
          paidDate = new Date().toISOString().split("T")[0];
        }

        if (paidAmt > 0) {
          paymentHistory = [
            {
              amount: paidAmt,
              timestamp: new Date().toISOString(),
              note: "initial deposit",
            },
          ];
        }

        scheduleData.push({
          no: i,
          dueDate: currentDate.toISOString().split("T")[0],
          amount: installmentAmt,
          paidAmount: paidAmt,
          paidDate: paidDate,
          paymentHistory: paymentHistory,
          status: status,
        });

        if (savings.frequency === "Weekly") currentDate.setDate(currentDate.getDate() + 7);
        else if (savings.frequency === "Monthly") currentDate.setMonth(currentDate.getMonth() + 1);
        else currentDate.setDate(currentDate.getDate() + 1); 
      }
      savings.schedule = scheduleData;
      await window.db.add("savings", savings);
    }

    const paidCount = scheduleData.filter((s) => s.status === "PAID").length;

    const rows = scheduleData.map((item, index) => {
      const ratio = item.amount > 0 ? item.paidAmount / item.amount : 0;
      let statusBadge = "";

      if (ratio >= 1)
        statusBadge = `<span class="status-badge status-active">PAID</span>`;
      else if (ratio > 0)
        statusBadge = `<span class="status-badge" style="background:#fef3c7; color:#d97706;">PARTIAL</span>`;
      else
        statusBadge = `<span class="status-badge" style="background:#fee2e2; color:#ef4444;">DUE</span>`;

      // Format date from YYYY-MM-DD to DD-MM-YYYY
      const formatDateToDDMMYYYY = (dateStr) => {
        if (!dateStr) return 'N/A';
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
      };

      const history = item.paymentHistory || [];
      const historyHtml = history.length > 0
          ? history.map((h) => {
                const dt = new Date(h.timestamp);
                const dateStr = dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
                const timeStr = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

                return `<span class="pay-history-entry" title="${h.note || ""} • ${dt.toLocaleString()}">
                  <span class="entry-dot"></span>
                  <span class="entry-amount"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${h.amount}</span>
                  <span style="color:#64748b; font-weight:500;">${dateStr} ${timeStr}</span>
                </span>`;
            }).join("")
          : `<span class="pay-history-empty">No deposits yet</span>`;

      const _sLastEntry = history.length > 0 ? history[history.length - 1] : null;
      const receivedByHtml = _sLastEntry && _sLastEntry.receivedBy
        ? (() => {
            const rDt = new Date(_sLastEntry.timestamp);
            const rDate = rDt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
            const rTime = rDt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
            return `<div class="received-by-cell">
              <div class="rb-name-badge"><i class="fa-solid fa-user-shield"></i> ${_sLastEntry.receivedBy}</div>
              <div class="rb-timestamp">${rDate} · ${rTime}</div>
            </div>`;
          })()
        : `<span class="received-by-empty">—</span>`;

      // Calculate cumulative balance (sum of all paid amounts from row 0 to current row)
      const cumulativeBalance = scheduleData
        .slice(0, index + 1)
        .reduce((sum, row) => sum + parseFloat(row.paidAmount || 0), 0);

        return `
        <tr class="schedule-row" data-index="${index}" data-due-date="${item.dueDate}" data-amount="${item.amount}" data-no="${item.no}" style="border-bottom:1px solid #f1f5f9; transition:all 250ms ease;">
          <td style="padding:1rem 0.75rem; text-align:center; color:#64748b; font-weight:600; font-size:0.9rem; border-right:1px solid #f1f5f9; background:#fafbfc;">${item.no}</td>
          <td style="padding:1rem 0.75rem; text-align:center; font-weight:500; color:#334155; font-size:0.9rem; border-right:1px solid #f1f5f9;">${formatDateToDDMMYYYY(item.dueDate)}</td>
          <td style="padding:1rem 0.75rem; text-align:center; border-right:1px solid #f1f5f9;">${statusBadge}</td>
          <td style="padding:1rem 0.75rem; text-align:center; font-weight:600; color:#1e293b; font-size:0.9rem; border-right:1px solid #f1f5f9;"><i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:0.85em; margin-right:4px;"></i>${item.amount.toLocaleString('en-IN')}</td>
          <td style="padding:0.75rem; text-align:center; border-right:1px solid #f1f5f9;">
            <div class="payment-history-cell" style="display:flex; flex-direction:column; gap:0.5rem; align-items:center;">
              ${historyHtml}
              <button class="log-payment-btn" onclick="window.ui.logManualSavingsDeposit('${savingsId}', ${index})" style="padding:0.4rem 0.75rem; background:#e0f2fe; color:#0369a1; border:none; border-radius:6px; cursor:pointer; font-size:0.8rem; font-weight:600; transition:all 200ms ease;">
                <i class="fa-solid fa-plus" style="font-size:0.7rem; margin-right:4px;"></i> Log
              </button>
            </div>
          </td>
          <td style="padding:0.75rem; text-align:center; border-right:1px solid #f1f5f9;">
            ${receivedByHtml}
          </td>
          <td style="padding:1rem 0.75rem; text-align:center; border-right:1px solid #f1f5f9;">
            <input type="number" class="form-control schedule-amount" value="${item.paidAmount}" data-prev-paid="${item.paidAmount}" style="font-size:0.9rem; padding:0.5rem; font-weight:600; width:100px; border:1px solid #e2e8f0; border-radius:6px; text-align:center; margin:0 auto; display:block;">
          </td>
          <td style="padding:1rem 0.75rem; text-align:center;">
            <span class="cumulative-balance" style="display:inline-block; background:linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%); padding:0.5rem 0.75rem; border-radius:8px; border-left:3px solid #0ea5e9; font-weight:600; color:#0369a1; font-size:0.9rem; cursor:default; user-select:none;">
              <i class="fi fi-sr-bangladeshi-taka-sign" style="font-size:0.85em; margin-right:3px;"></i>${cumulativeBalance.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 2})}
            </span>
          </td>
        </tr>`;
    }).join("");

    const scheduleHtml = scheduleData.length > 0 ? `
      <div style="display:flex; justify-content:space-between; align-items:center; margin:2rem 0 1rem;">
        <h4 style="margin:0; display:flex; align-items:center; gap:0.5rem;">
          <i class="fa-solid fa-list-ol" style="color:var(--primary-color);"></i> Installment Schedule
        </h4>
        <button class="btn btn-primary btn-sm" onclick="window.ui.saveSavingsSchedule('${savingsId}')">
          <i class="fa-solid fa-cloud-arrow-up"></i> Save Schedule
        </button>
      </div>

      <div class="card" style="padding:0; overflow:hidden; border-radius:12px; box-shadow:0 4px 12px -2px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
        <div style="overflow-x:auto;">
          <table class="modern-table savings-schedule-table" style="width:100%; min-width:800px; border-collapse:collapse; background:white;">
            <thead style="background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-bottom:2px solid #cbd5e1; position:sticky; top:0; z-index:10;">
              <tr>
                <th style="padding:1rem 0.75rem; text-align:center; font-weight:700; color:#1e293b; font-size:0.875rem; text-transform:uppercase; letter-spacing:0.5px; width:50px; border-right:1px solid #e2e8f0;">No</th>
                <th style="padding:1rem 0.75rem; text-align:center; font-weight:700; color:#1e293b; font-size:0.875rem; text-transform:uppercase; letter-spacing:0.5px; border-right:1px solid #e2e8f0; min-width:100px;">Due Date</th>
                <th style="padding:1rem 0.75rem; text-align:center; font-weight:700; color:#1e293b; font-size:0.875rem; text-transform:uppercase; letter-spacing:0.5px; border-right:1px solid #e2e8f0; width:90px;">Status</th>
                <th style="padding:1rem 0.75rem; text-align:center; font-weight:700; color:#1e293b; font-size:0.875rem; text-transform:uppercase; letter-spacing:0.5px; border-right:1px solid #e2e8f0; width:100px;">Due Amt</th>
                <th style="padding:1rem 0.75rem; text-align:center; font-weight:700; color:#1e293b; font-size:0.875rem; text-transform:uppercase; letter-spacing:0.5px; border-right:1px solid #e2e8f0; min-width:200px;">Payment History</th>
                <th style="padding:1rem 0.75rem; text-align:center; font-weight:700; color:#1e293b; font-size:0.875rem; text-transform:uppercase; letter-spacing:0.5px; border-right:1px solid #e2e8f0; min-width:140px;">Received By</th>
                <th style="padding:1rem 0.75rem; text-align:center; font-weight:700; color:#1e293b; font-size:0.875rem; text-transform:uppercase; letter-spacing:0.5px; border-right:1px solid #e2e8f0; width:110px;">Paid Amt</th>
                <th style="padding:1rem 0.75rem; text-align:center; font-weight:700; color:#1e293b; font-size:0.875rem; text-transform:uppercase; letter-spacing:0.5px; width:120px;">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    ` : `<div class="card" style="margin-top:2rem; text-align:center; padding:3rem 1rem; color:#94a3b8;"><i class="fa-solid fa-piggy-bank" style="font-size:2rem; margin-bottom:1rem; opacity:0.5;"></i><p>This flexible account has no fixed schedule.</p></div>`;


    this.container.innerHTML = `
      <div class="card" style="border-radius:16px; margin-bottom:1.5rem; position:relative;">
        <div style="display:flex; gap:1.5rem; flex-wrap:wrap;">
          <div style="position:relative; flex-shrink:0;">
            <img src="${user && user.photo ? user.photo : "https://ui-avatars.com/api/?name=" + userName}" style="width:100px;height:100px;border-radius:12px; object-fit:cover; border:1px solid #e2e8f0; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
          </div>
          <div style="flex:1; min-width:250px;">
            <div style="display:flex; justify-content:space-between; align-items:start;">
              <div>
                <h2 style="margin:0; font-size:1.5rem; color:var(--text-main);">${userName}</h2>
                <div style="display:flex; gap:0.75rem; margin-top:0.5rem; flex-wrap:wrap;">
                  <span class="info-tag"><i class="fa-solid fa-book"></i> Book #${user && user.serialNo ? user.serialNo : "N/A"}</span>
                  <span class="info-tag"><i class="fa-solid fa-phone"></i> ${user && user.mobile ? user.mobile : "-"}</span>
                  <span class="info-tag"><i class="fa-solid fa-mars-and-venus"></i> ${user && user.gender ? user.gender : "-"}</span>
                  <span class="info-tag"><i class="fa-solid fa-tags"></i> ${savings.savingsTypeName || "Savings"}</span>
                </div>
              </div>
              <div style="display:flex; gap:0.5rem; align-items:flex-start;">
                <button class="btn btn-secondary" onclick="window.app.navigate('add-savings', '${savingsId}')" title="Edit Savings"><i class="fa-solid fa-pen" style="color:#64748b;"></i> Edit</button>
                <button class="btn btn-secondary" onclick="window.ui.generateSavingsReport('${savingsId}')" title="Download Report"><i class="fa-solid fa-file-pdf" style="color:#ef4444;"></i> Report</button>
              </div>
            </div>
            
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:1rem; margin-top:1.5rem; padding-top:1.5rem; border-top:1px dashed #e2e8f0;">
              <div><small style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">A/C Status</small><div style="font-weight:600;">${isActive ? `<span class="status-badge status-active">ACTIVE</span>` : `<span class="status-badge" style="background:#fee2e2; color:#ef4444;">CLOSED</span>`}</div></div>
              <div><small style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Frequency</small><div style="font-weight:600; font-size:0.9rem;">${savings.frequency || "Flexible"}</div></div>
              <div><small style="color:var(--text-muted); display:block; margin-bottom:0.25rem;">Account No</small><div style="font-weight:600; font-size:0.9rem;">#${savings.accountNo || savingsId.substr(0, 6).toUpperCase()}</div></div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid-4" style="margin-bottom:1.5rem;">
         <div class="card stat-card">
          <span class="stat-label">Total Goal</span>
          <span class="stat-value"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${goalAmt.toLocaleString()}</span>
         </div>
         <div class="card stat-card">
          <span class="stat-label">Total Saved</span>
          <span class="stat-value text-success"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${savedAmt.toLocaleString()}</span>
         </div>
         <div class="card stat-card">
          <span class="stat-label">Remaining</span>
          <span class="stat-value text-danger"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${remaining.toLocaleString()}</span>
         </div>
         <div class="card stat-card">
          <span class="stat-label">Deposits</span>
          <span class="stat-value" style="color:var(--primary-color)">${paidCount}/${savings.installmentsCount || "∞"}</span>
         </div>
      </div>

      ${scheduleHtml}

      <!-- ═══════════════════════════════════════════════════════════════ -->
      <!-- SAVINGS DETAILS TRANSACTION TABLE (FIXED POSITION) -->
      <!-- ═══════════════════════════════════════════════════════════════ -->
      <div style="margin-top: 2.5rem; margin-bottom: 1.5rem;">
        <h3 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">
          <i class="fa-solid fa-transaction" style="color: var(--primary); opacity: 0.8;"></i>
          All Transactions (${txns.length || 0})
        </h3>

        <div class="savings-details-table-wrapper" style="
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(37, 99, 235, 0.08);
          background: white;
          position: relative;
        ">
          <div style="overflow-x: auto;">
            <table style="
              width: 100%;
              border-collapse: collapse;
              font-size: 0.9rem;
              background: white;
            ">
              <thead style="
                background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%);
                border-bottom: 2px solid rgba(37, 99, 235, 0.15);
                position: sticky;
                top: 0;
                z-index: 10;
              ">
                <tr>
                  <th style="
                    padding: 1rem;
                    text-align: left;
                    font-weight: 700;
                    color: var(--text-primary);
                    border-right: 1px solid rgba(37, 99, 235, 0.1);
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    letter-spacing: 0.5px;
                  ">
                    <i class="fa-solid fa-calendar-alt" style="margin-right: 0.5rem; opacity: 0.6;"></i>Date
                  </th>
                  <th style="
                    padding: 1rem;
                    text-align: left;
                    font-weight: 700;
                    color: var(--text-primary);
                    border-right: 1px solid rgba(37, 99, 235, 0.1);
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    letter-spacing: 0.5px;
                  ">
                    <i class="fa-solid fa-bookmark" style="margin-right: 0.5rem; opacity: 0.6;"></i>Type
                  </th>
                  <th style="
                    padding: 1rem;
                    text-align: right;
                    font-weight: 700;
                    color: var(--text-primary);
                    border-right: 1px solid rgba(37, 99, 235, 0.1);
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    letter-spacing: 0.5px;
                  ">
                    <i class="fa-solid fa-coins" style="margin-right: 0.5rem; opacity: 0.6;"></i>Amount
                  </th>
                  <th style="
                    padding: 1rem;
                    text-align: left;
                    font-weight: 700;
                    color: var(--text-primary);
                    border-right: 1px solid rgba(37, 99, 235, 0.1);
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    letter-spacing: 0.5px;
                  ">
                    <i class="fa-solid fa-user-check" style="margin-right: 0.5rem; opacity: 0.6; color: #16a34a;"></i>Received By
                  </th>
                  <th style="
                    padding: 1rem;
                    text-align: left;
                    font-weight: 700;
                    color: var(--text-primary);
                    border-right: 1px solid rgba(37, 99, 235, 0.1);
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    letter-spacing: 0.5px;
                  ">
                    <i class="fa-solid fa-note-sticky" style="margin-right: 0.5rem; opacity: 0.6;"></i>Note
                  </th>
                  <th style="
                    padding: 1rem;
                    text-align: left;
                    font-weight: 700;
                    color: var(--text-primary);
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    letter-spacing: 0.5px;
                  ">
                    <i class="fa-solid fa-info-circle" style="margin-right: 0.5rem; opacity: 0.6;"></i>ID
                  </th>
                </tr>
              </thead>
              <tbody>
                ${txns.length > 0 ? txns.sort((a, b) => new Date(b.date) - new Date(a.date)).map((t, idx) => {
                  const transactionType = t.type || 'Deposit';
                  const formattedDate = t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
                  const formattedAmount = parseFloat(t.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                  const receivedBy = t.receivedBy || '—';
                  const note = t.note || '—';
                  const bgColor = idx % 2 === 0 ? 'rgba(37, 99, 235, 0.02)' : 'white';
                  
                  return `
                    <tr style="
                      border-bottom: 1px solid rgba(37, 99, 235, 0.08);
                      background: ${bgColor};
                      padding: 0;
                    ">
                      <td style="
                        padding: 1rem;
                        border-right: 1px solid rgba(37, 99, 235, 0.08);
                        font-weight: 500;
                        color: var(--text-primary);
                      ">
                        <i class="fa-solid fa-calendar" style="color: #2563eb; margin-right: 0.5rem; opacity: 0.7;"></i>${formattedDate}
                      </td>
                      <td style="
                        padding: 1rem;
                        border-right: 1px solid rgba(37, 99, 235, 0.08);
                      ">
                        <span style="
                          background: linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(147, 51, 234, 0.06) 100%);
                          border: 1px solid rgba(147, 51, 234, 0.2);
                          padding: 0.4rem 0.8rem;
                          border-radius: 6px;
                          font-size: 0.8rem;
                          font-weight: 700;
                          color: #6d28d9;
                          display: inline-flex;
                          align-items: center;
                          gap: 0.4rem;
                        ">
                          <i class="fa-solid fa-piggy-bank" style="opacity: 0.7;"></i>${transactionType}
                        </span>
                      </td>
                      <td style="
                        padding: 1rem;
                        text-align: right;
                        color: #16a34a;
                        font-weight: 700;
                        border-right: 1px solid rgba(37, 99, 235, 0.08);
                      ">
                        ৳${formattedAmount}
                      </td>
                      <td style="
                        padding: 1rem;
                        border-right: 1px solid rgba(37, 99, 235, 0.08);
                      ">
                        <span style="
                          background: linear-gradient(135deg, rgba(22, 163, 74, 0.15) 0%, rgba(34, 197, 94, 0.08) 100%);
                          border: 1px solid rgba(34, 197, 94, 0.2);
                          padding: 0.4rem 0.7rem;
                          border-radius: 6px;
                          font-size: 0.8rem;
                          font-weight: 600;
                          color: #16a34a;
                          display: inline-flex;
                          align-items: center;
                          gap: 0.4rem;
                        ">
                          <i class="fa-solid fa-badge-check" style="opacity: 0.8;"></i>${receivedBy}
                        </span>
                      </td>
                      <td style="
                        padding: 1rem;
                        border-right: 1px solid rgba(37, 99, 235, 0.08);
                        color: var(--text-secondary);
                        font-size: 0.85rem;
                      ">
                        ${note}
                      </td>
                      <td style="
                        padding: 1rem;
                        font-size: 0.8rem;
                        color: #64748b;
                      ">
                        <span style="
                          background: rgba(37, 99, 235, 0.08);
                          padding: 0.4rem 0.6rem;
                          border-radius: 6px;
                          display: inline-block;
                          font-family: monospace;
                          letter-spacing: 0.5px;
                        ">${t.id ? t.id.substring(0, 8).toUpperCase() : 'N/A'}...</span>
                      </td>
                    </tr>
                  `;
                }).join('') : '<tr><td colspan="6" style="padding: 3rem 1rem; text-align: center; color: #94a3b8;"><i class="fa-solid fa-inbox" style="font-size: 2rem; opacity: 0.3; display: block; margin-bottom: 0.5rem;"></i>No transactions found</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- Fixed Footer with Summary -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            background: rgba(37, 99, 235, 0.02);
            border-top: 1px solid rgba(37, 99, 235, 0.1);
          ">
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
              Total Transactions: <strong>${txns.length}</strong>
            </div>
            <div style="font-size: 0.9rem; color: var(--success); font-weight: 700;">
              Total Amount: <i class="fi fi-sr-bangladeshi-taka-sign" style="font-size: 0.85em; margin-right: 2px;"></i>৳${txns.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async saveSavingsSchedule(savingsId) {
    const rows = document.querySelectorAll(".schedule-row");
    const savings = await window.db.get("savings", savingsId);
    if (!savings) return;

    const existingSchedule = savings.schedule || [];
    let totalSaved = 0;
    let newSchedule = [];

    rows.forEach((row, index) => {
      const input = row.querySelector(".schedule-amount");
      const currentVal = parseFloat(input.value) || 0;
      const prevVal = parseFloat(input.getAttribute("data-prev-paid")) || 0;
      const amount = parseFloat(row.getAttribute("data-amount")) || 0;
      const dueDate = row.getAttribute("data-due-date");
      const no = parseInt(row.getAttribute("data-no"));

      const existingData = existingSchedule[index] || {};
      let paymentHistory = existingData.paymentHistory || [];

      if (currentVal !== prevVal) {
        const diff = currentVal - prevVal;
        if (diff !== 0) {
          paymentHistory.push({
            amount: diff,
            timestamp: new Date().toISOString(),
            note: diff > 0 ? "Bulk Deposit" : "Correction",
            receivedBy: localStorage.getItem('fincollect_user') || 'Admin',
          });

          if (diff > 0) {
            window.db.add('savingsTransactions', {
              id: Date.now().toString() + Math.random().toString(36).substring(7),
              savingsId: savingsId,
              amount: diff,
              date: new Date().toISOString().split("T")[0],
              note: `Bulk Update (Dep #${no})`,
              timestamp: Date.now(),
            }).catch(e => console.error(e));
          }
        }
      }

      let status = "DUE";
      if (currentVal >= amount && amount > 0) status = "PAID";
      else if (currentVal > 0) status = "PARTIAL";

      totalSaved += currentVal;

      newSchedule.push({
        no: no,
        dueDate: dueDate,
        amount: amount,
        paidAmount: currentVal,
        status: status,
        paymentHistory: paymentHistory,
      });
    });

    savings.schedule = newSchedule;
    await window.db.add("savings", savings);

    Swal.fire({
      icon: "success",
      title: "Schedule Saved",
      timer: 1500,
      showConfirmButton: false,
    });
    
    this.renderSavingsDetail(savingsId);
  }

  async logManualSavingsDeposit(savingsId, index) {
      Swal.fire({
          title: 'Log Specific Deposit',
          html: `
              <input type="number" id="manual-dep-amt" class="swal2-input" placeholder="Amount (<i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>)">
              <input type="date" id="manual-dep-date" class="swal2-input" value="${new Date().toISOString().split('T')[0]}">
              <input type="text" id="manual-dep-note" class="swal2-input" placeholder="Note (Optional)">
          `,
          showCancelButton: true,
          confirmButtonText: 'Save Deposit',
          preConfirm: () => {
              const amt = document.getElementById('manual-dep-amt').value;
              const date = document.getElementById('manual-dep-date').value;
              const note = document.getElementById('manual-dep-note').value;
              if (!amt || isNaN(amt) || parseFloat(amt) <= 0) {
                  Swal.showValidationMessage('Please enter a valid amount');
                  return false;
              }
              return { amount: parseFloat(amt), date, note };
          }
      }).then(async (result) => {
          if (result.isConfirmed) {
              const savings = await window.db.get("savings", savingsId);
              if (!savings) return;
              
              if (savings.schedule && savings.schedule[index]) {
                  const scheduleItem = savings.schedule[index];
                  if(!scheduleItem.paymentHistory) scheduleItem.paymentHistory = [];
                  
                  scheduleItem.paymentHistory.push({
                      amount: result.value.amount,
                      timestamp: new Date().toISOString(),
                      note: result.value.note || 'Manual Deposit',
                      receivedBy: localStorage.getItem('fincollect_user') || 'Admin',
                  });
                  
                  scheduleItem.paidAmount = (parseFloat(scheduleItem.paidAmount) || 0) + result.value.amount;
                  
                  if (scheduleItem.paidAmount >= scheduleItem.amount && scheduleItem.amount > 0) scheduleItem.status = "PAID";
                  else if (scheduleItem.paidAmount > 0) scheduleItem.status = "PARTIAL";
                  else scheduleItem.status = "DUE";
                  
                  await window.db.add('savings', savings);
              }

              const collector = localStorage.getItem('fincollect_user') || 'Admin';
              const freshSavings = await window.db.get('savings', savingsId);
              await window.db.add('savingsTransactions', {
                  id: Date.now().toString() + Math.random().toString(36).substring(7),
                  savingsId: savingsId,
                  userId: freshSavings?.userId || '',
                  amount: result.value.amount,
                  date: result.value.date,
                  receivedBy: collector,
                  note: result.value.note || `Manual log (Dep #${index + 1})`,
                  timestamp: Date.now()
              });

              Swal.fire({ icon: 'success', title: 'Deposit Saved', timer: 1500, showConfirmButton: false });
              this.renderSavingsDetail(savingsId);
          }
      });
  }

  async generateSavingsReport(savingsId) {
    try {
      const savings = await window.db.get('savings', savingsId);
      if (!savings) {
        Swal.fire('Error', 'Savings record not found', 'error');
        return;
      }

      const user      = await window.db.get('borrowers', savings.userId);
      const allTxns   = await window.db.getAll('savingsTransactions');
      const txns      = allTxns.filter(t => t.savingsId === savingsId)
                               .sort((a, b) => new Date(a.date) - new Date(b.date));

    const goalAmt   = parseFloat(savings.goalAmount || 0);
    const savedAmt  = txns.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const remaining = Math.max(0, goalAmt - savedAmt);
    const progress  = goalAmt > 0 ? Math.min(100, ((savedAmt / goalAmt) * 100).toFixed(1)) : 0;

    const paidCount = (savings.schedule || []).filter(s => s.status === 'PAID').length;
    const totalInst = savings.installmentsCount || (savings.schedule || []).length || '∞';
    const isActive  = savings.status === 'active';
    const userName  = user ? user.name : 'Unknown';
    const genDate   = new Date().toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true });
    const generatedBy = localStorage.getItem('fincollect_user') || 'Admin';

    /* ── Schedule rows ── */
    const scheduleRows = (savings.schedule || []).map((item, scheduleIndex) => {
      const history = item.paymentHistory || [];
      const lastEntry = history.length > 0 ? history[history.length - 1] : null;
      const lastPaidStr = lastEntry
        ? new Date(lastEntry.timestamp).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' })
        : (item.paidDate || '—');
      const receivedBy = lastEntry && lastEntry.receivedBy ? lastEntry.receivedBy : '—';
      const badgeStyle = item.status === 'PAID'
        ? 'background:#dcfce7;color:#16a34a;'
        : item.status === 'PARTIAL'
          ? 'background:#fef9c3;color:#ca8a04;'
          : 'background:#fee2e2;color:#dc2626;';
      
      // Calculate cumulative balance (sum of all paid amounts from row 0 to current row)
      const cumulativeBalance = (savings.schedule || [])
        .slice(0, scheduleIndex + 1)
        .reduce((sum, row) => sum + parseFloat(row.paidAmount || 0), 0);
      
      return `<tr style="text-align:center;">
        <td style="text-align:center !important;vertical-align:middle !important;font-weight:700;color:#64748b;padding:9px 11px;">${item.no}</td>
        <td style="text-align:center !important;vertical-align:middle !important;padding:9px 11px;">${new Date(item.dueDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
        <td style="text-align:center !important;vertical-align:middle !important;padding:9px 11px;"><span style="${badgeStyle}display:inline-block;padding:3px 9px;border-radius:12px;font-size:7pt;font-weight:700;">${item.status}</span></td>
        <td style="text-align:center !important;vertical-align:middle !important;font-weight:600;padding:9px 11px;">Tk ${parseFloat(item.amount).toLocaleString('en-IN',{minimumFractionDigits:0})}</td>
        <td style="text-align:center !important;vertical-align:middle !important;color:#64748b;font-size:7.5pt;padding:9px 11px;">${lastPaidStr}</td>
        <td style="text-align:center !important;vertical-align:middle !important;color:${item.paidAmount > 0 ? '#16a34a' : 'inherit'};font-weight:600;padding:9px 11px;">Tk ${parseFloat(item.paidAmount||0).toLocaleString('en-IN',{minimumFractionDigits:0})}</td>
        <td style="text-align:center !important;vertical-align:middle !important;color:#0ea5e9;font-weight:700;font-size:7.5pt;padding:9px 11px;">Tk ${cumulativeBalance.toLocaleString('en-IN',{minimumFractionDigits:0})}</td>
        <td style="text-align:center !important;vertical-align:middle !important;color:#4338ca;font-weight:600;font-size:7.5pt;padding:9px 11px;">${receivedBy}</td>
      </tr>`;
    }).join('');

    /* ── Transaction ledger rows ── */
    const ledgerRows = txns.map((t, i) => `
      <tr style="text-align:center;">
        <td style="text-align:center !important;vertical-align:middle !important;color:#64748b;font-weight:700;padding:9px 11px;">${i + 1}</td>
        <td style="text-align:center !important;vertical-align:middle !important;padding:9px 11px;">${t.date}</td>
        <td style="text-align:center !important;vertical-align:middle !important;color:#16a34a;font-weight:700;padding:9px 11px;">Tk ${parseFloat(t.amount).toLocaleString('en-IN',{minimumFractionDigits:0})}</td>
        <td style="text-align:center !important;vertical-align:middle !important;color:#4338ca;font-weight:600;padding:9px 11px;">${t.receivedBy || 'Admin'}</td>
      </tr>`).join('');

    /* ── Progress bar SVG ── */
    const barWidth = Math.min(100, parseFloat(progress));

    const printArea = document.createElement('div');
    printArea.id = 'print-area';
    printArea.className = 'print-container';

    printArea.innerHTML = `
<style>
@page { margin: 12mm 10mm; size: A4; orphans: 3; widows: 3; page-break-after: auto; }
* { box-sizing: border-box; -webkit-font-smoothing: antialiased; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif; color: #1f2937; background: white; line-height: 1.4; -webkit-print-color-adjust: exact; margin: 0; padding: 0; }
.print-container { width: 100%; max-width: 100%; margin: 0; color: #111827; page-break-after: avoid; }

/* ═══════════════════════════════════════════════════════════ PAGE BREAK CONTROLS ═══════════════════════════════════════════════════════════ */
.print-container > div { page-break-inside: avoid; break-inside: avoid; }
.doc-header-container { page-break-after: avoid; break-after: avoid; }
.member-section { page-break-inside: avoid; break-inside: avoid; }
.account-section { page-break-inside: avoid; break-inside: avoid; }
.metrics-container { page-break-inside: avoid; break-inside: avoid; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
.metric-card { page-break-inside: avoid; break-inside: avoid; }
.progress-container { page-break-inside: avoid; break-inside: avoid; }
.table-section { page-break-inside: auto; break-inside: auto; margin-bottom: 16px; }
.footer-container { page-break-before: auto; break-before: auto; margin-top: 20px; }

/* ═══════════════════════════════════════════════════════════ DOCUMENT HEADER ═══════════════════════════════════════════════════════════ */
.doc-header-container { margin-bottom: 24px; page-break-after: avoid; }
.company-branding { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 3px solid #4338ca; }
.company-logo { }
.company-name { font-size: 26pt; font-weight: 900; color: #111827; letter-spacing: -1px; margin: 0; }
.company-name .highlight { color: #4338ca; font-weight: 950; }
.company-tagline { font-size: 9pt; color: #6b7280; text-transform: uppercase; letter-spacing: 2.5px; font-weight: 700; margin: 4px 0 0 0; }
.document-title { font-size: 11pt; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 1px; margin: 0; margin-top: 8px; }

.doc-metadata { display: flex; justify-content: space-between; align-items: flex-start; }
.metadata-section { }
.metadata-item { font-size: 8pt; margin-bottom: 6px; line-height: 1.5; }
.metadata-label { color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.metadata-value { color: #111827; font-weight: 800; margin-top: 2px; }
.status-badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 7pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
.status-active { background: #d1fae5; color: #065f46; }
.status-closed { background: #fee2e2; color: #991b1b; }

/* ═════════════════════════════════════════════════════════════════════ MEMBER SECTION ════════════════════════════════════════════════════════════════════ */
.member-section { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
.member-section-title { font-size: 10pt; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; }
.member-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.member-field { }
.member-label { font-size: 8pt; color: #6b7280; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 3px; }
.member-value { font-size: 9pt; color: #111827; font-weight: 700; line-height: 1.4; }

/* ═════════════════════════════════════════════════════════════════════ ACCOUNT SECTION ════════════════════════════════════════════════════════════════════ */
.account-section { background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
.account-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 14px; }
.account-field { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
.account-field:last-child { border-bottom: none; }
.account-label { font-size: 8pt; color: #6b7280; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
.account-value { font-size: 9.5pt; color: #111827; font-weight: 700; margin-top: 2px; }

/* ═════════════════════════════════════════════════════════════════════ KPI METRICS ════════════════════════════════════════════════════════════════════ */
.metrics-container { margin-bottom: 20px; }
.metrics-title { font-size: 10pt; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px 0; }
.metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.metric-card { border: 2px solid #e5e7eb; border-radius: 6px; padding: 11px 10px; text-align: center; background: white; page-break-inside: avoid; }
.metric-card.primary { border-color: #4338ca; background: #ede9fe; }
.metric-card.success { border-color: #10b981; background: #ecfdf5; }
.metric-card.warning { border-color: #f59e0b; background: #fffbeb; }
.metric-label { font-size: 7pt; color: #6b7280; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px; }
.metric-value { font-size: 13pt; font-weight: 950; color: #111827; font-family: 'Courier New', monospace; letter-spacing: -0.5px; }
.metric-card.primary .metric-value { color: #4338ca; }
.metric-card.success .metric-value { color: #10b981; }
.metric-card.warning .metric-value { color: #f59e0b; }

/* ═════════════════════════════════════════════════════════════════════ PROGRESS VISUALIZATION ════════════════════════════════════════════════════════════════════ */
.progress-container { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px; page-break-inside: avoid; }
.progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.progress-title { font-size: 9pt; font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; }
.progress-percent { font-size: 11pt; font-weight: 950; color: #4338ca; font-family: 'Courier New', monospace; }
.progress-bar { height: 10px; background: #e5e7eb; border-radius: 99px; overflow: hidden; border: 0.5px solid #cbd5e1; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #4338ca 0%, #6366f1 100%); border-radius: 99px; transition: width 0.3s ease; }

/* ═════════════════════════════════════════════════════════════════════ TABLE STYLING ════════════════════════════════════════════════════════════════════ */
.table-section { margin-bottom: 22px; page-break-inside: avoid; }
.table-section-title { font-size: 10pt; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
.modern-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; background: white; page-break-inside: avoid; table-layout: fixed; border: 1px solid #cbd5e1; }
.modern-table * { text-align: center !important; vertical-align: middle !important; }
.modern-table th { background: linear-gradient(135deg, #5B4FE5 0%, #6B63F5 100%); color: white; font-weight: 900; text-align: center !important; padding: 12px 10px; border: 1px solid #5B4FE5; text-transform: uppercase; letter-spacing: 0.6px; vertical-align: middle !important; font-size: 8pt; }
.modern-table td { padding: 10px 11px; border: 1px solid #cbd5e1; color: #1f2937; text-align: center !important; vertical-align: middle !important; }
.modern-table tbody tr:nth-child(odd) { background: white; }
.modern-table tbody tr:nth-child(even) { background: #f8fafc; }
.modern-table tbody tr { page-break-inside: avoid; }
.modern-table tbody tr:hover { background: #eff6ff; }
.modern-table .amt { font-family: 'Courier New', Courier, monospace; font-weight: 900; letter-spacing: -0.3px; text-align: center !important; }
.modern-table thead { text-align: center !important; }
.modern-table thead th { text-align: center !important; vertical-align: middle !important; }
.modern-table tbody { text-align: center !important; }
.modern-table tbody td { text-align: center !important; vertical-align: middle !important; }
.modern-table tr { text-align: center !important; }
.status-pill { display: inline-block; padding: 5px 9px; border-radius: 4px; font-size: 7.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; }
.status-paid { background: #dbeafe; color: #0c4a6e; }
.status-partial { background: #fef08a; color: #713f12; }
.status-pending { background: #fee2e2; color: #7f1d1d; }

/* ═════════════════════════════════════════════════════════════════════ FOOTER SECTION ════════════════════════════════════════════════════════════════════ */
.footer-container { margin-top: 28px; padding-top: 14px; border-top: 2px solid #e5e7eb; }
.footer-signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 16px; }
.signature-block { }
.signature-line { border-top: 2px solid #111827; height: 1px; margin-bottom: 4px; }
.signature-label { font-size: 8pt; color: #111827; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
.footer-text { font-size: 7pt; color: #6b7280; line-height: 1.5; text-align: center; border-top: 1px solid #d1d5db; padding-top: 10px; margin-top: 12px; }
.footer-row { display: flex; justify-content: space-between; font-size: 7pt; color: #6b7280; }

/* ═════════════════════════════════════════════════════════════════════ PRINT UTILITIES ════════════════════════════════════════════════════════════════════ */
@media print {
  .no-print { display: none !important; }
  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; background: white; }
  .print-container { box-shadow: none; }
  .print-container, .table-section, .metric-card { page-break-inside: avoid; }
  .modern-table, .modern-table *, .modern-table td, .modern-table th { text-align: center !important; vertical-align: middle !important; }
}

/* ═════════════════════════════════════════════════════════════════════ UNIVERSAL TABLE CENTER ALIGNMENT ════════════════════════════════════════════════════════════════════ */
table.modern-table, table.modern-table tbody, table.modern-table thead, table.modern-table tr, table.modern-table td, table.modern-table th { text-align: center !important; vertical-align: middle !important; }
table.modern-table td, table.modern-table th { display: table-cell !important; margin: 0 !important; }

.no-print { text-align: center; padding: 18px 0 12px; display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
.btn-action { border: none; border-radius: 10px; padding: 0.68rem 1.4rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.2s ease; }
.btn-print { background: linear-gradient(135deg, #8b5cf6, #a78bfa); color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3); }
.btn-print:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4); }
.btn-close { background: #f1f5f9; color: #475569; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08); }
.btn-close:hover { background: #e2e8f0; }
</style>

<!-- Print Button (hidden on print) -->
<div class="no-print">
  <button onclick="window.print()" class="btn-action btn-print">
    <i class="fa-solid fa-print"></i> Print Statement
  </button>
  <button onclick="window.ui.downloadPDF('savings-report-content', 'Savings_Report_${userName.replace(/\s+/g, '_')}.pdf')" style="background:linear-gradient(135deg,#10b981,#34d399);color:white;border:none;border-radius:10px;padding:0.65rem 1.5rem;font-size:0.88rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:0.5rem;">
    <i class="fa-solid fa-download"></i> Download PDF
  </button>
  <button onclick="document.getElementById('print-area').remove()" class="btn-action btn-close">
    <i class="fa-solid fa-xmark"></i> Close
  </button>
</div>

<!-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ REPORT CONTENT WRAPPER ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div id="savings-report-content">

<!-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ DOCUMENT HEADER ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div id="rpt-header-area" class="doc-header-container">
  <div class="company-branding">
    <div>
      <h1 class="company-name">Fin<span class="highlight">Collect</span></h1>
      <p class="company-tagline">Financial Management System</p>
      <p class="document-title">Savings Account Statement</p>
    </div>
    <div class="doc-metadata">
      <div class="metadata-section">
        <div class="metadata-item">
          <div class="metadata-label">Reference No.</div>
          <div class="metadata-value">#${savings.accountNo || savingsId.substr(0, 8).toUpperCase()}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Generated</div>
          <div class="metadata-value">${genDate}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Status</div>
          <div class="metadata-value"><span class="status-badge ${isActive ? 'status-active' : 'status-closed'}">${isActive ? '✓ Active' : '✗ Closed'}</span></div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ MEMBER INFORMATION ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div class="member-section">
  <h2 class="member-section-title">Account Holder Information</h2>
  <div class="member-grid">
    <div class="member-field">
      <div class="member-label">Full Name</div>
      <div class="member-value">${userName}</div>
    </div>
    <div class="member-field">
      <div class="member-label">Member ID</div>
      <div class="member-value">${user && user.id ? user.id.substr(0, 12).toUpperCase() : 'N/A'}</div>
    </div>
    <div class="member-field">
      <div class="member-label">Mobile Number</div>
      <div class="member-value">${user && user.mobile ? user.mobile : '—'}</div>
    </div>
    <div class="member-field">
      <div class="member-label">Book / Serial Number</div>
      <div class="member-value">${user && user.serialNo ? user.serialNo : '—'}</div>
    </div>
    <div class="member-field" style="grid-column: 1/-1;">
      <div class="member-label">Address</div>
      <div class="member-value">${user && user.address ? user.address : '—'}</div>
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ ACCOUNT DETAILS ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div class="account-section">
  <h2 class="member-section-title">Account Details</h2>
  <div class="account-grid">
    <div>
      <div class="account-field">
        <div class="account-label">Account Type</div>
        <div class="account-value">${savings.savingsTypeName || 'General Savings'}</div>
      </div>
      <div class="account-field">
        <div class="account-label">Collection Frequency</div>
        <div class="account-value">${savings.frequency || 'Flexible'}</div>
      </div>
      <div class="account-field">
        <div class="account-label">Account Opening Date</div>
        <div class="account-value">${savings.startDate ? new Date(savings.startDate).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : '—'}</div>
      </div>
    </div>
    <div>
      <div class="account-field">
        <div class="account-label">Regular Installment</div>
        <div class="account-value" style="color: #4338ca; font-size: 10pt;">৳ ${parseFloat(savings.installmentAmount || 0).toLocaleString('en-IN')}</div>
      </div>
      <div class="account-field">
        <div class="account-label">Total Installments</div>
        <div class="account-value">${paidCount} <span style="color: #6b7280;">of</span> ${totalInst} <span style="color: #6b7280;">Paid</span></div>
      </div>
      <div class="account-field">
        <div class="account-label">Prepared By</div>
        <div class="account-value">${generatedBy}</div>
      </div>
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ KEY PERFORMANCE INDICATORS ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div class="metrics-container">
  <h2 class="metrics-title">Savings Performance Summary</h2>
  <div class="metrics-grid">
    <div class="metric-card primary">
      <div class="metric-label">Savings Goal</div>
      <div class="metric-value">৳ ${goalAmt.toLocaleString('en-IN')}</div>
    </div>
    <div class="metric-card success">
      <div class="metric-label">Total Saved</div>
      <div class="metric-value">৳ ${savedAmt.toLocaleString('en-IN')}</div>
    </div>
    <div class="metric-card warning">
      <div class="metric-label">Remaining</div>
      <div class="metric-value">৳ ${remaining.toLocaleString('en-IN')}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Progress</div>
      <div class="metric-value">${progress}%</div>
    </div>
  </div>
</div>

<!-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ PROGRESS VISUALIZATION ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div class="progress-container">
  <div class="progress-header">
    <span class="progress-title">Savings Progress</span>
    <span class="progress-percent">${progress}% Complete</span>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" style="width: ${barWidth}%;"></div>
  </div>
  <div style="font-size: 7.5pt; color: #6b7280; margin-top: 6px; text-align: center;">
    Saved <strong>৳ ${savedAmt.toLocaleString('en-IN')}</strong> out of <strong>৳ ${goalAmt.toLocaleString('en-IN')}</strong> Goal
  </div>
</div>

${(savings.schedule || []).length > 0 ? `
<!-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ INSTALLMENT SCHEDULE ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div class="table-section">
  <h2 class="table-section-title">Installment Schedule & Collection History</h2>
  <table class="modern-table" id="savings-schedule-table">
    <thead>
      <tr style="text-align:center;">
        <th style="width: 5%; text-align: center !important; vertical-align: middle !important;">No</th>
        <th style="width: 12%; text-align: center !important; vertical-align: middle !important;">Due Date</th>
        <th style="width: 11%; text-align: center !important; vertical-align: middle !important;">Status</th>
        <th style="width: 13%; text-align: center !important; vertical-align: middle !important;">Due Amount</th>
        <th style="width: 11%; text-align: center !important; vertical-align: middle !important;">Last Collected</th>
        <th style="width: 13%; text-align: center !important; vertical-align: middle !important;">Paid Amount</th>
        <th style="width: 13%; text-align: center !important; vertical-align: middle !important;">Balance</th>
        <th style="width: 22%; text-align: center !important; vertical-align: middle !important;">Collected By</th>
      </tr>
    </thead>
    <tbody>${scheduleRows}</tbody>
  </table>
</div>` : ''}

<!-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ TRANSACTION LEDGER ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
${ledgerRows ? `
<div class="table-section">
  <h2 class="table-section-title">Transaction Ledger</h2>
  <table class="modern-table">
    <thead>
      <tr style="text-align:center;">
        <th style="width: 8%; text-align: center !important; vertical-align: middle !important;">Txn No</th>
        <th style="width: 22%; text-align: center !important; vertical-align: middle !important;">Date</th>
        <th style="width: 20%; text-align: center !important; vertical-align: middle !important;">Amount</th>
        <th style="width: 50%; text-align: center !important; vertical-align: middle !important;">Received By</th>
      </tr>
    </thead>
    <tbody>${ledgerRows}</tbody>
  </table>
</div>` : ''}

<!-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ FOOTER SECTION ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
<div class="footer-container">
  <div class="footer-signatures" id="rpt-signature-area">
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-label">Account Holder</div>
      <div style="font-size: 8pt; color: #111827; margin-top: 2px;">${userName}</div>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-label">Prepared By</div>
      <div style="font-size: 8pt; color: #111827; margin-top: 2px;">${generatedBy}</div>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-label">Authorized By</div>
      <div style="font-size: 8pt; color: #111827; margin-top: 2px;">Branch Manager</div>
    </div>
  </div>

  <div class="footer-text">
    <div style="margin-bottom: 6px; font-weight: 700; color: #111827;">
      FinCollect Financial Management System
    </div>
    <div style="color: #6b7280; font-size: 7pt; line-height: 1.6;">
      This is an official record of the savings account statement. Please verify all details and notify immediately of any discrepancies.<br>
      Account Reference: <strong>#${savings.accountNo || savingsId.substr(0, 8).toUpperCase()}</strong> | Generated: <strong>${genDate}</strong> | Page 1 of 1
    </div>
    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 6.5pt; color: #9ca3af;">
      This document is confidential and for official use only. © 2024 FinCollect. All rights reserved.
    </div>
  </div>
</div>
</div>

<!-- ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ END REPORT CONTENT WRAPPER ════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════ -->
</div>
</div>`;


    // Render in overlay (not auto-print — user clicks Print button)
    const overlay = document.createElement('div');
    overlay.id = 'print-area';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.85);z-index:9999;overflow-y:auto;overflow-x:hidden;padding:1.5rem 1rem;backdrop-filter:blur(5px);display:flex;flex-direction:column;align-items:center;';
    
    const inner = document.createElement('div');
    inner.style.cssText = 'width:100%;max-width:950px;background:white;box-shadow:0 20px 50px rgba(0,0,0,0.4);flex-grow:0;margin-bottom:2rem;';
    
    // Add content wrapper with proper spacing
    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = 'padding:2.5rem;overflow:hidden;';
    contentWrapper.innerHTML = printArea.innerHTML;
    inner.appendChild(contentWrapper);
    
    // Create sticky close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Close';
    closeBtn.style.cssText = 'position:sticky;bottom:0;width:100%;padding:1rem;background:#f1f5f9;color:#475569;border:none;font-weight:700;cursor:pointer;font-size:0.9rem;transition:all 0.3s;margin-top:1.5rem;border-radius:0 0 8px 8px;';
    closeBtn.onmouseover = () => { closeBtn.style.background = '#e2e8f0'; };
    closeBtn.onmouseout = () => { closeBtn.style.background = '#f1f5f9'; };
    closeBtn.onclick = () => { overlay.remove(); };
    inner.appendChild(closeBtn);
    
    overlay.appendChild(inner);
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
    
    // Force render and ensure scrollable
    setTimeout(() => {
      overlay.scrollTop = 0;
    }, 100);
    } catch (error) {
      console.error('Savings Report Generation Error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Report Generation Failed',
        text: error.message || 'An error occurred while generating the report. Please try again.',
        confirmButtonColor: '#ef4444'
      });
    }
  }

  async openDepositModal(savingsId) {
    let modal = document.getElementById("deposit-modal");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "deposit-modal";
      modal.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:flex-end;justify-content:center;`;
      if (window.innerWidth > 768) modal.style.alignItems = "center";
      document.body.appendChild(modal);
    }

    const savings = await window.db.get("savings", savingsId);
    if (!savings) return;
    const user = await window.db.get("borrowers", savings.userId);

    let nextInstallmentNo = 1;
    let nextDate = new Date(savings.startDate || new Date());
    let nextAmount = parseFloat(savings.installmentAmount || 0);

    if (savings.schedule && savings.schedule.length > 0) {
      const firstUnpaid = savings.schedule.find((item) => item.status !== "PAID");
      if (firstUnpaid) {
        nextInstallmentNo = firstUnpaid.no;
        nextDate = new Date(firstUnpaid.dueDate);
        nextAmount = parseFloat(firstUnpaid.amount) - parseFloat(firstUnpaid.paidAmount || 0);
      } else {
        nextInstallmentNo = savings.schedule.length + 1;
        nextAmount = 0;
      }
    } else {
      const allTxns = await window.db.getAll("savingsTransactions");
      const savedAmt = allTxns.filter((t) => t.savingsId === savingsId).reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const installmentAmt = parseFloat(savings.installmentAmount || 1);
      const installmentsPaid = Math.floor(savedAmt / installmentAmt);
      nextInstallmentNo = installmentsPaid + 1;
      
      if (savings.frequency === "Weekly") nextDate.setDate(nextDate.getDate() + installmentsPaid * 7);
      else if (savings.frequency === "Monthly") nextDate.setMonth(nextDate.getMonth() + installmentsPaid);
      else nextDate.setDate(nextDate.getDate() + installmentsPaid);
    }

    const today = new Date().toISOString().split("T")[0];
    const frequency = savings.frequency || "Flexible";
    
    let lastDueDate = null;
    if (savings.schedule && savings.schedule.length > 0) {
      const paidItems = savings.schedule.filter((item) => item.status === "PAID" || item.status === "PARTIAL");
      if (paidItems.length > 0) lastDueDate = new Date(paidItems[paidItems.length - 1].dueDate);
    }
    if (!lastDueDate) lastDueDate = new Date(nextDate);
    
    const defFromDate = lastDueDate.toISOString().split("T")[0];

    modal.innerHTML = `
<style>
@keyframes smSlideUp { from{transform:translateY(60px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes smFadeIn  { from{opacity:0} to{opacity:1} }
#deposit-modal .sm-tab-btn { flex:1; padding:0.65rem 0.5rem; border:none; background:transparent; font-size:0.85rem; font-weight:600; color:#64748b; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.2s; }
#deposit-modal .sm-tab-btn.sm-active { color:#059669; border-bottom:2px solid #059669; }
#deposit-modal .sm-tab-btn:hover:not(.sm-active) { color:#334155; background:#f8fafc; }
#deposit-modal .sm-section { display:none; animation:smFadeIn 0.2s ease; }
#deposit-modal .sm-section.sm-active { display:block; }
#deposit-modal .sm-input { width:100%; padding:0.72rem 1rem; border:1.5px solid #e2e8f0; border-radius:10px; font-size:0.95rem; font-family:inherit; color:#1e293b; background:#fff; outline:none; box-sizing:border-box; transition:border-color 0.2s; }
#deposit-modal .sm-input:focus { border-color:#059669; box-shadow:0 0 0 3px rgba(5,150,105,0.08); }
#deposit-modal .sm-input[readonly] { background:#f8fafc; color:#64748b; }
#deposit-modal .sm-label { display:block; font-size:0.74rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:0.38rem; }
#deposit-modal .sm-btn-ok { background:linear-gradient(135deg,#059669,#10b981); color:white; border:none; border-radius:10px; padding:0.78rem 1.25rem; font-size:0.9rem; font-weight:700; cursor:pointer; width:100%; box-shadow:0 4px 12px rgba(5,150,105,0.3); transition:all 0.2s; }
#deposit-modal .sm-btn-ok:hover { transform:translateY(-1px); }
#deposit-modal .sm-btn-cancel { background:#f1f5f9; color:#475569; border:none; border-radius:10px; padding:0.78rem 1.25rem; font-size:0.9rem; font-weight:700; cursor:pointer; width:100%; transition:background 0.2s; }
#deposit-modal .sm-btn-cancel:hover { background:#e2e8f0; }
#deposit-modal .sm-btn-show { background:linear-gradient(135deg,#0ea5e9,#3b82f6); color:white; border:none; border-radius:10px; padding:0.72rem 1.25rem; font-size:0.88rem; font-weight:700; cursor:pointer; width:100%; box-shadow:0 3px 10px rgba(14,165,233,0.25); transition:all 0.2s; }
#deposit-modal .sm-btn-show:hover { transform:translateY(-1px); }
#deposit-modal .s-table-wrap { border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; margin-top:0.9rem; box-shadow:0 2px 8px rgba(0,0,0,0.05); max-height:38vh; overflow-y:auto; }
#deposit-modal .s-table { width:100%; border-collapse:collapse; font-size:0.83rem; }
#deposit-modal .s-table thead tr { background:linear-gradient(135deg,#059669,#10b981); position:sticky; top:0; z-index:1; }
#deposit-modal .s-table thead th { color:white; padding:0.62rem 0.6rem; font-weight:700; text-align:left; font-size:0.71rem; text-transform:uppercase; letter-spacing:0.5px; }
#deposit-modal .s-table tbody tr { border-bottom:1px solid #f1f5f9; transition:background 0.15s; }
#deposit-modal .s-table tbody tr:last-child { border-bottom:none; }
#deposit-modal .s-table tbody tr:hover { background:#f8fafc; }
#deposit-modal .s-table td { padding:0.52rem 0.55rem; vertical-align:middle; }
#deposit-modal .s-input-amt { width:86px; padding:0.36rem 0.4rem 0.36rem 1.25rem; border:1.5px solid #e2e8f0; border-radius:8px; font-size:0.9rem; font-weight:700; color:#1e293b; text-align:right; outline:none; transition:border-color 0.2s; font-family:inherit; }
#deposit-modal .s-input-amt:focus { border-color:#059669; }
#deposit-modal .s-btn-save-row { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; border-radius:7px; padding:0.26rem 0.52rem; font-size:0.72rem; font-weight:700; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
#deposit-modal .s-btn-save-row:hover { background:#dcfce7; }
#deposit-modal .s-btn-del-row { background:#fff1f2; color:#e11d48; border:1px solid #fecdd3; border-radius:7px; padding:0.26rem 0.52rem; font-size:0.72rem; font-weight:700; cursor:pointer; transition:all 0.15s; }
#deposit-modal .s-btn-del-row:hover { background:#ffe4e6; }
#deposit-modal .sm-save-all-btn { background:linear-gradient(135deg,#059669,#10b981); color:white; border:none; border-radius:10px; padding:0.82rem 1.25rem; font-size:0.93rem; font-weight:700; cursor:pointer; width:100%; box-shadow:0 4px 12px rgba(5,150,105,0.3); transition:all 0.2s; margin-top:0.8rem; display:flex; align-items:center; justify-content:center; gap:0.45rem; }
#deposit-modal .sm-save-all-btn:hover { transform:translateY(-1px); }
#deposit-modal .s-row-saved { background:#f0fdf4 !important; }
</style>
<div style="width:100%;max-width:520px;background:white;border-radius:20px 20px 0 0;animation:smSlideUp 0.35s cubic-bezier(.22,.68,0,1.2);max-height:93vh;overflow-y:auto;box-shadow:0 -8px 40px rgba(0,0,0,0.2);">
<div style="padding:1.35rem 1.35rem 0;position:relative;">
<button onclick="document.getElementById('deposit-modal').remove()" style="position:absolute;right:1rem;top:1rem;background:#f1f5f9;border:none;width:30px;height:30px;border-radius:50%;font-size:0.9rem;color:#64748b;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-xmark"></i></button>
<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
<div style="width:40px;height:40px;background:linear-gradient(135deg,#059669,#10b981);border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
<i class="fa-solid fa-piggy-bank" style="color:white;font-size:1rem;"></i>
</div>
<div>
<div style="font-size:1.05rem;font-weight:800;color:#1e293b;">Add Deposit</div>
<div style="font-size:0.74rem;color:#94a3b8;margin-top:0.05rem;">
${user?user.name:"Unknown"}&nbsp;&middot;&nbsp;<span style="color:#059669;font-weight:700;">${frequency}</span>&nbsp;&middot;&nbsp;Inst. <i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${parseFloat(savings.installmentAmount||0).toLocaleString("en-IN")}
</div></div></div>
<div style="display:flex;border-bottom:1px solid #e2e8f0;">
<button class="sm-tab-btn sm-active" id="sm-tab-single" onclick="window.ui._smSwitchTab('single')"><i class="fa-solid fa-pen-to-square" style="margin-right:0.28rem;font-size:0.77rem;"></i>Single Entry</button>
<button class="sm-tab-btn" id="sm-tab-multiple" onclick="window.ui._smSwitchTab('multiple')"><i class="fa-solid fa-layer-group" style="margin-right:0.28rem;font-size:0.77rem;"></i>Multiple Entry</button>
</div></div>
<div style="padding:1.1rem 1.35rem 1.5rem;">
<!-- SINGLE ENTRY -->
<div id="sm-section-single" class="sm-section sm-active">
<form id="dep-single-form" autocomplete="off">
<div style="margin-bottom:0.85rem;"><label class="sm-label">Account Name</label><input class="sm-input" type="text" value="${user?user.name:"Unknown"}" readonly></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:0.85rem;">
<div><label class="sm-label">Due No.</label><input class="sm-input" type="text" value="${nextInstallmentNo}" readonly></div>
<div><label class="sm-label">Due Date</label><input class="sm-input" type="text" value="${nextDate.toLocaleDateString("en-IN")}" readonly style="color:#059669;font-weight:700;"></div>
</div>
<div style="margin-bottom:0.85rem;"><label class="sm-label">Deposit Amount (<i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>)</label>
<div style="position:relative;">
<span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#059669;font-weight:800;font-size:1.1rem;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span></span>
<input class="sm-input" type="number" name="amount" value="${nextAmount}" style="padding-left:2.1rem;font-size:1.35rem;font-weight:800;color:#059669;" step="0.01" required>
</div></div>
<div style="margin-bottom:0.85rem;"><label class="sm-label">Deposit Date</label><input class="sm-input" type="date" name="date" value="${today}" required></div>
<div style="margin-bottom:1.25rem;"><label class="sm-label">Note / Collector</label><input class="sm-input" type="text" name="note" placeholder="Optional notes..."></div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;">
<button type="button" class="sm-btn-cancel" onclick="document.getElementById('deposit-modal').remove()">Cancel</button>
<button type="submit" class="sm-btn-ok" id="single-dep-submit-btn"><i class="fa-solid fa-check" style="margin-right:0.3rem;"></i>Confirm</button>
</div></form></div>
<!-- MULTIPLE ENTRY -->
<div id="sm-section-multiple" class="sm-section">
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:0.58rem 0.85rem;margin-bottom:0.95rem;display:flex;align-items:center;gap:0.5rem;">
<i class="fa-solid fa-circle-info" style="color:#3b82f6;font-size:0.88rem;flex-shrink:0;"></i>
<span style="font-size:0.77rem;color:#1d4ed8;font-weight:500;">Generates <strong>${frequency}</strong> dates between the two dates with the pre-filled amount.</span>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:0.85rem;">
<div><label class="sm-label"><i class="fa-solid fa-calendar-minus" style="color:#94a3b8;margin-right:0.22rem;"></i>From Date</label><input class="sm-input" type="date" id="s-from-date" value="${defFromDate}"></div>
<div><label class="sm-label"><i class="fa-solid fa-calendar-check" style="color:#94a3b8;margin-right:0.22rem;"></i>Up To (Today)</label><input class="sm-input" type="date" id="s-to-date" value="${today}"></div>
</div>
<div style="margin-bottom:0.95rem;"><label class="sm-label">Default Deposit Amount</label>
<div style="position:relative;">
<span style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#059669;font-weight:800;font-size:1rem;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span></span>
<input class="sm-input" type="number" id="s-default-amount" value="${parseFloat(savings.installmentAmount||0)}" style="padding-left:2rem;font-size:1.2rem;font-weight:800;color:#059669;" step="0.01">
</div><div style="font-size:0.69rem;color:#94a3b8;margin-top:0.28rem;"><i class="fa-solid fa-info-circle" style="margin-right:0.2rem;"></i>Pre-filled for all rows &mdash; edit individually in the table.</div></div>
<button class="sm-btn-show" onclick="window.ui._smGenerateDates('${savingsId}','${frequency}')"><i class="fa-solid fa-table-list" style="margin-right:0.4rem;"></i>Show Expected Schedule</button>
<div id="s-table-container"></div>
</div></div></div>`;

    modal.onclick = (e) => { if(e.target===modal) modal.remove(); };

    document.getElementById("dep-single-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = document.getElementById("single-dep-submit-btn");
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

        try {
            const fd = new FormData(e.target);
            const val = parseFloat(fd.get("amount"));
            const date = fd.get("date");
            const note = fd.get("note");
            const collector = localStorage.getItem('fincollect_user') || 'Admin';

            if(val > 0) {
                const fresh = await window.db.get("savings", savingsId);
                
                await window.db.add('savingsTransactions', {
                    id: Date.now().toString() + crypto.randomUUID().substring(0,6),
                    savingsId: savingsId,
                    userId: fresh?.userId || '',
                    amount: val,
                    date: date,
                    receivedBy: collector,
                    note: note || "via Deposit Modal",
                    timestamp: Date.now()
                });

                if(fresh.schedule && fresh.schedule.length > 0) {
                    let rem = val;
                    for (const item of fresh.schedule) {
                        if (item.status === "PAID" || rem <= 0) continue;
                        const already = parseFloat(item.paidAmount || 0);
                        const expected = parseFloat(item.amount || 0);
                        const due = expected - already;

                        if(!item.paymentHistory) item.paymentHistory = [];

                        if (rem >= due && expected > 0) {
                            item.paidAmount = expected;
                            item.status = "PAID";
                            rem -= due;
                            item.paymentHistory.push({
                                amount: due,
                                timestamp: new Date().toISOString(),
                                note: note || "via Deposit Modal",
                                receivedBy: localStorage.getItem('fincollect_user') || 'Admin'
                            });
                        } else {
                            item.paidAmount = already + rem;
                            item.status = "PARTIAL";
                            item.paymentHistory.push({
                                amount: rem,
                                timestamp: new Date().toISOString(),
                                note: note || "via Deposit Modal",
                                receivedBy: localStorage.getItem('fincollect_user') || 'Admin'
                            });
                            rem = 0;
                        }
                    }
                }
                
                await window.db.add("savings", fresh);
                modal.remove();

                Swal.fire({
                    icon: "success",
                    title: "Deposit Logged!",
                    html: `<div style="font-size:1.5rem;font-weight:800;color:#059669;margin:0.5rem 0;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${val.toLocaleString("en-IN")}</div>`,
                    timer: 2000,
                    showConfirmButton: false
                });

                window.ui.renderSavingsDetail(savingsId);
            }
        } catch(err) {
            console.error(err);
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-check" style="margin-right:0.3rem;"></i>Confirm';
        }
    });

    setTimeout(() => { if(document.querySelector('input[name="amount"]')) document.querySelector('input[name="amount"]').focus(); }, 100);
  }

  _smSwitchTab(tab) {
    ["single", "multiple"].forEach(t => {
      document.getElementById(`sm-tab-${t}`)?.classList.toggle("sm-active", t === tab);
      document.getElementById(`sm-section-${t}`)?.classList.toggle("sm-active", t === tab);
    });
  }

  _smGenerateDates(savingsId, frequency) {
    const fromVal = document.getElementById("s-from-date").value;
    const toVal = document.getElementById("s-to-date").value;
    const defAmt = parseFloat(document.getElementById("s-default-amount").value) || 0;

    if (!fromVal || !toVal) return Swal.fire({ icon: "warning", title: "Select Dates", timer: 2000, showConfirmButton: false });
    if (fromVal > toVal) return Swal.fire({ icon: "warning", title: "Invalid Range", timer: 2200, showConfirmButton: false });

    const dates = [];
    let cur = new Date(fromVal);
    const end = new Date(toVal);

    while (cur <= end) {
      dates.push(cur.toISOString().split("T")[0]);
      if (frequency === "Weekly") cur.setDate(cur.getDate() + 7);
      else if (frequency === "Monthly") cur.setMonth(cur.getMonth() + 1);
      else cur.setDate(cur.getDate() + 1);
    }

    if (dates.length === 0) {
      document.getElementById("s-table-container").innerHTML = `<div style="text-align:center;padding:1.5rem;color:#94a3b8;"><i class="fa-solid fa-calendar-xmark" style="font-size:2rem;color:#cbd5e1;display:block;"></i>No dates in range.</div>`;
      return;
    }
    if (dates.length > 366) return Swal.fire({ icon: "warning", title: "Too Many", text: `${dates.length} dates. Narrow range.`, timer: 2500, showConfirmButton: false });

    const totalEst = (defAmt * dates.length).toLocaleString("en-IN", { maximumFractionDigits: 2 });
    const rows = dates.map((d, i) => `
    <tr id="s-row-${i}" data-date="${d}" data-index="${i}">
      <td style="color:#64748b;font-weight:700;text-align:center;font-size:0.77rem;">${i + 1}</td>
      <td style="font-weight:600;color:#1e293b;font-size:0.8rem;white-space:nowrap;">${d}</td>
      <td>
        <div style="position:relative;">
          <span style="position:absolute;left:6px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:0.76rem;font-weight:700;"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span></span>
          <input class="s-input-amt" type="number" id="s-amt-${i}" value="${defAmt}" step="0.01" oninput="window.ui._updateMultipleEntrySavingsTotals()">
        </div>
      </td>
      <td>
        <div style="display:flex;gap:0.28rem;justify-content:flex-end;">
          <button class="s-btn-save-row" onclick="window.ui._smSaveRow('${savingsId}',${i})"><i class="fa-solid fa-floppy-disk" style="margin-right:0.18rem;"></i>Save</button>
          <button class="s-btn-del-row" onclick="window.ui._smDeleteRow(${i})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join("");

    document.getElementById("s-table-container").innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.9rem;margin-bottom:0.5rem;">
        <div style="font-size:0.79rem;font-weight:700;color:#1e293b;" id="s-est-count"><i class="fa-solid fa-list-check" style="color:#059669;margin-right:0.28rem;"></i>${dates.length} entries found</div>
        <div style="font-size:0.74rem;color:#64748b;background:#f8fafc;padding:0.2rem 0.55rem;border-radius:20px;border:1px solid #e2e8f0;">Est. Total: <strong style="color:#059669;" id="s-est-total"><i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${totalEst}</strong></div>
      </div>
      <div class="s-table-wrap">
        <table class="s-table">
          <thead><tr><th style="width:30px;">#</th><th>Date</th><th>Amount</th><th style="text-align:right;">Actions</th></tr></thead>
          <tbody id="s-table-body">${rows}</tbody>
        </table>
      </div>
      <button class="sm-save-all-btn" id="s-save-all-btn" onclick="window.ui._smSaveAll('${savingsId}')">
        <i class="fa-solid fa-cloud-arrow-up" style="font-size:1rem;"></i><span id="s-btn-save-all-text">Save All ${dates.length} Deposits</span>
      </button>
    `;

  }

  _updateMultipleEntrySavingsTotals() {
    const tbody = document.getElementById("s-table-body");
    if (!tbody) return;
    const pendingRows = Array.from(tbody.querySelectorAll('tr[id^="s-row-"]')).filter((r) => r.dataset.saved !== "true");
    let count = pendingRows.length, total = 0;
    pendingRows.forEach(row => {
      const amtEl = document.getElementById(`s-amt-${row.dataset.index}`);
      if(amtEl) total += parseFloat(amtEl.value) || 0;
    });
    
    document.getElementById("s-est-count").innerHTML = `<i class="fa-solid fa-list-check" style="color:#059669;margin-right:0.28rem;"></i>${count} entries found`;
    document.getElementById("s-est-total").innerHTML = `<i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    document.getElementById("s-btn-save-all-text").innerHTML = count > 0 ? `Save All ${count} Deposits` : `No Pending Deposits`;
    const btn = document.getElementById("s-save-all-btn");
    btn.disabled = count === 0;
    btn.style.opacity = count === 0 ? "0.6" : "1";
  }

  async _smSaveRow(savingsId, rowIndex) {
    const row = document.getElementById(`s-row-${rowIndex}`);
    if (!row || row.dataset.saved === "true") return;
    const date = row.dataset.date;
    const amtEl = document.getElementById(`s-amt-${rowIndex}`);
    const val = parseFloat(amtEl?.value);
    if (!val || val <= 0) return Swal.fire({ icon: "warning", title: "Invalid", text: "Enter value > 0", toast: true, position: "top-end", timer:1800, showConfirmButton:false });

    try {
      let fresh = await window.db.get("savings", savingsId);
      await window.db.add("savingsTransactions", {
        id: Date.now().toString() + crypto.randomUUID().substring(0,6),
        savingsId: savingsId,
        amount: val,
        date: date,
        note: "Multiple Entry",
        timestamp: Date.now()
      });

      if(fresh.schedule && fresh.schedule.length > 0) {
        let si = fresh.schedule.findIndex(s => s.dueDate === date);
        if(si === -1) si = fresh.schedule.findIndex(s => s.status !== "PAID");
        
        if(si !== -1) {
            const it = fresh.schedule[si];
            it.paidAmount = parseFloat((parseFloat(it.paidAmount||0) + val).toFixed(2));
            it.status = it.paidAmount >= it.amount && it.amount > 0 ? "PAID" : it.paidAmount > 0 ? "PARTIAL" : "DUE";
            if(!it.paymentHistory) it.paymentHistory = [];
            it.paymentHistory.push({
                amount: val,
                timestamp: new Date().toISOString(),
                note: `Multiple Entry (${date})`,
                receivedBy: localStorage.getItem('fincollect_user') || 'Admin'
            });
        }
      }
      await window.db.add("savings", fresh);

      row.classList.add("s-row-saved");
      row.dataset.saved = "true";
      if (amtEl) { amtEl.disabled = true; amtEl.style.color = "#059669"; }
      row.querySelector("td:last-child div").innerHTML = `<span style="color:#059669;font-size:0.74rem;font-weight:700;"><i class="fa-solid fa-check-circle"></i> Saved</span>`;
      Swal.fire({ icon: "success", title: `<i class='fi fi-sr-bangladeshi-taka-sign'></i><span style='display:none'>৳</span>${val} saved`, toast: true, position: "top-end", timer:1600, showConfirmButton:false });
      window.ui._updateMultipleEntrySavingsTotals();
    } catch(err) {
      Swal.fire({ icon: "error", title: "Failed", text: err.message, timer:2500 });
    }
  }

  _smDeleteRow(rowIndex) {
    const row = document.getElementById(`s-row-${rowIndex}`);
    if (!row || row.dataset.saved === "true") return;
    row.style.transition = "all 0.2s"; row.style.opacity = "0"; row.style.transform = "translateX(20px)";
    setTimeout(() => { row.remove(); window.ui._updateMultipleEntrySavingsTotals(); }, 210);
  }

  async _smSaveAll(savingsId) {
    const pending = Array.from(document.querySelectorAll('#s-table-body tr[id^="s-row-"]')).filter((r) => r.dataset.saved !== "true");
    if(pending.length === 0) return;

    document.getElementById("s-save-all-btn").innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    let saved = 0;
    try {
        for (const row of pending) {
            await this._smSaveRow(savingsId, row.dataset.index);
            saved++;
        }
        Swal.fire({ icon: "success", title: "All Saved", text: `${saved} deposits logged.`, timer: 2000, showConfirmButton:false });
        const modal = document.getElementById("deposit-modal");
        if(modal) modal.remove();
        this.renderSavingsDetail(savingsId);
    } catch(e) {
        Swal.fire({ icon: "error", title: "Failed saving all", text: e.message });
    }
  }

  async closeSavingsAccount(savingsId) {
    const result = await Swal.fire({
      title: "Close Account?",
      text: "This will mark the savings account as closed. No more deposits can be made.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Close Account",
    });
    if (result.isConfirmed) {
      const sav = await window.db.get("savings", savingsId);
      if (sav) {
        await window.db.add("savings", {
          ...sav,
          status: "closed",
          closedAt: new Date().toISOString(),
        });
      }
      Swal.fire({
        icon: "success",
        title: "Account Closed",
        timer: 1200,
        showConfirmButton: false,
      });
      this.renderSavingsDetail(savingsId);
    }
  }

  async _deleteSavings(savingsId) {
    const result = await Swal.fire({
        title: "Are you absolutely sure?",
        text: "This will permanently delete the savings account, its schedule, and all recorded transactions. This action cannot be undone.",
        icon: "error",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Yes, delete it!"
    });
    
    if (result.isConfirmed) {
        // Find and delete all associated transactions
        const allTxns = await window.db.getAll("savingsTransactions");
        const accountTxns = allTxns.filter(t => t.savingsId === savingsId);
        
        for (const txn of accountTxns) {
            await window.db.delete("savingsTransactions", txn.id);
        }
        
        // Delete the main savings account
        await window.db.delete("savings", savingsId);
        
        Swal.fire({ 
            icon: "success", 
            title: "Deleted!", 
            text: "Account and history erased.", 
            timer: 1500, 
            showConfirmButton: false 
        });
        
        window.app.navigate("savings");
    }
  }
}

window.ui = new UI();
